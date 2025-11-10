// src/services/activityCompletionQueue.js

// Sistema de cola para completado de actividades que almacena en IndexedDB
// y reintenta la sincronización con Firebase mientras no haya conexión.

const DB_NAME = "activity_completion_queue_db";
const STORE_NAME = "completions";
const DB_VERSION = 1;

// Store para actividades marcadas localmente como completadas
const LOCAL_COMPLETED_STORE = "local_completed_activities";

/**
 * Abre la base de datos IndexedDB.
 */
function openDB() {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, DB_VERSION);
		request.onupgradeneeded = (event) => {
			const db = event.target.result;
			
			// Store para la cola de sincronización
			if (!db.objectStoreNames.contains(STORE_NAME)) {
				db.createObjectStore(STORE_NAME, {
					keyPath: "id",
					autoIncrement: true,
				});
			}
			
			// Store para actividades marcadas localmente como completadas
			if (!db.objectStoreNames.contains(LOCAL_COMPLETED_STORE)) {
				const store = db.createObjectStore(LOCAL_COMPLETED_STORE, {
					keyPath: "activityKey", // eventId_teamId_activityId
				});
				// Índice para búsquedas rápidas
				store.createIndex("eventTeam", ["eventId", "teamId"], { unique: false });
			}
		};
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
}

/**
 * Marca una actividad como completada localmente.
 * Este estado prevalecerá sobre Firebase mientras exista.
 * @param {{eventId: number, teamId: number, activityId: number, completedAt: number}} item
 */
export async function markActivityAsLocallyCompleted(item) {
	const db = await openDB();
	const activityKey = `${item.eventId}_${item.teamId}_${item.activityId}`;
	
	return new Promise((resolve, reject) => {
		const tx = db.transaction(LOCAL_COMPLETED_STORE, "readwrite");
		const store = tx.objectStore(LOCAL_COMPLETED_STORE);
		
		const data = {
			activityKey,
			eventId: item.eventId,
			teamId: item.teamId,
			activityId: item.activityId,
			completedAt: item.completedAt || Date.now(),
			synced: false
		};
		
		store.put(data); // put sobrescribe si ya existe
		
		tx.oncomplete = () => {
			console.log(`✅ Actividad ${activityKey} marcada localmente como completada`);
			resolve();
		};
		tx.onerror = () => reject(tx.error);
	});
}

/**
 * Verifica si una actividad está marcada localmente como completada.
 * @param {number} eventId
 * @param {number} teamId
 * @param {number} activityId
 * @returns {Promise<boolean>}
 */
export async function isActivityLocallyCompleted(eventId, teamId, activityId) {
	const db = await openDB();
	const activityKey = `${eventId}_${teamId}_${activityId}`;
	
	return new Promise((resolve, reject) => {
		const tx = db.transaction(LOCAL_COMPLETED_STORE, "readonly");
		const store = tx.objectStore(LOCAL_COMPLETED_STORE);
		const request = store.get(activityKey);
		
		request.onsuccess = () => {
			resolve(!!request.result);
		};
		request.onerror = () => reject(request.error);
	});
}

/**
 * Obtiene todas las actividades marcadas localmente como completadas para un equipo.
 * @param {number} eventId
 * @param {number} teamId
 * @returns {Promise<Array>}
 */
export async function getLocallyCompletedActivities(eventId, teamId) {
	const db = await openDB();
	
	return new Promise((resolve, reject) => {
		const tx = db.transaction(LOCAL_COMPLETED_STORE, "readonly");
		const store = tx.objectStore(LOCAL_COMPLETED_STORE);
		const index = store.index("eventTeam");
		const request = index.getAll([eventId, teamId]);
		
		request.onsuccess = () => resolve(request.result || []);
		request.onerror = () => reject(request.error);
	});
}

/**
 * Marca una actividad local como sincronizada (pero NO la elimina).
 * Solo se eliminará cuando se confirme desde Firebase.
 * @param {number} eventId
 * @param {number} teamId
 * @param {number} activityId
 */
export async function markActivityAsSynced(eventId, teamId, activityId) {
	const db = await openDB();
	const activityKey = `${eventId}_${teamId}_${activityId}`;
	
	return new Promise((resolve, reject) => {
		const tx = db.transaction(LOCAL_COMPLETED_STORE, "readwrite");
		const store = tx.objectStore(LOCAL_COMPLETED_STORE);
		const getRequest = store.get(activityKey);
		
		getRequest.onsuccess = () => {
			const data = getRequest.result;
			if (data) {
				data.synced = true;
				data.syncedAt = Date.now();
				store.put(data);
			}
		};
		
		tx.oncomplete = () => {
			console.log(`✅ Actividad ${activityKey} marcada como sincronizada`);
			resolve();
		};
		tx.onerror = () => reject(tx.error);
	});
}

/**
 * Elimina una actividad de la marca local cuando Firebase confirma el estado.
 * Solo se llama cuando Firebase devuelve la actividad con complete=true.
 * @param {number} eventId
 * @param {number} teamId
 * @param {number} activityId
 */
export async function removeLocalCompletionMark(eventId, teamId, activityId) {
	const db = await openDB();
	const activityKey = `${eventId}_${teamId}_${activityId}`;
	
	return new Promise((resolve, reject) => {
		const tx = db.transaction(LOCAL_COMPLETED_STORE, "readwrite");
		const store = tx.objectStore(LOCAL_COMPLETED_STORE);
		store.delete(activityKey);
		
		tx.oncomplete = () => {
			console.log(`🗑️ Marca local de actividad ${activityKey} eliminada (confirmada por Firebase)`);
			resolve();
		};
		tx.onerror = () => reject(tx.error);
	});
}

/**
 * Añade un ítem a la cola de sincronización con Firebase.
 * @param {{eventId: number, teamId: number, activityId: number, activity: object, success: boolean, media: object, valorateValue: number, pointsToAdd: number}} item
 */
export async function enqueueActivityCompletion(item) {
	const db = await openDB();
	
	return new Promise((resolve, reject) => {
		const tx = db.transaction(STORE_NAME, "readwrite");
		const store = tx.objectStore(STORE_NAME);
		
		const queueItem = {
			...item,
			timestamp: Date.now(),
			retryCount: 0
		};
		
		store.add(queueItem);
		
		tx.oncomplete = () => {
			console.log(`📝 Completado de actividad ${item.activityId} encolado para sincronización`);
			resolve();
			// Iniciar procesamiento inmediato
			processCompletionQueue().catch(console.error);
		};
		tx.onerror = () => reject(tx.error);
	});
}

/**
 * Obtiene todos los ítems de la cola de sincronización.
 */
async function getAllCompletions() {
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
async function deleteCompletion(id) {
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
 * Actualiza el contador de reintentos de un ítem.
 * @param {number} id
 * @param {number} retryCount
 */
async function updateRetryCount(id, retryCount) {
	const db = await openDB();
	return new Promise((resolve, reject) => {
		const tx = db.transaction(STORE_NAME, "readwrite");
		const store = tx.objectStore(STORE_NAME);
		const getRequest = store.get(id);
		
		getRequest.onsuccess = () => {
			const item = getRequest.result;
			if (item) {
				item.retryCount = retryCount;
				item.lastRetry = Date.now();
				store.put(item);
			}
		};
		
		tx.oncomplete = () => resolve();
		tx.onerror = () => reject(tx.error);
	});
}

/**
 * Sincroniza el completado de una actividad con Firebase.
 * @param {object} item - Item de la cola con todos los datos necesarios
 */
async function syncActivityCompletion(item) {
	const { updateTeamActivity } = await import("../services/firebase");
	const { getValorateValue } = await import("../utils/activityValidation");
	
	const { eventId, teamId, activityId, activity, success, media } = item;
	
	// Calcular valorateValue si no está en el item
	const valorateValue = item.valorateValue !== undefined 
		? item.valorateValue 
		: getValorateValue(activity, success);
	
	// Calcular puntos si no están en el item
	let pointsToAdd = item.pointsToAdd !== undefined ? item.pointsToAdd : 0;
	if (pointsToAdd === 0 && success && valorateValue === 1) {
		pointsToAdd = activity.points || 0;
	}
	
	// Preparar actualizaciones para la actividad específica
	const activityUpdates = {
		complete: true,
		complete_time: Math.floor(Date.now() / 1000),
		data: media?.data || null,
		valorate: valorateValue,
		awarded_points: valorateValue === 1 ? (success ? (activity.points || 0) : 0) : 0
	};
	
	// Sincronizar con Firebase de forma atómica
	// La transacción calculará el nuevo total de puntos de forma atómica
	await updateTeamActivity(eventId, teamId, activityId, activityUpdates, {
		pointsToAdd: pointsToAdd
	});
	
	// Marcar como sincronizada
	await markActivityAsSynced(eventId, teamId, activityId);
	
	console.log(`✅ Actividad ${activityId} sincronizada con Firebase (atomic)`);
}

/**
 * Procesa la cola: intenta sincronizar cada ítem y lo elimina si tiene éxito.
 */
export async function processCompletionQueue() {
	const completions = await getAllCompletions();
	
	if (completions.length === 0) {
		return;
	}
	
	console.log(`🔄 Procesando ${completions.length} actividades completadas en cola...`);
	
	for (const item of completions) {
		try {
			await syncActivityCompletion(item);
			// Si va bien, lo borramos de la cola
			await deleteCompletion(item.id);
			console.log(`✅ Actividad ${item.activityId} eliminada de la cola`);
		} catch (err) {
			console.warn(`⚠️ Fallo al sincronizar actividad ${item.activityId}:`, err);
			
			// Incrementar contador de reintentos
			const newRetryCount = (item.retryCount || 0) + 1;
			
			// Si ha superado el máximo de reintentos, eliminar de la cola pero mantener marca local
			const MAX_RETRIES = 10;
			if (newRetryCount >= MAX_RETRIES) {
				console.error(`❌ Actividad ${item.activityId} superó ${MAX_RETRIES} reintentos. Eliminando de cola pero manteniendo marca local.`);
				await deleteCompletion(item.id);
			} else {
				await updateRetryCount(item.id, newRetryCount);
			}
		}
	}
}

/**
 * Inicializa el manejador de la cola: se dispara al montar la app.
 * Retriada al reconectar.
 */
export function initActivityCompletionQueue() {
	// Procesar al arrancar
	processCompletionQueue().catch(console.error);
	
	// Reintentar cuando el navegador detecte reconexión
	window.addEventListener("online", () => {
		console.log("🌐 Conexión restablecida, procesando cola de actividades completadas...");
		processCompletionQueue().catch(console.error);
	});
}

/**
 * Limpia todas las marcas locales y la cola (útil para desarrollo/debugging).
 * NO usar en producción a menos que sea necesario.
 */
export async function clearAllLocalCompletions() {
	const db = await openDB();
	
	return new Promise((resolve, reject) => {
		const tx = db.transaction([STORE_NAME, LOCAL_COMPLETED_STORE], "readwrite");
		
		tx.objectStore(STORE_NAME).clear();
		tx.objectStore(LOCAL_COMPLETED_STORE).clear();
		
		tx.oncomplete = () => {
			console.log("🗑️ Todas las marcas locales y cola limpiadas");
			resolve();
		};
		tx.onerror = () => reject(tx.error);
	});
}
