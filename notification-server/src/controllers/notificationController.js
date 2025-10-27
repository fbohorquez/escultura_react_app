const express = require('express');
const router = express.Router();
const notificationService = require('../services/notificationService');
const logger = require('../utils/logger');

/**
 * POST /api/send-chat-message - Endpoint principal para mensajes de chat
 */
router.post('/send-chat-message', async (req, res) => {
  try {
    const { 
      eventId, 
      chatId, 
      senderId, 
      senderName,
      senderType, 
      message, 
      chatName 
    } = req.body;

    // Validar datos requeridos
    if (!eventId || !chatId || !senderId || !senderName || !message) {
      return res.status(400).json({
        error: 'Faltan datos requeridos: eventId, chatId, senderId, senderName, message'
      });
    }

    console.log(`=== DEBUG send-chat-message ===`);
    console.log(`eventId: "${eventId}" (tipo: ${typeof eventId})`);
    console.log(`senderId: "${senderId}" (tipo: ${typeof senderId})`);
    console.log(`chatId: "${chatId}"`);

    // Enviar notificaciones
    const result = await notificationService.sendChatMessage(
      eventId,
      chatId,
      senderId,
      senderName,
      senderType,
      message,
      chatName
    );

    res.json({
      message: 'Notificaciones enviadas',
      ...result
    });

  } catch (error) {
    logger.error(`Error en POST /send-chat-message: ${error.message}`);
    res.status(500).json({
      error: 'Error enviando notificaciones de chat',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/send-event-notification - Enviar notificación genérica a evento
 */
router.post('/send-event-notification', async (req, res) => {
  try {
    const { eventId, title, body, data, excludeUserId } = req.body;

    if (!eventId || !title || !body) {
      return res.status(400).json({
        error: 'Faltan datos requeridos: eventId, title, body'
      });
    }

    const result = await notificationService.sendEventNotification(
      eventId,
      title,
      body,
      data,
      excludeUserId
    );

    res.json({
      message: 'Notificación de evento enviada',
      ...result
    });

  } catch (error) {
    logger.error(`Error en POST /send-event-notification: ${error.message}`);
    res.status(500).json({
      error: 'Error enviando notificación de evento',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/send-test-notification - Enviar notificación de prueba (solo desarrollo)
 */
router.post('/send-test-notification', async (req, res) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({
      error: 'Endpoint disponible solo en desarrollo'
    });
  }

  try {
    const { userId, eventId, title, body } = req.body;

    if (!userId || !eventId) {
      return res.status(400).json({
        error: 'Faltan datos requeridos: userId, eventId'
      });
    }

    const result = await notificationService.sendTestNotification(
      userId,
      eventId,
      title,
      body
    );

    res.json({
      message: 'Notificación de prueba enviada',
      success: result.success,
      error: result.error
    });

  } catch (error) {
    logger.error(`Error en POST /send-test-notification: ${error.message}`);
    res.status(500).json({
      error: error.message
    });
  }
});

/**
 * POST /api/send-activity-valuation - Enviar notificación de valoración de actividad
 */
router.post('/send-activity-valuation', async (req, res) => {
  try {
    const { 
      eventId, 
      teamId, 
      activityId, 
      activityName, 
      points, 
      isUpdate = false 
    } = req.body;

    // Validar datos requeridos
    if (!eventId || !teamId || !activityId || !activityName) {
      return res.status(400).json({
        error: 'Faltan datos requeridos: eventId, teamId, activityId, activityName'
      });
    }

    // Enviar notificación específica al equipo
    // const result = await notificationService.sendActivityValuationNotification(
    //   eventId,
    //   teamId,
    //   activityId,
    //   activityName,
    //   points,
    //   isUpdate
    // );

    // res.json({
    //   message: 'Notificación de valoración enviada',
    //   ...result
    // });

  } catch (error) {
    logger.error(`Error en POST /send-activity-valuation: ${error.message}`);
    res.status(500).json({
      error: 'Error enviando notificación de valoración',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/send-activity-sent - Enviar notificación de actividad enviada
 */
router.post('/send-activity-sent', async (req, res) => {
  try {
    const { 
      eventId, 
      teamId, 
      activityId, 
      activityName, 
      isForced = false 
    } = req.body;

    // Validar datos requeridos
    if (!eventId || !teamId || !activityId || !activityName) {
      return res.status(400).json({
        error: 'Faltan datos requeridos: eventId, teamId, activityId, activityName'
      });
    }

    // Enviar notificación específica al equipo
    const result = await notificationService.sendActivitySentNotification(
      eventId,
      teamId,
      activityId,
      activityName,
      isForced
    );

    res.json({
      message: 'Notificación de actividad enviada',
      ...result
    });

  } catch (error) {
    logger.error(`Error en POST /send-activity-sent: ${error.message}`);
    res.status(500).json({
      error: 'Error enviando notificación de actividad',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
