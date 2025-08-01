// src/utils/chatUtils.js

/**
 * Verifica si un mensaje pertenece al usuario actual
 * @param {Object} message - El mensaje a verificar
 * @param {boolean} isAdmin - Si el usuario actual es admin
 * @param {string|number} currentUserId - ID del usuario actual
 * @returns {boolean} - true si el mensaje pertenece al usuario actual
 */
export const isMyMessage = (message, isAdmin, currentUserId) => {
  if (isAdmin) {
    return message.type === "admin";
  } else {
    return message.team === currentUserId || message.team === currentUserId.toString();
  }
};

/**
 * Obtiene el nombre del remitente de un mensaje
 * @param {Object} message - El mensaje
 * @param {Function} t - Función de traducción
 * @returns {string} - Nombre del remitente
 */
export const getMessageSenderName = (message, t) => {
  if (message.type === "admin") {
    return t("chats.admin");
  }
  return message.name || t("chats.team");
};

/**
 * Formatea la hora de un mensaje
 * @param {number} timestamp - Timestamp del mensaje
 * @returns {string} - Hora formateada
 */
export const formatMessageTime = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};
