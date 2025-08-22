/**
 * Wrapper para Push API del navegador
 * Gestión simplificada del ciclo de vida de suscripciones push
 */

import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  registerServiceWorker,
  createPushSubscription,
  getVapidPublicKey
} from './notificationService';

class PushManager {
  constructor() {
    this.registration = null;
    this.vapidPublicKey = null;
    this.isInitialized = false;
  }

  /**
   * Inicializar el push manager
   */
  async initialize() {
    if (this.isInitialized) {
      return true;
    }

    try {
      if (!isNotificationSupported()) {
        throw new Error('Notificaciones no soportadas');
      }

      // Registrar service worker
      this.registration = await registerServiceWorker();
      
      // Obtener clave VAPID
      this.vapidPublicKey = await getVapidPublicKey();
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Error inicializando PushManager:', error);
      return false;
    }
  }

  /**
   * Verificar si el push manager está listo
   */
  isReady() {
    return this.isInitialized && this.registration && this.vapidPublicKey;
  }

  /**
   * Obtener estado actual de permisos
   */
  getPermissionState() {
    return getNotificationPermission();
  }

  /**
   * Solicitar permisos si es necesario
   */
  async requestPermission() {
    return await requestNotificationPermission();
  }

  /**
   * Verificar si hay suscripción activa localmente
   */
  async hasActiveSubscription() {
    if (!this.isReady()) {
      return false;
    }

    try {
      const subscription = await this.registration.pushManager.getSubscription();
      return !!subscription;
    } catch (error) {
      console.error('Error verificando suscripción local:', error);
      return false;
    }
  }

  /**
   * Obtener suscripción actual
   */
  async getCurrentSubscription() {
    if (!this.isReady()) {
      return null;
    }

    try {
      return await this.registration.pushManager.getSubscription();
    } catch (error) {
      console.error('Error obteniendo suscripción actual:', error);
      return null;
    }
  }

  /**
   * Crear nueva suscripción
   */
  async createSubscription() {
    if (!this.isReady()) {
      throw new Error('PushManager no inicializado');
    }

    // Verificar permisos
    const permission = await this.requestPermission();
    if (permission !== 'granted') {
      throw new Error('Permisos de notificación requeridos');
    }

    return await createPushSubscription(this.registration, this.vapidPublicKey);
  }

  /**
   * Cancelar suscripción actual
   */
  async unsubscribe() {
    const subscription = await this.getCurrentSubscription();
    
    if (subscription) {
      try {
        const success = await subscription.unsubscribe();
        return success;
      } catch (error) {
        console.error('Error cancelando suscripción:', error);
        return false;
      }
    }
    
    return true; // No había suscripción que cancelar
  }

  /**
   * Obtener detalles de la suscripción actual
   */
  async getSubscriptionDetails() {
    const subscription = await this.getCurrentSubscription();
    
    if (!subscription) {
      return null;
    }

    return {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.getKey('p256dh'),
        auth: subscription.getKey('auth')
      },
      expirationTime: subscription.expirationTime
    };
  }

  /**
   * Verificar si la suscripción está próxima a expirar
   */
  async isSubscriptionExpiringSoon(daysThreshold = 7) {
    const subscription = await this.getCurrentSubscription();
    
    if (!subscription || !subscription.expirationTime) {
      return false;
    }

    const now = Date.now();
    const threshold = daysThreshold * 24 * 60 * 60 * 1000;
    
    return (subscription.expirationTime - now) <= threshold;
  }

  /**
   * Renovar suscripción si está próxima a expirar
   */
  async renewSubscriptionIfNeeded(daysThreshold = 7) {
    try {
      const isExpiring = await this.isSubscriptionExpiringSoon(daysThreshold);
      
      if (isExpiring) {
        console.log('Renovando suscripción próxima a expirar...');
        
        // Cancelar suscripción actual
        await this.unsubscribe();
        
        // Crear nueva suscripción
        const newSubscription = await this.createSubscription();
        
        return newSubscription;
      }
      
      return null; // No era necesario renovar
    } catch (error) {
      console.error('Error renovando suscripción:', error);
      throw error;
    }
  }

  /**
   * Limpiar recursos
   */
  cleanup() {
    this.registration = null;
    this.vapidPublicKey = null;
    this.isInitialized = false;
  }
}

// Singleton para uso global
const pushManager = new PushManager();

export default pushManager;
