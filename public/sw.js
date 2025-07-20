const CACHE_NAME = "escultura-assets-v1";
const DEV_LOG = false;

self.addEventListener("install", () => {
	self.skipWaiting();
});

self.addEventListener("activate", (event) => {
	event.waitUntil(self.clients.claim());
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
	if (req.url.includes("sw.js")) return;
	if (!extensions.some((ext) => req.url.includes(ext))) return;
	if (req.method !== "GET") return;
	
	// Filtrar esquemas no soportados por la Cache API
	const url = new URL(req.url);
	if (url.protocol !== "http:" && url.protocol !== "https:") return;

	if (DEV_LOG) console.log("Fetching:", req.url);

	event.respondWith(
		caches.open(CACHE_NAME).then((cache) =>
			cache.match(req).then((cached) => {
				if (cached) {
					console.log("Cache hit:", req.url);
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
