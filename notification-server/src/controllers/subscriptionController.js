const express = require('express');
const router = express.Router();
const subscriptionService = require('../services/subscriptionService');
const { vapidDetails } = require('../../config/vapid');
const logger = require('../utils/logger');

/**
 * POST /api/subscribe - Guardar nueva suscripción
 */
router.post('/subscribe', async (req, res) => {
  try {
    const { userId, eventId, subscription } = req.body;

    // Validar datos requeridos
    if (!userId || !eventId || !subscription) {
      return res.status(400).json({
        error: 'Faltan datos requeridos: userId, eventId, subscription'
      });
    }

    console.log(`=== DEBUG subscribe ===`);
    console.log(`userId: "${userId}" (tipo: ${typeof userId})`);
    console.log(`eventId: "${eventId}" (tipo: ${typeof eventId})`);

    // Obtener User-Agent para tracking
    const userAgent = req.headers['user-agent'] || '';

    // Guardar suscripción
    const success = subscriptionService.saveSubscription(userId, eventId, subscription, userAgent);
    
    if (success) {
      res.status(201).json({
        message: 'Suscripción guardada exitosamente',
        userId,
        eventId
      });
    } else {
      res.status(500).json({
        error: 'Error guardando suscripción'
      });
    }

  } catch (error) {
    logger.error(`Error en POST /subscribe: ${error.message}`);
    res.status(400).json({
      error: error.message
    });
  }
});

/**
 * DELETE /api/unsubscribe - Eliminar suscripción
 */
router.delete('/unsubscribe', async (req, res) => {
  try {
    const { userId, eventId } = req.body;

    if (!userId || !eventId) {
      return res.status(400).json({
        error: 'Faltan datos requeridos: userId, eventId'
      });
    }

    const success = subscriptionService.removeSubscription(userId, eventId);
    
    if (success) {
      res.json({
        message: 'Suscripción eliminada exitosamente',
        userId,
        eventId
      });
    } else {
      res.status(404).json({
        error: 'Suscripción no encontrada'
      });
    }

  } catch (error) {
    logger.error(`Error en DELETE /unsubscribe: ${error.message}`);
    res.status(500).json({
      error: 'Error eliminando suscripción'
    });
  }
});

/**
 * GET /api/subscription/status - Verificar estado de suscripción
 */
router.get('/subscription/status', async (req, res) => {
  try {
    const { userId, eventId } = req.query;

    if (!userId || !eventId) {
      return res.status(400).json({
        error: 'Faltan parámetros requeridos: userId, eventId'
      });
    }

    const subscription = subscriptionService.getSubscription(userId, eventId);
    
    res.json({
      isSubscribed: !!subscription,
      subscription: subscription ? {
        userId: subscription.userId,
        eventId: subscription.eventId,
        timestamp: subscription.timestamp,
        lastActivity: subscription.lastActivity
      } : null
    });

  } catch (error) {
    logger.error(`Error en GET /subscription/status: ${error.message}`);
    res.status(500).json({
      error: 'Error verificando estado de suscripción'
    });
  }
});

/**
 * POST /api/user-active-chat - Marcar usuario como activo en chat específico
 */
router.post('/user-active-chat', async (req, res) => {
  try {
    const { userId, eventId, chatId } = req.body;

    if (!userId || !eventId) {
      return res.status(400).json({
        error: 'Faltan datos requeridos: userId, eventId'
      });
    }

    // chatId puede ser null para indicar que el usuario ya no está activo
    subscriptionService.setUserActiveChat(userId, chatId);
    
    // Actualizar actividad de la suscripción si existe
    if (chatId) {
      subscriptionService.updateSubscriptionActivity(userId, eventId);
    }

    res.json({
      message: chatId ? 
        `Usuario ${userId} marcado como activo en chat ${chatId}` :
        `Usuario ${userId} ya no está activo en ningún chat`,
      userId,
      eventId,
      chatId
    });

  } catch (error) {
    logger.error(`Error en POST /user-active-chat: ${error.message}`);
    res.status(500).json({
      error: 'Error actualizando estado de usuario'
    });
  }
});

/**
 * GET /api/vapid-public-key - Obtener clave pública VAPID
 */
router.get('/vapid-public-key', (req, res) => {
  res.json({
    publicKey: vapidDetails.publicKey
  });
});

/**
 * GET /api/stats - Estadísticas del servicio (solo desarrollo)
 */
router.get('/stats', (req, res) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({
      error: 'Endpoint disponible solo en desarrollo'
    });
  }

  const stats = subscriptionService.getStats();
  res.json(stats);
});

/**
 * POST /api/user-app-activity - Reportar actividad del usuario en la aplicación
 */
router.post('/user-app-activity', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        error: 'Falta userId'
      });
    }

    // Actualizar actividad del usuario
    subscriptionService.setUserAppActivity(userId);

    res.json({
      message: 'Actividad de usuario actualizada',
      userId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error(`Error en POST /user-app-activity: ${error.message}`);
    res.status(500).json({
      error: 'Error actualizando actividad de usuario'
    });
  }
});

module.exports = router;
