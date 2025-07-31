// src/hooks/useEventLoadBehavior.js
import { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  hasActiveEventSession, 
  handleExistingSession,
  getEventLoadBehavior,
  EVENT_LOAD_BEHAVIORS
} from '../services/eventLoadBehavior';

/**
 * Hook que maneja el comportamiento de carga del evento según la configuración
 */
export const useEventLoadBehavior = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const state = useSelector(state => state);
  const hasProcessed = useRef(false);
  
  useEffect(() => {
    // Solo ejecutar una vez al iniciar la aplicación y solo si estamos en la ruta raíz
    if (hasProcessed.current || location.pathname !== '/') {
      return;
    }
    
    const behavior = getEventLoadBehavior();
    
    // Si el comportamiento es KEEP_PAGE, no hacer nada (comportamiento actual)
    if (behavior === EVENT_LOAD_BEHAVIORS.KEEP_PAGE) {
      return;
    }
    
    // Verificar si hay una sesión activa
    if (hasActiveEventSession(state)) {
      console.log('🔄 Detected active event session, applying behavior:', behavior);
      hasProcessed.current = true;
      handleExistingSession(dispatch, state, navigate);
    }
  }, [dispatch, navigate, state, location.pathname]);
  
  return {
    behavior: getEventLoadBehavior(),
    hasActiveSession: hasActiveEventSession(state)
  };
};
