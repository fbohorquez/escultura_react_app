// src/components/DebugModeIndicator.jsx
import React from 'react';
import { useDebugMode } from '../hooks/useDebugMode';

/**
 * Componente que muestra un indicador visual del modo debug
 */
const DebugModeIndicator = () => {
  const { isDebugMode, toggleDebugMode } = useDebugMode();

  if (!isDebugMode) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        backgroundColor: '#ff4444',
        color: 'white',
        padding: '8px 12px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: 'bold',
        zIndex: 9999,
        cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        userSelect: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}
      onClick={toggleDebugMode}
      title="Click para desactivar el modo debug"
    >
      <span>DEBUG MODE</span>
    </div>
  );
};

export default DebugModeIndicator;
