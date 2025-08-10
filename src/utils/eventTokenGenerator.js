// src/utils/eventTokenGenerator.js

import { generateEventToken, validateEventToken } from './eventToken';

/**
 * Utilidades para generar y validar tokens de eventos desde la consola del navegador
 * Estas funciones se exponen globalmente para uso de administradores
 */

/**
 * Genera un token para un evento específico
 * Uso: window.generateEventToken('evento123')
 */
window.generateEventToken = (eventId) => {
  if (!eventId) {
    console.error('generateEventToken: Se requiere un eventId');
    return null;
  }
  
  const token = generateEventToken(eventId);
  const url = `${window.location.origin}/?event=${token}`;
  
  console.log('Token generado:', token);
  console.log('URL de acceso directo:', url);
  console.log('Para copiar la URL:');
  console.log(`%c${url}`, 'font-weight: bold; font-size: 14px; color: #007bff;');
  
  // Intentar copiar al portapapeles si es posible
  if (navigator.clipboard) {
    navigator.clipboard.writeText(url).then(() => {
      console.log('✅ URL copiada al portapapeles');
    }).catch(() => {
      console.log('❌ No se pudo copiar al portapapeles automáticamente');
    });
  }
  
  return {
    eventId,
    token,
    url
  };
};

/**
 * Valida un token de evento
 * Uso: window.validateEventToken('evento123abc123def456...')
 */
window.validateEventToken = (token) => {
  if (!token) {
    console.error('validateEventToken: Se requiere un token');
    return null;
  }
  
  const validation = validateEventToken(token);
  
  if (validation && validation.isValid) {
    console.log('✅ Token válido');
    console.log('EventId:', validation.eventId);
  } else {
    console.log('❌ Token inválido');
  }
  
  return validation;
};

/**
 * Muestra ayuda sobre las utilidades disponibles
 * Uso: window.eventTokenHelp()
 */
window.eventTokenHelp = () => {
  console.log(`
🔐 UTILIDADES DE TOKEN DE EVENTO

📝 Generar token para un evento:
   window.generateEventToken('ID_DEL_EVENTO')
   
   Ejemplo: window.generateEventToken('evento123')
   
🔍 Validar un token:
   window.validateEventToken('TOKEN_COMPLETO')
   
   Ejemplo: window.validateEventToken('evento123abc123def456...')

📋 El token generado incluye:
   - ID del evento
   - Hash MD5 del ID del evento
   - Se genera una URL completa de acceso directo

🌐 URL de acceso directo:
   ${window.location.origin}/?event=TOKEN
   
   Cuando un usuario accede con esta URL:
   - Se valida el token automáticamente
   - Se redirige a la página de selección de equipo
   - Se limpia el parámetro de la URL
   - Opcionalmente se limpia la sesión (configurado en .env)

⚙️ Configuración en .env:
   VITE_EVENT_ACCESS_CLEAR_SESSION=true  # Limpia sesión al acceder
   VITE_EVENT_ACCESS_CLEAR_SESSION=false # Mantiene sesión existente
  `);
};

// Mostrar ayuda al cargar
console.log('🔐 Utilidades de token de evento cargadas. Usa window.eventTokenHelp() para más información.');

export {
  // Re-exportar las funciones principales para uso en otros módulos
  generateEventToken,
  validateEventToken
};
