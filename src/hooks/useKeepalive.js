import { useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { initializeKeepalive, initializeKeepaliveReadOnly, cleanupKeepalive, getKeepaliveService } from '../services/firebase';

/**
 * Hook personalizado para gestionar el sistema de keepalive
 * @param {string|number} eventId - ID del evento
 * @param {string|number} teamId - ID del equipo
 * @param {Object} options - Opciones de configuración
 * @returns {Object} Estado y funciones del keepalive
 */
export const useKeepalive = (eventId, teamId, options = {}) => {
  const dispatch = useDispatch();
  const storeRef = useRef();
  
  // Mantener useSelector para el return del hook
  const keepaliveState = useSelector(state => state.keepalive);
  
  // Crear una función que obtiene siempre el estado actual directamente
  const getCurrentState = useCallback(() => {
    // Intentar obtener el estado del store global si está disponible
    if (typeof window !== 'undefined' && window.__store) {
      return window.__store.getState();
    }
    // Fallback: usar el estado del selector (puede estar desactualizado)
    return { keepalive: keepaliveState };
  }, [keepaliveState]);
  
  // Usar useRef para mantener una referencia estable al store
  if (!storeRef.current) {
    storeRef.current = { dispatch, getState: getCurrentState };
  } else {
    // Actualizar la función getState para que siempre devuelva el estado actual
    storeRef.current.getState = getCurrentState;
  }

  const {
    autoStart = true,
    heartbeatInterval = 30000,
    maxReconnectAttempts = 5
  } = options;

  useEffect(() => {
    let mounted = true;

    const initializeService = async () => {
      if (!eventId || !autoStart) return;

      try {
        // Configurar intervalos personalizados si se proporcionan
        if (heartbeatInterval !== 30000) {
          dispatch({ 
            type: 'keepalive/setHeartbeatInterval', 
            payload: heartbeatInterval 
          });
        }

        if (maxReconnectAttempts !== 5) {
          dispatch({ 
            type: 'keepalive/setMaxReconnectAttempts', 
            payload: maxReconnectAttempts 
          });
        }

        // Decidir qué tipo de inicialización usar
        if (teamId) {
          // Inicialización completa (con envío de keepalive)
          await initializeKeepalive(eventId, teamId, storeRef.current);
        } else {
          // Inicialización solo lectura (para administradores)
          await initializeKeepaliveReadOnly(eventId, storeRef.current);
        }
        
        if (!mounted) {
          await cleanupKeepalive();
        }
      } catch (error) {
        console.error('Error initializing keepalive in hook:', error);
        if (mounted) {
          dispatch({ 
            type: 'keepalive/setError', 
            payload: error.message 
          });
        }
      }
    };

    initializeService();

    return () => {
      mounted = false;
      cleanupKeepalive();
    };
  }, [eventId, teamId, autoStart, heartbeatInterval, maxReconnectAttempts, dispatch]);

  // Funciones de control
  const startKeepalive = async () => {
    if (!eventId) return;
    try {
      if (teamId) {
        await initializeKeepalive(eventId, teamId, storeRef.current);
      } else {
        await initializeKeepaliveReadOnly(eventId, storeRef.current);
      }
    } catch (error) {
      console.error('Error starting keepalive:', error);
      dispatch({ 
        type: 'keepalive/setError', 
        payload: error.message 
      });
    }
  };

  const stopKeepalive = async () => {
    try {
      await cleanupKeepalive();
    } catch (error) {
      console.error('Error stopping keepalive:', error);
    }
  };

  const getService = () => {
    return getKeepaliveService();
  };

  const forceHeartbeat = async () => {
    const service = getKeepaliveService();
    if (service) {
      try {
        await service.sendHeartbeat();
      } catch (error) {
        console.error('Error sending heartbeat:', error);
        dispatch({ 
          type: 'keepalive/setError', 
          payload: error.message 
        });
      }
    }
  };

  return {
    // Estado
    ...keepaliveState,
    
    // Funciones de control
    startKeepalive,
    stopKeepalive,
    forceHeartbeat,
    getService,
    
    // Estado derivado
    isConnected: keepaliveState.connectionStatus === 'connected',
    isConnecting: keepaliveState.connectionStatus === 'connecting',
    isDisconnected: keepaliveState.connectionStatus === 'disconnected',
    hasError: keepaliveState.connectionStatus === 'error',
    
    // Estadísticas
    connectedTeamsCount: Object.values(keepaliveState.teams).filter(t => t.status === 'online').length,
    totalTeamsCount: Object.keys(keepaliveState.teams).length + 1, // +1 para este equipo
  };
};
