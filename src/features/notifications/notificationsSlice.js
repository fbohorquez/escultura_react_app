import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import pushManager from '../../services/pushManager';
import {
  isNotificationSupported,
  getNotificationPermission,
  subscribeToNotifications,
  unsubscribeFromNotifications,
  checkActiveSubscription
} from '../../services/notificationService';

// Clave para localStorage
const STORAGE_KEY = 'notificationSettings';

/**
 * Serializar suscripción para Redux
 * Solo guardamos los datos serializables, no el objeto PushSubscription completo
 */
function serializeSubscription(subscription) {
  if (!subscription) return null;
  
  // Si ya es un objeto serializado, devolverlo tal como está
  if (typeof subscription.toJSON !== 'function') {
    return subscription;
  }
  
  // Convertir PushSubscription a objeto serializable
  return {
    endpoint: subscription.endpoint,
    expirationTime: subscription.expirationTime,
    keys: {
      p256dh: subscription.getKey ? subscription.getKey('p256dh') ? btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')))) : null : subscription.keys?.p256dh,
      auth: subscription.getKey ? subscription.getKey('auth') ? btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')))) : null : subscription.keys?.auth
    }
  };
}

// Estado inicial
const initialState = {
  // Soporte y permisos
  isSupported: isNotificationSupported(),
  permission: getNotificationPermission(),
  
  // Estado de suscripción
  isSubscribed: false,
  subscription: null,
  
  // Estado de carga y errores
  isLoading: false,
  error: null,
  
  // Estado de inicialización
  isInitialized: false,
  
  // Configuración de usuario
  settings: {
    enabled: true,
    chatNotifications: true,
    eventNotifications: true,
    sound: true
  }
};

// Thunks asíncronos

/**
 * Inicializar sistema de notificaciones
 */
export const initializeNotifications = createAsyncThunk(
  'notifications/initialize',
  async (_, { dispatch, getState }) => {
    const { session, event } = getState();
    
    // En este sistema, el "usuario" es selectedTeam.id o admin
    const { selectedTeam, isAdmin } = session || {};
    const currentUserId = isAdmin ? 'admin' : selectedTeam?.id;
    const currentEventId = event?.event?.id;
    
    // Cargar configuración desde localStorage
    const savedSettings = localStorage.getItem(STORAGE_KEY);
    let settings = initialState.settings;
    
    if (savedSettings) {
      try {
        settings = { ...settings, ...JSON.parse(savedSettings) };
      } catch (error) {
        console.warn('Error cargando configuración de notificaciones:', error);
      }
    }
    
    // Inicializar push manager
    const pushManagerReady = await pushManager.initialize();
    
    // Verificar estado de suscripción si hay usuario y evento
    let subscriptionStatus = false;
    if (currentUserId && currentEventId && pushManagerReady) {
      try {
        const status = await checkActiveSubscription(currentUserId, currentEventId);
        subscriptionStatus = status.isSubscribed;
      } catch (error) {
        console.warn('Error verificando suscripción inicial:', error);
      }
    }
    
    return {
      settings,
      isSubscribed: subscriptionStatus,
      permission: getNotificationPermission(),
      pushManagerReady
    };
  }
);

/**
 * Suscribir usuario a notificaciones
 */
export const subscribeUser = createAsyncThunk(
  'notifications/subscribe',
  async ({ userId, eventId }, { rejectWithValue }) => {
    try {
      const result = await subscribeToNotifications(userId, eventId);
      return {
        userId,
        eventId,
        subscription: serializeSubscription(result.subscription),
        permission: result.permission
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Desuscribir usuario de notificaciones
 */
export const unsubscribeUser = createAsyncThunk(
  'notifications/unsubscribe',
  async ({ userId, eventId }, { rejectWithValue }) => {
    try {
      await unsubscribeFromNotifications(userId, eventId);
      return { userId, eventId };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Verificar estado de suscripción
 */
export const checkSubscription = createAsyncThunk(
  'notifications/checkSubscription',
  async ({ userId, eventId }, { rejectWithValue }) => {
    try {
      const status = await checkActiveSubscription(userId, eventId);
      return status;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Slice
const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    // Setters síncronos
    setPermission: (state, action) => {
      state.permission = action.payload;
    },
    
    setSubscriptionStatus: (state, action) => {
      state.isSubscribed = action.payload;
    },
    
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    
    setError: (state, action) => {
      state.error = action.payload;
    },
    
    clearError: (state) => {
      state.error = null;
    },
    
    // Actualizar configuración
    updateSettings: (state, action) => {
      state.settings = { ...state.settings, ...action.payload };
      
      // Guardar en localStorage
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state.settings));
      } catch (error) {
        console.warn('Error guardando configuración:', error);
      }
    },
    
    // Reset del estado
    resetNotifications: (state) => {
      return {
        ...initialState,
        isSupported: state.isSupported,
        permission: getNotificationPermission()
      };
    }
  },
  
  extraReducers: (builder) => {
    // initializeNotifications
    builder
      .addCase(initializeNotifications.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(initializeNotifications.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isInitialized = true;
        state.settings = action.payload.settings;
        state.isSubscribed = action.payload.isSubscribed;
        state.permission = action.payload.permission;
      })
      .addCase(initializeNotifications.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message;
        state.isInitialized = true; // Continuar aunque falle
      });
    
    // subscribeUser
    builder
      .addCase(subscribeUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(subscribeUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSubscribed = true;
        state.subscription = action.payload.subscription;
        state.permission = action.payload.permission;
      })
      .addCase(subscribeUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.isSubscribed = false;
      });
    
    // unsubscribeUser
    builder
      .addCase(unsubscribeUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(unsubscribeUser.fulfilled, (state) => {
        state.isLoading = false;
        state.isSubscribed = false;
        state.subscription = null;
      })
      .addCase(unsubscribeUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
    
    // checkSubscription
    builder
      .addCase(checkSubscription.fulfilled, (state, action) => {
        state.isSubscribed = action.payload.isSubscribed;
        if (action.payload.localSubscription) {
          state.subscription = serializeSubscription(action.payload.localSubscription);
        }
      });
  }
});

// Exportar actions
export const {
  setPermission,
  setSubscriptionStatus,
  setLoading,
  setError,
  clearError,
  updateSettings,
  resetNotifications
} = notificationsSlice.actions;

// Selectores
export const selectNotificationSettings = (state) => state.notifications.settings;
export const selectIsNotificationsEnabled = (state) => 
  state.notifications.isSupported && 
  state.notifications.permission === 'granted' && 
  state.notifications.isSubscribed;

export const selectCanEnableNotifications = (state) => 
  state.notifications.isSupported && 
  state.notifications.permission !== 'denied';

// Exportar reducer
export default notificationsSlice.reducer;
