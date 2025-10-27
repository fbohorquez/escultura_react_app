import { 
  doc, 
  setDoc, 
  onSnapshot, 
  collection,
  serverTimestamp,
  query,
  orderBy,
  limit,
  getDoc
} from "firebase/firestore";
import { KEEPALIVE_TIMEOUT } from '../utils/keepaliveUtils';

class KeepaliveService {
  constructor(db, store) {
    this.db = db;
    this.store = store;
    this.worker = null;
    this.heartbeatInterval = null;
    this.teamsListenerUnsubscribe = null;
    this.reconnectTimeout = null;
    this.isInitialized = false;
    this.readOnlyMode = false;
    this.supportsWorker = typeof Worker !== 'undefined';
    
    // Variables para el evento y equipo
    this.eventId = null;
    this.teamId = null;
    this.sessionId = null;
    
    // Escuchar cambios en el estado de conexión de red
    this.setupNetworkListeners();
    this.initWebWorker();
  }

  initWebWorker() {
    if (!this.supportsWorker) {
      console.log('Web Workers not supported, using fallback');
      return;
    }

    try {
      this.worker = new Worker('/keepalive-worker.js');
      this.worker.onmessage = (e) => {
        this.handleWorkerMessage(e.data);
      };
      
      this.worker.onerror = (error) => {
        console.error('Web Worker error:', error);
        this.fallbackToInterval();
      };
      
      console.log('Web Worker initialized for keepalive');
    } catch (error) {
      console.error('Failed to initialize Web Worker:', error);
      this.worker = null;
      this.supportsWorker = false;
    }
  }

  handleWorkerMessage(data) {
    const { type, timestamp, error, data: requestData } = data;
    
    switch (type) {
      case 'HEARTBEAT_SUCCESS':
        this.store.dispatch({ type: 'keepalive/updateLastHeartbeat', payload: timestamp });
        this.store.dispatch({ type: 'keepalive/setConnectionStatus', payload: 'connected' });
        this.store.dispatch({ type: 'keepalive/resetReconnectAttempts' });
        break;
        
      case 'HEARTBEAT_ERROR':
        console.error('Worker heartbeat error:', error);
        this.handleHeartbeatError(new Error(error));
        break;
        
      case 'HEARTBEAT_REQUEST':
        // El worker solicita que enviemos un heartbeat desde el hilo principal
        this.handleWorkerHeartbeatRequest(requestData);
        break;
        
      case 'KEEPALIVE_STARTED':
        console.log('Keepalive started in worker');
        break;
        
      case 'KEEPALIVE_STOPPED':
        console.log('Keepalive stopped in worker');
        break;
        
      case 'WORKER_ALIVE':
        // Worker está funcionando correctamente
        break;
    }
  }

  async handleWorkerHeartbeatRequest(data) {
    try {
      const teamRef = doc(this.db, 'events', `event_${data.eventId}`, 'teams_keepalive', `team_${data.teamId}`);
      
      // Obtener el estado actual de la aplicación desde el store
      const state = this.store.getState();
      const keepaliveState = state.keepalive;
      
      const heartbeatData = {
        lastSeen: serverTimestamp(),
        status: data.status,
        timestamp: data.timestamp,
        url: data.url,
        // Nuevos campos para el estado de la aplicación
        appState: keepaliveState.appState,
        currentActivity: keepaliveState.currentActivity,
        appStateTimestamp: keepaliveState.appStateTimestamp
      };

      await setDoc(teamRef, heartbeatData, { merge: true });
      
      // Notificar al worker que el heartbeat fue exitoso
      if (this.worker) {
        this.worker.postMessage({ 
          type: 'HEARTBEAT_RESPONSE', 
          data: {
            success: true,
            timestamp: data.timestamp
          }
        });
      }
      
      // Actualizar el estado local
      this.store.dispatch({ type: 'keepalive/updateLastHeartbeat', payload: data.timestamp });
      this.store.dispatch({ type: 'keepalive/setConnectionStatus', payload: 'connected' });
      this.store.dispatch({ type: 'keepalive/resetReconnectAttempts' });
      
    } catch (error) {
      console.error('Error handling worker heartbeat request:', error);
      
      // Notificar al worker que el heartbeat falló
      if (this.worker) {
        this.worker.postMessage({ 
          type: 'HEARTBEAT_RESPONSE', 
          data: {
            success: false,
            error: error.message
          }
        });
      }
      
      this.handleHeartbeatError(error);
    }
  }

  generateDeviceId() {
    return 'device_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }

  generateSessionId() {
    return 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }

  /**
   * Obtiene la hora del servidor de Firestore escribiendo un documento con serverTimestamp()
   * y leyéndolo inmediatamente. Si falla, hace fallback a la hora local (solo para no romper flujo).
   */
  async getServerTime() {
    try {
      // Usar un doc dentro del propio evento para agrupar (si eventId existe)
      const ref = this.eventId
        ? doc(this.db, 'events', `event_${this.eventId}`, 'server_time', 'now')
        : doc(this.db, 'server_time', 'now');
      // Escribimos el serverTimestamp
      await setDoc(ref, { now: serverTimestamp() }, { merge: true });
      // Leemos inmediatamente
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        if (data?.now?.toMillis) {
          return data.now.toMillis();
        }
      }
    } catch (e) {
      console.warn('No se pudo obtener hora del servidor, fallback a hora local:', e);
    }
    return Date.now();
  }

  setupNetworkListeners() {
    window.addEventListener('online', () => {
      console.log('Network: Online');
      this.store.dispatch({ type: 'keepalive/setOnlineStatus', payload: true });
      this.handleReconnect();
    });

    window.addEventListener('offline', () => {
      console.log('Network: Offline');
      this.store.dispatch({ type: 'keepalive/setOnlineStatus', payload: false });
      this.handleDisconnect();
    });

    // Detectar cuando la pestaña pierde/gana foco
    document.addEventListener('visibilitychange', () => {
      this.handleVisibilityChange();
    });

    // Cleanup al cerrar la ventana
    window.addEventListener('beforeunload', () => {
      this.handleBeforeUnload();
    });
  }

  handleVisibilityChange() {
    if (document.hidden) {
      console.log('Tab: Hidden - continuing with worker');
      // El Web Worker continuará funcionando en segundo plano
      if (this.worker && this.isInitialized) {
        this.worker.postMessage({
          type: 'UPDATE_CONFIG',
          data: { 
            interval: 30000, // Mantener intervalo normal
            url: 'background'
          }
        });
      }
    } else {
      console.log('Tab: Visible - resuming normal operation');
      // Pestaña visible - enviar heartbeat inmediato
      if (this.isInitialized) {
        this.sendHeartbeat();
      }
    }
  }

  handleBeforeUnload() {
    // Marcar como offline antes de cerrar
    if (this.isInitialized && this.eventId && this.teamId) {
      try {
        // Usar sendBeacon con una simple URL para marcar offline
        const teamRef = doc(this.db, 'events', `event_${this.eventId}`, 'teams_keepalive', `team_${this.teamId}`);
        
        // En lugar de usar REST API, intentamos una escritura síncrona rápida
        setDoc(teamRef, {
          status: 'offline',
          lastSeen: serverTimestamp(),
          timestamp: Date.now()
        }, { merge: true }).catch(error => {
          console.warn('Could not mark team offline on unload:', error);
        });
        
      } catch (error) {
        console.warn('Error in beforeunload handler:', error);
      }
    }
    
    // Detener worker
    if (this.worker) {
      this.worker.postMessage({ type: 'STOP' });
    }
  }

  async initialize(eventId, teamId) {
    try {
      // Validar que se proporcionen eventId y teamId
      if (!eventId || !teamId) {
        throw new Error('Se requiere eventId y teamId para inicializar el keepalive');
      }

      if (this.isInitialized) {
        await this.cleanup();
      }

      this.eventId = eventId;
      this.teamId = teamId;

      // Intentar obtener el token "device" del documento del equipo y usarlo como sessionId
      try {
        const teamDocRef = doc(this.db, 'events', `event_${eventId}`, 'teams', `team_${teamId}`);
        const teamSnap = await getDoc(teamDocRef);
        if (teamSnap.exists()) {
          const teamData = teamSnap.data();
          if (teamData && teamData.device) {
            this.sessionId = teamData.device;
            console.log(`Using team device token as sessionId: ${this.sessionId}`);
          } else {
            this.sessionId = this.generateSessionId();
            console.log('No device token found on team, generated sessionId:', this.sessionId);
          }
        } else {
          this.sessionId = this.generateSessionId();
          console.log('Team document not found, generated sessionId:', this.sessionId);
        }
      } catch (err) {
        // Si falla la lectura, generar sessionId como fallback
        console.warn('Could not read team document for device token, falling back to generated sessionId:', err);
        this.sessionId = this.generateSessionId();
      }

      // Actualizar store con IDs
      this.store.dispatch({ type: 'keepalive/setTeamId', payload: this.teamId });
      this.store.dispatch({ type: 'keepalive/setSessionId', payload: this.sessionId });
      this.store.dispatch({ type: 'keepalive/setConnectionStatus', payload: 'connecting' });

      // Registrar equipo
      await this.registerTeam();
      
      // Iniciar heartbeat
      this.startHeartbeat();
      
      // Escuchar otros equipos
      this.subscribeToTeams();

      this.isInitialized = true;
      this.store.dispatch({ type: 'keepalive/setActive', payload: true });
      
      console.log(`Keepalive initialized for event ${eventId}, team ${teamId}`);
    } catch (error) {
      console.error('Error initializing keepalive:', error);
      this.store.dispatch({ type: 'keepalive/setConnectionStatus', payload: 'error' });
      throw error;
    }
  }

  /**
   * Inicializa el servicio solo para lectura (sin envío de keepalive)
   * Útil para administradores que necesitan leer estados sin tener equipo asignado
   */
  async initializeReadOnly(eventId) {
    try {
      if (!eventId) {
        throw new Error('Se requiere eventId para inicializar en modo solo lectura');
      }

      if (this.isInitialized) {
        await this.cleanup();
      }

      this.eventId = eventId;
      this.teamId = null; // No hay equipo en modo solo lectura
      this.sessionId = null;
      
      // Solo escuchar otros equipos, no enviar keepalive
      this.subscribeToTeams();

      this.isInitialized = true;
      this.readOnlyMode = true;
      
      console.log(`Keepalive initialized in read-only mode for event ${eventId}`);
    } catch (error) {
      console.error('Error initializing keepalive in read-only mode:', error);
      throw error;
    }
  }

  async registerTeam() {
    // No registrar equipo en modo solo lectura
    if (this.readOnlyMode) {
      console.log('Team registration disabled in read-only mode');
      return;
    }
    
    const teamRef = doc(this.db, 'events', `event_${this.eventId}`, 'teams_keepalive', `team_${this.teamId}`);
    
    // Obtener el estado actual de la aplicación desde el store
    const state = this.store.getState();
    const keepaliveState = state.keepalive;
    
    const teamData = {
      teamId: this.teamId,
      sessionId: this.sessionId,
      lastSeen: serverTimestamp(),
      status: 'online',
      userAgent: navigator.userAgent,
      timestamp: Date.now(),
      url: window.location.href,
      // Nuevos campos para el estado de la aplicación
      appState: keepaliveState.appState,
      currentActivity: keepaliveState.currentActivity,
      appStateTimestamp: keepaliveState.appStateTimestamp
    };

    await setDoc(teamRef, teamData);
  }

  startHeartbeat() {
    // No iniciar heartbeat en modo solo lectura
    if (this.readOnlyMode) {
      console.log('Heartbeat disabled in read-only mode');
      return;
    }
    
    this.clearHeartbeat();
    
    if (this.worker && this.supportsWorker) {
      // Usar Web Worker para heartbeat en segundo plano
      this.worker.postMessage({
        type: 'START',
        data: {
          eventId: this.eventId,
          teamId: this.teamId,
          interval: 30000,
          url: window.location.href
        }
      });
    } else {
      // Fallback para navegadores sin Web Worker
      this.fallbackToInterval();
    }
  }

  fallbackToInterval() {
    console.log('Using fallback interval for keepalive');
    
    const state = this.store.getState();
    const interval = state.keepalive?.heartbeatInterval || 30000;
    
    this.heartbeatInterval = setInterval(async () => {
      try {
        await this.sendHeartbeat();
      } catch (error) {
        console.error('Heartbeat failed:', error);
        this.handleHeartbeatError(error);
      }
    }, interval);

    // Enviar heartbeat inicial
    this.sendHeartbeat();
  }

  async sendHeartbeat() {
    if (!this.isInitialized || !navigator.onLine) {
      return;
    }

    const teamRef = doc(this.db, 'events', `event_${this.eventId}`, 'teams_keepalive', `team_${this.teamId}`);
    
    // Obtener el estado actual de la aplicación desde el store
    const state = this.store.getState();
    const keepaliveState = state.keepalive;
    
    const heartbeatData = {
      lastSeen: serverTimestamp(),
      status: 'online',
      timestamp: Date.now(),
      // Nuevos campos para el estado de la aplicación
      appState: keepaliveState.appState,
      currentActivity: keepaliveState.currentActivity,
      appStateTimestamp: keepaliveState.appStateTimestamp
    };

    await setDoc(teamRef, heartbeatData, { merge: true });
    this.store.dispatch({ type: 'keepalive/updateLastHeartbeat', payload: Date.now() });
  }

  // Función para forzar el envío inmediato de keepalive (para cambios de estado)
  async forceHeartbeat() {
    if (!this.isInitialized || !navigator.onLine || this.readOnlyMode) {
      return;
    }

    console.log('🚀 Forcing immediate keepalive update due to app state change');
    
    try {
      if (this.worker && this.supportsWorker) {
        // Si hay worker, pedirle que envíe inmediatamente
        this.worker.postMessage({ type: 'FORCE_HEARTBEAT' });
      } else {
        // Si no hay worker, enviar directamente
        await this.sendHeartbeat();
      }
    } catch (error) {
      console.error('Error forcing heartbeat:', error);
    }
  }

  subscribeToTeams() {
    if (this.teamsListenerUnsubscribe) {
      this.teamsListenerUnsubscribe();
    }

    const teamsRef = collection(this.db, 'events', `event_${this.eventId}`, 'teams_keepalive');
    const teamsQuery = query(
      teamsRef,
      orderBy('lastSeen', 'desc'),
      limit(50)
    );

    this.teamsListenerUnsubscribe = onSnapshot(
      teamsQuery,
      (snapshot) => {
        // Obtener hora de servidor antes de procesar cambios para evitar depender del reloj local
        this.getServerTime().then((serverNow) => {
          snapshot.docChanges().forEach((change) => {
            const teamData = change.doc.data();
            const teamId = change.doc.id.replace('team_', '');

            // Ignorar solo nuestro propio equipo cuando this.teamId esté definido
            if (this.teamId && teamId === this.teamId.toString()) {
              return; // Ignorar nuestro propio equipo
            }

            if (change.type === 'added' || change.type === 'modified') {
              // lastSeen y sleepTimestamp (ambos serverTimestamp)
              let lastSeenMillis = 0;
              if (teamData?.lastSeen?.toMillis) {
                lastSeenMillis = teamData.lastSeen.toMillis();
              }
              let sleepTimestampMillis = 0;
              if (teamData?.sleepTimestamp?.toMillis) {
                sleepTimestampMillis = teamData.sleepTimestamp.toMillis();
              }

              const withinActiveWindow = (serverNow - lastSeenMillis) < KEEPALIVE_TIMEOUT;
              const withinSleepWindow = sleepTimestampMillis > 0 && (serverNow - sleepTimestampMillis) < KEEPALIVE_TIMEOUT;

              let computedStatus = 'offline';
              if (withinActiveWindow) {
                computedStatus = 'online';
              } else if (teamData?.status === 'sleep' && withinSleepWindow) {
                computedStatus = 'sleep';
              }

              this.store.dispatch({
                type: 'keepalive/updateTeamStatus',
                payload: {
                  teamId,
                  lastSeen: lastSeenMillis || null,
                  sleepTimestamp: sleepTimestampMillis || null,
                  status: computedStatus,
                  // Nuevos campos para el estado de la aplicación
                  appState: teamData.appState,
                  currentActivity: teamData.currentActivity,
                  appStateTimestamp: teamData.appStateTimestamp
                }
              });
            } else if (change.type === 'removed') {
              this.store.dispatch({
                type: 'keepalive/removeTeam',
                payload: teamId
              });
            }
          });
        });
      },
      (error) => {
        console.error('Error listening to teams:', error);
        this.store.dispatch({ type: 'keepalive/setError', payload: error.message });
      }
    );
  }

  handleHeartbeatError(error) {
    console.error('Heartbeat error:', error);
    this.store.dispatch({ type: 'keepalive/setConnectionStatus', payload: 'error' });
    this.scheduleReconnect();
  }

  handleDisconnect() {
    this.pauseHeartbeat();
    this.store.dispatch({ type: 'keepalive/setConnectionStatus', payload: 'disconnected' });
  }

  handleReconnect() {
    if (!this.isInitialized) {
      return;
    }

    const state = this.store.getState();
    const { connectionStatus, reconnectAttempts, maxReconnectAttempts } = state.keepalive;

    if (connectionStatus === 'connected') {
      return;
    }

    if (reconnectAttempts >= maxReconnectAttempts) {
      console.log('Max reconnection attempts reached');
      this.store.dispatch({ type: 'keepalive/setConnectionStatus', payload: 'error' });
      return;
    }

    this.store.dispatch({ type: 'keepalive/incrementReconnectAttempts' });
    this.store.dispatch({ type: 'keepalive/setConnectionStatus', payload: 'connecting' });

    // Intentar reconectar
    this.startHeartbeat();
    
    console.log(`Reconnection attempt ${reconnectAttempts + 1}/${maxReconnectAttempts}`);
  }

  scheduleReconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    const state = this.store.getState();
    const { reconnectAttempts } = state.keepalive;
    
    // Backoff exponencial: 2^attemps * 1000ms, máximo 30 segundos
    const delay = Math.min(Math.pow(2, reconnectAttempts) * 1000, 30000);
    
    this.reconnectTimeout = setTimeout(() => {
      this.handleReconnect();
    }, delay);

    console.log(`Scheduled reconnection in ${delay}ms`);
  }

  pauseHeartbeat() {
    // No pausar si estamos usando worker, solo limpiar el intervalo local
    if (!this.worker) {
      this.clearHeartbeat();
    }
  }

  clearHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  async cleanup() {
    console.log('Cleaning up keepalive service');
    
    this.clearHeartbeat();
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    // Detener Web Worker
    if (this.worker) {
      this.worker.postMessage({ type: 'STOP' });
    }

    if (this.teamsListenerUnsubscribe) {
      this.teamsListenerUnsubscribe();
      this.teamsListenerUnsubscribe = null;
    }

    // Marcar equipo como offline
    if (this.isInitialized && this.eventId && this.teamId) {
      try {
        const teamRef = doc(this.db, 'events', `event_${this.eventId}`, 'teams_keepalive', `team_${this.teamId}`);
        await setDoc(teamRef, {
          status: 'offline',
          lastSeen: serverTimestamp(),
          timestamp: Date.now()
        }, { merge: true });
      } catch (error) {
        console.error('Error updating team status on cleanup:', error);
      }
    }

    this.isInitialized = false;
    this.store.dispatch({ type: 'keepalive/setConnectionStatus', payload: 'disconnected' });
    this.store.dispatch({ type: 'keepalive/clearTeams' });
  }

  // Método para destruir completamente el servicio
  destroy() {
    this.cleanup();
    
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    
    // Remover event listeners
    window.removeEventListener('online', this.handleReconnect);
    window.removeEventListener('offline', this.handleDisconnect);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    window.removeEventListener('beforeunload', this.handleBeforeUnload);
  }

  // Métodos para obtener información del estado
  getConnectionStatus() {
    const state = this.store.getState();
    return state.keepalive.connectionStatus;
  }

  getConnectedTeams() {
    const state = this.store.getState();
    return Object.entries(state.keepalive.teams)
      .filter(([, team]) => team.status === 'online')
      .map(([teamId, team]) => ({ teamId, ...team }));
  }

  getTeamCount() {
    return this.getConnectedTeams().length + 1; // +1 para incluir este equipo
  }

  // Método para obtener el estado de un equipo específico desde Firebase
  async getTeamStatus(teamId) {
    if (!this.eventId || !teamId) {
      return { status: 'offline', lastSeen: null };
    }

    try {
      const teamRef = doc(this.db, 'events', `event_${this.eventId}`, 'teams_keepalive', `team_${teamId}`);
      const teamDoc = await getDoc(teamRef);
      
      if (!teamDoc.exists()) {
        return { status: 'offline', lastSeen: null };
      }

      const teamData = teamDoc.data();
      // Obtener hora de servidor para comparación
      const serverNow = await this.getServerTime();
      let lastSeenMillis = 0;
      if (teamData?.lastSeen?.toMillis) {
        lastSeenMillis = teamData.lastSeen.toMillis();
      }
      let sleepTimestampMillis = 0;
      if (teamData?.sleepTimestamp?.toMillis) {
        sleepTimestampMillis = teamData.sleepTimestamp.toMillis();
      }
      const withinActiveWindow = (serverNow - lastSeenMillis) < KEEPALIVE_TIMEOUT;
      const withinSleepWindow = sleepTimestampMillis > 0 && (serverNow - sleepTimestampMillis) < KEEPALIVE_TIMEOUT;
      let computedStatus = 'offline';
      if (withinActiveWindow) {
        computedStatus = 'online';
      } else if (teamData?.status === 'sleep' && withinSleepWindow) {
        computedStatus = 'sleep';
      }

      return {
        status: computedStatus,
        lastSeen: lastSeenMillis || null,
        sleepTimestamp: sleepTimestampMillis || null,
        sessionId: teamData.sessionId,
        userAgent: teamData.userAgent,
        url: teamData.url,
        // Nuevos campos para el estado de la aplicación
        appState: teamData.appState,
        currentActivity: teamData.currentActivity,
        appStateTimestamp: teamData.appStateTimestamp
      };
    } catch (error) {
      console.error('Error getting team status from Firebase:', error);
      return { status: 'offline', lastSeen: null };
    }
  }
}

export default KeepaliveService;

