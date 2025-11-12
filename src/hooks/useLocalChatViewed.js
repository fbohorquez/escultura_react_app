// src/hooks/useLocalChatViewed.js
import { useCallback } from 'react';
import { useSelector } from 'react-redux';

/**
 * Hook para gestionar el estado local de mensajes visualizados
 * Independiente de Firebase, persiste en localStorage
 * 
 * Estructura en localStorage:
 * {
 *   "chat_viewed_{eventId}_{userId}": {
 *     "chatId_1": {
 *       lastViewedIndex: 5,
 *       lastViewedDate: timestamp
 *     },
 *     "chatId_2": {
 *       lastViewedIndex: 10,
 *       lastViewedDate: timestamp
 *     }
 *   }
 * }
 */

const STORAGE_KEY_PREFIX = 'chat_viewed';

/**
 * Obtiene la clave de localStorage para un evento/usuario específico
 */
const getStorageKey = (eventId, userId) => {
  return `${STORAGE_KEY_PREFIX}_${eventId}_${userId}`;
};

/**
 * Lee el estado de visualización desde localStorage
 */
const readLocalViewedState = (eventId, userId) => {
  try {
    const key = getStorageKey(eventId, userId);
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('[LocalChatViewed] Error reading from localStorage:', error);
    return {};
  }
};

/**
 * Guarda el estado de visualización en localStorage
 */
const saveLocalViewedState = (eventId, userId, state) => {
  try {
    const key = getStorageKey(eventId, userId);
    localStorage.setItem(key, JSON.stringify(state));
  } catch (error) {
    console.error('[LocalChatViewed] Error saving to localStorage:', error);
  }
};

/**
 * Hook principal
 */
export const useLocalChatViewed = (eventId, userId) => {
  const messages = useSelector((state) => state.chats.messages);

  /**
   * Obtiene el último índice visualizado para un chat
   */
  const getLastViewedIndex = useCallback((chatId) => {
    const viewedState = readLocalViewedState(eventId, userId);
    return viewedState[chatId]?.lastViewedIndex ?? -1;
  }, [eventId, userId]);

  /**
   * Marca un chat como visualizado hasta cierto índice
   */
  const markChatAsViewed = useCallback((chatId, messageIndex = null) => {
    const viewedState = readLocalViewedState(eventId, userId);
    
    // Si no se especifica índice, usar el último mensaje disponible
    const lastIndex = messageIndex !== null 
      ? messageIndex 
      : (messages[chatId]?.length || 1) - 1;

    viewedState[chatId] = {
      lastViewedIndex: lastIndex,
      lastViewedDate: Date.now()
    };

    saveLocalViewedState(eventId, userId, viewedState);
    
    console.log(`[LocalChatViewed] Chat ${chatId} marcado como visto hasta índice ${lastIndex}`);
  }, [eventId, userId, messages]);

  /**
   * Obtiene el contador de mensajes NO visualizados localmente
   */
  const getLocalUnreadCount = useCallback((chatId) => {
    const chatMessages = messages[chatId] || [];
    if (chatMessages.length === 0) return 0;

    const lastViewedIndex = getLastViewedIndex(chatId);
    
    // Contar mensajes con índice mayor al último visualizado
    const unreadCount = chatMessages.length - 1 - lastViewedIndex;
    
    return Math.max(0, unreadCount);
  }, [messages, getLastViewedIndex]);

  /**
   * Obtiene el total de mensajes NO visualizados en todos los chats
   */
  const getTotalLocalUnread = useCallback(() => {
    const chatIds = Object.keys(messages);
    return chatIds.reduce((total, chatId) => {
      return total + getLocalUnreadCount(chatId);
    }, 0);
  }, [messages, getLocalUnreadCount]);

  /**
   * Limpia el estado local de un chat específico
   */
  const clearChatViewedState = useCallback((chatId) => {
    const viewedState = readLocalViewedState(eventId, userId);
    delete viewedState[chatId];
    saveLocalViewedState(eventId, userId, viewedState);
  }, [eventId, userId]);

  /**
   * Limpia TODO el estado local de visualización
   */
  const clearAllViewedState = useCallback(() => {
    const key = getStorageKey(eventId, userId);
    localStorage.removeItem(key);
  }, [eventId, userId]);

  return {
    getLastViewedIndex,
    markChatAsViewed,
    getLocalUnreadCount,
    getTotalLocalUnread,
    clearChatViewedState,
    clearAllViewedState
  };
};

export default useLocalChatViewed;
