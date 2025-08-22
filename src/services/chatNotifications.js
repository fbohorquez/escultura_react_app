/**
 * Servicio para enviar notificaciones de chat
 * Se integra COMPLEMENTARIAMENTE con Firebase (no lo reemplaza)
 */

import { NOTIFICATION_SERVER_URL, NOTIFICATION_CONFIG } from '../constants/notifications';

/**
 * Enviar notificación de mensaje de chat al servidor de notificaciones
 * Esta función NO interfiere con Firebase, es complementaria
 */
export async function sendChatNotification(eventId, chatId, messageData, senderInfo, chatName) {
  try {
    // Preparar datos para el servidor de notificaciones
    const payload = {
      eventId,
      chatId,
      senderId: senderInfo.senderId,
      senderName: senderInfo.senderName,
      senderType: senderInfo.senderType,
      message: messageData.message,
      chatName: chatName || `Chat ${chatId}`
    };

    // Usar timeout para no bloquear el chat si falla
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), NOTIFICATION_CONFIG.REQUEST_TIMEOUT)
    );

    const fetchPromise = fetch(`${NOTIFICATION_SERVER_URL}/api/send-chat-message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    const response = await Promise.race([fetchPromise, timeoutPromise]);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }

    const result = await response.json();
    
    // Log en desarrollo
    if (import.meta.env.MODE === 'development') {
      console.log('📱 Notificación de chat enviada:', result);
    }

    return {
      success: true,
      sent: result.sent || 0,
      total: result.total || 0,
      filtered: result.filtered || 0
    };

  } catch (error) {
    // Fallar silenciosamente para no afectar el chat
    console.warn('⚠️ Error enviando notificación de chat (no crítico):', error.message);
    
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Notificar actividad de usuario en chat específico
 * Esto evita spam de notificaciones a usuarios activos
 */
export async function notifyUserChatActivity(userId, eventId, chatId) {
  try {
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), NOTIFICATION_CONFIG.REQUEST_TIMEOUT)
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
      console.warn('Error notificando actividad de usuario:', response.status);
      return false;
    }

    return true;
  } catch (error) {
    console.warn('Error notificando actividad de usuario:', error.message);
    return false;
  }
}

/**
 * Limpiar actividad de usuario (ya no está en ningún chat)
 */
export async function clearUserChatActivity(userId, eventId) {
  return await notifyUserChatActivity(userId, eventId, null);
}
