const { webpush } = require('../../config/vapid');
const subscriptionService = require('./subscriptionService');
const logger = require('../utils/logger');

/**
 * Formatear notificación de chat
 */
function formatChatNotification(chatName, senderName, message, chatId, eventId) {
  const truncatedMessage = message.length > 80 ? 
    message.substring(0, 80) + '...' : 
    message;

  return {
    title: chatName || 'Nuevo mensaje',
    body: `${senderName}: ${truncatedMessage}`,
    icon: '/icons/web-app-manifest-192x192.png',
    badge: '/icons/favicon-96x96.png',
    tag: `chat-${chatId}`, // Para reemplazar notificaciones del mismo chat
    data: {
      type: 'chat',
      chatId,
      eventId,
      timestamp: Date.now(),
      url: `/event/${eventId}/chat/${chatId}` // URL para abrir al hacer click
    },
    actions: [
      { 
        action: 'open', 
        title: 'Ver Chat'
      }
    ],
    requireInteraction: false, // Se cierra automáticamente
    silent: false, // Con sonido
    renotify: true // Volver a notificar si se reemplaza
  };
}

/**
 * Enviar notificación a una suscripción específica
 */
async function sendNotificationToSubscription(subscription, payload) {
  try {
    const result = await webpush.sendNotification(subscription, JSON.stringify(payload));
    logger.info(`Notificación enviada exitosamente a ${subscription.userId}`);
    return { success: true, result };
  } catch (error) {
    logger.error(`Error enviando notificación a ${subscription.userId}: ${error.message}`);
    
    // Si la suscripción expiró (410), eliminarla del Map
    if (error.statusCode === 410) {
      logger.warn(`Suscripción expirada, eliminando: ${subscription.userId}-${subscription.eventId}`);
      subscriptionService.removeSubscription(subscription.userId, subscription.eventId);
    }
    
    return { success: false, error: error.message };
  }
}

/**
 * Enviar notificación a múltiples suscripciones con reintentos
 */
async function sendNotificationToMultiple(subscriptions, payload, maxRetries = 3) {
  const results = [];
  
  for (const subscription of subscriptions) {
    let attempts = 0;
    let success = false;
    
    while (attempts < maxRetries && !success) {
      attempts++;
      
      try {
        const result = await sendNotificationToSubscription(subscription, payload);
        
        if (result.success) {
          success = true;
          results.push({
            userId: subscription.userId,
            success: true,
            attempts
          });
        } else {
          // Si es error 410 (suscripción expirada), no reintentar
          if (result.error && result.error.includes('410')) {
            break;
          }
          
          // Esperar antes del siguiente intento (backoff exponencial)
          if (attempts < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 1000));
          }
        }
      } catch (error) {
        logger.error(`Intento ${attempts} fallido para ${subscription.userId}: ${error.message}`);
      }
    }
    
    if (!success) {
      results.push({
        userId: subscription.userId,
        success: false,
        attempts
      });
    }
  }
  
  return results;
}

/**
 * Enviar notificación de mensaje de chat
 */
async function sendChatMessage(eventId, chatId, senderId, senderName, senderType, message, chatName) {
  try {
    // Obtener suscripciones del evento (excluyendo al remitente)
    const eventSubscriptions = subscriptionService.getEventSubscriptions(eventId, senderId);
    
    if (eventSubscriptions.length === 0) {
      logger.info(`No hay suscripciones para el evento ${eventId}`);
      return { sent: 0, total: 0 };
    }

    // Filtrar usuarios activos en este chat específico
    const filteredSubscriptions = subscriptionService.filterActiveUsers(eventSubscriptions, chatId);
    
    if (filteredSubscriptions.length === 0) {
      logger.info(`Todos los usuarios del evento ${eventId} están activos en el chat ${chatId}`);
      return { sent: 0, total: eventSubscriptions.length, filtered: eventSubscriptions.length };
    }

    // Formatear payload de notificación
    const payload = formatChatNotification(chatName, senderName, message, chatId, eventId);
    
    // Enviar notificaciones
    logger.info(`Enviando notificación de chat a ${filteredSubscriptions.length} usuarios`);
    const results = await sendNotificationToMultiple(filteredSubscriptions, payload);
    
    // Contar resultados
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    logger.info(`Notificaciones enviadas: ${successful} exitosas, ${failed} fallidas`);
    
    return {
      sent: successful,
      failed: failed,
      total: eventSubscriptions.length,
      filtered: eventSubscriptions.length - filteredSubscriptions.length,
      results
    };

  } catch (error) {
    logger.error(`Error enviando notificación de chat: ${error.message}`);
    throw error;
  }
}

/**
 * Enviar notificación genérica a un evento
 */
async function sendEventNotification(eventId, title, body, data = {}, excludeUserId = null) {
  try {
    const eventSubscriptions = subscriptionService.getEventSubscriptions(eventId, excludeUserId);
    
    if (eventSubscriptions.length === 0) {
      logger.info(`No hay suscripciones para el evento ${eventId}`);
      return { sent: 0, total: 0 };
    }

    const payload = {
      title,
      body,
      icon: '/icons/web-app-manifest-192x192.png',
      badge: '/icons/favicon-96x96.png',
      data: {
        type: 'event',
        eventId,
        timestamp: Date.now(),
        ...data
      },
      requireInteraction: false,
      silent: false
    };

    const results = await sendNotificationToMultiple(eventSubscriptions, payload);
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    return {
      sent: successful,
      failed: failed,
      total: eventSubscriptions.length,
      results
    };

  } catch (error) {
    logger.error(`Error enviando notificación de evento: ${error.message}`);
    throw error;
  }
}

/**
 * Probar notificación (solo desarrollo)
 */
async function sendTestNotification(userId, eventId, title = 'Notificación de prueba', body = 'Esta es una notificación de prueba') {
  try {
    if (process.env.NODE_ENV !== 'development') {
      throw new Error('Notificaciones de prueba solo disponibles en desarrollo');
    }

    const subscription = subscriptionService.getSubscription(userId, eventId);
    
    if (!subscription) {
      throw new Error('No se encontró suscripción para el usuario');
    }

    const payload = {
      title,
      body,
      icon: '/icons/web-app-manifest-192x192.png',
      data: {
        type: 'test',
        timestamp: Date.now()
      }
    };

    const result = await sendNotificationToSubscription(subscription, payload);
    return result;

  } catch (error) {
    logger.error(`Error enviando notificación de prueba: ${error.message}`);
    throw error;
  }
}

module.exports = {
  sendChatMessage,
  sendEventNotification,
  sendTestNotification,
  formatChatNotification
};
