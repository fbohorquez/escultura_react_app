// src/components/ChatConnectionManager.jsx
import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useChatConnections } from "../hooks/useChatConnections";
import { initializeChatConnections } from "../features/chats/chatsSlice";

/**
 * Componente que maneja las conexiones automáticas a salas de chat relevantes.
 * 
 * ✅ OPTIMIZADO: Ya solo se conecta a 2 salas (grupo + admin) en lugar de 3-5
 * ✅ OPTIMIZADO: getConnectionStatus memoizado para evitar re-renders
 */
export const ChatConnectionManager = () => {
  const dispatch = useDispatch();
  const { getConnectionStatus } = useChatConnections();
  
  const { id: eventId } = useSelector((state) => state.event);
  const { selectedTeam, isAdmin } = useSelector((state) => state.session);
  const { rooms, connections } = useSelector((state) => state.chats);
  
  const teamId = selectedTeam?.id;

  // Inicializar conexiones cuando se carga el evento y hay sesión
  useEffect(() => {
    if (eventId && (teamId || isAdmin)) {
      console.log("[ChatConnectionManager] Inicializando conexiones de chat...");
      console.log("EventId:", eventId, "TeamId:", teamId, "IsAdmin:", isAdmin);
      
      dispatch(initializeChatConnections({ 
        eventId, 
        teamId: teamId || null, 
        isAdmin: isAdmin || false 
      }));
    }
  }, [dispatch, eventId, teamId, isAdmin]);

  // ✅ OPTIMIZACIÓN: Memoizar solo cuando cambia el tamaño del array, no el array completo
  const roomCount = rooms.length;
  const connectedRoomCount = connections.connectedRooms.length;

  // Log del estado de conexiones para debugging (solo cuando realmente cambia)
  useEffect(() => {
    if (roomCount > 0) {
      const status = getConnectionStatus();
      console.log("[ChatConnectionManager] Estado de conexiones:", {
        salas_disponibles: roomCount,
        salas_conectadas: status.connectedRooms.length,
        completamente_conectado: status.isFullyConnected,
        salas: rooms.map(room => ({ id: room.id, name: room.name, type: room.type })),
        conexiones_activas: status.connectedRooms
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomCount, connectedRoomCount, getConnectionStatus]); // rooms está en el cuerpo de la función, no en deps

  // Este componente no renderiza nada visible
  return null;
};

export default ChatConnectionManager;
