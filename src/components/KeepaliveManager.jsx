import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useKeepalive } from '../hooks/useKeepalive';

/**
 * Componente que gestiona automáticamente el keepalive basado en el evento y equipo actual
 * Se debe incluir en App.jsx para mantener la conexión activa durante toda la sesión
 * Solo se activa cuando hay un evento Y un equipo seleccionados
 */
const KeepaliveManager = () => {
  const currentEvent = useSelector(state => state.event?.data);
  const session = useSelector(state => state.session);
  
  // Obtener IDs del evento y equipo actual
  const eventId = currentEvent?.id;
  const teamId = session?.teamId; // Asumiendo que el teamId está en session

  const {
    isConnected,
    hasError,
    error,
    connectedTeamsCount,
    teamId: keepaliveTeamId,
    sessionId
  } = useKeepalive(eventId, teamId, {
    autoStart: true,
    heartbeatInterval: 30000, // 30 segundos
    maxReconnectAttempts: 5
  });

  // Log del estado de conexión para debug
  useEffect(() => {
    if (eventId && teamId) {
      console.log(`[KeepaliveManager] Initialized - Event: ${eventId}, Team: ${teamId}`);
      
      if (keepaliveTeamId && sessionId) {
        console.log(`[KeepaliveManager] Active - Session: ${sessionId}`);
        console.log(`[KeepaliveManager] Status: ${isConnected ? 'Connected' : 'Disconnected'}`);
        
        if (connectedTeamsCount > 0) {
          console.log(`[KeepaliveManager] Other teams connected: ${connectedTeamsCount}`);
        }
      }
      
      if (hasError && error) {
        console.error(`[KeepaliveManager] Error: ${error}`);
      }
    } else {
      console.log(`[KeepaliveManager] Waiting for event and team selection...`);
      console.log(`[KeepaliveManager] Current - Event: ${eventId || 'none'}, Team: ${teamId || 'none'}`);
    }
  }, [eventId, teamId, keepaliveTeamId, sessionId, isConnected, connectedTeamsCount, hasError, error]);

  // Este componente no renderiza nada visible
  return null;
};

export default KeepaliveManager;
