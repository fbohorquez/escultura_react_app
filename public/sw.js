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

// === NOTIFICACIONES PUSH ===

// Event listener para recibir notificaciones push
self.addEventListener('push', function(event) {
	if (DEV_LOG) console.log('Push event received:', event);
	
	// Datos por defecto si no hay payload
	let notificationData = {
		title: 'Escultura',
		body: 'Nueva notificación',
		icon: '/icons/web-app-manifest-192x192.png',
		badge: '/icons/favicon-96x96.png',
		data: {}
	};
	
	// Procesar datos del push si existen
	if (event.data) {
		try {
			const pushData = event.data.json();
			notificationData = { ...notificationData, ...pushData };
		} catch (error) {
			console.error('Error parsing push data:', error);
		}
	}
	
	// Mostrar notificación
	event.waitUntil(
		self.registration.showNotification(notificationData.title, {
			body: notificationData.body,
			icon: notificationData.icon,
			badge: notificationData.badge,
			tag: notificationData.tag,
			data: notificationData.data,
			actions: notificationData.actions || [],
			requireInteraction: notificationData.requireInteraction || false,
			silent: notificationData.silent || false,
			renotify: notificationData.renotify || false
		})
	);
});

// Event listener para clicks en notificaciones
self.addEventListener('notificationclick', function(event) {
	if (DEV_LOG) console.log('Notification clicked:', event.notification);
	
	event.notification.close();
	
	const notificationData = event.notification.data || {};
	
	// Manejar acciones específicas
	if (event.action === 'open' || event.action === 'view' || !event.action) {
		// Extraer información de navegación de los datos
		const { eventId, chatId, teamId, activityId, type } = notificationData;
		
		event.waitUntil(
			self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
				// Buscar si ya hay una ventana abierta con la aplicación
				for (const client of clientList) {
					if (client.url.includes(self.location.origin) && 'focus' in client) {
						// Enviar mensaje de navegación para MemoryRouter
						client.postMessage({
							type: 'NOTIFICATION_NAVIGATE',
							payload: {
								eventId,
								chatId,
								teamId,
								activityId,
								type,
								source: 'notification'
							}
						});
						return client.focus();
					}
				}
				// Si no hay ventana abierta, abrir una nueva con parámetros
				if (self.clients.openWindow) {
					const baseUrl = self.location.origin;
					let urlWithParams = baseUrl;
					
					if (type === 'activity_valuation' && eventId && teamId && activityId) {
						// Notificación de valoración de actividad
						urlWithParams = `${baseUrl}?notification_event=${eventId}&notification_team=${teamId}&notification_activity=${activityId}&notification_type=activity_valuation`;
					} else if (type === 'activity_sent' && eventId) {
						// Notificación de actividad enviada
						urlWithParams = `${baseUrl}?notification_event=${eventId}&notification_type=activity_sent`;
					} else if (eventId && chatId) {
						// Notificación de chat
						urlWithParams = `${baseUrl}?notification_event=${eventId}&notification_chat=${chatId}&notification_type=chat`;
					}
					
					return self.clients.openWindow(urlWithParams);
				}
			})
		);
	}
});

// Listener para mensajes desde el cliente (para navegación)
self.addEventListener('message', function(event) {
	if (event.data && event.data.type === 'NAVIGATE_TO_CHAT') {
		// Enviar mensaje a todos los clientes para navegar al chat
		event.waitUntil(
			self.clients.matchAll({ includeUncontrolled: true }).then(function(clientList) {
				clientList.forEach(function(client) {
					client.postMessage({
						type: 'NOTIFICATION_NAVIGATE',
						payload: event.data.payload
					});
				});
			})
		);
	}
});
