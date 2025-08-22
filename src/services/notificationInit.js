import store from '../store';
import { initializeNotifications } from '../features/notifications/notificationsSlice';
import { DEV_CONFIG } from '../constants/notifications';
import { requestNotificationPermission, isNotificationSupported } from './notificationService';

/**
 * Inicializar sistema de notificaciones push
 * Se ejecuta al cargar la aplicación
 */
export async function initNotificationSystem() {
  try {
    if (DEV_CONFIG.LOG_ENABLED) {
      console.log('🔔 Inicializando sistema de notificaciones push...');
    }

    // Verificar soporte antes de continuar
    if (!isNotificationSupported()) {
      if (DEV_CONFIG.LOG_ENABLED) {
        console.log('ℹ️ Notificaciones no soportadas en este navegador');
      }
      return false;
    }

    // Dispatch de inicialización a través del store
    await store.dispatch(initializeNotifications());

    // Configurar listener para navegación desde notificaciones
    setupNavigationListener();

    if (DEV_CONFIG.LOG_ENABLED) {
      console.log('✅ Sistema de notificaciones inicializado');
    }

    return true;
  } catch (error) {
    console.error('❌ Error inicializando notificaciones:', error);
    return false;
  }
}

/**
 * Solicitar permisos de notificación si aún no se han pedido
 */
export async function promptNotificationPermission() {
  try {
    if (!isNotificationSupported()) {
      return false;
    }

    // Solo solicitar si el estado es 'default' (nunca se ha preguntado)
    if (Notification.permission === 'default') {
      if (DEV_CONFIG.LOG_ENABLED) {
        console.log('🔔 Solicitando permisos de notificación...');
      }
      
      const permission = await requestNotificationPermission();
      
      if (DEV_CONFIG.LOG_ENABLED) {
        console.log('📝 Permisos de notificación:', permission);
      }
      
      return permission === 'granted';
    }

    return Notification.permission === 'granted';
  } catch (error) {
    console.error('❌ Error solicitando permisos:', error);
    return false;
  }
}

/**
 * Configurar listener para navegación desde service worker
 */
function setupNavigationListener() {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  // Escuchar mensajes del service worker para navegación
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'navigate' && event.data.url) {
      // Navegar a la URL solicitada
      const { url } = event.data;
      
      if (DEV_CONFIG.LOG_ENABLED) {
        console.log('📱 Navegando desde notificación:', url);
      }

      // Si la aplicación está en React Router, necesitamos usar history
      // Por ahora, usamos window.location como fallback
      if (url.startsWith('/')) {
        window.location.href = window.location.origin + url;
      } else {
        window.location.href = url;
      }
    }
  });
}

/**
 * Cleanup del sistema de notificaciones
 * Se ejecuta al cerrar la aplicación
 */
export function cleanupNotificationSystem() {
  try {
    // Aquí se pueden agregar tareas de limpieza si es necesario
    if (DEV_CONFIG.LOG_ENABLED) {
      console.log('🧹 Limpiando sistema de notificaciones');
    }
  } catch (error) {
    console.error('Error en cleanup de notificaciones:', error);
  }
}
