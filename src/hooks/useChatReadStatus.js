// src/hooks/useChatReadStatus.js
import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchChatReadStatus } from "../features/chats/chatsSlice";

/**
 * Hook para manejar el estado de lectura de los chats
 * @param {string} eventId - ID del evento
 * @param {string|number} userId - ID del usuario actual
 * @param {string} userType - Tipo de usuario ("admin" o "team")
 * 
 * ✅ OPTIMIZADO: Ya solo carga 2 salas (grupo + admin) en lugar de 3-5
 * ✅ OPTIMIZADO: Evita recargas innecesarias usando ref
 */
export const useChatReadStatus = (eventId, userId, userType) => {
  const dispatch = useDispatch();
  const { rooms } = useSelector((state) => state.chats);
  const loadedRoomsRef = useRef(new Set());

  useEffect(() => {
    if (!eventId || !userId || !userType || rooms.length === 0) return;

    // ✅ OPTIMIZACIÓN: Solo cargar estado de lectura para salas que NO se han cargado antes
    rooms.forEach((room) => {
      const roomKey = `${eventId}_${room.id}_${userId}`;
      
      if (!loadedRoomsRef.current.has(roomKey)) {
        loadedRoomsRef.current.add(roomKey);
        dispatch(fetchChatReadStatus({
          eventId,
          chatId: room.id,
          userId
        }));
      }
    });
  }, [dispatch, eventId, userId, userType, rooms]);
};

export default useChatReadStatus;
