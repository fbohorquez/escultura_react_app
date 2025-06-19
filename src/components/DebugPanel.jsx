// src/components/DebugPanel.jsx
import React from 'react';
import { useSelector } from 'react-redux';
import { useDebugMode } from '../hooks/useDebugMode';

/**
 * Panel de control del modo debug con información útil para desarrollo
 */
const DebugPanel = () => {
  const { isDebugMode, toggleDebugMode } = useDebugMode();
  const selectedTeam = useSelector((state) => state.session.selectedTeam);
  const event = useSelector((state) => state.event.event);
  const teams = useSelector((state) => state.teams.items);

  if (!isDebugMode) {
    return null;
  }

  const selectedTeamData = teams.find(team => team.id === selectedTeam?.id) || selectedTeam;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '10px',
        left: '10px',
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        color: 'white',
        padding: '12px',
        borderRadius: '8px',
        fontSize: '11px',
        zIndex: 9998,
        maxWidth: '300px',
        fontFamily: 'monospace',
        border: '1px solid #ff4444'
      }}
    >
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '8px',
        borderBottom: '1px solid #333',
        paddingBottom: '8px'
      }}>
        <strong>🔧 DEBUG PANEL</strong>
        <button
          onClick={toggleDebugMode}
          style={{
            backgroundColor: '#ff4444',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '2px 6px',
            fontSize: '10px',
            cursor: 'pointer'
          }}
        >
          ✕
        </button>
      </div>
      
      <div style={{ marginBottom: '6px' }}>
        <strong>Posición Actual:</strong>
        {selectedTeamData?.lat && selectedTeamData?.lon ? (
          <div>
            Lat: {selectedTeamData.lat.toFixed(6)}<br/>
            Lng: {selectedTeamData.lon.toFixed(6)}
          </div>
        ) : (
          <div style={{ color: '#ffaa00' }}>Sin posición</div>
        )}
      </div>

      <div style={{ marginBottom: '6px' }}>
        <strong>Equipo:</strong>
        <div>{selectedTeam?.name || 'Sin equipo seleccionado'}</div>
      </div>

      <div style={{ marginBottom: '6px' }}>
        <strong>Evento:</strong>
        <div>{event?.name || 'Sin evento activo'}</div>
      </div>

      <div style={{ marginBottom: '6px' }}>
        <strong>GPS:</strong>
        <div style={{ color: '#00ff00' }}>DESACTIVADO (Modo Debug)</div>
      </div>

      <div style={{ 
        marginTop: '8px', 
        paddingTop: '8px', 
        borderTop: '1px solid #333',
        fontSize: '10px',
        color: '#aaa'
      }}>
        💡 Haz click en el mapa para mover el equipo
      </div>
    </div>
  );
};

export default DebugPanel;
