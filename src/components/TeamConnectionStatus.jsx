import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { getTeamConnectionStatus } from '../services/firebase';
import './TeamConnectionStatus.css';

/**
 * Componente que muestra el estado de conexión de un equipo específico
 * @param {Object} props - Propiedades del componente
 * @param {string|number} props.teamId - ID del equipo
 * @param {boolean} props.showLastSeen - Mostrar última vez visto (opcional)
 * @param {boolean} props.compact - Versión compacta (opcional)
 * @param {string} props.className - Clases CSS adicionales (opcional)
 * @param {number} props.refreshInterval - Intervalo de actualización en ms (opcional, default: 5000)
 */
const TeamConnectionStatus = ({ 
  teamId, 
  showLastSeen = false, 
  compact = false, 
  className = '',
  refreshInterval = 5000
}) => {
  const [teamStatus, setTeamStatus] = useState({ status: 'offline', lastSeen: null });
  const [loading, setLoading] = useState(true);
  
  // Obtener el estado del keepalive actual desde Redux
  const keepaliveState = useSelector(state => state.keepalive);
  const event = useSelector((state) => state.event.event);
  const eventId = event?.id;
  const currentTeamId = keepaliveState.teamId;

  // Función para obtener el estado del equipo
  const fetchTeamStatus = useCallback(async () => {
    try {
      // Si es el equipo actual, usar el estado de Redux
      if (teamId?.toString() === currentTeamId?.toString() && keepaliveState.isActive) {
        setTeamStatus({
          status: keepaliveState.connectionStatus === 'connected' ? 'online' : 'offline',
          lastSeen: keepaliveState.lastHeartbeat,
          isCurrent: true
        });
      } else {
        // Para otros equipos o si no hay keepalive activo, consultar Firebase
        const status = await getTeamConnectionStatus(teamId, eventId);
        setTeamStatus({
          ...status,
          isCurrent: false
        });
      }
    } catch (error) {
      console.error('Error fetching team status:', error);
      setTeamStatus({ status: 'offline', lastSeen: null, isCurrent: false });
    } finally {
      setLoading(false);
    }
  }, [teamId, currentTeamId, eventId, keepaliveState.isActive, keepaliveState.connectionStatus, keepaliveState.lastHeartbeat]);

  // Efecto para cargar el estado inicial y configurar actualización periódica
  useEffect(() => {
    // if (!teamId) return;

    fetchTeamStatus();
    
    const interval = setInterval(fetchTeamStatus, refreshInterval);
    
    return () => clearInterval(interval);
  }, [teamId, fetchTeamStatus, refreshInterval]);

  const getStatusColor = () => {
    if (loading) return 'loading';
    return teamStatus.status === 'online' ? 'online' : 'offline';
  };

  const getStatusText = () => {
    if (loading) return 'Cargando...';
    
    if (teamStatus.isCurrent) {
      return teamStatus.status === 'online' ? 'Conectado (tú)' : 'Desconectado (tú)';
    }
    return teamStatus.status === 'online' ? 'Conectado' : 'Desconectado';
  };

  const formatLastSeen = () => {
    if (!teamStatus.lastSeen) return 'Nunca';
    
    const diff = Date.now() - teamStatus.lastSeen;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `Hace ${hours}h`;
    if (minutes > 0) return `Hace ${minutes}m`;
    return `Hace ${seconds}s`;
  };

  if (compact) {
    return (
      <div className={`team-connection-status compact ${getStatusColor()} ${className}`}>
        <div className="status-indicator" />
        <span className="team-id">Equipo {teamId}</span>
      </div>
    );
  }

  return (
    <div className={`team-connection-status ${getStatusColor()} ${className}`}>
      <div className="status-info">
        <div className="status-main">
          <div className="status-indicator" />
          <span className="status-text">{getStatusText()}</span>
        </div>
        
        {showLastSeen && teamStatus.lastSeen && (
          <div className="last-seen-info">
            <span className="last-seen-text">
              Última actividad: {formatLastSeen()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamConnectionStatus;
