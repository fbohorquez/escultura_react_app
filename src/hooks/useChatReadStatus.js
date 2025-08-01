// src/hooks/useChatReadStatus.js
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchChatReadStatus } from "../features/chats/chatsSlice";

/**
 * Hook para manejar el estado de lectura de los chats
 * @param {string} eventId - ID del evento
 * @param {string|number} userId - ID del usuario actual
 * @param {string} userType - Tipo de usuario ("admin" o "team")
 */
export const useChatReadStatus = (eventId, userId, userType) => {
  const dispatch = useDispatch();
  const { rooms } = useSelector((state) => state.chats);

  useEffect(() => {
    if (!eventId || !userId || !userType) return;

    // Inicializar el estado de lectura para todas las salas de chat
    // Se ejecuta para todas las salas, no solo las que tienen mensajes
    rooms.forEach((room) => {
      dispatch(fetchChatReadStatus({
        eventId,
        chatId: room.id,
        userId
      }));
    });
  }, [dispatch, eventId, userId, userType, rooms]);
};

export default useChatReadStatus;
