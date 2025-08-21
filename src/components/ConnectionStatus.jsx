import React from 'react';
import { useKeepalive } from '../hooks/useKeepalive';
import './ConnectionStatus.css';

const ConnectionStatus = ({ 
  eventId, 
  teamId,
  showTeamCount = true, 
  showLastHeartbeat = false,
  compact = false,
  className = ''
}) => {
  const {
    isConnected,
    isConnecting,
    hasError,
    connectedTeamsCount,
    totalTeamsCount,
    lastHeartbeat,
    error,
    isOnline
  } = useKeepalive(eventId, teamId);

  const getStatusColor = () => {
    if (hasError) return 'error';
    if (isConnected) return 'connected';
    if (isConnecting) return 'connecting';
    return 'disconnected';
  };

  const getStatusText = () => {
    if (!isOnline) return 'Sin conexión a internet';
    if (hasError) return `Error: ${error}`;
    if (isConnected) return 'Conectado';
    if (isConnecting) return 'Conectando...';
    return 'Desconectado';
  };

  const formatLastHeartbeat = () => {
    if (!lastHeartbeat) return 'Nunca';
    const diff = Date.now() - lastHeartbeat;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (minutes > 0) return `Hace ${minutes}m`;
    return `Hace ${seconds}s`;
  };

  if (compact) {
    return (
      <div className={`connection-status compact ${getStatusColor()} ${className}`}>
        <div className="status-indicator" />
        {showTeamCount && (
          <span className="device-count">{totalTeamsCount}</span>
        )}
      </div>
    );
  }
  return null;

  // return (
  //   <div className={`connection-status ${getStatusColor()} ${className}`}>
  //     <div className="status-info">
  //       <div className="status-main">
  //         <div className="status-indicator" />
  //       </div>
        
  //       {showTeamCount && isConnected && (
  //         <div className="device-info">
  //           <span className="device-count">
  //             {totalTeamsCount} equipo{totalTeamsCount !== 1 ? 's' : ''} conectado{totalTeamsCount !== 1 ? 's' : ''}
  //           </span>
  //           {connectedTeamsCount > 0 && (
  //             <span className="other-devices">
  //               ({connectedTeamsCount} otro{connectedTeamsCount !== 1 ? 's' : ''})
  //             </span>
  //           )}
  //         </div>
  //       )}
        
  //       {showLastHeartbeat && lastHeartbeat && (
  //         <div className="heartbeat-info">
  //           <span className="heartbeat-text">
  //             Último heartbeat: {formatLastHeartbeat()}
  //           </span>
  //         </div>
  //       )}
  //     </div>
  //   </div>
  // );
};

export default ConnectionStatus;
