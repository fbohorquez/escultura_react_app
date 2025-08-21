// keepalive-worker.js - Web Worker para mantener keepalive en segundo plano
// Enfoque simplificado que evita problemas de CORS

let intervalId = null;
let config = null;
let isActive = false;

self.onmessage = function(e) {
  const { type, data } = e.data;
  
  switch(type) {
    case 'START':
      config = data;
      startKeepalive();
      break;
    case 'STOP':
      stopKeepalive();
      break;
    case 'UPDATE_CONFIG':
      if (config) {
        config = { ...config, ...data };
      }
      break;
    case 'PING':
      self.postMessage({ type: 'PONG' });
      break;
    case 'FORCE_HEARTBEAT':
      // Enviar heartbeat inmediato
      if (isActive) {
        sendHeartbeat();
      }
      break;
    case 'HEARTBEAT_RESPONSE':
      // Respuesta del hilo principal sobre el estado del heartbeat
      if (data.success) {
        self.postMessage({ 
          type: 'HEARTBEAT_SUCCESS', 
          timestamp: data.timestamp 
        });
      } else {
        self.postMessage({ 
          type: 'HEARTBEAT_ERROR', 
          error: data.error || 'Unknown error' 
        });
      }
      break;
  }
};

function startKeepalive() {
  if (intervalId) {
    clearInterval(intervalId);
  }
  
  if (!config) {
    self.postMessage({ type: 'HEARTBEAT_ERROR', error: 'No config provided' });
    return;
  }
  
  isActive = true;
  
  intervalId = setInterval(() => {
    if (isActive) {
      sendHeartbeat();
    }
  }, config.interval || 30000);
  
  // Enviar heartbeat inicial
  sendHeartbeat();
  self.postMessage({ type: 'KEEPALIVE_STARTED' });
}

function stopKeepalive() {
  isActive = false;
  
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  
  self.postMessage({ type: 'KEEPALIVE_STOPPED' });
}

function sendHeartbeat() {
  if (!config || !isActive) {
    return;
  }

  try {
    const timestamp = Date.now();
    
    // Enviar solicitud de heartbeat al hilo principal
    // El hilo principal manejará la escritura a Firestore y la obtención del estado de la app
    self.postMessage({ 
      type: 'HEARTBEAT_REQUEST',
      data: {
        eventId: config.eventId,
        teamId: config.teamId,
        timestamp: timestamp,
        status: 'online',
        url: config.url || 'background'
      }
    });
    
  } catch (error) {
    self.postMessage({ 
      type: 'HEARTBEAT_ERROR', 
      error: error.message 
    });
  }
}

// Mantener el worker activo con pings periódicos
setInterval(() => {
  if (isActive) {
    self.postMessage({ type: 'WORKER_ALIVE' });
  }
}, 300000); // Cada 5 minutos
