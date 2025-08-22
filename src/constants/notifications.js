/**
 * Constantes para el sistema de notificaciones push
 */

// URLs del servidor de notificaciones
export const NOTIFICATION_SERVER_URL = import.meta.env.VITE_NOTIFICATIONS_SERVER_URL || 'http://localhost:3089';

// Configuración de notificaciones
export const NOTIFICATION_CONFIG = {
  // Timeout para llamadas al servidor (ms)
  REQUEST_TIMEOUT: 5000,
  
  // Intervalo para verificar suscripciones (ms)
  CHECK_INTERVAL: 5 * 60 * 1000, // 5 minutos
  
  // Días antes de expiración para renovar suscripción
  RENEWAL_THRESHOLD_DAYS: 7,
  
  // Opciones por defecto de notificación
  DEFAULT_OPTIONS: {
    requireInteraction: false,
    silent: false,
    renotify: true
  }
};

// Tipos de notificación
export const NOTIFICATION_TYPES = {
  CHAT: 'chat',
  EVENT: 'event',
  SYSTEM: 'system',
  TEST: 'test'
};

// Iconos para notificaciones
export const NOTIFICATION_ICONS = {
  CHAT: '/icons/web-app-manifest-192x192.png',
  EVENT: '/icons/web-app-manifest-192x192.png',
  SYSTEM: '/icons/web-app-manifest-192x192.png',
  DEFAULT: '/icons/web-app-manifest-192x192.png',
  BADGE: '/icons/favicon-96x96.png'
};

// Estados de permisos
export const PERMISSION_STATES = {
  DEFAULT: 'default',     // No solicitado
  GRANTED: 'granted',     // Concedido
  DENIED: 'denied',       // Denegado
  UNSUPPORTED: 'unsupported' // No soportado
};

// Acciones de notificación (botones)
export const NOTIFICATION_ACTIONS = {
  OPEN_CHAT: {
    action: 'open',
    title: 'Ver Chat'
  },
  MARK_READ: {
    action: 'mark-read',
    title: 'Marcar como leído'
  },
  DISMISS: {
    action: 'dismiss',
    title: 'Cerrar'
  }
};

// Configuración de sonidos (si se implementa en el futuro)
export const NOTIFICATION_SOUNDS = {
  CHAT: '/sounds/chat.mp3',
  EVENT: '/sounds/event.mp3',
  DEFAULT: null
};

// Etiquetas (tags) para agrupar notificaciones
export const NOTIFICATION_TAGS = {
  CHAT: (chatId) => `chat-${chatId}`,
  EVENT: (eventId) => `event-${eventId}`,
  SYSTEM: 'system'
};

// Mensajes de error comunes
export const ERROR_MESSAGES = {
  NOT_SUPPORTED: 'Las notificaciones no están soportadas en este navegador',
  PERMISSION_DENIED: 'Los permisos de notificación han sido denegados',
  NO_USER: 'Debes iniciar sesión para recibir notificaciones',
  NO_EVENT: 'Selecciona un evento para recibir notificaciones',
  SERVER_ERROR: 'Error de conexión con el servidor de notificaciones',
  SUBSCRIPTION_FAILED: 'Error al crear la suscripción de notificaciones',
  INVALID_SUBSCRIPTION: 'Suscripción inválida o corrupta'
};

// Configuración de desarrollo
export const DEV_CONFIG = {
  LOG_ENABLED: import.meta.env.MODE === 'development',
  SHOW_TEST_COMPONENTS: import.meta.env.MODE === 'development',
  MOCK_NOTIFICATIONS: false
};

// Clave para localStorage
export const STORAGE_KEYS = {
  NOTIFICATION_SETTINGS: 'notificationSettings',
  DISMISSED_BANNERS: 'dismissedNotificationBanners'
};
