const logger = require('../utils/logger');

// Maps en memoria para almacenamiento ultra-rápido
// Suscripciones: key = "userId-eventId", value = subscription object
const subscriptions = new Map();

// Usuarios por evento: key = eventId, value = Set of userIds  
const eventSubscriptions = new Map();

// Usuarios activos en chat: key = userId, value = chatId actual
const activeChatUsers = new Map();

// Usuarios activos en la aplicación: key = userId, value = timestamp de última actividad
const activeAppUsers = new Map();

/**
 * Normalizar IDs a string para consistencia
 */
function normalizeId(id) {
  return String(id);
}

/**
 * Validar suscripción de push
 */
function isValidSubscription(subscription) {
  return subscription && 
         subscription.endpoint && 
         subscription.keys &&
         subscription.keys.p256dh &&
         subscription.keys.auth;
}

/**
 * Generar clave única para suscripción
 */
function getSubscriptionKey(userId, eventId) {
  return `${normalizeId(userId)}-${normalizeId(eventId)}`;
}

/**
 * Guardar suscripción en memoria
 */
function saveSubscription(userId, eventId, subscription, userAgent = '') {
  try {
    // Normalizar IDs
    userId = normalizeId(userId);
    eventId = normalizeId(eventId);
    
    if (!isValidSubscription(subscription)) {
      throw new Error('Datos de suscripción inválidos');
    }

    const key = getSubscriptionKey(userId, eventId);
    const subscriptionData = {
      ...subscription,
      userId,
      eventId,
      userAgent,
      timestamp: Date.now(),
      lastActivity: Date.now()
    };

    // Guardar suscripción
    subscriptions.set(key, subscriptionData);

    // Actualizar índice por evento
    console.log(`=== DEBUG saveSubscription ===`);
    console.log(`Suscribiendo usuario ${userId} al evento ${eventId} (tipo: ${typeof eventId})`);
    if (!eventSubscriptions.has(eventId)) {
      eventSubscriptions.set(eventId, new Set());
    }
    eventSubscriptions.get(eventId).add(userId);

    logger.info(`Suscripción guardada: ${key}`);
    console.log(`Suscriptores al evento ${eventId}:`, eventSubscriptions.get(eventId));
    console.log(`Todos los eventos:`, Array.from(eventSubscriptions.keys()));
    return true;
  } catch (error) {
    logger.error(`Error guardando suscripción: ${error.message}`);
    throw error;
  }
}

/**
 * Eliminar suscripción
 */
function removeSubscription(userId, eventId) {
  try {
    // Normalizar IDs
    userId = normalizeId(userId);
    eventId = normalizeId(eventId);
    
    const key = getSubscriptionKey(userId, eventId);
    
    // Eliminar suscripción principal
    const deleted = subscriptions.delete(key);
    
    // Limpiar índice por evento
    if (eventSubscriptions.has(eventId)) {
      eventSubscriptions.get(eventId).delete(userId);
      
      // Si no quedan usuarios en el evento, eliminar el Set
      if (eventSubscriptions.get(eventId).size === 0) {
        eventSubscriptions.delete(eventId);
      }
    }

    if (deleted) {
      logger.info(`Suscripción eliminada: ${key}`);
    }
    
    return deleted;
  } catch (error) {
    logger.error(`Error eliminando suscripción: ${error.message}`);
    return false;
  }
}

/**
 * Obtener suscripción específica
 */
function getSubscription(userId, eventId) {
  const key = getSubscriptionKey(normalizeId(userId), normalizeId(eventId));
  return subscriptions.get(key);
}

/**
 * Obtener todas las suscripciones de un evento (excepto usuario específico)
 */
function getEventSubscriptions(eventId, excludeUserId = null) {
  try {
    // Normalizar IDs
    eventId = normalizeId(eventId);
    if (excludeUserId) {
      excludeUserId = normalizeId(excludeUserId);
    }
    
    console.log(`=== DEBUG getEventSubscriptions ===`);
    console.log(`Buscando evento: "${eventId}" (tipo: ${typeof eventId})`);
    console.log(`Eventos disponibles:`, Array.from(eventSubscriptions.keys()));
    console.log(`Tipos de eventos:`, Array.from(eventSubscriptions.keys()).map(k => typeof k));
    
    const userIds = eventSubscriptions.get(eventId);
    console.log(`Usuarios suscritos al evento ${eventId}:`, userIds);
    if (!userIds || userIds.size === 0) {
      return [];
    }

    const eventSubs = [];
    for (const userId of userIds) {
      if (excludeUserId && userId === excludeUserId) {
        continue; // Excluir al remitente
      }

      const subscription = getSubscription(userId, eventId);
      if (subscription) {
        eventSubs.push(subscription);
      }
    }

    return eventSubs;
  } catch (error) {
    logger.error(`Error obteniendo suscripciones del evento ${eventId}: ${error.message}`);
    return [];
  }
}

/**
 * Verificar si usuario está activo en chat
 */
function isUserActiveInChat(userId, chatId) {
  const activeChat = activeChatUsers.get(normalizeId(userId));
  return activeChat === chatId;
}

/**
 * Marcar usuario como activo en chat
 */
function setUserActiveChat(userId, chatId) {
  userId = normalizeId(userId);
  if (chatId === null || chatId === undefined) {
    activeChatUsers.delete(userId);
    logger.info(`Usuario ${userId} ya no está activo en ningún chat`);
  } else {
    activeChatUsers.set(userId, chatId);
    logger.info(`Usuario ${userId} activo en chat ${chatId}`);
  }
}

/**
 * Filtrar usuarios activos en el chat actual
 */
function filterActiveUsers(subscriptions, chatId) {
  // return subscriptions;
  return subscriptions.filter(sub => !isUserActiveInChat(sub.userId, chatId));
}

/**
 * Marcar usuario como activo en la aplicación
 */
function setUserAppActivity(userId) {
  userId = normalizeId(userId);
  const timestamp = Date.now();
  activeAppUsers.set(userId, timestamp);
  logger.info(`Usuario ${userId} activo en la aplicación (${new Date(timestamp).toISOString()})`);
}

/**
 * Verificar si usuario está activo en la aplicación (últimos 5 minutos)
 */
function isUserActiveInApp(userId) {
  userId = normalizeId(userId);
  const lastActivity = activeAppUsers.get(userId);
  if (!lastActivity) return false;

  const timeAgo = Date.now() - (1 * 30 * 1000); // 30 segundos
  return lastActivity > timeAgo;
}

/**
 * Filtrar usuarios activos en la aplicación para notificaciones de actividades
 */
function filterActiveAppUsers(subscriptions) {
  // Todos los usuarios se consideran activos (Check)
  return subscriptions;
  return subscriptions.filter(sub => !isUserActiveInApp(sub.userId));
}

/**
 * Limpiar suscripciones expiradas (más de 24 horas sin actividad)
 */
function cleanupExpiredSubscriptions() {
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 horas
  let cleaned = 0;

  for (const [key, subscription] of subscriptions.entries()) {
    if (now - subscription.lastActivity > maxAge) {
      const { userId, eventId } = subscription;
      removeSubscription(userId, eventId);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    logger.info(`Limpieza automática: ${cleaned} suscripciones expiradas eliminadas`);
  }

  return cleaned;
}

/**
 * Actualizar última actividad de suscripción
 */
function updateSubscriptionActivity(userId, eventId) {
  const subscription = getSubscription(normalizeId(userId), normalizeId(eventId));
  if (subscription) {
    subscription.lastActivity = Date.now();
  }
}

/**
 * Obtener estadísticas del servicio
 */
function getStats() {
  return {
    totalSubscriptions: subscriptions.size,
    totalEvents: eventSubscriptions.size,
    activeUsers: activeChatUsers.size,
    memoryUsage: process.memoryUsage()
  };
}

/**
 * Exportar datos para backup
 */
function exportData() {
  return {
    subscriptions: Array.from(subscriptions.entries()),
    eventSubscriptions: Array.from(eventSubscriptions.entries()).map(([eventId, userSet]) => [
      eventId, 
      Array.from(userSet)
    ]),
    activeChatUsers: Array.from(activeChatUsers.entries()),
    timestamp: Date.now()
  };
}

/**
 * Importar datos desde backup
 */
function importData(data) {
  try {
    if (!data || !data.subscriptions) {
      return false;
    }

    // Limpiar Maps actuales
    subscriptions.clear();
    eventSubscriptions.clear();
    activeChatUsers.clear();

    // Importar suscripciones
    for (const [key, subscription] of data.subscriptions) {
      subscriptions.set(key, subscription);
    }

    // Importar índice de eventos
    if (data.eventSubscriptions) {
      for (const [eventId, userArray] of data.eventSubscriptions) {
        eventSubscriptions.set(eventId, new Set(userArray));
      }
    }

    // Importar usuarios activos
    if (data.activeChatUsers) {
      for (const [userId, chatId] of data.activeChatUsers) {
        activeChatUsers.set(userId, chatId);
      }
    }

    logger.info(`Datos importados: ${subscriptions.size} suscripciones, ${eventSubscriptions.size} eventos`);
    return true;
  } catch (error) {
    logger.error(`Error importando datos: ${error.message}`);
    return false;
  }
}

module.exports = {
  saveSubscription,
  removeSubscription,
  getSubscription,
  getEventSubscriptions,
  isUserActiveInChat,
  setUserActiveChat,
  filterActiveUsers,
  setUserAppActivity,
  isUserActiveInApp,
  filterActiveAppUsers,
  cleanupExpiredSubscriptions,
  updateSubscriptionActivity,
  getStats,
  exportData,
  importData
};

