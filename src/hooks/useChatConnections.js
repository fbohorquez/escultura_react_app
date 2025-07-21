// src/hooks/useChatConnections.js
import { useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { subscribeToChat } from "../services/firebase";
import { setChatMessages } from "../features/chats/chatsSlice";

/**
 * Hook personalizado para manejar conexiones automáticas a todas las salas de chat relevantes
 * Se conecta automáticamente a:
 * - Sala "group" (chat grupal)
 * - Sala "admin_{teamId}" (chat privado con admin)
 * - Todas las salas "team_*" que contengan el ID del equipo
 */
export const useChatConnections = () => {
  const dispatch = useDispatch();
  const subscriptionsRef = useRef({});
  
  const { rooms } = useSelector((state) => state.chats);
  const { id: eventId } = useSelector((state) => state.event);

  useEffect(() => {
    // Solo conectar si tenemos eventId y rooms disponibles
    if (!eventId || !rooms.length) {
      return;
    }

    console.log(`[ChatConnections] Conectando a ${rooms.length} salas de chat...`);

    // Función para suscribirse a una sala específica
    const subscribeToRoom = (room) => {
      if (subscriptionsRef.current[room.id]) {
        console.log(`[ChatConnections] Ya conectado a sala ${room.id}`);
        return;
      }

      console.log(`[ChatConnections] Conectando a sala: ${room.id} (${room.name})`);
      
      const unsubscribe = subscribeToChat(eventId, room.id, (newMessages) => {
        // Actualizar mensajes de la sala
        dispatch(setChatMessages({ 
          chatId: room.id, 
          messages: newMessages 
        }));
        
        // Si hay mensajes nuevos y no es la sala activa, podríamos mostrar notificación
        // (esto se puede implementar más adelante)
      });

      subscriptionsRef.current[room.id] = {
        unsubscribe,
        roomInfo: room
      };
    };

    // Conectar a todas las salas relevantes
    rooms.forEach(room => {
      subscribeToRoom(room);
    });

    // Cleanup function: desconectar de todas las salas
    return () => {
      console.log(`[ChatConnections] Desconectando de todas las salas...`);
      Object.entries(subscriptionsRef.current).forEach(([roomId, subscription]) => {
        console.log(`[ChatConnections] Desconectando de sala: ${roomId}`);
        subscription.unsubscribe();
      });
      subscriptionsRef.current = {};
    };
  }, [eventId, rooms, dispatch]);

  // Función para obtener el estado de conexión
  const getConnectionStatus = () => {
    const connectedRooms = Object.keys(subscriptionsRef.current);
    return {
      connectedRooms,
      totalRooms: rooms.length,
      isFullyConnected: connectedRooms.length === rooms.length
    };
  };

  // Función para reconectar manualmente a todas las salas
  const reconnectAll = () => {
    console.log("[ChatConnections] Reconectando a todas las salas...");
    
    // Desconectar primero
    Object.values(subscriptionsRef.current).forEach(subscription => {
      subscription.unsubscribe();
    });
    subscriptionsRef.current = {};

    // Reconectar
    rooms.forEach(room => {
      const unsubscribe = subscribeToChat(eventId, room.id, (newMessages) => {
        dispatch(setChatMessages({ 
          chatId: room.id, 
          messages: newMessages 
        }));
      });

      subscriptionsRef.current[room.id] = {
        unsubscribe,
        roomInfo: room
      };
    });
  };

  // Función para obtener una suscripción existente o crear una nueva si no existe
  const getOrCreateSubscription = (roomId) => {
    if (subscriptionsRef.current[roomId]) {
      return subscriptionsRef.current[roomId];
    }
    
    // Si no existe la suscripción, buscar en rooms y crear una nueva
    const room = rooms.find(r => r.id === roomId);
    if (room) {
      const unsubscribe = subscribeToChat(eventId, room.id, (newMessages) => {
        dispatch(setChatMessages({ 
          chatId: room.id, 
          messages: newMessages 
        }));
      });

      subscriptionsRef.current[room.id] = {
        unsubscribe,
        roomInfo: room
      };
      
      return subscriptionsRef.current[room.id];
    }
    
    return null;
  };

  return {
    getConnectionStatus,
    reconnectAll,
    getOrCreateSubscription,
    connectedRooms: Object.keys(subscriptionsRef.current)
  };
};
