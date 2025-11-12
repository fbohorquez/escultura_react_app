// src/services/assetCache.js

// CACHE DESHABILITADA - Servicios de cache completamente desactivados

/**
 * Prefetch de todos los activos encontrados recursivamente en un JSON.
 * @param {object} _jsonData
 */
export async function prefetchAssetsFromJson(_jsonData) {
	// CACHE DESHABILITADA - Función desactivada
	console.log("prefetchAssetsFromJson: Cache disabled, no prefetch performed");
	return;
}

/**
 * Inicializa el Service Worker y lanza el prefetch recursivo de assets.
 * @param {object} _jsonData  Objeto JSON completo del evento/actividades
 */
export function initAssetCaching(_jsonData) {
	// CACHE DESHABILITADA - Solo registrar SW para notificaciones, sin cache
	if ("serviceWorker" in navigator) {
		navigator.serviceWorker
			.register("/sw.js")
			.then(() => console.log("SW registered (cache disabled, notifications only)"))
			.catch(console.error);
	}
	console.log("initAssetCaching: Asset caching disabled");
}

