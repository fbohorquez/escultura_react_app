// src/services/mediaQueueService.js

// Cola offline + pipeline de medios (foto/vídeo)
// - Stores: pendingUploads (cola) y mediaUploaded (histórico recuperable)
// - Fotos: comprime (JPEG) y sube original+comprimida
// - Vídeos: normaliza extensión a .mov cuando aplique y sube
// - Reintentos automáticos al volver la conexión (con guardia de concurrencia)
// - Idempotencia: bloqueo por ítem + clave estable en mediaUploaded
// - Manejo de memoria: libera refs y evita tamaños peligrosos
// - Sistema de eventos: notifica cuando una subida se completa

import {
	createImageVersions,
	COMPRESSION_CONFIGS,
	isImageFile,
} from "../utils/imageCompressionUtils";
import { enqueueMultipleVersions } from "./uploadQueue";

const lazyUpload = async () => (await import("./uploadQueue")).enqueueUpload;

// Sistema de eventos para notificar completación de subidas
class UploadEventEmitter {
	constructor() {
		this.listeners = new Map();
	}

	subscribe(uploadId, callback) {
		if (!this.listeners.has(uploadId)) {
			this.listeners.set(uploadId, []);
		}
		this.listeners.get(uploadId).push(callback);

		// Retornar función de unsubscribe
		return () => {
			const callbacks = this.listeners.get(uploadId);
			if (callbacks) {
				const index = callbacks.indexOf(callback);
				if (index > -1) {
					callbacks.splice(index, 1);
				}
				if (callbacks.length === 0) {
					this.listeners.delete(uploadId);
				}
			}
		};
	}

	emit(uploadId, result) {
		const callbacks = this.listeners.get(uploadId);
		if (callbacks) {
			callbacks.forEach(callback => {
				try {
					callback(result);
				} catch (error) {
					console.error("Error en callback de upload:", error);
				}
			});
			// Limpiar listeners después de emitir
			this.listeners.delete(uploadId);
		}
	}

	hasListeners(uploadId) {
		return this.listeners.has(uploadId) && this.listeners.get(uploadId).length > 0;
	}
}

const uploadEvents = new UploadEventEmitter();

const DB_NAME = "escultura-media";
const STORE_PENDING = "pendingUploads";
const STORE_UPLOADED = "mediaUploaded";

// límite prudente para base64 de vídeo
const MAX_BASE64_MB = 60;

// instancia (para lockOwner)
const INSTANCE_ID =
	(typeof crypto !== "undefined" && crypto.randomUUID && crypto.randomUUID()) ||
	`inst-${Math.random().toString(36).slice(2)}`;

let RETRY_RUNNING = false; // guardia para evitar reintentos paralelos

function openDB() {
	return new Promise((resolve, reject) => {
		const req = indexedDB.open(DB_NAME, 2);
		req.onupgradeneeded = () => {
			const db = req.result;
			if (!db.objectStoreNames.contains(STORE_PENDING)) {
				db.createObjectStore(STORE_PENDING, { keyPath: "id" });
			}
			if (!db.objectStoreNames.contains(STORE_UPLOADED)) {
				const os = db.createObjectStore(STORE_UPLOADED, { keyPath: "id" });
				os.createIndex("byEvent", "eventId", { unique: false });
				os.createIndex("byTeam", "teamId", { unique: false });
				os.createIndex("byActivity", "activityId", { unique: false });
				os.createIndex("byKind", "kind", { unique: false });
			}
		};
		req.onsuccess = () => resolve(req.result);
		req.onerror = () => reject(req.error);
	});
}

function txGet(os, key) {
	return new Promise((res, rej) => {
		const r = os.get(key);
		r.onsuccess = () => res(r.result);
		r.onerror = () => rej(r.error);
	});
}
function txPut(os, value) {
	return new Promise((res, rej) => {
		const r = os.put(value);
		r.onsuccess = () => res();
		r.onerror = () => rej(r.error);
	});
}
async function idbPut(store, record) {
	const db = await openDB();
	const tx = db.transaction(store, "readwrite");
	await txPut(tx.objectStore(store), record);
	return new Promise((res, rej) => {
		tx.oncomplete = () => res();
		tx.onerror = () => rej(tx.error);
	});
}
async function idbGet(store, key) {
	const db = await openDB();
	const tx = db.transaction(store, "readonly");
	const os = tx.objectStore(store);
	const val = await txGet(os, key);
	return val;
}
async function idbGetAll(store) {
	const db = await openDB();
	const tx = db.transaction(store, "readonly");
	const os = tx.objectStore(store);
	return new Promise((res, rej) => {
		const r = os.getAll();
		r.onsuccess = () => res(r.result || []);
		r.onerror = () => rej(r.error);
	});
}
// async function idbDelete(store, id) {
// 	const db = await openDB();
// 	const tx = db.transaction(store, "readwrite");
// 	const os = tx.objectStore(store);
// 	os.delete(id);
// 	return new Promise((res, rej) => {
// 		tx.oncomplete = () => res();
// 		tx.onerror = () => rej(tx.error);
// 	});
// }

// Itera sobre todos los registros utilizando cursor pero procesando fuera de la transacción
async function idbForEach(store, fn) {
	const db = await openDB();
	const tx = db.transaction(store, "readonly");
	const os = tx.objectStore(store);
	const buffered = [];

	await new Promise((res, rej) => {
		const req = os.openCursor();
		req.onsuccess = (e) => {
			const cur = e.target.result;
			if (!cur) {
				return res();
			}
			buffered.push(cur.value);
			cur.continue();
		};
		req.onerror = () => rej(req.error);
	});

	for (const item of buffered) {
		await fn(item);
	}
}

function readAsDataURLWithTimeout(file, timeoutMs = 60000) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		const tid = setTimeout(() => {
			try {
				reader.abort();
			} catch (abortError) {
				void abortError; // ignore abort failures
			}
			reject(new Error("read-timeout"));
		}, timeoutMs);
		reader.onerror = () => {
			clearTimeout(tid);
			reject(reader.error || new Error("read-error"));
		};
		reader.onabort = () => {
			clearTimeout(tid);
			reject(new Error("read-abort"));
		};
		reader.onload = () => {
			clearTimeout(tid);
			const out = reader.result;
			if (!out || typeof out !== "string" || out.length < 64) {
				reject(new Error("read-invalid"));
			} else {
				resolve(out);
			}
		};
		reader.readAsDataURL(file);
	});
}

function buildPaths({ eventId, teamId, activityId, ext }) {
	const event_path = "event_" + String(eventId);
	const team_path = "team_" + String(teamId);
	const file_name = `activity_${activityId}.${ext}`;
	const file_path = `${event_path}@${team_path}@${file_name}`;
	const basePath = `/${event_path}@${team_path}@activity_${activityId}`;
	const baseUrl = import.meta.env.VITE_API_BASE_URL.replace("/api", "");
	const fileUrl = `${baseUrl}/uploads/events/event_${eventId}/team_${teamId}/${file_name}`;
	return { file_path, file_name, basePath, fileUrl, event_path, team_path };
}

/* --------------------------------------------------------------------------
 * BLOQUEO E IDEMPOTENCIA
 * ------------------------------------------------------------------------*/

// Lock atómico en pending: pasa de queued -> processing si no estaba procesándose
async function tryLockPending(id) {
	const db = await openDB();
	const tx = db.transaction(STORE_PENDING, "readwrite");
	const os = tx.objectStore(STORE_PENDING);
	const rec = await txGet(os, id);
	if (!rec) {
		// ya se borró o nunca existió
		return null;
	}
	if (rec.status === "processing") {
		// otro proceso lo tiene
		return null;
	}
	// adquirir lock
	rec.status = "processing";
	rec.lockOwner = INSTANCE_ID;
	await txPut(os, rec);
	return new Promise((res, rej) => {
		tx.oncomplete = () => res(rec);
		tx.onerror = () => rej(tx.error);
	});
}

// Libera (a queued) si falló; borra si ok
async function releaseOrDeletePending(id, ok) {
	const db = await openDB();
	const tx = db.transaction(STORE_PENDING, "readwrite");
	const os = tx.objectStore(STORE_PENDING);
	const rec = await txGet(os, id);
	if (rec) {
		if (ok) {
			os.delete(id);
		} else {
			rec.status = "queued";
			delete rec.lockOwner;
			os.put(rec);
		}
	}
	return new Promise((res, rej) => {
		tx.oncomplete = () => res();
		tx.onerror = () => rej(tx.error);
	});
}

// Clave estable para uploaded (evita duplicados entre reintentos)
// Exportada para que PhotoVideoActivity pueda generar el mismo ID
export function makeUploadedKey({ file, eventId, teamId, activityId, kind }) {
	const size = file?.size || 0;
	const lm = file?.lastModified || 0;
	const name = file?.name || "noname";
	return `uploaded@${eventId}@${teamId}@${activityId}@${kind}@${size}@${lm}@${name}`;
}

/* --------------------------------------------------------------------------
 * PROCESADORES
 * ------------------------------------------------------------------------*/
async function processPhoto(lockedItem) {
	const { file, eventId, teamId, activityId, originalFileName, timestamp } =
		lockedItem;

	// idempotencia uploaded
	const uploadedId = makeUploadedKey({
		file,
		eventId,
		teamId,
		activityId,
		kind: "photo",
	});
	const already = await idbGet(STORE_UPLOADED, uploadedId);
	if (already) {
		return { success: true, payload: already._payload }; // ya estaba
	}

	const versions = await createImageVersions(file, [
		COMPRESSION_CONFIGS.MOBILE,
	]);

	const { basePath, fileUrl } = buildPaths({
		eventId,
		teamId,
		activityId,
		ext: "jpg",
	});

	await enqueueMultipleVersions(versions, basePath, "jpg", {
		activityId,
		timestamp,
		type: "photo",
		source: "device",
		originalFileName,
	});

	versions.length = 0;

	const uploadedRecord = {
		id: uploadedId,
		kind: "photo",
		file,
		eventId,
		teamId,
		activityId,
		originalFileName,
		ext: "jpg",
		urls: {
			original: fileUrl,
			compressed: fileUrl.replace(".jpg", "_compressed.jpg"),
		},
		uploadedAt: Date.now(),
		lastReuploadAt: null,
		// payload cache para devolver al caller sin recalcular
		_payload: {
			type: "photo",
			path: basePath,
			uploadedAt: timestamp,
			originalFile: originalFileName,
			source: "device",
			data: fileUrl,
			versions: [
				{ type: "original", url: fileUrl },
				{ type: "compressed", url: fileUrl.replace(".jpg", "_compressed.jpg") },
			],
			hasCompression: true,
		},
	};

	await idbPut(STORE_UPLOADED, uploadedRecord);

	return { success: true, payload: uploadedRecord._payload };
}

async function processVideo(lockedItem) {
	const { file, eventId, teamId, activityId, timestamp } = lockedItem;

	let ext = (file.type?.split("/")[1] || "mp4").toLowerCase();
	if (ext === "quicktime") ext = "mov";

	const uploadedId = makeUploadedKey({
		file,
		eventId,
		teamId,
		activityId,
		kind: "video",
	});
	const already = await idbGet(STORE_UPLOADED, uploadedId);
	if (already) {
		return { success: true, payload: already._payload };
	}

	const { file_path, fileUrl } = buildPaths({
		eventId,
		teamId,
		activityId,
		ext,
	});
	const uploadUrl = `/${file_path}/upload`;

	const sizeMB = file.size / (1024 * 1024);
	if (sizeMB > MAX_BASE64_MB) {
		throw new Error(`video-too-large-${sizeMB.toFixed(1)}MB`);
	}

	const base64Data = await readAsDataURLWithTimeout(file, 60000);
	const enqueueUpload = await lazyUpload();

	await enqueueUpload({
		file: base64Data,
		url: uploadUrl,
		metadata: {
			activityId,
			timestamp,
			type: "video",
			source: "device",
		},
	});

	const uploadedRecord = {
		id: uploadedId,
		kind: "video",
		file,
		eventId,
		teamId,
		activityId,
		originalFileName: file.name,
		ext,
		urls: { original: fileUrl },
		uploadedAt: Date.now(),
		lastReuploadAt: null,
		_payload: {
			type: "video",
			path: file_path,
			uploadedAt: timestamp,
			originalFile: file.name,
			source: "device",
			data: fileUrl,
			hasCompression: false,
		},
	};

	await idbPut(STORE_UPLOADED, uploadedRecord);

	return { success: true, payload: uploadedRecord._payload };
}

// Procesa un ítem con lock; si no consigue lock, lo omite (no duplica)
async function processItem(item) {
	// adquirir lock atómico
	const locked = await tryLockPending(item.id);
	if (!locked) {
		// ya lo está procesando otra ejecución
		return { success: false, queued: true, skipped: true };
	}

	const uploadId = makeUploadedKey({
		file: locked.file,
		eventId: locked.eventId,
		teamId: locked.teamId,
		activityId: locked.activityId,
		kind: isImageFile(locked.file) && !locked.isVideo ? "photo" : "video",
	});

	try {
		const out =
			isImageFile(locked.file) && !locked.isVideo
				? await processPhoto(locked)
				: await processVideo(locked);

		await releaseOrDeletePending(locked.id, true);
		
		// Emitir evento de éxito
		uploadEvents.emit(uploadId, { success: true, payload: out.payload });
		
		return out;
	} catch (e) {
		console.warn("Proceso fallido; se mantiene en cola:", item.id, e);
		await releaseOrDeletePending(item.id, false);
		
		// Si es un error definitivo (no de red), emitir evento de fallo
		const isNetworkError = e.message?.includes('fetch') || e.message?.includes('network');
		if (!isNetworkError) {
			uploadEvents.emit(uploadId, { success: false, error: e });
		}
		
		return { success: false, queued: true, error: e };
	}
}

/* --------------------------------------------------------------------------
 * API pública
 * ------------------------------------------------------------------------*/

export async function enqueueMediaTask({
	file,
	isVideo,
	eventId,
	teamId,
	activityId,
}) {
	const timestamp = Date.now();
	const id = `event_${eventId}@team_${teamId}@activity_${activityId}@${timestamp}`;
	const record = {
		id,
		file,
		isVideo: !!isVideo,
		eventId,
		teamId,
		activityId,
		originalFileName: file.name,
		timestamp,
		createdAt: Date.now(),
		status: "queued",
	};
	await idbPut(STORE_PENDING, record);
	return processItem(record); // intenta ahora; si falla o hay lock, quedará en cola
}

export async function retryPendingUploads() {
	if (RETRY_RUNNING) return;
	RETRY_RUNNING = true;
	try {
		await idbForEach(STORE_PENDING, async (it) => {
			await processItem(it);
		});
	} finally {
		RETRY_RUNNING = false;
	}
}

// Listado del histórico
export async function listUploadedMedia() {
	return idbGetAll(STORE_UPLOADED);
}

// Re-subir TODO lo de mediaUploaded, secuencialmente (idempotente)
export async function reuploadAllUploadedMedia({ onProgress } = {}) {
	let total = 0,
		ok = 0,
		fail = 0,
		processed = 0;

	const all = await idbGetAll(STORE_UPLOADED);
	total = all.length;
	const notify = () =>
		typeof onProgress === "function" &&
		onProgress({ total, processed, ok, fail });

	for (const rec of all) {
		try {
			if (rec.kind === "photo") {
				const versions = await createImageVersions(rec.file, [
					COMPRESSION_CONFIGS.MOBILE,
				]);
				const { basePath, fileUrl } = buildPaths({
					eventId: rec.eventId,
					teamId: rec.teamId,
					activityId: rec.activityId,
					ext: "jpg",
				});
				await enqueueMultipleVersions(versions, basePath, "jpg", {
					activityId: rec.activityId,
					timestamp: Date.now(),
					type: "photo",
					source: "resend",
					originalFileName: rec.originalFileName,
				});
				versions.length = 0;
				await idbPut(STORE_UPLOADED, {
					...rec,
					urls: {
						original: fileUrl,
						compressed: fileUrl.replace(".jpg", "_compressed.jpg"),
					},
					lastReuploadAt: Date.now(),
				});
				ok++;
			} else {
				let ext = (rec.ext || "mp4").toLowerCase();
				if (ext === "quicktime") ext = "mov";
				const { file_path } = buildPaths({
					eventId: rec.eventId,
					teamId: rec.teamId,
					activityId: rec.activityId,
					ext,
				});
				const uploadUrl = `/${file_path}/upload`;

				const sizeMB = rec.file.size / (1024 * 1024);
				if (sizeMB > MAX_BASE64_MB)
					throw new Error(`video-too-large-${sizeMB.toFixed(1)}MB`);

				const base64Data = await readAsDataURLWithTimeout(rec.file, 60000);
				const enqueueUpload = await lazyUpload();
				await enqueueUpload({
					file: base64Data,
					url: uploadUrl,
					metadata: {
						activityId: rec.activityId,
						timestamp: Date.now(),
						type: "video",
						source: "resend",
					},
				});

				await idbPut(STORE_UPLOADED, { ...rec, lastReuploadAt: Date.now() });
				ok++;
			}
		} catch (e) {
			console.warn("Re-subida fallida:", rec.id, e);
			fail++;
		} finally {
			processed++;
			notify();
		}
	}

	return { total, ok, fail };
}

// Suscripción a eventos de completación de subida
// Retorna función de unsubscribe
export function subscribeToUpload(uploadId, callback) {
	return uploadEvents.subscribe(uploadId, callback);
}

// Reintento automático al volver online (no acumula ejecuciones simultáneas)
if (typeof window !== "undefined") {
	window.addEventListener("online", () => {
		retryPendingUploads().catch(() => {});
	});
}

