// src/components/ChatConnectionManager.jsx
import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useChatConnections } from "../hooks/useChatConnections";
import { initializeChatConnections } from "../features/chats/chatsSlice";

/**
 * Componente que maneja las conexiones automáticas a todas las salas de chat relevantes.
 * Se debe incluir en el nivel superior de la aplicación para que funcione en toda la app.
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

  // Log del estado de conexiones para debugging
  useEffect(() => {
    if (rooms.length > 0) {
      const status = getConnectionStatus();
      console.log("[ChatConnectionManager] Estado de conexiones:", {
        salas_disponibles: rooms.length,
        salas_conectadas: status.connectedRooms.length,
        completamente_conectado: status.isFullyConnected,
        salas: rooms.map(room => ({ id: room.id, name: room.name, type: room.type })),
        conexiones_activas: status.connectedRooms
      });
    }
  }, [rooms, connections.connectedRooms, getConnectionStatus]);

  // Este componente no renderiza nada visible
  return null;
};

export default ChatConnectionManager;
