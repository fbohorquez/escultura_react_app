# Inventario Completo de Comunicación con Firebase

## Sistema Keepalive - Puntos de Interacción

### 📤 Escrituras a Firebase

#### 1. `KeepaliveService.registerTeam()`
**Archivo**: `src/services/keepalive.js` (línea ~360)
```javascript
async registerTeam() {
  const teamRef = doc(this.db, 'events', `event_${this.eventId}`, 'teams_keepalive', `team_${this.teamId}`);
  const teamData = {
    teamId: this.teamId,
    sessionId: this.sessionId,
    lastSeen: serverTimestamp(),
    status: 'online',
    userAgent: navigator.userAgent,
    timestamp: Date.now(),
    url: window.location.href,
    appState: keepaliveState.appState,
    currentActivity: keepaliveState.currentActivity,
    appStateTimestamp: keepaliveState.appStateTimestamp
  };
  await setDoc(teamRef, teamData);
}
```
- **Frecuencia**: 1 vez al inicializar
- **Operación**: `setDoc` (sobrescribe)
- **Ruta**: `events/event_{id}/teams_keepalive/team_{id}`

#### 2. `KeepaliveService.sendHeartbeat()`
**Archivo**: `src/services/keepalive.js` (línea ~420)
```javascript
async sendHeartbeat() {
  const teamRef = doc(this.db, 'events', `event_${this.eventId}`, 'teams_keepalive', `team_${this.teamId}`);
  const heartbeatData = {
    lastSeen: serverTimestamp(),
    status: 'online',
    timestamp: Date.now(),
    appState: keepaliveState.appState,
    currentActivity: keepaliveState.currentActivity,
    appStateTimestamp: keepaliveState.appStateTimestamp
  };
  await setDoc(teamRef, heartbeatData, { merge: true });
  this.store.dispatch({ type: 'keepalive/updateLastHeartbeat', payload: Date.now() });
}
```
- **Frecuencia**: Cada 30 segundos (configurable)
- **Operación**: `setDoc` con `merge: true`
- **Ruta**: `events/event_{id}/teams_keepalive/team_{id}`
- **Disparado por**: Web Worker o setInterval

#### 3. `KeepaliveService.handleWorkerHeartbeatRequest()`
**Archivo**: `src/services/keepalive.js` (línea ~90)
```javascript
async handleWorkerHeartbeatRequest(data) {
  const teamRef = doc(this.db, 'events', `event_${this.eventId}`, 'teams_keepalive', `team_${this.teamId}`);
  const heartbeatData = {
    lastSeen: serverTimestamp(),
    status: data.status,
    timestamp: data.timestamp,
    url: data.url,
    appState: keepaliveState.appState,
    currentActivity: keepaliveState.currentActivity,
    appStateTimestamp: keepaliveState.appStateTimestamp
  };
  await setDoc(teamRef, heartbeatData, { merge: true });
}
```
- **Frecuencia**: Cada 30 segundos (cuando usa Web Worker)
- **Operación**: `setDoc` con `merge: true`
- **Ruta**: `events/event_{id}/teams_keepalive/team_{id}`
- **Disparado por**: Mensaje del Web Worker

#### 4. `KeepaliveService.getServerTime()`
**Archivo**: `src/services/keepalive.js` (línea ~155)
```javascript
async getServerTime() {
  const ref = this.eventId
    ? doc(this.db, 'events', `event_${this.eventId}`, 'server_time', 'now')
    : doc(this.db, 'server_time', 'now');
  await setDoc(ref, { now: serverTimestamp() }, { merge: true });
  const snap = await getDoc(ref);
  if (snap.exists()) {
    const data = snap.data();
    if (data?.now?.toMillis) {
      return data.now.toMillis();
    }
  }
  return Date.now();
}
```
- **Frecuencia**: Variable (llamada en callbacks)
- **Operación**: `setDoc` + `getDoc`
- **Ruta**: `events/event_{id}/server_time/now` o `server_time/now`
- **PROBLEMA**: Escritura + lectura cada vez (ineficiente)

#### 5. `KeepaliveService.cleanup()` - Marcar offline
**Archivo**: `src/services/keepalive.js` (línea ~620)
```javascript
async cleanup() {
  if (this.isInitialized && this.eventId && this.teamId) {
    const teamRef = doc(this.db, 'events', `event_${this.eventId}`, 'teams_keepalive', `team_${this.teamId}`);
    await setDoc(teamRef, {
      status: 'offline',
      lastSeen: serverTimestamp(),
      timestamp: Date.now()
    }, { merge: true });
  }
}
```
- **Frecuencia**: 1 vez al limpiar servicio
- **Operación**: `setDoc` con `merge: true`
- **Ruta**: `events/event_{id}/teams_keepalive/team_{id}`

#### 6. `KeepaliveService.handleBeforeUnload()`
**Archivo**: `src/services/keepalive.js` (línea ~225)
```javascript
handleBeforeUnload() {
  if (this.isInitialized && this.eventId && this.teamId) {
    const teamRef = doc(this.db, 'events', `event_${this.eventId}`, 'teams_keepalive', `team_${this.teamId}`);
    setDoc(teamRef, {
      status: 'offline',
      lastSeen: serverTimestamp(),
      timestamp: Date.now()
    }, { merge: true }).catch(error => {
      console.warn('Could not mark team offline on unload:', error);
    });
  }
}
```
- **Frecuencia**: 1 vez al cerrar pestaña
- **Operación**: `setDoc` con `merge: true` (sin await)
- **Ruta**: `events/event_{id}/teams_keepalive/team_{id}`

### 📥 Lecturas desde Firebase

#### 7. `KeepaliveService.subscribeToTeams()`
**Archivo**: `src/services/keepalive.js` (línea ~471)
```javascript
subscribeToTeams() {
  const teamsRef = collection(this.db, 'events', `event_${this.eventId}`, 'teams_keepalive');
  const teamsQuery = query(
    teamsRef,
    orderBy('lastSeen', 'desc'),
    limit(50)
  );

  this.teamsListenerUnsubscribe = onSnapshot(
    teamsQuery,
    (snapshot) => {
      this.getServerTime().then((serverNow) => {
        snapshot.docChanges().forEach((change) => {
          const teamData = change.doc.data();
          const teamId = change.doc.id.replace('team_', '');
          
          // Procesamiento y dispatch a Redux
          this.store.dispatch({
            type: 'keepalive/updateTeamStatus',
            payload: { ... }
          });
        });
      });
    },
    (error) => {
      console.error('Error listening to teams:', error);
      this.store.dispatch({ type: 'keepalive/setError', payload: error.message });
    }
  );
}
```
- **Tipo**: Listener en tiempo real (`onSnapshot`)
- **Frecuencia**: CONTINUA (se dispara por cada cambio)
- **Ruta**: `events/event_{id}/teams_keepalive` (colección completa)
- **Query**: `orderBy('lastSeen', 'desc').limit(50)`
- **PROBLEMA CRÍTICO**: 
  - Se dispara por CADA equipo que actualiza su heartbeat
  - Con N equipos actualizando cada 30s → N callbacks cada 30s
  - Cada callback llama `getServerTime()` (escritura+lectura adicional)

#### 8. `KeepaliveService.getTeamStatus()` - Lectura individual
**Archivo**: `src/services/keepalive.js` (línea ~692)
```javascript
async getTeamStatus(teamId) {
  const teamRef = doc(this.db, 'events', `event_${this.eventId}`, 'teams_keepalive', `team_${teamId}`);
  const teamDoc = await getDoc(teamRef);
  
  if (!teamDoc.exists()) {
    return { status: 'offline', lastSeen: null };
  }
  
  const teamData = teamDoc.data();
  const serverNow = await this.getServerTime();
  // ... procesamiento ...
  
  return { status, lastSeen, ... };
}
```
- **Tipo**: Lectura puntual (`getDoc`)
- **Frecuencia**: Cuando se solicita estado específico
- **Ruta**: `events/event_{id}/teams_keepalive/team_{id}`
- **PROBLEMA**: Llama `getServerTime()` (escritura+lectura adicional)

#### 9. Lectura de token del equipo (en initialize)
**Archivo**: `src/services/keepalive.js` (línea ~260)
```javascript
const teamDocRef = doc(this.db, 'events', `event_${eventId}`, 'teams', `team_${teamId}`);
const teamSnap = await getDoc(teamDocRef);
if (teamSnap.exists()) {
  const teamData = teamSnap.data();
  if (teamData && teamData.device) {
    this.sessionId = teamData.device;
  }
}
```
- **Tipo**: Lectura puntual (`getDoc`)
- **Frecuencia**: 1 vez al inicializar
- **Ruta**: `events/event_{id}/teams/team_{id}`

---

## Sistema Chat - Puntos de Interacción

### 📤 Escrituras a Firebase

#### 10. `sendMessage()` - Enviar mensaje
**Archivo**: `src/services/firebase.js` (línea ~397)
```javascript
export const sendMessage = async (eventId, chatId, message) => {
  const chatRef = doc(db, "events", `event_${eventId}`, "chats", chatId);
  
  const chatDoc = await getDoc(chatRef);
  
  if (chatDoc.exists()) {
    await updateDoc(chatRef, {
      messages: arrayUnion(message)
    });
  } else {
    await setDoc(chatRef, {
      messages: [message]
    });
  }
};
```
- **Frecuencia**: Cuando usuario envía mensaje
- **Operación**: `updateDoc` con `arrayUnion` (o `setDoc` si no existe)
- **Ruta**: `events/event_{id}/chats/{chatId}`
- **Disparado desde**: `chatsSlice.sendMessage` thunk

#### 11. `markChatAsReadInFirebase()` - Marcar como leído
**Archivo**: `src/services/firebase.js` (línea ~565)
```javascript
export const markChatAsRead = async (eventId, chatId, userId, userType) => {
  const readStatusRef = doc(
    db, 
    "events", 
    `event_${eventId}`, 
    "chat_read_status", 
    `${userId}_${chatId}`
  );
  
  // Obtener el chat para saber el índice del último mensaje
  const chatRef = doc(db, "events", `event_${eventId}`, "chats", chatId);
  const chatDoc = await getDoc(chatRef);
  
  if (chatDoc.exists()) {
    const messages = chatDoc.data().messages || [];
    const lastMessageIndex = messages.length - 1;
    
    await setDoc(readStatusRef, {
      userId,
      chatId,
      lastReadMessageIndex: lastMessageIndex,
      lastReadAt: Date.now(),
      userType
    }, { merge: true });
  }
};
```
- **Frecuencia**: Cuando usuario abre/lee chat
- **Operación**: `getDoc` + `setDoc` con `merge: true`
- **Ruta**: `events/event_{id}/chat_read_status/{userId}_{chatId}`
- **PROBLEMA**: Lee el chat completo solo para obtener el índice

### 📥 Lecturas desde Firebase

#### 12. `subscribeToChat()` - Suscripción a mensajes
**Archivo**: `src/services/firebase.js` (línea ~428)
```javascript
export const subscribeToChat = (eventId, chatId, callback) => {
  const chatRef = doc(db, "events", `event_${eventId}`, "chats", chatId);
  const listenerId = `chat_${eventId}_${chatId}`;

  return createRobustListener(
    listenerId,
    chatRef,
    (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        callback(data.messages || []);
      } else {
        callback([]);
      }
    },
    (error) => {
      console.error(`Error in chat subscription ${chatId}:`, error);
    }
  );
};
```
- **Tipo**: Listener en tiempo real (`onSnapshot` vía `createRobustListener`)
- **Frecuencia**: CONTINUA (se dispara por cada mensaje nuevo)
- **Ruta**: `events/event_{id}/chats/{chatId}`
- **PROBLEMA CRÍTICO**: 
  - Se crea UNA suscripción por cada sala de chat
  - Típicamente 3-5 salas = 3-5 listeners simultáneos
  - Cada callback ejecuta `dispatch(setChatMessages(...))`

**Invocado desde**:
- `src/hooks/useChatConnections.js` (línea ~38, ~93, ~116)
- `src/pages/chatRoomPage.jsx` (línea ~45)

#### 13. `getChatRooms()` - Obtener salas de chat
**Archivo**: `src/services/firebase.js` (línea ~461)
```javascript
export const getChatRooms = async (eventId, teamId, isAdmin, teams = []) => {
  // Construye lista de salas basándose en lógica local
  // NO hace peticiones a Firebase directamente
  
  const rooms = [];
  
  // Sala grupal
  rooms.push({ id: "group", name: "Chat Grupal", type: "group" });
  
  // Chat privado con admin
  if (!isAdmin && teamId) {
    rooms.push({ 
      id: `admin_${teamId}`, 
      name: "Chat con Organizador", 
      type: "admin" 
    });
  }
  
  // Chats entre equipos
  if (teams && teams.length > 0) {
    teams.forEach(team => {
      if (!isAdmin && team.id !== teamId) {
        rooms.push({
          id: `team_${teamId}_${team.id}`,
          name: `Chat con ${team.name}`,
          type: "team",
          otherTeamId: team.id
        });
      }
    });
  }
  
  return rooms;
};
```
- **Tipo**: Función síncrona (sin Firebase)
- **Frecuencia**: Al inicializar conexiones
- **NOTA**: No interactúa con Firebase, genera salas basándose en datos locales

#### 14. `getChatReadStatus()` - Obtener estado de lectura
**Archivo**: `src/services/firebase.js` (línea ~589)
```javascript
export const getChatReadStatus = async (eventId, chatId, userId) => {
  const readStatusRef = doc(
    db, 
    "events", 
    `event_${eventId}`, 
    "chat_read_status", 
    `${userId}_${chatId}`
  );
  
  const readDoc = await getDoc(readStatusRef);
  
  if (readDoc.exists()) {
    return readDoc.data();
  }
  
  return {
    lastReadMessageIndex: -1,
    lastReadAt: 0
  };
};
```
- **Tipo**: Lectura puntual (`getDoc`)
- **Frecuencia**: Por cada sala al inicializar
- **Ruta**: `events/event_{id}/chat_read_status/{userId}_{chatId}`
- **Disparado desde**: `chatsSlice.fetchChatReadStatus` thunk
- **Invocado desde**: `src/hooks/useChatReadStatus.js`
- **PROBLEMA**: Se ejecuta para TODAS las salas al montar el componente

#### 15. `subscribeToUserReadStatus()` - Suscripción a estado de lectura
**Archivo**: `src/services/firebase.js` (línea ~618)
```javascript
export const subscribeToUserReadStatus = (eventId, userId, callback) => {
  const readStatusCollection = collection(db, "events", `event_${eventId}`, "chat_read_status");
  const listenerId = `read_status_${eventId}_${userId}`;
  
  const q = query(
    readStatusCollection,
    where("userId", "==", userId)
  );
  
  return createRobustListener(
    listenerId,
    q,
    (snapshot) => {
      const readStatuses = {};
      snapshot.forEach((doc) => {
        const data = doc.data();
        readStatuses[data.chatId] = data;
      });
      callback(readStatuses);
    }
  );
};
```
- **Tipo**: Listener en tiempo real (`onSnapshot` en colección)
- **Frecuencia**: CONTINUA (si se usa, no veo uso activo en el código)
- **Ruta**: `events/event_{id}/chat_read_status` (colección con filtro)
- **NOTA**: Función existe pero no parece estar en uso actualmente

---

## Helpers de Firebase - Sistema de Listeners

#### 16. `createRobustListener()` - Wrapper para onSnapshot
**Archivo**: `src/services/firebase.js` (línea ~111)
```javascript
const createRobustListener = (listenerId, ref, onNext, onError = null) => {
  let unsubscribe = null;
  let isActive = true;
  
  const startListening = () => {
    if (!isActive) return;
    
    console.log(`Starting listener ${listenerId}`);
    lastHeartbeat.set(listenerId, Date.now());
    
    unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        lastHeartbeat.set(listenerId, Date.now());
        reconnectionAttempts.set(listenerId, 0);
        onNext(snapshot);
      },
      (error) => {
        console.error(`Error in listener ${listenerId}:`, error);
        if (onError) onError(error);
        if (isActive) {
          scheduleReconnection(listenerId, startListening);
        }
      }
    );
  };
  
  startListening();
  
  connectionListeners.set(listenerId, {
    startListening,
    isActive: () => isActive
  });
  
  return () => {
    // cleanup
  };
};
```
- **Función**: Wrapper que añade reconexión automática a `onSnapshot`
- **Características**:
  - Manejo de errores
  - Reconexión automática con backoff exponencial
  - Tracking de "heartbeat" del listener
- **Usado por**: `subscribeToChat`, `subscribeToUserReadStatus`, otros listeners

#### 17. `startConnectionMonitor()` - Monitor de conexiones
**Archivo**: `src/services/firebase.js` (línea ~1073)
```javascript
export const startConnectionMonitor = () => {
  setInterval(() => {
    const info = getConnectionInfo();
    
    if (info.staleListeners.length > 0) {
      console.warn('⚠️ Detected stale listeners:', info.staleListeners);
      
      info.staleListeners.forEach(staleInfo => {
        const listener = connectionListeners.get(staleInfo.id);
        if (listener && listener.isActive()) {
          console.log(`🔄 Attempting to restart stale listener: ${staleInfo.id}`);
          listener.startListening();
        }
      });
    }
  }, 60000); // Cada 60 segundos
};
```
- **Función**: Monitoreo periódico de salud de listeners
- **Frecuencia**: Cada 60 segundos
- **Impacto**: Adicional overhead de monitoreo

---

## Resumen Cuantitativo

### Escrituras a Firebase

| ID | Función | Frecuencia | Sistema |
|----|---------|------------|---------|
| 1 | `registerTeam()` | 1x al init | Keepalive |
| 2 | `sendHeartbeat()` | Cada 30s | Keepalive |
| 3 | `handleWorkerHeartbeatRequest()` | Cada 30s | Keepalive |
| 4 | `getServerTime()` | Variable | Keepalive |
| 5 | `cleanup()` - offline | 1x al cleanup | Keepalive |
| 6 | `handleBeforeUnload()` | 1x al cerrar | Keepalive |
| 10 | `sendMessage()` | Por mensaje | Chat |
| 11 | `markChatAsRead()` | Al abrir chat | Chat |

**Total escrituras periódicas**: 2 por minuto (keepalive heartbeats)

### Lecturas desde Firebase

#### Lecturas Puntuales (getDoc)

| ID | Función | Frecuencia | Sistema |
|----|---------|------------|---------|
| 4 | `getServerTime()` (parte lectura) | Variable | Keepalive |
| 8 | `getTeamStatus()` | Bajo demanda | Keepalive |
| 9 | Leer token equipo | 1x al init | Keepalive |
| 11 | `markChatAsRead()` (parte lectura) | Al abrir chat | Chat |
| 14 | `getChatReadStatus()` | Por sala al init | Chat |

**Total lecturas iniciales**: ~3-5 (init keepalive + salas chat)

#### Listeners en Tiempo Real (onSnapshot)

| ID | Función | Cantidad | Frecuencia Callbacks | Sistema |
|----|---------|----------|---------------------|---------|
| 7 | `subscribeToTeams()` | 1 listener | Por cada equipo actualizando (cada 30s) | Keepalive |
| 12 | `subscribeToChat()` | 3-5 listeners | Por cada mensaje nuevo en cualquier sala | Chat |
| 15 | `subscribeToUserReadStatus()` | 0 (no usado) | N/A | Chat |

**Total listeners activos simultáneos**: 4-6

---

## Problemas Críticos Identificados

### 🔴 PROBLEMA 1: `getServerTime()` ineficiente
- **Ubicación**: Llamado desde `subscribeToTeams()` callback
- **Impacto**: 
  - Por cada cambio en un equipo → escritura + lectura Firebase
  - Con 10 equipos actualizando cada 30s = 20 lecturas/escrituras adicionales por minuto
- **Solución**: Cachear offset servidor-cliente, evitar escritura repetida

### 🔴 PROBLEMA 2: `subscribeToTeams()` muy activo
- **Ubicación**: `KeepaliveService.subscribeToTeams()`
- **Impacto**:
  - Se dispara por cada equipo que actualiza
  - Cada callback ejecuta `getServerTime()` (ver Problema 1)
  - Cada callback ejecuta `dispatch` a Redux
- **Solución**: 
  - Debounce de actualizaciones
  - Procesar cambios en batch
  - No llamar `getServerTime()` en cada callback

### 🔴 PROBLEMA 3: Múltiples suscripciones de chat simultáneas
- **Ubicación**: `useChatConnections.js` crea múltiples listeners
- **Impacto**:
  - 3-5 listeners `onSnapshot` activos
  - Cada mensaje dispara callback + dispatch Redux
  - Re-renders en cascada
- **Solución**:
  - Lazy loading: solo suscribirse a sala activa
  - Suscribirse a otras salas bajo demanda
  - Usar polling para salas inactivas

### 🔴 PROBLEMA 4: `getChatReadStatus()` masivo al iniciar
- **Ubicación**: `useChatReadStatus.js` llama para todas las salas
- **Impacto**: 
  - 5 peticiones `getDoc` simultáneas al montar componente
  - Carga inicial alta
- **Solución**:
  - Lazy loading: cargar solo para sala activa
  - Cachear resultados
  - Usar `subscribeToUserReadStatus()` en lugar de múltiples `getDoc`

### 🟡 PROBLEMA 5: `markChatAsRead()` ineficiente
- **Ubicación**: Lee chat completo solo para obtener índice del último mensaje
- **Impacto**: Lectura innecesaria de todos los mensajes
- **Solución**: 
  - Mantener count de mensajes en metadata separada
  - O pasar índice desde el componente (ya conoce los mensajes)

---

## Métricas Estimadas (Configuración Actual)

### Con 1 usuario, 5 salas de chat, 10 equipos totales

**Por minuto**:
- Escrituras Firebase: ~2-4 (heartbeats + eventualmente server_time)
- Callbacks de listeners: ~10-15 (equipos actualizando + mensajes chat)
- Dispatches Redux: ~15-20
- Re-renders potenciales: ~30-50 (dependiendo de componentes)

**Al inicializar**:
- Lecturas puntuales: ~6-8
- Listeners creados: 4-6

**Ancho de banda Firebase**:
- Listeners activos: 4-6 conexiones WebSocket
- Datos descargados: Bajo (solo cambios incrementales)
- Datos subidos: Muy bajo (heartbeats pequeños)

---

## Recomendaciones de Optimización

### Prioridad Alta

1. **Cachear hora del servidor**: Evitar `getServerTime()` en cada callback
2. **Lazy loading de suscripciones chat**: Solo sala activa
3. **Debounce updates en `subscribeToTeams()`**: Procesar cambios en batch
4. **Memoizar selectores Redux**: Evitar re-renders innecesarios

### Prioridad Media

5. **Aumentar intervalo keepalive**: 30s → 60s o 120s
6. **Optimizar `markChatAsRead()`**: No leer mensajes completos
7. **Usar `subscribeToUserReadStatus()`**: En lugar de múltiples `getDoc`
8. **Implementar React.memo**: En componentes de gestión

### Prioridad Baja

9. **Reducir límite en `subscribeToTeams()`**: 50 → 20 equipos
10. **Implementar paginación**: Para equipos si hay muchos
11. **Comprimir payloads**: Reducir tamaño de heartbeats

---

**Fecha**: 4 de noviembre de 2025
**Versión**: 1.0
**Estado**: ✅ Inventario completo
