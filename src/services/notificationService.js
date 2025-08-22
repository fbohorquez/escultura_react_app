/**
 * Servicio de notificaciones para React
 * Gestiona permisos, suscripciones y comunicación con el servidor de notificaciones
 */

const NOTIFICATION_SERVER_URL = import.meta.env.VITE_NOTIFICATIONS_SERVER_URL || 'http://localhost:3089';
const ENABLE_NOTIFICATIONS = import.meta.env.VITE_ENABLE_NOTIFICATIONS === 'true';

/**
 * Verificar soporte de notificaciones en el navegador
 */
export function isNotificationSupported() {
  return (
    'serviceWorker' in navigator && 
    'PushManager' in window && 
    'Notification' in window &&
    ENABLE_NOTIFICATIONS
  );
}

/**
 * Obtener estado actual de permisos
 */
export function getNotificationPermission() {
  if (!isNotificationSupported()) {
    return 'unsupported';
  }
  return Notification.permission;
}

/**
 * Solicitar permisos de notificación al usuario
 */
export async function requestNotificationPermission() {
  if (!isNotificationSupported()) {
    throw new Error('Las notificaciones no están soportadas en este navegador');
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    throw new Error('Los permisos de notificación han sido denegados');
  }

  const permission = await Notification.requestPermission();
  return permission;
}

/**
 * Registrar service worker si no está registrado
 */
export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service Worker no soportado');
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    
    // Esperar a que esté activo
    if (registration.installing) {
      await new Promise((resolve) => {
        registration.installing.addEventListener('statechange', (e) => {
          if (e.target.state === 'activated') {
            resolve();
          }
        });
      });
    }

    return registration;
  } catch (error) {
    console.error('Error registrando Service Worker:', error);
    throw error;
  }
}

/**
 * Obtener clave pública VAPID del servidor
 */
export async function getVapidPublicKey() {
  try {
    const response = await fetch(`${NOTIFICATION_SERVER_URL}/api/vapid-public-key`);
    
    if (!response.ok) {
      throw new Error(`Error obteniendo clave VAPID: ${response.status}`);
    }
    
    const data = await response.json();
    return data.publicKey;
  } catch (error) {
    console.error('Error obteniendo clave VAPID:', error);
    throw error;
  }
}

/**
 * Convertir clave VAPID a formato Uint8Array
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Crear suscripción push
 */
export async function createPushSubscription(registration, vapidPublicKey) {
  try {
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
    });

    return subscription;
  } catch (error) {
    console.error('Error creando suscripción push:', error);
    throw error;
  }
}

/**
 * Enviar suscripción al servidor
 */
export async function saveSubscriptionToServer(userId, eventId, subscription) {
  try {
    const response = await fetch(`${NOTIFICATION_SERVER_URL}/api/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        eventId,
        subscription
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Error del servidor: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error guardando suscripción:', error);
    throw error;
  }
}

/**
 * Eliminar suscripción del servidor
 */
export async function removeSubscriptionFromServer(userId, eventId) {
  try {
    const response = await fetch(`${NOTIFICATION_SERVER_URL}/api/unsubscribe`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        eventId
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Error del servidor: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error eliminando suscripción:', error);
    throw error;
  }
}

/**
 * Verificar estado de suscripción en el servidor
 */
export async function checkSubscriptionStatus(userId, eventId) {
  try {
    const response = await fetch(
      `${NOTIFICATION_SERVER_URL}/api/subscription/status?userId=${userId}&eventId=${eventId}`
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Error del servidor: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error verificando estado de suscripción:', error);
    throw error;
  }
}

/**
 * Notificar al servidor que el usuario está activo en un chat
 */
export async function setUserActiveInChat(userId, eventId, chatId) {
  try {
    // Usar timeout para no bloquear la UI
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), 5000)
    );

    const fetchPromise = fetch(`${NOTIFICATION_SERVER_URL}/api/user-active-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        eventId,
        chatId
      })
    });

    const response = await Promise.race([fetchPromise, timeoutPromise]);

    if (!response.ok) {
      console.warn(`Error actualizando estado de usuario: ${response.status}`);
      return false;
    }

    return true;
  } catch (error) {
    // Fallar silenciosamente para no afectar la UX
    console.warn('Error notificando actividad de usuario:', error.message);
    return false;
  }
}

/**
 * Proceso completo de suscripción
 */
export async function subscribeToNotifications(userId, eventId) {
  // 1. Verificar soporte
  if (!isNotificationSupported()) {
    throw new Error('Las notificaciones no están soportadas');
  }

  // 2. Solicitar permisos
  const permission = await requestNotificationPermission();
  if (permission !== 'granted') {
    throw new Error('Permisos de notificación denegados');
  }

  // 3. Registrar service worker
  const registration = await registerServiceWorker();

  // 4. Obtener clave VAPID
  const vapidPublicKey = await getVapidPublicKey();

  // 5. Crear suscripción
  const subscription = await createPushSubscription(registration, vapidPublicKey);

  // 6. Enviar al servidor
  await saveSubscriptionToServer(userId, eventId, subscription);

  return {
    subscription,
    permission,
    isSubscribed: true
  };
}

/**
 * Proceso completo de desuscripción
 */
export async function unsubscribeFromNotifications(userId, eventId) {
  try {
    // 1. Eliminar del servidor
    await removeSubscriptionFromServer(userId, eventId);

    // 2. Intentar obtener suscripción local y cancelarla
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration && registration.pushManager) {
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
        }
      }
    }

    return { isSubscribed: false };
  } catch (error) {
    console.error('Error en desuscripción:', error);
    throw error;
  }
}

/**
 * Verificar si hay suscripción activa (local + servidor)
 */
export async function checkActiveSubscription(userId, eventId) {
  try {
    // 1. Verificar suscripción local
    if (!('serviceWorker' in navigator)) {
      return { isSubscribed: false, source: 'no-sw' };
    }

    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration || !registration.pushManager) {
      return { isSubscribed: false, source: 'no-pushmanager' };
    }

    const localSubscription = await registration.pushManager.getSubscription();
    if (!localSubscription) {
      return { isSubscribed: false, source: 'no-local-subscription' };
    }

    // 2. Verificar en servidor
    const serverStatus = await checkSubscriptionStatus(userId, eventId);
    
    return {
      isSubscribed: serverStatus.isSubscribed,
      source: 'server',
      localSubscription,
      serverSubscription: serverStatus.subscription
    };
  } catch (error) {
    console.warn('Error verificando suscripción activa:', error);
    return { isSubscribed: false, source: 'error', error: error.message };
  }
}
