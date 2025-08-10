const CACHE_NAME = "escultura-assets-v2";
const DEV_LOG = false;
const DYNAMIC_PATHS = ["/uploads/"];

self.addEventListener("install", () => {
	self.skipWaiting();
});

self.addEventListener("activate", (event) => {
	// Tomar control inmediatamente y limpiar caches antiguos
	event.waitUntil(
		Promise.all([
			self.clients.claim(),
			caches.keys().then((keys) =>
				Promise.all(
					keys
						.filter((k) => k !== CACHE_NAME)
						.map((k) => caches.delete(k))
					)
				)
		])
	);
});

self.addEventListener("fetch", (event) => {
	const req = event.request;
	const extensions = [
		".png",
		".jpg",
		".jpeg",
		".svg",
		".ico",
		".webp",
		".gif",
		".css",
		".js",
		".mp3",
		".mp4",
		".wav",
		".ogg",
		".webm",
		".m4a",
	];

	// No gestionar el propio SW ni peticiones no-GET
	if (req.url.includes("sw.js")) return;
	if (req.method !== "GET") return;

	// Filtrar esquemas no soportados por la Cache API
	const url = new URL(req.url);
	if (url.protocol !== "http:" && url.protocol !== "https:") return;

	// Sólo cachear/responder same-origin
	if (url.origin !== self.location.origin) return;

	// Excluir rutas dinámicas (p.ej. subidas de usuario)
	if (DYNAMIC_PATHS.some((p) => url.pathname.startsWith(p))) {
		// Pasar a red sin tocar caché y sin usar HTTP cache
		event.respondWith(fetch(req, { cache: 'no-store' }));
		return;
	}

	// Sólo gestionar recursos con extensiones estáticas conocidas
	if (!extensions.some((ext) => url.pathname.includes(ext))) return;

	if (DEV_LOG) console.log("Fetching:", req.url);

	event.respondWith(
		caches.open(CACHE_NAME).then((cache) =>
			cache.match(req).then((cached) => {
				if (cached) {
					if (DEV_LOG) console.log("Cache hit:", req.url);
					return cached;
				}
				return fetch(req).then((networkRes) => {
					if (
						networkRes &&
						networkRes.status === 200 &&
						networkRes.type === "basic"
					) {
						cache.put(req, networkRes.clone());
						if (DEV_LOG) console.log("Cached new resource:", req.url);
					}
					return networkRes;
				});
			})
		)
	);
});
