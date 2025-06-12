// src/services/uploadQueue.js

// Un sistema de cola de subida que almacena archivos (imagen/video) en IndexedDB
// y los reintenta mientras no haya conexión.

const DB_NAME = "upload_queue_db";
const STORE_NAME = "uploads";
const DB_VERSION = 1;

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Abre la base de datos IndexedDB.
 */
function openDB() {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, DB_VERSION);
		request.onupgradeneeded = (event) => {
			const db = event.target.result;
			if (!db.objectStoreNames.contains(STORE_NAME)) {
				db.createObjectStore(STORE_NAME, {
					keyPath: "id",
					autoIncrement: true,
				});
			}
		};
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
}

/**
 * Añade un ítem a la cola de subida.
 * @param {{file: Blob, url: string, metadata?: object}} item
 */
export async function enqueueUpload(item) {
	const db = await openDB();
  if (item.url) {
    item.url = API_BASE_URL + item.url;
  }else {
    throw new Error("No se ha especificado la URL de subida");
  }
	return new Promise((resolve, reject) => {
		const tx = db.transaction(STORE_NAME, "readwrite");
		const store = tx.objectStore(STORE_NAME);
		store.add(item);
		tx.oncomplete = () => resolve();
		tx.onerror = () => reject(tx.error);
    processUploadQueue().catch(console.error);
	});
}

/**
 * Obtiene todos los ítems de la cola.
 */
async function getAllUploads() {
	const db = await openDB();
	return new Promise((resolve, reject) => {
		const tx = db.transaction(STORE_NAME, "readonly");
		const store = tx.objectStore(STORE_NAME);
		const request = store.getAll();
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
}

/**
 * Elimina un ítem de la cola por su clave primaria.
 * @param {number} id
 */
async function deleteUpload(id) {
	const db = await openDB();
	return new Promise((resolve, reject) => {
		const tx = db.transaction(STORE_NAME, "readwrite");
		const store = tx.objectStore(STORE_NAME);
		store.delete(id);
		tx.oncomplete = () => resolve();
		tx.onerror = () => reject(tx.error);
	});
}

/**
 * Función genérica de envío HTTP multipart/form-data.
 * @param {Blob} file
 * @param {string} uploadUrl
 * @param {object} [metadata]
 */
async function sendFile(fileOrDataUrl, uploadUrl, metadata = {}) {
	let blob;
	if (typeof fileOrDataUrl === "string" && fileOrDataUrl.startsWith("data:")) {
		const res = await fetch(fileOrDataUrl);
		blob = await res.blob();
	} else {
		blob = fileOrDataUrl; 
	}

	const formData = new FormData();
	Object.entries(metadata).forEach(([k, v]) => formData.append(k, v));
	formData.append("profile_img", blob, "file");

	const response = await fetch(uploadUrl, { method: "POST", body: formData });
	if (!response.ok) throw new Error(`Upload failed: ${response.statusText}`);
	return response;
}

/**
 * Procesa la cola: intenta subir cada ítem y lo elimina si tiene éxito.
 */
export async function processUploadQueue() {
	const uploads = await getAllUploads();
	for (const item of uploads) {
		try {
			await sendFile(item.file, item.url, item.metadata);
			// si va bien, lo borramos de la cola
			await deleteUpload(item.id);
		} catch (err) {
			console.warn("Upload failed, quedará en cola:", err);
			// dejamos en cola para reintentar luego
		}
	}
}

/**
 * Inicializa el manejador de la cola: se dispara al montar la app.
 * Retriada al reconectar.
 */
export function initUploadQueue() {
	// procesamos al arrancar
	processUploadQueue().catch(console.error);
	// reintentamos cuando el navegador detecte reconexión
	window.addEventListener("online", () => {
		processUploadQueue().catch(console.error);
	});
}




