// src/services/assetCache.js

const CACHE_NAME = "escultura-assets-v1";

/**
 * Extrae recursivamente todas las URLs encontradas en un objeto o array.
 * @param {any} obj
 * @param {Set<string>} result
 */
function extractUrlsFromObject(obj, result = new Set()) {
	if (!obj) return result;
	if (typeof obj === "string") {
		try {
			const url = new URL(obj);
			// sólo http(s)
			if (url.protocol === "http:" || url.protocol === "https:") {
				result.add(obj);
			}
		} catch {
			// no es URL válida
		}
	} else if (Array.isArray(obj)) {
		obj.forEach((item) => extractUrlsFromObject(item, result));
	} else if (typeof obj === "object") {
		Object.values(obj).forEach((value) => extractUrlsFromObject(value, result));
	}
	return result;
}

/**
 * Prefetch de todos los activos encontrados recursivamente en un JSON.
 * @param {object} jsonData
 */
export async function prefetchAssetsFromJson(jsonData) {
	if (!("caches" in window)) return;
	const urls = Array.from(extractUrlsFromObject(jsonData));
	const cache = await caches.open(CACHE_NAME);
	for (const url of urls) {
		try {
			const response = await fetch(url, { mode: "no-cors" });
			if (response.ok || response.type === "opaque") {
				cache.put(url, response.clone());
			}
		} catch (err) {
			console.warn("Prefetch failed for", url, err);
		}
	}
}

/**
 * Inicializa el Service Worker y lanza el prefetch recursivo de assets.
 * @param {object} jsonData  Objeto JSON completo del evento/actividades
 */
export function initAssetCaching(jsonData) {
	if ("serviceWorker" in navigator) {
		navigator.serviceWorker
			.register("/sw.js")
			.then(() => console.log("SW registered"))
			.catch(console.error);
    if (jsonData) {
      window.addEventListener("load", () => {
        prefetchAssetsFromJson(jsonData);
      });
    }
	}
}

