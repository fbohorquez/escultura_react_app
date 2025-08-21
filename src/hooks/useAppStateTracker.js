import { useDispatch, useSelector } from 'react-redux';
import { useCallback } from 'react';
import { setAppState, clearCurrentActivity } from '../features/keepalive/keepaliveSlice';
import { APP_STATES } from '../constants/appStates';

/**
 * Hook para gestionar el estado/ubicación actual del equipo en la aplicación
 */
export const useAppStateTracker = () => {
  const dispatch = useDispatch();
  const { appState, currentActivity, appStateTimestamp } = useSelector(state => state.keepalive);

  /**
   * Actualiza el estado de la aplicación a "En mapa"
   */
  const setMapState = useCallback(() => {
    console.log('🗺️ Setting map state');
    console.log('🗺️ About to dispatch setAppState with EN_MAPA');
    dispatch(setAppState({
      appState: APP_STATES.EN_MAPA,
      currentActivity: null
    }));
    console.log('🗺️ setAppState dispatched');
  }, [dispatch]);

  /**
   * Actualiza el estado de la aplicación a "Realizando prueba"
   * @param {Object} activity - Información de la actividad { id, name }
   */
  const setActivityStartState = useCallback((activity) => {
    console.log('🎯 Setting activity start state:', activity);
    console.log('🎯 About to dispatch setAppState with:', {
      appState: APP_STATES.REALIZANDO_PRUEBA,
      currentActivity: activity
    });
    const action = setAppState({
      appState: APP_STATES.REALIZANDO_PRUEBA,
      currentActivity: activity
    });
    console.log('🎯 Action object:', action);
    dispatch(action);
    console.log('🎯 setAppState dispatched');
  }, [dispatch]);

  /**
   * Actualiza el estado de la aplicación a "Finalizando prueba"
   * @param {Object} activity - Información de la actividad { id, name }
   */
  const setActivityFinishingState = useCallback((activity) => {
    dispatch(setAppState({
      appState: APP_STATES.FINALIZANDO_PRUEBA,
      currentActivity: activity
    }));
  }, [dispatch]);

  /**
   * Limpia la actividad actual y vuelve al estado de mapa
   */
  const clearActivity = useCallback(() => {
    console.log('🧹 Clearing activity');
    console.log('🧹 About to dispatch clearCurrentActivity');
    dispatch(clearCurrentActivity());
    console.log('🧹 clearCurrentActivity dispatched');
  }, [dispatch]);

  /**
   * Obtiene la información del estado actual
   */
  const getCurrentState = useCallback(() => {
    return {
      appState,
      currentActivity,
      appStateTimestamp
    };
  }, [appState, currentActivity, appStateTimestamp]);

  return {
    appState,
    currentActivity,
    appStateTimestamp,
    setMapState,
    setActivityStartState,
    setActivityFinishingState,
    clearActivity,
    getCurrentState
  };
};
