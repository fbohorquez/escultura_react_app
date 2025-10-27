// src/features/systemStatus/systemStatusSlice.js

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { runFullDiagnostic, requestGeolocationAccess, requestNotificationAccess, requestCameraAccess, requestMicrophoneAccess, requestMotionAccess, getPermissionsSnapshot } from '../../services/systemDiagnostics';

// === ASYNC THUNKS ===

/**
 * Ejecuta un diagnóstico completo del sistema
 */
export const runSystemDiagnostic = createAsyncThunk(
  'systemStatus/runDiagnostic',
  async (_, { rejectWithValue }) => {
    try {
      const result = await runFullDiagnostic();
      return result;
    } catch (error) {
      return rejectWithValue({
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
);

// Thunks de solicitud de permisos
export const requestPermissionGeolocation = createAsyncThunk('systemStatus/permission/geolocation', async () => {
  const res = await requestGeolocationAccess();
  const snap = await getPermissionsSnapshot();
  return { type: 'geolocation', result: res, snapshot: snap.geolocation };
});
export const requestPermissionNotifications = createAsyncThunk('systemStatus/permission/notifications', async () => {
  const res = await requestNotificationAccess();
  const snap = await getPermissionsSnapshot();
  return { type: 'notifications', result: res, snapshot: snap.notifications };
});
export const requestPermissionCamera = createAsyncThunk('systemStatus/permission/camera', async () => {
  const res = await requestCameraAccess();
  const snap = await getPermissionsSnapshot();
  return { type: 'camera', result: res, snapshot: snap.camera };
});
export const requestPermissionMicrophone = createAsyncThunk('systemStatus/permission/microphone', async () => {
  const res = await requestMicrophoneAccess();
  const snap = await getPermissionsSnapshot();
  return { type: 'microphone', result: res, snapshot: snap.microphone };
});
export const requestPermissionMotion = createAsyncThunk('systemStatus/permission/motion', async () => {
  const res = await requestMotionAccess();
  const snap = await getPermissionsSnapshot();
  return { type: 'motion', result: res, snapshot: snap.motion };
});

// === ESTADO INICIAL ===

const initialState = {
  // Estado de carga
  loading: false,
  error: null,
  lastUpdate: null,
  
  // Información del sistema
  versions: {
    app: null,
    browser: null,
    os: null,
    device: null
  },
  
  // Información de sesión
  session: {
    eventId: null,
    teamId: null,
    userType: null,
    activeTime: 0,
    userAgent: null,
    language: null,
    online: null
  },
  
  // Estados de conexión
  connections: {
    internet: {
      status: 'unknown',
      latency: null,
      lastTest: null,
      error: null
    },
    keepalive: {
      status: 'unknown',
      lastHeartbeat: null,
      heartbeatCount: 0,
      age: null,
      lastTest: null,
      error: null
    },
    firebase: {
      status: 'unknown',
      listeners: 0,
      lastActivity: null,
      error: null
    },
    backend: {
      status: 'unknown',
      responseTime: null,
      statusCode: null,
      url: null,
      lastTest: null,
      error: null
    },
    backendUpload: {
      status: 'unknown',
      responseTime: null,
      statusCode: null,
      url: null,
      path: null,
  publicUrl: null,
  verified: null,
  availabilityTime: null,
      sizeBytes: null,
      lastTest: null,
      error: null
    },
    pushServer: {
      status: 'unknown',
      responseTime: null,
      statusCode: null,
      url: null,
      subscription: false,
      lastTest: null,
      error: null
    }
  },
  
  // Información de red
  networkStatus: {
    online: null,
    type: 'unknown',
    downlink: null,
    rtt: null
  },
  
  // Operaciones y métricas
  operations: {
    firebase: {
      reads: 0,
      writes: 0,
      errors: 0,
      avgResponseTime: null
    },
    localStorage: {
      available: null,
      working: null,
      usedSpace: null,
      estimatedLimit: null,
      keyCount: null,
      error: null
    },
    pushServer: {
      sent: 0,
      received: 0,
      errors: 0,
      lastNotification: null
    },
    backend: {
      requests: 0,
      uploads: 0,
      errors: 0,
      avgResponseTime: null
    }
  },
  
  // Pruebas de recepción
  receptionTests: {
    activity: {
      status: 'not_tested',
      lastTest: null,
      success: false,
      error: null
    },
    gadget: {
      status: 'not_tested',
      lastTest: null,
      success: false,
      error: null
    },
    chat: {
      status: 'not_tested',
      lastTest: null,
      success: false,
      error: null
    },
    push: {
      status: 'not_tested',
      lastTest: null,
      success: false,
      error: null
    }
  },
  
  // Pruebas con bloqueo de pantalla
  screenLockTests: {
    keepalive: {
      status: 'not_tested',
      lastHeartbeat: null,
      frequency: null,
      errors: 0
    },
    geolocation: {
      status: 'not_tested',
      lastPosition: null,
      accuracy: null,
      frequency: null
    },
    reception: {
      status: 'not_tested',
      lastTest: null,
      success: false
    }
  },
  
  // Pruebas sin conexión
  offlineTests: {
    cache: {
      status: 'not_tested',
      resourcesCached: 0,
      cacheSize: null,
      lastUpdate: null
    },
    uploadQueue: {
      status: 'not_tested',
      pendingUploads: 0,
      queueSize: null,
      lastProcessed: null
    }
  },
  
  // Permisos y disponibilidad
  permissions: {
    camera: {
      status: 'unknown',
      available: null,
      devices: []
    },
    sensors: {
      orientation: 'unknown',
      accelerometer: 'unknown',
      compass: 'unknown'
    },
    notifications: {
      status: 'unknown',
      permission: null,
      serviceWorkerSupported: null,
      pushSupported: null
    },
    geolocation: {
      status: 'unknown',
      permission: null,
      highAccuracySupported: null
    }
  },
  
  // Pruebas de coherencia
  coherenceTests: {
    geolocation: {
      status: 'not_tested',
      consistent: null,
      lastCheck: null,
      issues: []
    },
    internalState: {
      status: 'not_tested',
      consistent: null,
      lastCheck: null,
      issues: []
    }
  },
  
  // Información del dispositivo y red
  device: {
    os: null,
    platform: null,
    isMobile: null,
    isTablet: null,
    screenWidth: null,
    screenHeight: null,
    viewportWidth: null,
    viewportHeight: null,
    pixelRatio: null,
    orientation: null
  },
  
  network: {
    online: null,
    effectiveType: null,
    downlink: null,
    rtt: null,
    saveData: null,
    type: null
  },
  
  // Capacidades del navegador
  capabilities: {
    localStorage: null,
    serviceWorker: null,
    geolocation: null,
    notifications: null
  }
};

// === SLICE ===

const systemStatusSlice = createSlice({
  name: 'systemStatus',
  initialState,
  reducers: {
    // Actualizar información de sesión
    updateSessionInfo: (state, action) => {
      state.session = { ...state.session, ...action.payload };
    },
    
    // Actualizar estado de conexión específica
    updateConnectionStatus: (state, action) => {
      const { type, data } = action.payload;
      if (state.connections[type]) {
        state.connections[type] = { ...state.connections[type], ...data };
      }
    },
    startKeepaliveScreenLockTest: (state) => {
      state.screenLockTests.keepalive.status = 'running';
      state.screenLockTests.keepalive.startTime = Date.now();
      state.screenLockTests.keepalive.initialHeartbeatCount = (state.connections.keepalive.heartbeatCount)||0;
    },
    finishKeepaliveScreenLockTest: (state) => {
      const test = state.screenLockTests.keepalive;
      test.status = 'completed';
      test.endTime = Date.now();
      const total = (state.connections.keepalive.heartbeatCount||0) - (test.initialHeartbeatCount||0);
      const durationMin = (test.endTime - test.startTime)/60000;
      test.frequency = durationMin>0 ? (total/durationMin).toFixed(2) : null;
      test.lastHeartbeat = state.connections.keepalive.lastHeartbeat;
    },
    
    // Actualizar métricas de operaciones
    updateOperationMetrics: (state, action) => {
      const { type, metrics } = action.payload;
      if (state.operations[type]) {
        state.operations[type] = { ...state.operations[type], ...metrics };
      }
    },
    
    // Registrar resultado de test de recepción
    recordReceptionTest: (state, action) => {
      const { type, result } = action.payload;
      if (state.receptionTests[type]) {
        state.receptionTests[type] = {
          ...state.receptionTests[type],
          ...result,
          lastTest: new Date().toISOString()
        };
      }
    },
    
    // Actualizar estado de permisos
    updatePermissionStatus: (state, action) => {
      const { type, data } = action.payload;
      if (state.permissions[type]) {
        state.permissions[type] = { ...state.permissions[type], ...data };
      }
    },
    
    // Incrementar contador de operación
    incrementOperationCounter: (state, action) => {
      const { type, operation } = action.payload;
      if (state.operations[type] && typeof state.operations[type][operation] === 'number') {
        state.operations[type][operation]++;
      }
    },
    
    // Actualizar tiempo de respuesta promedio
    updateResponseTime: (state, action) => {
      const { type, responseTime } = action.payload;
      if (state.operations[type]) {
        const current = state.operations[type].avgResponseTime || 0;
        const requests = state.operations[type].requests || 1;
        state.operations[type].avgResponseTime = Math.round(
          (current * (requests - 1) + responseTime) / requests
        );
      }
    },
    
    // Limpiar error
    clearError: (state) => {
      state.error = null;
    },
    
    // Reset completo del estado
    resetSystemStatus: () => {
      return { ...initialState };
    }
  },
  
  extraReducers: (builder) => {
    builder
      // Diagnóstico completo - pending
      .addCase(runSystemDiagnostic.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      
      // Diagnóstico completo - fulfilled
      .addCase(runSystemDiagnostic.fulfilled, (state, action) => {
        state.loading = false;
        state.lastUpdate = action.payload.timestamp;
        
        // Actualizar todas las secciones con los datos del diagnóstico
        if (action.payload.versions) {
          state.versions = { ...state.versions, ...action.payload.versions };
        }
        
        if (action.payload.session) {
          state.session = { ...state.session, ...action.payload.session };
        }
        
        if (action.payload.connections) {
          // Mapear resultados de conexión al formato del estado
          if (action.payload.connections.internet) {
            const internetStatus = action.payload.connections.internet;
            state.connections.internet = {
              ...state.connections.internet,
              status: internetStatus.status === 'connected' ? 'ok' : 'error',
              latency: internetStatus.latency,
              error: internetStatus.error,
              lastTest: action.payload.timestamp
            };
          }
          
          if (action.payload.connections.backend) {
            const backendStatus = action.payload.connections.backend;
            let status = 'error';
            if (backendStatus.status === 'connected') status = 'ok';
            else if (backendStatus.status === 'not_configured') status = 'error';
            else if (backendStatus.status === 'timeout') status = 'error';
            
            state.connections.backend = {
              ...state.connections.backend,
              status: status,
              responseTime: backendStatus.responseTime,
              statusCode: backendStatus.statusCode,
              url: backendStatus.url,
              error: backendStatus.error,
              lastTest: action.payload.timestamp
            };
          }

          if (action.payload.connections.backendUpload) {
            const up = action.payload.connections.backendUpload;
            let status = 'error';
            if (up.status === 'connected') status = 'ok';
            else if (up.status === 'not_configured') status = 'error';
            else if (up.status === 'timeout') status = 'error';
            state.connections.backendUpload = {
              ...state.connections.backendUpload,
              status,
              responseTime: up.responseTime,
              statusCode: up.statusCode,
              url: up.url,
              path: up.path,
              publicUrl: up.publicUrl,
              verified: up.verified,
              availabilityTime: up.availabilityTime,
              sizeBytes: up.sizeBytes,
              error: up.error,
              lastTest: action.payload.timestamp
            };
          }
          
          if (action.payload.connections.pushServer) {
            const pushStatus = action.payload.connections.pushServer;
            let status = 'error';
            if (pushStatus.status === 'connected' || pushStatus.status === 'reachable') status = 'ok';
            else if (pushStatus.status === 'not_configured') status = 'error';
            else if (pushStatus.status === 'timeout') status = 'error';
            
            state.connections.pushServer = {
              ...state.connections.pushServer,
              status: status,
              responseTime: pushStatus.responseTime,
              statusCode: pushStatus.statusCode,
              url: pushStatus.url,
              endpoint: pushStatus.endpointTried || state.connections.pushServer.endpoint,
              error: pushStatus.error,
              lastTest: action.payload.timestamp
            };
          }
          
          if (action.payload.connections.firebase) {
            const firebaseStatus = action.payload.connections.firebase;
            let status = 'error';
            if (firebaseStatus.status === 'connected') status = 'ok';
            else if (firebaseStatus.status === 'not_configured') status = 'error';
            else if (firebaseStatus.status === 'timeout') status = 'error';
            
            state.connections.firebase = {
              ...state.connections.firebase,
              status: status,
              responseTime: firebaseStatus.responseTime,
              error: firebaseStatus.error,
              lastTest: action.payload.timestamp
            };
          }
          if (action.payload.connections.keepalive) {
            const k = action.payload.connections.keepalive;
            let status = 'error';
            if (k.status === 'connected') status = 'ok';
            else if (k.status === 'stale') status = 'error';
            else if (k.status === 'unknown') status = 'pending';
            state.connections.keepalive = {
              ...state.connections.keepalive,
              status,
              lastHeartbeat: k.lastHeartbeat,
              heartbeatCount: k.heartbeatCount,
              age: k.age,
              error: k.error||null,
              lastTest: action.payload.timestamp
            };
          }
        }
        
        // Mapear información de red
        if (action.payload.network) {
          state.networkStatus = {
            online: action.payload.network.online,
            type: action.payload.network.effectiveType || action.payload.network.type || 'unknown',
            downlink: action.payload.network.downlink,
            rtt: action.payload.network.rtt
          };
        }
        
        if (action.payload.capabilities) {
          state.capabilities = { ...state.capabilities, ...action.payload.capabilities };
          
          // Actualizar localStorage específicamente
          if (action.payload.capabilities.localStorage) {
            state.operations.localStorage = {
              ...state.operations.localStorage,
              ...action.payload.capabilities.localStorage
            };
          }
          
          // Actualizar permisos basados en capacidades
          if (action.payload.capabilities.geolocation) {
            state.permissions.geolocation = {
              ...state.permissions.geolocation,
              ...action.payload.capabilities.geolocation
            };
          }
          
          if (action.payload.capabilities.notifications) {
            state.permissions.notifications = {
              ...state.permissions.notifications,
              ...action.payload.capabilities.notifications
            };
          }
        }
        
        if (action.payload.device) {
          state.device = { ...state.device, ...action.payload.device };
        }
        
        if (action.payload.network) {
          state.network = { ...state.network, ...action.payload.network };
        }

        if (action.payload.permissions) {
          const p = action.payload.permissions;
          state.permissions.geolocation = { ...state.permissions.geolocation, status: p.geolocation.permission, ...p.geolocation };
          state.permissions.notifications = { ...state.permissions.notifications, status: p.notifications.permission, ...p.notifications };
          state.permissions.camera = { ...(state.permissions.camera||{}), status: p.camera.permission, ...p.camera };
          state.permissions.microphone = { ...(state.permissions.microphone||{}), status: p.microphone.permission, ...p.microphone };
          state.permissions.motion = { ...(state.permissions.motion||{}), status: p.motion.permission, ...p.motion };
        }
      })
      
      // Diagnóstico completo - rejected
      .addCase(runSystemDiagnostic.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || { 
          message: 'Error desconocido en diagnóstico',
          timestamp: new Date().toISOString()
        };
      })
      .addCase(requestPermissionGeolocation.fulfilled, (state, action) => {
        state.permissions.geolocation = { ...state.permissions.geolocation, ...action.payload.snapshot, status: action.payload.snapshot.permission };
      })
      .addCase(requestPermissionNotifications.fulfilled, (state, action) => {
        state.permissions.notifications = { ...state.permissions.notifications, ...action.payload.snapshot, status: action.payload.snapshot.permission };
      })
      .addCase(requestPermissionCamera.fulfilled, (state, action) => {
        state.permissions.camera = { ...state.permissions.camera, ...action.payload.snapshot, status: action.payload.snapshot.permission };
      })
      .addCase(requestPermissionMicrophone.fulfilled, (state, action) => {
        state.permissions.microphone = { ...state.permissions.microphone, ...action.payload.snapshot, status: action.payload.snapshot.permission };
      })
      .addCase(requestPermissionMotion.fulfilled, (state, action) => {
        state.permissions.motion = { ...state.permissions.motion, ...action.payload.snapshot, status: action.payload.snapshot.permission };
      });
  }
});

// === ACTIONS ===
export const {
  updateSessionInfo,
  updateConnectionStatus,
  updateOperationMetrics,
  recordReceptionTest,
  updatePermissionStatus,
  incrementOperationCounter,
  updateResponseTime,
  clearError,
  resetSystemStatus,
  startKeepaliveScreenLockTest,
  finishKeepaliveScreenLockTest
} = systemStatusSlice.actions;

// === SELECTORS ===

// Selector para obtener el estado completo
export const selectSystemStatus = (state) => state.systemStatus;

// Selector para obtener solo información básica
export const selectBasicInfo = (state) => ({
  versions: state.systemStatus.versions,
  session: state.systemStatus.session,
  device: state.systemStatus.device,
  network: state.systemStatus.network
});

// Selector para obtener estado de conexiones
export const selectConnections = (state) => ({
  ...state.systemStatus.connections,
  networkStatus: state.systemStatus.networkStatus,
  services: {
    firebase: state.systemStatus.connections.firebase,
    backend: state.systemStatus.connections.backend,
  backendUpload: state.systemStatus.connections.backendUpload,
  notifications: state.systemStatus.connections.pushServer,
  keepalive: state.systemStatus.connections.keepalive
  }
});

// Selector para obtener métricas de operaciones
export const selectOperations = (state) => state.systemStatus.operations;

// Selector para obtener resultados de tests
export const selectTests = (state) => ({
  reception: state.systemStatus.receptionTests,
  screenLock: state.systemStatus.screenLockTests,
  offline: state.systemStatus.offlineTests,
  coherence: state.systemStatus.coherenceTests
});

// Selector para obtener permisos
export const selectPermissions = (state) => state.systemStatus.permissions;

// Selector para obtener capacidades
export const selectCapabilities = (state) => state.systemStatus.capabilities;

// Selector para verificar si hay errores
export const selectHasErrors = (state) => {
  const { connections, operations, receptionTests } = state.systemStatus;
  
  // Verificar errores en conexiones
  const connectionErrors = Object.values(connections).some(conn => 
    conn.status === 'error' || conn.status === 'disconnected'
  );
  
  // Verificar errores en operaciones
  const operationErrors = Object.values(operations).some(op => 
    op.errors > 0 || op.error
  );
  
  // Verificar tests fallidos
  const testErrors = Object.values(receptionTests).some(test => 
    test.status === 'failed'
  );
  
  return connectionErrors || operationErrors || testErrors;
};

// Selector para estadísticas de salud general
export const selectHealthStats = (state) => {
  const { connections, operations, permissions } = state.systemStatus;
  
  let total = 0;
  let healthy = 0;
  
  // Contar conexiones
  Object.values(connections).forEach(conn => {
    total++;
    if (conn.status === 'connected') healthy++;
  });
  
  // Contar operaciones funcionando
  Object.values(operations).forEach(op => {
    total++;
    if (!op.error && op.working !== false) healthy++;
  });
  
  // Contar permisos concedidos
  Object.values(permissions).forEach(perm => {
    if (typeof perm === 'object' && perm.status) {
      total++;
      if (perm.status === 'granted' || perm.status === 'available') healthy++;
    }
  });
  
  return {
    total,
    healthy,
    percentage: total > 0 ? Math.round((healthy / total) * 100) : 0
  };
};

export default systemStatusSlice.reducer;
