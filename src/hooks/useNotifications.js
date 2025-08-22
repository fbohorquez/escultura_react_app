import { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  isNotificationSupported,
  getNotificationPermission,
  subscribeToNotifications,
  unsubscribeFromNotifications,
  checkActiveSubscription
} from '../services/notificationService';
import {
  setPermission,
  setSubscriptionStatus,
  setLoading,
  setError,
  initializeNotifications,
  subscribeUser,
  unsubscribeUser
} from '../features/notifications/notificationsSlice';
import pushManager from '../services/pushManager';

/**
 * Serializar PushSubscription para guardar en Redux
 */
/**
 * Hook personalizado para gestión de notificaciones
 * Encapsula toda la lógica de notificaciones push
 */
export function useNotifications() {
  const dispatch = useDispatch();
  const notificationState = useSelector(state => state.notifications);
  const {
    permission = 'default',
    isSubscribed = false,
    isLoading = false,
    error = null,
    isInitialized = false
  } = notificationState || {};

  const session = useSelector(state => state.session);
  const event = useSelector((state) => state.event.event);
  
  // En este sistema, el "usuario" es el selectedTeam.id o admin
  const { selectedTeam, isAdmin } = session || {};
  const currentUserId = isAdmin ? 'admin' : selectedTeam?.id;
  const currentEventId = event?.id;

  // Estado local para tracking
  const [isSupported] = useState(isNotificationSupported());

  /**
   * Inicializar notificaciones al montar el hook
   */
  useEffect(() => {
    if (isSupported && !isInitialized) {
      dispatch(initializeNotifications());
    }
  }, [isSupported, isInitialized, dispatch]);

  /**
   * Verificar estado cuando cambia el usuario o evento
   */
  useEffect(() => {
    if (currentUserId && currentEventId && isInitialized) {
      checkSubscriptionStatus();
    }
  }, [currentUserId, currentEventId, isInitialized]);

  /**
   * Verificar estado actual de suscripción
   */
  const checkSubscriptionStatus = useCallback(async () => {
    if (!currentUserId || !currentEventId) {
      return;
    }

    try {
      dispatch(setLoading(true));
      
      const status = await checkActiveSubscription(currentUserId, currentEventId);
      dispatch(setSubscriptionStatus(status.isSubscribed));
      
      // Actualizar permiso actual
      const currentPermission = getNotificationPermission();
      dispatch(setPermission(currentPermission));
      
    } catch (error) {
      console.warn('Error verificando estado de suscripción:', error);
      dispatch(setError(error.message));
    } finally {
      dispatch(setLoading(false));
    }
  }, [currentUserId, currentEventId, dispatch]);

  /**
   * Solicitar permisos y suscribirse a notificaciones
   */
  const requestPermissionAndSubscribe = useCallback(async () => {
    if (!currentUserId || !currentEventId) {
      throw new Error('Usuario o evento no disponible');
    }

    try {
      dispatch(setLoading(true));
      dispatch(setError(null));

      const result = await dispatch(subscribeUser({
        userId: currentUserId,
        eventId: currentEventId
      })).unwrap();

      return result;
    } catch (error) {
      dispatch(setError(error.message));
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  }, [currentUserId, currentEventId, dispatch]);

  /**
   * Desuscribirse de notificaciones
   */
  const unsubscribe = useCallback(async () => {
    if (!currentUserId || !currentEventId) {
      throw new Error('Usuario o evento no disponible');
    }

    try {
      dispatch(setLoading(true));
      dispatch(setError(null));

      await unsubscribeFromNotifications(currentUserId, currentEventId);
      
      dispatch(unsubscribeUser({
        userId: currentUserId,
        eventId: currentEventId
      }));

    } catch (error) {
      dispatch(setError(error.message));
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  }, [currentUserId, currentEventId, dispatch]);

  /**
   * Alternar estado de suscripción
   */
  const toggleSubscription = useCallback(async () => {
    if (isSubscribed) {
      await unsubscribe();
    } else {
      await requestPermissionAndSubscribe();
    }
  }, [isSubscribed, unsubscribe, requestPermissionAndSubscribe]);

  /**
   * Verificar si las notificaciones pueden ser habilitadas
   */
  const canEnableNotifications = useCallback(() => {
    return isSupported && permission !== 'denied' && currentUserId && currentEventId;
  }, [isSupported, permission, currentUserId, currentEventId]);

  /**
   * Obtener mensaje de estado para mostrar al usuario
   */
  const getStatusMessage = useCallback(() => {
    if (!isSupported) {
      return 'Las notificaciones no están soportadas en este navegador';
    }
    
    if (permission === 'denied') {
      return 'Los permisos de notificación han sido denegados. Habilitálas en la configuración del navegador.';
    }
    
    if (!currentUserId) {
      return 'Selecciona un equipo o inicia sesión como admin para recibir notificaciones';
    }
    
    if (!currentEventId) {
      return 'Selecciona un evento para recibir notificaciones';
    }
    
    if (isSubscribed) {
      return 'Recibirás notificaciones de nuevos mensajes';
    }
    
    return 'Habilita las notificaciones para recibir alertas de nuevos mensajes';
  }, [isSupported, permission, currentUserId, currentEventId, isSubscribed]);

  /**
   * Renovar suscripción si está próxima a expirar
   */
  const renewSubscriptionIfNeeded = useCallback(async () => {
    if (!isSubscribed || !currentUserId || !currentEventId) {
      return false;
    }

    try {
      const newSubscription = await pushManager.renewSubscriptionIfNeeded();
      
      if (newSubscription) {
        // Actualizar suscripción en el servidor
        await subscribeToNotifications(currentUserId, currentEventId);
        console.log('Suscripción renovada exitosamente');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error renovando suscripción:', error);
      return false;
    }
  }, [isSubscribed, currentUserId, currentEventId]);

  /**
   * Limpiar errores
   */
  const clearError = useCallback(() => {
    dispatch(setError(null));
  }, [dispatch]);

  return {
    // Estado
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    error,
    isInitialized,
    
    // Información contextual
    canEnableNotifications: canEnableNotifications(),
    statusMessage: getStatusMessage(),
    
    // Acciones
    requestPermissionAndSubscribe,
    unsubscribe,
    toggleSubscription,
    checkSubscriptionStatus,
    renewSubscriptionIfNeeded,
    clearError
  };
}

