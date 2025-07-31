// src/components/EventLoadBehaviorManager.jsx
import { useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  hasActiveEventSession, 
  handleExistingSession,
  getEventLoadBehavior,
  EVENT_LOAD_BEHAVIORS
} from '../services/eventLoadBehavior';

/**
 * Componente que maneja el comportamiento de carga del evento según la configuración
 * Se ejecuta después de que Redux se hidrate completamente
 */
const EventLoadBehaviorManager = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const state = useSelector(state => state);
  const hasProcessed = useRef(false);
  const [isRehydrated, setIsRehydrated] = useState(false);
  
  // Escuchar el evento de hidratación
  useEffect(() => {
    // Si ya está hidratado (la persistencia está activa), marcar como tal
    if (state._persist?.rehydrated) {
      setIsRehydrated(true);
    }
  }, [state._persist]);
  
  useEffect(() => {
    // Solo ejecutar una vez después de la hidratación
    if (hasProcessed.current || !isRehydrated) {
      return;
    }
    
    const behavior = getEventLoadBehavior();
    
    console.log('🔄 EventLoadBehaviorManager - Checking behavior:', behavior, 'Location:', location.pathname);
    
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
  }, [dispatch, navigate, state, location.pathname, isRehydrated]);
  
  return null; // Este componente no renderiza nada
};

export default EventLoadBehaviorManager;
