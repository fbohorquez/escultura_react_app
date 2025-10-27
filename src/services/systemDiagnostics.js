// src/services/systemDiagnostics.js

/**
 * Servicio para diagnósticos del sistema
 * Proporciona funciones para detectar información del entorno,
 * verificar conexiones y realizar tests de funcionamiento.
 */

// === CLAVES Y UTILIDADES DE PERMISOS ===

const GEO_PERMISSION_KEY = 'geo_permission_state';
const GEO_PERMISSION_SESSION_KEY = 'geo_permission_state_session';
const MOTION_PERMISSION_KEY = 'motion_permission_state';
const MOTION_PERMISSION_SESSION_KEY = 'motion_permission_state_session';

const persistPermissionState = (key, sessionKey, value) => {
  if (!value) {
    return;
  }
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
  try {
    sessionStorage.setItem(sessionKey, value);
  } catch {
    /* ignore */
  }
};

const persistPermissionStateIfFinal = (key, sessionKey, value) => {
  if (value === 'granted' || value === 'denied') {
    persistPermissionState(key, sessionKey, value);
  }
};

const readPermissionState = (key, sessionKey) => {
  let sessionValue = null;
  let storedValue = null;
  try {
    sessionValue = sessionStorage.getItem(sessionKey);
  } catch {
    /* ignore */
  }
  try {
    storedValue = localStorage.getItem(key);
  } catch {
    /* ignore */
  }
  return { sessionValue, storedValue };
};

// === INFORMACIÓN DEL SISTEMA ===

/**
 * Detecta información detallada del navegador
 * @returns {Object} Información completa del navegador
 */
export const getBrowserInfo = () => {
  const userAgent = navigator.userAgent;
  let browser = 'Unknown';
  let version = 'Unknown';
  let fullVersion = 'Unknown';
  let engine = 'Unknown';

  // Detectar navegador y versión con mayor precisión
  if (userAgent.includes('Edg/')) {
    // Microsoft Edge (Chromium)
    browser = 'Microsoft Edge';
    const match = userAgent.match(/Edg\/(\d+)\.(\d+)\.(\d+)\.(\d+)/);
    if (match) {
      version = match[1];
      fullVersion = `${match[1]}.${match[2]}.${match[3]}.${match[4]}`;
    }
    engine = 'Blink';
  } else if (userAgent.includes('Chrome/') && !userAgent.includes('Edg/')) {
    browser = 'Google Chrome';
    const match = userAgent.match(/Chrome\/(\d+)\.(\d+)\.(\d+)\.(\d+)/);
    if (match) {
      version = match[1];
      fullVersion = `${match[1]}.${match[2]}.${match[3]}.${match[4]}`;
    }
    engine = 'Blink';
  } else if (userAgent.includes('Firefox/')) {
    browser = 'Mozilla Firefox';
    const match = userAgent.match(/Firefox\/(\d+)\.(\d+)/);
    if (match) {
      version = match[1];
      fullVersion = `${match[1]}.${match[2]}`;
    }
    engine = 'Gecko';
  } else if (userAgent.includes('Safari/') && !userAgent.includes('Chrome/')) {
    browser = 'Safari';
    const match = userAgent.match(/Version\/(\d+)\.(\d+)/);
    if (match) {
      version = match[1];
      fullVersion = `${match[1]}.${match[2]}`;
    }
    engine = 'WebKit';
  } else if (userAgent.includes('Opera/') || userAgent.includes('OPR/')) {
    browser = 'Opera';
    const match = userAgent.match(/(?:Opera\/|OPR\/)(\d+)\.(\d+)/);
    if (match) {
      version = match[1];
      fullVersion = `${match[1]}.${match[2]}`;
    }
    engine = 'Blink';
  }

  return {
    name: browser,
    version: version,
    fullVersion: fullVersion,
    engine: engine,
    userAgent: userAgent,
    language: navigator.language,
    languages: navigator.languages || [navigator.language],
    cookieEnabled: navigator.cookieEnabled,
    onlineStatus: navigator.onLine,
    platform: navigator.platform,
    maxTouchPoints: navigator.maxTouchPoints || 0,
    hardwareConcurrency: navigator.hardwareConcurrency || 'Unknown'
  };
};

/**
 * Detecta información detallada del dispositivo
 * @returns {Object} Información completa del dispositivo
 */
export const getDeviceInfo = () => {
  const userAgent = navigator.userAgent;
  let os = 'Unknown';
  let osVersion = 'Unknown';
  let device = 'Desktop';
  let isMobile = false;
  let isTablet = false;

  // Detectar OS con versiones
  if (userAgent.includes('Windows NT')) {
    os = 'Windows';
    const match = userAgent.match(/Windows NT (\d+\.\d+)/);
    if (match) {
      const version = match[1];
      switch (version) {
        case '10.0': osVersion = '10/11'; break;
        case '6.3': osVersion = '8.1'; break;
        case '6.2': osVersion = '8'; break;
        case '6.1': osVersion = '7'; break;
        default: osVersion = version;
      }
    }
  } else if (userAgent.includes('Intel Mac OS X')) {
    os = 'macOS';
    const match = userAgent.match(/Mac OS X (\d+_\d+)/);
    if (match) {
      osVersion = match[1].replace('_', '.');
    }
  } else if (userAgent.includes('Linux')) {
    os = 'Linux';
    if (userAgent.includes('Ubuntu')) osVersion = 'Ubuntu';
    else if (userAgent.includes('CentOS')) osVersion = 'CentOS';
    else if (userAgent.includes('Fedora')) osVersion = 'Fedora';
  } else if (userAgent.includes('Android')) {
    os = 'Android';
    const match = userAgent.match(/Android (\d+\.?\d*)/);
    if (match) osVersion = match[1];
  } else if (userAgent.includes('iPhone OS') || userAgent.includes('OS ')) {
    os = 'iOS';
    const match = userAgent.match(/OS (\d+_\d+)/);
    if (match) osVersion = match[1].replace('_', '.');
  }

  // Detectar tipo de dispositivo con mayor precisión
  const width = window.innerWidth;
  const height = window.innerHeight;
  const hasTouch = navigator.maxTouchPoints > 0;
  
  if (/iPhone|iPod/i.test(userAgent)) {
    device = 'iPhone';
    isMobile = true;
  } else if (/iPad/i.test(userAgent)) {
    device = 'iPad';
    isTablet = true;
  } else if (/Android/i.test(userAgent)) {
    if (width < 768) {
      device = 'Android Phone';
      isMobile = true;
    } else {
      device = 'Android Tablet';
      isTablet = true;
    }
  } else if (hasTouch && (width < 768 || height < 768)) {
    device = 'Mobile';
    isMobile = true;
  } else if (hasTouch && (width >= 768 && width < 1024)) {
    device = 'Tablet';
    isTablet = true;
  } else {
    device = 'Desktop';
  }

  // Información de pantalla mejorada
  const screen = window.screen;
  const orientation = screen.orientation || screen.mozOrientation || screen.msOrientation;
  
  return {
    os: os,
    osVersion: osVersion,
    device: device,
    isMobile: isMobile,
    isTablet: isTablet,
    isDesktop: !isMobile && !isTablet,
    platform: navigator.platform,
    hasTouch: hasTouch,
    maxTouchPoints: navigator.maxTouchPoints || 0,
    screen: {
      width: screen.width,
      height: screen.height,
      availWidth: screen.availWidth,
      availHeight: screen.availHeight,
      colorDepth: screen.colorDepth,
      pixelDepth: screen.pixelDepth
    },
    viewport: {
      width: width,
      height: height,
      pixelRatio: window.devicePixelRatio || 1
    },
    orientation: {
      type: orientation?.type || 'unknown',
      angle: orientation?.angle || 0,
      current: width > height ? 'landscape' : 'portrait'
    },
    storage: {
      available: typeof(Storage) !== "undefined",
      localStorage: testLocalStorage(),
      sessionStorage: testSessionStorage()
    }
  };
};


/**
 * Testa la disponibilidad de sessionStorage
 * @returns {Object} Estado de sessionStorage
 */
const testSessionStorage = () => {
  try {
    const test = '__sessionStorage_test__';
    sessionStorage.setItem(test, 'test');
    const retrieved = sessionStorage.getItem(test);
    sessionStorage.removeItem(test);
    
    if (retrieved !== 'test') {
      throw new Error('sessionStorage no funciona correctamente');
    }
    
    return {
      available: true,
      working: true
    };
  } catch (e) {
    return {
      available: typeof(Storage) !== "undefined",
      working: false,
      error: e.message
    };
  }
};

/**
 * Obtiene información de la red
 * @returns {Object} Información de la red
 */
export const getNetworkInfo = () => {
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  
  // Información básica siempre disponible
  const baseInfo = {
    online: navigator.onLine,
    effectiveType: connection?.effectiveType || 'unknown',
    downlink: connection?.downlink || null,
    rtt: connection?.rtt || null,
    saveData: connection?.saveData || false,
    type: connection?.type || 'unknown'
  };
  
  // Mejorar detección del tipo de red basándose en múltiples factores
  let detectedType = 'unknown';
  let detectedEffectiveType = baseInfo.effectiveType;
  
  // 1. Si tenemos información de la API de conexión, usarla
  if (connection && connection.type && connection.type !== 'unknown') {
    detectedType = connection.type;
  }
  // 2. Si no, intentar detectar basándose en el contexto del dispositivo
  else {
    const userAgent = navigator.userAgent;
    const isMobile = /Mobile|Android|iPhone|iPad/i.test(userAgent);
    const isTablet = /iPad|Android.*Tablet/i.test(userAgent);
    
    if (isMobile && !isTablet) {
      // En móviles, puede ser WiFi o cellular
      // Si effectiveType es muy bueno, probablemente WiFi
      if (baseInfo.effectiveType === '4g' && baseInfo.downlink && baseInfo.downlink > 10) {
        detectedType = 'wifi';
      } else if (baseInfo.effectiveType) {
        detectedType = 'cellular';
      } else {
        detectedType = 'cellular'; // Asumir cellular por defecto en móviles
        detectedEffectiveType = 'unknown';
      }
    } else {
      // En desktop/tablet, probablemente ethernet o wifi
      detectedType = 'ethernet';
      // Si no hay effectiveType disponible, no asumir nada
      if (detectedEffectiveType === 'unknown') {
        detectedEffectiveType = 'unknown';
      }
    }
  }
  
  // 3. Ajustar effectiveType si no está disponible y tenemos pistas
  if (detectedEffectiveType === 'unknown' && baseInfo.downlink) {
    if (baseInfo.downlink > 10) {
      detectedEffectiveType = 'fast';
    } else if (baseInfo.downlink > 1.5) {
      detectedEffectiveType = '4g';
    } else if (baseInfo.downlink > 0.4) {
      detectedEffectiveType = '3g';
    } else {
      detectedEffectiveType = '2g';
    }
  }
  
  // Debug: Log de información de red detectada
  console.log('🌐 Network detection:', {
    userAgent: navigator.userAgent.slice(0, 50) + '...',
    connectionAPI: !!connection,
    apiType: connection?.type,
    apiEffectiveType: connection?.effectiveType,
    apiDownlink: connection?.downlink,
    apiRTT: connection?.rtt,
    detectedType,
    detectedEffectiveType,
    online: baseInfo.online
  });
  
  return {
    ...baseInfo,
    type: detectedType,
    effectiveType: detectedEffectiveType
  };
};

// === TESTS DE CONECTIVIDAD ===

/**
 * Función de debug para inspeccionar la API de conexión
 * @returns {Object} Información detallada de la API de conexión
 */
export const debugConnectionAPI = () => {
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  
  const debug = {
    hasConnectionAPI: !!connection,
    navigator: {
      onLine: navigator.onLine,
      userAgent: navigator.userAgent,
      platform: navigator.platform
    }
  };
  
  if (connection) {
    debug.connectionAPI = {
      type: connection.type,
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      downlinkMax: connection.downlinkMax,
      rtt: connection.rtt,
      saveData: connection.saveData
    };
  }
  
  console.log('🔍 Connection API Debug:', debug);
  return debug;
};

// Exponer función de debug globalmente para testing
if (typeof window !== 'undefined') {
  window.debugConnectionAPI = debugConnectionAPI;
}

/**
 * Test básico de conectividad a internet
 * @returns {Promise<Object>} Resultado del test
 */
export const testInternetConnection = async () => {
  const startTime = Date.now();
  
  try {
    // Usar navigator.onLine primero como verificación rápida
    if (!navigator.onLine) {
      return {
        status: 'disconnected',
        error: 'Navigator indica que no hay conexión',
        timestamp: new Date().toISOString(),
        method: 'navigator.onLine'
      };
    }
    
    // Test más confiable con Google DNS
    const response = await fetch('https://dns.google/resolve?name=google.com&type=A', {
      method: 'GET',
      mode: 'cors',
      cache: 'no-cache',
      signal: AbortSignal.timeout(5000) // Timeout de 5 segundos
    });
    
    const latency = Date.now() - startTime;
    
    if (response.ok) {
      return {
        status: 'connected',
        latency: latency,
        timestamp: new Date().toISOString(),
        method: 'dns.google'
      };
    } else {
      return {
        status: 'error',
        error: `HTTP ${response.status}: ${response.statusText}`,
        timestamp: new Date().toISOString(),
        method: 'dns.google'
      };
    }
  } catch (error) {
    // Fallback: intentar con un favicon
    try {
      await fetch('https://www.google.com/favicon.ico', {
        mode: 'no-cors',
        cache: 'no-cache',
        signal: AbortSignal.timeout(3000)
      });
      
      const latency = Date.now() - startTime;
      return {
        status: 'connected',
        latency: latency,
        timestamp: new Date().toISOString(),
        method: 'favicon fallback'
      };
    } catch (fallbackError) {
      return {
        status: 'disconnected',
        error: `${error.message} (fallback: ${fallbackError.message})`,
        timestamp: new Date().toISOString(),
        method: 'both failed'
      };
    }
  }
};

/**
 * Test de conectividad al backend de la aplicación
 * @returns {Promise<Object>} Resultado del test
 */
export const testBackendConnection = async () => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  
  if (!baseUrl) {
    return {
      status: 'not_configured',
      error: 'No hay URL del backend configurada (VITE_API_BASE_URL)',
      timestamp: new Date().toISOString()
    };
  }
  
  const startTime = Date.now();
  
  try {
    // Intentar hacer ping al endpoint base con timeout
    const response = await fetch(baseUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(10000) // Timeout de 10 segundos
    });
    
    const responseTime = Date.now() - startTime;
    
    return {
      status: response.ok ? 'connected' : 'error',
      statusCode: response.status,
      responseTime: responseTime,
      url: baseUrl,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    // Distinguir entre timeout y otros errores
    if (error.name === 'AbortError' || error.message.includes('timeout')) {
      return {
        status: 'timeout',
        error: 'Timeout - El servidor no responde',
        responseTime: responseTime,
        url: baseUrl,
        timestamp: new Date().toISOString()
      };
    }
    
    return {
      status: 'disconnected',
      error: error.message,
      responseTime: responseTime,
      url: baseUrl,
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Test de subida de archivo (dummy) al backend.
 * Intenta emular una subida real usando el mismo campo 'profile_img'.
 * No verifica la lectura posterior (depende de lógica servidor), solo el POST.
 * @returns {Promise<Object>} Resultado del test
 */
export const testBackendUpload = async () => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  if (!baseUrl) {
    return {
      status: 'not_configured',
      error: 'No hay URL del backend configurada (VITE_API_BASE_URL)',
      timestamp: new Date().toISOString()
    };
  }

  // Evitar si estamos claramente offline
  if (!navigator.onLine) {
    return {
      status: 'disconnected',
      error: 'Sin conexión (navigator.onLine = false)',
      timestamp: new Date().toISOString()
    };
  }

  // Construir una ruta de prueba que siga el patrón genérico de uploads
  // Formato usado en la app: /event_#/team_#/activity_#.ext/upload o variantes con @
  // Para minimizar efectos laterales usamos un nombre explícito de diagnóstico.
  const timestamp = Date.now();
  const testFileName = `upload_${timestamp}.txt`;
  const testFileBase = `/diagnostic@status@${testFileName}`; // patrón event@team@filename
  const uploadEndpoint = `${testFileBase}/upload`;
  const fullUrl = baseUrl + uploadEndpoint;
  const startTime = Date.now();

  try {
    const blob = new Blob([`diagnostic upload test ${timestamp}`], { type: 'text/plain' });
    const formData = new FormData();
    formData.append('profile_img', blob, 'diagnostic.txt');
    formData.append('diagnostic', 'true');
    formData.append('timestamp', String(timestamp));

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s
    let response;
    try {
      response = await fetch(fullUrl, {
        method: 'POST',
        body: formData,
        signal: controller.signal
      });
    } finally {
      clearTimeout(timeout);
    }

    const responseTime = Date.now() - startTime;
    if (!response.ok) {
      return {
        status: 'error',
        statusCode: response.status,
        responseTime,
        url: fullUrl,
        path: uploadEndpoint,
        sizeBytes: blob.size,
        timestamp: new Date().toISOString(),
        error: `HTTP ${response.status}`
      };
    }

    // URL pública esperada (el backend sirve /uploads/events/<event>/<team>/<file>)
    const publicBase = baseUrl.replace('/api', '');
    const publicUrl = `${publicBase}/uploads/events/diagnostic/status/${testFileName}`;

    // Comprobar si origen (puerto/dom) difiere para advertir sobre CORS en iOS
    let originNote = null;
    try {
      const appOrigin = window.location.origin;
      const apiURL = new URL(baseUrl);
      if (appOrigin !== `${apiURL.protocol}//${apiURL.host}`) {
        originNote = `Origen app (${appOrigin}) != API (${apiURL.protocol}//${apiURL.host}) -> posible CORS`;
      }
  } catch {
      // ignorar
    }

    // Verificar disponibilidad con reintentos (manejo especial iOS Safari)
    const isIOS = /iP(ad|hone|od)/i.test(navigator.userAgent);
    const maxAttempts = isIOS ? 8 : 5; // más intentos en iOS por latencias/caché
    let verified = false;
    let availabilityTime = null;
    let fetchStatus = null;
    let fetchError = null;
    let loadFailedTransientCount = 0;
    // Pequeña espera inicial para permitir procesamiento backend/CDN
    await new Promise(r => setTimeout(r, 1000));
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const attemptStart = Date.now();
      try {
        // Añadir parámetros anti-caché fuertes
        const urlToCheck = `${publicUrl}?v=${timestamp}&a=${attempt}&rnd=${Math.random().toString(36).slice(2)}`;
        let verifyResp;
        try {
          verifyResp = await fetch(urlToCheck, {
            method: 'GET',
            cache: 'reload', // fuerza revalidación en Safari
            credentials: 'omit',
            mode: 'cors'
          });
        } catch (primaryErr) {
          // Fallback HEAD no-cors (algunos iOS devuelven CORS error antes de 404 real)
          try {
            verifyResp = await fetch(urlToCheck, {
              method: 'HEAD',
              cache: 'reload',
              credentials: 'omit',
              mode: 'no-cors'
            });
            // no-cors HEAD no expone status; asumimos 200 si no lanza
            if (verifyResp && typeof verifyResp.status === 'undefined') {
              fetchStatus = 200;
              verified = true;
              availabilityTime = Date.now() - startTime;
              break;
            }
          } catch {
            throw primaryErr; // usar error original
          }
        }
        fetchStatus = verifyResp.status;
        if (verifyResp.ok) {
          verified = true;
          availabilityTime = Date.now() - startTime;
          break;
        } else if (verifyResp.status === 404) {
          // No disponible aún: esperar progresivamente más en iOS
          const baseDelay = isIOS ? 450 : 250;
          await new Promise(r => setTimeout(r, attempt * baseDelay));
          continue;
        } else {
          fetchError = `HTTP ${verifyResp.status}`;
          break;
        }
      } catch (e) {
        // Safari iOS frecuentemente lanza TypeError 'Load failed' en recursos recién creados o con caché inconsistente
        const msg = e?.message || 'unknown error';
        if (msg === 'Load failed' || /Load failed/i.test(msg)) {
          loadFailedTransientCount++;
          // Tratarlo como si fuese aún no disponible si quedan intentos
            if (attempt < maxAttempts) {
              const adaptiveDelay = (isIOS ? 550 : 300) * attempt;
              await new Promise(r => setTimeout(r, adaptiveDelay));
              continue;
            }
        }
        fetchError = msg;
        // Espera incremental antes de abortar o siguiente intento
        await new Promise(r => setTimeout(r, attempt * (isIOS ? 500 : 300)));
      } finally {
        const attemptDuration = Date.now() - attemptStart;
        // Debug silencioso (sin alert) para no bloquear UX
        if (window?.console) {
          console.debug('[diagnostic][upload] intento', attempt, '/', maxAttempts, {
            fetchStatus,
            fetchError,
            verified,
            attemptDuration,
            isIOS,
            loadFailedTransientCount
          });
        }
      }
    }

    if (!verified) {
      return {
        status: 'error',
        statusCode: response.status,
        responseTime,
        url: fullUrl,
        path: uploadEndpoint,
        publicUrl,
        sizeBytes: blob.size,
        verified: false,
        availabilityTime,
        fetchStatus,
        timestamp: new Date().toISOString(),
        error: fetchError || 'Archivo no visible tras subida (reintentos agotados)',
        originNote
      };
    }

    // Intentar detectar tipo de cuerpo de respuesta POST
    let bodyType = 'unknown';
    try {
      const ct = response.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        await response.json();
        bodyType = 'json';
      } else {
        bodyType = ct || 'none';
      }
    } catch { /* ignorar */ }

    return {
      status: 'connected',
      statusCode: response.status,
      responseTime,
      url: fullUrl,
      path: uploadEndpoint,
      publicUrl,
      sizeBytes: blob.size,
      bodyType,
      verified: true,
      availabilityTime,
      timestamp: new Date().toISOString(),
      originNote
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    if (error.name === 'AbortError') {
      return {
        status: 'timeout',
        error: 'Timeout en subida de archivo',
        responseTime,
        url: fullUrl,
        path: uploadEndpoint,
        timestamp: new Date().toISOString()
      };
    }
    return {
      status: 'error',
      error: error.message,
      responseTime,
      url: fullUrl,
      path: uploadEndpoint,
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Test de conectividad al servidor de notificaciones push
 * @returns {Promise<Object>} Resultado del test
 */
export const testPushServerConnection = async () => {
  const pushServerUrl = import.meta.env.VITE_NOTIFICATIONS_SERVER_URL;
  
  if (!pushServerUrl) {
    return {
			status: "not_configured",
			error:
				"No hay URL del servidor push configurada (VITE_NOTIFICATIONS_SERVER_URL)",
			timestamp: new Date().toISOString(),
		};
  }
  
  const startTime = Date.now();

  const endpoints = [
    { path: '/health', expectJSON: true },
    { path: '/', expectJSON: false }
  ];

  let lastError = null;
  for (const ep of endpoints) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      const attemptStart = Date.now();
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000);
        const resp = await fetch(`${pushServerUrl}${ep.path}`, {
          method: 'GET',
          cache: 'no-cache',
          signal: controller.signal
        });
        clearTimeout(timeout);
        const rt = Date.now() - attemptStart;

        // Caso éxito claro
        if (resp.ok) {
          let health = null;
            if (ep.expectJSON) {
              try {
                const ct = resp.headers.get('content-type') || '';
                if (ct.includes('application/json')) {
                  health = await resp.json();
                }
              } catch { /* ignorar parse */ }
            }
          return {
            status: 'connected',
            responseTime: rt,
            statusCode: resp.status,
            endpointTried: ep.path,
            url: pushServerUrl,
            health,
            attempts: attempt,
            timestamp: new Date().toISOString()
          };
        }

        // Si responde (aunque 404/500) consideramos reachable pero error lógico
        return {
          status: 'reachable',
          responseTime: rt,
          statusCode: resp.status,
          endpointTried: ep.path,
          url: pushServerUrl,
          error: `HTTP ${resp.status}`,
          attempts: attempt,
          timestamp: new Date().toISOString()
        };
      } catch (e) {
        lastError = e;
        // si timeout/abort reintentar una vez más (attempt 2)
        if (attempt === 2) {
          continue; // pasar al siguiente endpoint
        }
      }
    }
  }

  const totalTime = Date.now() - startTime;
  return {
    status: totalTime > 7000 ? 'timeout' : 'error',
    responseTime: totalTime,
    error: lastError ? lastError.message : 'No reachable endpoints',
    url: pushServerUrl,
    timestamp: new Date().toISOString()
  };
};

/**
 * Test de conectividad con Firebase
 * @returns {Promise<Object>} Resultado del test
 */
export const testFirebaseConnection = async () => {
  const startTime = Date.now();
  
  try {
    // Método 1: Verificar si Firebase SDK está disponible y funcionando
    if (typeof window !== 'undefined' && window.firebase) {
      try {
        const app = window.firebase.app();
        if (app && app.options && app.options.projectId) {
          const responseTime = Date.now() - startTime;
          return {
            status: 'connected',
            responseTime: responseTime,
            projectId: app.options.projectId,
            appName: app.name,
            timestamp: new Date().toISOString(),
            method: 'firebase_sdk_active'
          };
        }
      } catch (firebaseError) {
        // SDK disponible pero con error
        return {
          status: 'error',
          error: `Firebase SDK error: ${firebaseError.message}`,
          timestamp: new Date().toISOString(),
          method: 'firebase_sdk_check'
        };
      }
    }
    
    // Método 2: Verificar configuración de Firebase
    const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
    const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
    
    if (!projectId) {
      return {
        status: 'not_configured',
        error: 'No hay project ID de Firebase configurado (VITE_FIREBASE_PROJECT_ID)',
        timestamp: new Date().toISOString(),
        method: 'config_check'
      };
    }
    
    // Método 3: Test de conectividad al dominio de auth (más confiable que Firestore)
    const authUrl = authDomain || `${projectId}.firebaseapp.com`;
    const testUrl = `https://${authUrl}/__/auth/handler`;
    
    try {
      // Hacer HEAD request al handler de auth de Firebase
      await fetch(testUrl, {
        method: 'HEAD',
        mode: 'no-cors', // Evitar problemas de CORS
        cache: 'no-cache',
        signal: AbortSignal.timeout(6000)
      });
      
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'connected',
        responseTime: responseTime,
        projectId: projectId,
        authDomain: authUrl,
        timestamp: new Date().toISOString(),
        method: 'firebase_auth_domain_check',
        note: 'Conectividad a dominio de autenticación verificada'
      };
      
    } catch (authError) {
      // Si falla el auth handler, intentar con el dominio base
      console.log('Firebase auth endpoint failed, trying basic connectivity:', authError.message);
      return await testFirebaseBasicConnectivity(projectId, startTime);
    }
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    return {
      status: responseTime > 5000 ? 'timeout' : 'error',
      responseTime: responseTime,
      error: error.message,
      timestamp: new Date().toISOString(),
      method: 'general_firebase_test'
    };
  }
};

/**
 * Test básico de conectividad a Firebase (fallback)
 * @param {string} projectId - ID del proyecto de Firebase
 * @param {number} startTime - Tiempo de inicio para calcular latencia
 * @returns {Promise<Object>} Resultado del test
 */
const testFirebaseBasicConnectivity = async (projectId, startTime) => {
  try {
    // Test más básico: verificar que el dominio de Firebase existe
    const basicUrl = `https://${projectId}.firebaseapp.com/`;
    
    // Intentar hacer HEAD request para verificar conectividad
    await fetch(basicUrl, {
      method: 'HEAD', // Solo verificar headers, no descargar contenido
      mode: 'no-cors', // Evitar problemas de CORS
      cache: 'no-cache',
      signal: AbortSignal.timeout(5000)
    });
    
    const responseTime = Date.now() - startTime;
    
    return {
      status: 'connected',
      responseTime: responseTime,
      projectId: projectId,
      timestamp: new Date().toISOString(),
      method: 'firebase_basic_connectivity',
      note: 'Conectividad básica verificada (dominio existe)'
    };
    
  } catch (basicError) {
    const responseTime = Date.now() - startTime;
    
    if (basicError.name === 'AbortError') {
      return {
        status: 'timeout',
        responseTime: responseTime,
        error: 'Timeout al conectar con Firebase',
        projectId: projectId,
        timestamp: new Date().toISOString(),
        method: 'firebase_basic_connectivity'
      };
    }
    
    return {
      status: 'error',
      responseTime: responseTime,
      error: `Firebase no disponible: ${basicError.message}`,
      projectId: projectId,
      timestamp: new Date().toISOString(),
      method: 'firebase_basic_connectivity'
    };
  }
};

// === TESTS DE CAPACIDADES DEL NAVEGADOR ===

// === TESTS DE CAPACIDADES DEL NAVEGADOR ===

/**
 * Verifica la disponibilidad de localStorage
 * @returns {Object} Estado de localStorage
 */
export const testLocalStorage = () => {
  try {
    const testKey = '__localStorage_test__';
    const testValue = 'test';
    
    localStorage.setItem(testKey, testValue);
    const retrieved = localStorage.getItem(testKey);
    localStorage.removeItem(testKey);
    
    if (retrieved !== testValue) {
      throw new Error('localStorage no funciona correctamente');
    }
    
    // Calcular espacio usado
    let totalSize = 0;
    for (let key in localStorage) {
      if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
        totalSize += localStorage[key].length + key.length;
      }
    }
    
    return {
      available: true,
      working: true,
      usedSpace: totalSize,
      estimatedLimit: 5 * 1024 * 1024, // 5MB aproximado
      keyCount: localStorage.length
    };
  } catch (error) {
    return {
      available: typeof(Storage) !== "undefined",
      working: false,
      error: error.message
    };
  }
};

/**
 * Verifica la disponibilidad de service workers
 * @returns {Object} Estado de service workers
 */
export const testServiceWorker = () => {
  const isSupported = 'serviceWorker' in navigator;
  
  if (!isSupported) {
    return {
      supported: false,
      error: 'Service Workers no soportados'
    };
  }
  
  return {
    supported: true,
    registrations: navigator.serviceWorker.getRegistrations ? 'available' : 'not_available'
  };
};

/**
 * Verifica la disponibilidad de geolocalización
 * @returns {Promise<Object>} Estado de geolocalización
 */
export const testGeolocation = async () => {
  if (!navigator.geolocation) {
    return {
      supported: false,
      error: 'Geolocalización no soportada'
    };
  }
  
  try {
    // Verificar permisos
    let permissionState = 'unknown';
    if (navigator.permissions) {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      permissionState = permission.state;
    }
    
    return {
      supported: true,
      permissionState: permissionState,
      highAccuracySupported: true
    };
  } catch (error) {
    return {
      supported: true,
      permissionState: 'unknown',
      error: error.message
    };
  }
};

/**
 * Verifica la disponibilidad de notificaciones
 * @returns {Promise<Object>} Estado de notificaciones
 */
export const testNotifications = async () => {
  if (!('Notification' in window)) {
    return {
      supported: false,
      error: 'Notificaciones no soportadas'
    };
  }
  
  try {
    let permissionState = Notification.permission;
    
    return {
      supported: true,
      permission: permissionState,
      serviceWorkerSupported: 'serviceWorker' in navigator,
      pushSupported: 'PushManager' in window
    };
  } catch (error) {
    return {
      supported: true,
      error: error.message
    };
  }
};

// === PERMISOS (snapshot sin forzar prompts) ===

export const getPermissionsSnapshot = async () => {
  const snapshot = { geolocation: {}, notifications: {}, camera: {}, microphone: {}, motion: {} };
  // Geolocalización
  try {
    const supported = !!navigator.geolocation;
    let permission = 'unknown';

    if (supported) {
      if (navigator.permissions) {
        try {
          const permissionStatus = await navigator.permissions.query({ name: 'geolocation' });
          permission = permissionStatus.state;
          persistPermissionStateIfFinal(GEO_PERMISSION_KEY, GEO_PERMISSION_SESSION_KEY, permission);
        } catch {
          // Ignorar y usar valores almacenados
        }
      }

      if (permission === 'unknown') {
        const { sessionValue, storedValue } = readPermissionState(GEO_PERMISSION_KEY, GEO_PERMISSION_SESSION_KEY);
        const persisted = sessionValue || storedValue;

        if (persisted) {
          permission = persisted;
          persistPermissionStateIfFinal(GEO_PERMISSION_KEY, GEO_PERMISSION_SESSION_KEY, permission);
        } else {
          permission = 'prompt';
        }
      }
    }

    snapshot.geolocation = { supported, permission, canRequest: supported && permission !== 'granted' };
  } catch (e) {
    snapshot.geolocation = { supported: false, permission: 'error', error: e.message };
  }
  // Notificaciones
  try {
    const supported = 'Notification' in window;
    const permission = supported ? Notification.permission : 'unsupported';
    snapshot.notifications = { supported, permission, canRequest: supported && permission === 'default' };
  } catch (e) {
    snapshot.notifications = { supported: false, permission: 'error', error: e.message };
  }
  // Cámara / Micrófono
  const mediaSupported = !!(navigator.mediaDevices && navigator.mediaDevices.enumerateDevices);
  let devices = [];
  if (mediaSupported) {
    try { devices = await navigator.mediaDevices.enumerateDevices(); } catch { /* ignore */ }
  }
  const videoInputs = devices.filter(d => d.kind === 'videoinput');
  const audioInputs = devices.filter(d => d.kind === 'audioinput');
  const inferPermission = (inputs) => {
    if (!mediaSupported) return 'unsupported';
    if (inputs.length === 0) return 'unavailable';
    // Si las labels están vacías probablemente no se concedió todavía (salvo en iOS Safari que oculta)
    const anyLabel = inputs.some(d => d.label && d.label.trim().length > 0);
    return anyLabel ? 'granted' : 'prompt';
  };
  let cameraPermission = inferPermission(videoInputs);
  let micPermission = inferPermission(audioInputs);
  if (navigator.permissions) { // intentar query estándar cuando exista
    try { const camQ = await navigator.permissions.query({ name: 'camera' }); cameraPermission = camQ.state; } catch { /* ignore */ }
    try { const micQ = await navigator.permissions.query({ name: 'microphone' }); micPermission = micQ.state; } catch { /* ignore */ }
  }
  snapshot.camera = { supported: mediaSupported, devices: videoInputs.length, permission: cameraPermission, canRequest: mediaSupported && cameraPermission !== 'granted' };
  snapshot.microphone = { supported: mediaSupported, devices: audioInputs.length, permission: micPermission, canRequest: mediaSupported && micPermission !== 'granted' };
  // Motion / Orientation (iOS requiere petición explícita)
  try {
    const hasMotion = typeof DeviceMotionEvent !== 'undefined';
    const needsRequest = hasMotion && typeof DeviceMotionEvent.requestPermission === 'function';
    const { sessionValue, storedValue } = readPermissionState(MOTION_PERMISSION_KEY, MOTION_PERMISSION_SESSION_KEY);
    let permissionVal;
    let previousGrant = null;

    if (!hasMotion) {
      permissionVal = 'unsupported';
    } else if (!needsRequest) {
      permissionVal = 'granted';
      persistPermissionStateIfFinal(MOTION_PERMISSION_KEY, MOTION_PERMISSION_SESSION_KEY, permissionVal);
    } else if (sessionValue === 'granted' || sessionValue === 'granted_soft') {
      permissionVal = 'granted';
    } else if (sessionValue === 'denied') {
      permissionVal = 'denied';
    } else if (storedValue === 'denied') {
      permissionVal = 'denied';
      persistPermissionStateIfFinal(MOTION_PERMISSION_KEY, MOTION_PERMISSION_SESSION_KEY, permissionVal);
    } else if (storedValue === 'granted' || storedValue === 'granted_soft') {
      // iOS requiere interacción por sesión: aunque tengamos un grant previo persistido, necesitamos solicitar de nuevo
      previousGrant = storedValue;
      permissionVal = 'prompt';
    } else if (sessionValue || storedValue) {
      permissionVal = sessionValue || storedValue;
    } else {
      permissionVal = 'prompt';
    }

    const extra = previousGrant ? { previous: previousGrant } : {};
    snapshot.motion = { supported: hasMotion, permission: permissionVal, canRequest: needsRequest, ...extra };
  } catch (e) {
    snapshot.motion = { supported: false, permission: 'error', error: e.message };
  }
  return snapshot;
};

// === Solicitudes activas de permisos ===

export const requestGeolocationAccess = async () => {
  return new Promise(resolve => {
    if (!navigator.geolocation) return resolve({ ok: false, error: 'No soportado' });
    navigator.geolocation.getCurrentPosition(
      () => {
        persistPermissionStateIfFinal(GEO_PERMISSION_KEY, GEO_PERMISSION_SESSION_KEY, 'granted');
        resolve({ ok: true });
      },
      (err) => {
        const denied = err?.code === 1;
        if (denied) {
          persistPermissionStateIfFinal(GEO_PERMISSION_KEY, GEO_PERMISSION_SESSION_KEY, 'denied');
        }
        resolve({ ok: false, error: err.message, state: denied ? 'denied' : undefined });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
};

export const requestNotificationAccess = async () => {
  if (!('Notification' in window)) return { ok: false, error: 'No soportado' };
  try { const r = await Notification.requestPermission(); return { ok: r === 'granted', state: r }; } catch (e) { return { ok: false, error: e.message }; }
};

export const requestCameraAccess = async () => {
  if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) return { ok: false, error: 'No soportado' };
  try { const stream = await navigator.mediaDevices.getUserMedia({ video: true }); stream.getTracks().forEach(t=>t.stop()); return { ok: true }; } catch (e) { return { ok: false, error: e.name || e.message }; }
};

export const requestMicrophoneAccess = async () => {
  if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) return { ok: false, error: 'No soportado' };
  try { const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); stream.getTracks().forEach(t=>t.stop()); return { ok: true }; } catch (e) { return { ok: false, error: e.name || e.message }; }
};

export const requestMotionAccess = async () => {
  try {
    let motionState = 'granted';
    let orientationState = 'granted';

    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
      motionState = await DeviceMotionEvent.requestPermission();
    }

    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      orientationState = await DeviceOrientationEvent.requestPermission();
    }

  const states = [motionState, orientationState].map((s) => s || 'granted');
  const hasDenied = states.some((s) => s === 'denied');
  const hasPrompt = states.some((s) => s === 'prompt' || s === 'default');
  const allGranted = states.every((s) => s === 'granted' || s === 'granted_soft');
  const finalState = hasDenied ? 'denied' : (allGranted ? 'granted' : (hasPrompt ? 'prompt' : states[0]));

  persistPermissionState(MOTION_PERMISSION_KEY, MOTION_PERMISSION_SESSION_KEY, finalState);

    return { ok: finalState === 'granted', state: finalState, details: { motion: motionState, orientation: orientationState } };
  } catch (e) {
    return { ok: false, error: e.message };
  }
};

// === FUNCIÓN PRINCIPAL DE DIAGNÓSTICO ===

/**
 * Ejecuta un diagnóstico completo del sistema
 * @returns {Promise<Object>} Diagnóstico completo
 */
export const runFullDiagnostic = async () => {
  console.log('🔍 Ejecutando diagnóstico completo del sistema...');
  
  const startTime = Date.now();
  
  try {
    const [
      browserInfo,
      deviceInfo,
      networkInfo,
      internetTest,
      backendTest,
      backendUploadTest,
      pushServerTest,
      firebaseTest,
      localStorageTest,
      serviceWorkerTest,
      geolocationTest,
      notificationsTest,
      permissionsSnapshot,
      keepaliveTest
    ] = await Promise.all([
      getBrowserInfo(),
      getDeviceInfo(),
      getNetworkInfo(),
      testInternetConnection(),
      testBackendConnection(),
      testBackendUpload(),
      testPushServerConnection(),
      testFirebaseConnection(),
      testLocalStorage(),
      testServiceWorker(),
      testGeolocation(),
      testNotifications(),
      getPermissionsSnapshot(),
      (async()=>{ try { const store=window.__store; if(!store) return {status:'unknown'}; const s=store.getState(); const k=s.keepalive||{}; const now=Date.now(); const age=k.lastHeartbeat?now-k.lastHeartbeat:null; let status=k.connectionStatus||'unknown'; if(age!=null && age>120000) status='stale'; return {status,lastHeartbeat:k.lastHeartbeat||null,age,heartbeatCount:k.heartbeatCount||0}; } catch(e){ return {status:'error',error:e.message}; } })()
    ]);
    
    const executionTime = Date.now() - startTime;
    
    const result = {
      timestamp: new Date().toISOString(),
      executionTime: executionTime,
      versions: {
        app: import.meta.env.VITE_APP_VERSION || 'No definida',
        browser: `${browserInfo.name} ${browserInfo.version}`,
  os: deviceInfo.os,
  device: deviceInfo.device,
  cookieEnabled: browserInfo.cookieEnabled,
  engine: browserInfo.engine
      },
      session: {
        userAgent: browserInfo.userAgent,
        language: browserInfo.language,
        online: browserInfo.onlineStatus
      },
      connections: {
        internet: internetTest,
        backend: backendTest,
        backendUpload: backendUploadTest,
        pushServer: pushServerTest,
        firebase: firebaseTest,
        keepalive: keepaliveTest
      },
      capabilities: {
        localStorage: localStorageTest,
        serviceWorker: serviceWorkerTest,
        geolocation: geolocationTest,
        notifications: notificationsTest
      },
  permissions: permissionsSnapshot,
      device: deviceInfo,
      network: networkInfo
    };
    
    console.log('✅ Diagnóstico completo finalizado:', result);
    
    return result;
  } catch (error) {
    console.error('❌ Error en diagnóstico completo:', error);
    
    return {
      timestamp: new Date().toISOString(),
      executionTime: Date.now() - startTime,
      error: error.message,
      success: false
    };
  }
};




