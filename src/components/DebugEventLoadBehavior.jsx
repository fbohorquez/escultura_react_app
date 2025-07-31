// src/components/DebugEventLoadBehavior.jsx
import React from 'react';
import { useSelector } from 'react-redux';
import { 
  getEventLoadBehavior, 
  hasActiveEventSession,
  getSavedSession 
} from '../services/eventLoadBehavior';

/**
 * Componente de debug que muestra información sobre el comportamiento de carga de eventos
 * Solo se muestra cuando VITE_DEBUG_MODE está activado
 */
const DebugEventLoadBehavior = () => {
  const isDebugMode = import.meta.env.VITE_DEBUG_MODE === 'true';
  const state = useSelector(state => state);
  
  if (!isDebugMode) return null;
  
  const behavior = getEventLoadBehavior();
  const hasActiveSession = hasActiveEventSession(state);
  const eventId = state.event.event?.id;
  const savedSession = eventId ? getSavedSession(eventId) : null;
  
  // Obtener todas las sesiones guardadas
  const allSavedSessions = JSON.parse(localStorage.getItem('savedEventSessions') || '{}');
  const savedSessionsCount = Object.keys(allSavedSessions).length;
  
  return (
    <div style={{
      position: 'fixed',
      bottom: '100px',
      left: '10px',
      background: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999,
      maxWidth: '300px',
      fontFamily: 'monospace'
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
        🔧 Event Load Behavior Debug
      </div>
      
      <div><strong>Behavior:</strong> {behavior}</div>
      <div><strong>Has Active Session:</strong> {hasActiveSession ? '✅' : '❌'}</div>
      <div><strong>Current Event ID:</strong> {eventId || 'none'}</div>
      <div><strong>Saved Sessions:</strong> {savedSessionsCount}</div>
      
      {savedSession && (
        <div style={{ marginTop: '5px', padding: '5px', background: 'rgba(255, 255, 255, 0.1)' }}>
          <div style={{ fontWeight: 'bold' }}>Saved Session for Current Event:</div>
          <div>Team: {savedSession.selectedTeam?.name}</div>
          <div>Token: {savedSession.token?.slice(0, 8)}...</div>
          <div>Age: {Math.floor((Date.now() - savedSession.timestamp) / 1000 / 60)}min</div>
        </div>
      )}
      
      {savedSessionsCount > 0 && (
        <div style={{ marginTop: '5px' }}>
          <strong>All Saved Events:</strong>
          {Object.keys(allSavedSessions).map(id => (
            <div key={id} style={{ fontSize: '10px' }}>
              • Event {id}: {allSavedSessions[id].selectedTeam?.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DebugEventLoadBehavior;
