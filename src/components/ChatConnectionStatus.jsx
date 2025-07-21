// src/components/ChatConnectionStatus.jsx
import React from "react";
import { useSelector } from "react-redux";
import { useChatConnections } from "../hooks/useChatConnections";

/**
 * Componente de debugging que muestra el estado de las conexiones de chat.
 * Solo se debe mostrar en modo desarrollo.
 */
export const ChatConnectionStatus = ({ show = false }) => {
  const { rooms, connections } = useSelector((state) => state.chats);
  const { getConnectionStatus } = useChatConnections();
  
  if (!show) return null;

  const status = getConnectionStatus();

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      left: '10px',
      background: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '8px',
      fontSize: '12px',
      zIndex: 9999,
      maxWidth: '300px'
    }}>
      <h4 style={{ margin: '0 0 8px 0' }}>🔗 Estado Conexiones Chat</h4>
      
      <div style={{ marginBottom: '8px' }}>
        <strong>Estado:</strong> {connections.status}
      </div>
      
      <div style={{ marginBottom: '8px' }}>
        <strong>Salas:</strong> {status.connectedRooms.length}/{rooms.length}
        {status.isFullyConnected && <span style={{ color: '#4CAF50' }}> ✓</span>}
      </div>
      
      {rooms.length > 0 && (
        <div>
          <strong>Salas disponibles:</strong>
          <ul style={{ margin: '4px 0', paddingLeft: '16px' }}>
            {rooms.map(room => (
              <li key={room.id} style={{ fontSize: '11px' }}>
                {room.id} ({room.name})
                {status.connectedRooms.includes(room.id) && 
                  <span style={{ color: '#4CAF50' }}> ✓</span>
                }
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {connections.lastConnectedAt && (
        <div style={{ fontSize: '10px', opacity: 0.7, marginTop: '8px' }}>
          Última conexión: {new Date(connections.lastConnectedAt).toLocaleTimeString()}
        </div>
      )}
    </div>
  );
};

export default ChatConnectionStatus;
