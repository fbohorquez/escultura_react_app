// src/components/DebugWelcome.jsx
import React, { useState, useEffect } from 'react';
import { useDebugMode } from '../hooks/useDebugMode';

/**
 * Componente que muestra información de bienvenida al activar el modo debug por primera vez
 */
const DebugWelcome = () => {
  const { isDebugMode } = useDebugMode();
  const [showWelcome, setShowWelcome] = useState(false);
  const [hasShownWelcome, setHasShownWelcome] = useState(() => {
    return localStorage.getItem('debug-welcome-shown') === 'true';
  });

  useEffect(() => {
    if (isDebugMode && !hasShownWelcome) {
      setShowWelcome(true);
    } else {
      setShowWelcome(false);
    }
  }, [isDebugMode, hasShownWelcome]);

  const handleClose = () => {
    setShowWelcome(false);
    setHasShownWelcome(true);
    localStorage.setItem('debug-welcome-shown', 'true');
  };

  if (!showWelcome) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        color: 'white',
        padding: '20px',
        borderRadius: '12px',
        fontSize: '14px',
        zIndex: 10000,
        maxWidth: '400px',
        width: '90%',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        border: '2px solid #ff4444',
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
      }}
    >
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '16px',
        borderBottom: '1px solid #333',
        paddingBottom: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '20px' }}>🔧</span>
          <strong style={{ fontSize: '16px' }}>Modo Debug Activado</strong>
        </div>
        <button
          onClick={handleClose}
          style={{
            backgroundColor: 'transparent',
            color: '#aaa',
            border: 'none',
            borderRadius: '4px',
            padding: '4px 8px',
            fontSize: '16px',
            cursor: 'pointer',
            lineHeight: '1'
          }}
        >
          ✕
        </button>
      </div>
      
      <div style={{ lineHeight: '1.5', marginBottom: '16px' }}>
        <p style={{ margin: '0 0 12px 0' }}>
          <strong>🎯 Navegación libre habilitada:</strong>
        </p>
        <ul style={{ margin: '0', paddingLeft: '20px' }}>
          <li>El GPS está desactivado</li>
          <li>Haz click en cualquier punto del mapa para mover tu equipo</li>
          <li>Las notificaciones de proximidad siguen funcionando</li>
        </ul>
      </div>

      <div style={{ lineHeight: '1.5', marginBottom: '16px' }}>
        <p style={{ margin: '0 0 8px 0' }}>
          <strong>⌨️ Controles:</strong>
        </p>
        <p style={{ margin: '0', color: '#ccc', fontSize: '13px' }}>
          • <code style={{ backgroundColor: '#333', padding: '2px 4px', borderRadius: '3px' }}>Ctrl + Shift + D</code> para activar/desactivar
        </p>
      </div>

      <button
        onClick={handleClose}
        style={{
          backgroundColor: '#ff4444',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          padding: '8px 16px',
          fontSize: '14px',
          cursor: 'pointer',
          width: '100%',
          fontWeight: 'bold'
        }}
      >
        Entendido
      </button>
    </div>
  );
};

export default DebugWelcome;
