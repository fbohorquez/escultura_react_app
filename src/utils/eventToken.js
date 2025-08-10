// src/utils/eventToken.js

/**
 * Genera un hash MD5 simple usando el algoritmo crypto-js
 * @param {string} input - El string a hashear
 * @returns {string} - El hash MD5 en hexadecimal
 */
const generateMD5 = (input) => {
  // Como la Web Crypto API no soporta MD5 directamente,
  // usamos una implementación simple
  return simpleMD5(input);
};

/**
 * Implementación simple de MD5
 * Basada en el algoritmo MD5 estándar
 */
const simpleMD5 = (input) => {
  // Convertir string a array de bytes
  const bytes = [];
  for (let i = 0; i < input.length; i++) {
    bytes.push(input.charCodeAt(i));
  }
  
  // Padding
  const msgLength = bytes.length;
  bytes.push(0x80);
  
  while (bytes.length % 64 !== 56) {
    bytes.push(0);
  }
  
  // Agregar longitud del mensaje en bits
  const bitLength = msgLength * 8;
  for (let i = 0; i < 8; i++) {
    bytes.push((bitLength >>> (i * 8)) & 0xFF);
  }
  
  // Valores iniciales MD5
  let h0 = 0x67452301;
  let h1 = 0xEFCDAB89;
  let h2 = 0x98BADCFE;
  let h3 = 0x10325476;
  
  // Procesar el mensaje en chunks de 512 bits (64 bytes)
  for (let chunk = 0; chunk < bytes.length; chunk += 64) {
    const w = [];
    for (let i = 0; i < 16; i++) {
      w[i] = bytes[chunk + i * 4] |
             (bytes[chunk + i * 4 + 1] << 8) |
             (bytes[chunk + i * 4 + 2] << 16) |
             (bytes[chunk + i * 4 + 3] << 24);
    }
    
    let a = h0, b = h1, c = h2, d = h3;
    
    // Constantes MD5
    const s = [
      7, 12, 17, 22,  7, 12, 17, 22,  7, 12, 17, 22,  7, 12, 17, 22,
      5,  9, 14, 20,  5,  9, 14, 20,  5,  9, 14, 20,  5,  9, 14, 20,
      4, 11, 16, 23,  4, 11, 16, 23,  4, 11, 16, 23,  4, 11, 16, 23,
      6, 10, 15, 21,  6, 10, 15, 21,  6, 10, 15, 21,  6, 10, 15, 21
    ];
    
    const K = [];
    for (let i = 0; i < 64; i++) {
      K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 4294967296);
    }
    
    // Rondas principales
    for (let i = 0; i < 64; i++) {
      let F, g;
      if (i < 16) {
        F = (b & c) | ((~b) & d);
        g = i;
      } else if (i < 32) {
        F = (d & b) | ((~d) & c);
        g = (5 * i + 1) % 16;
      } else if (i < 48) {
        F = b ^ c ^ d;
        g = (3 * i + 5) % 16;
      } else {
        F = c ^ (b | (~d));
        g = (7 * i) % 16;
      }
      
      F = (F + a + K[i] + w[g]) & 0xFFFFFFFF;
      a = d;
      d = c;
      c = b;
      b = (b + leftRotate(F, s[i])) & 0xFFFFFFFF;
    }
    
    h0 = (h0 + a) & 0xFFFFFFFF;
    h1 = (h1 + b) & 0xFFFFFFFF;
    h2 = (h2 + c) & 0xFFFFFFFF;
    h3 = (h3 + d) & 0xFFFFFFFF;
  }
  
  // Convertir a hexadecimal
  return (
    toLittleEndianHex(h0) +
    toLittleEndianHex(h1) +
    toLittleEndianHex(h2) +
    toLittleEndianHex(h3)
  );
};

const leftRotate = (value, amount) => {
  return (value << amount) | (value >>> (32 - amount));
};

const toLittleEndianHex = (value) => {
  return (
    ((value & 0xFF).toString(16).padStart(2, '0')) +
    (((value >>> 8) & 0xFF).toString(16).padStart(2, '0')) +
    (((value >>> 16) & 0xFF).toString(16).padStart(2, '0')) +
    (((value >>> 24) & 0xFF).toString(16).padStart(2, '0'))
  );
};

/**
 * Genera un token para acceso directo al evento
 * @param {string} eventId - ID del evento
 * @returns {string} - Token generado (eventId + MD5)
 */
export const generateEventToken = (eventId) => {
  const hash = generateMD5(eventId);
  return `${eventId}${hash}`;
};

/**
 * Valida un token de evento
 * @param {string} token - Token a validar
 * @returns {object|null} - {eventId, isValid} o null si el formato es inválido
 */
export const validateEventToken = (token) => {
  if (!token || typeof token !== 'string') {
    return null;
  }
  
  // El token debe tener al menos 33 caracteres (1 char eventId + 32 chars MD5)
  if (token.length < 33) {
    return null;
  }
  
  // Extraer el eventId y el hash
  // Asumimos que el eventId puede tener longitud variable
  // pero el MD5 siempre son 32 caracteres al final
  const hash = token.slice(-32);
  const eventId = token.slice(0, -32);
  
  if (!eventId) {
    return null;
  }
  
  // Validar que el hash coincida
  const expectedHash = generateMD5(eventId);
  const isValid = hash.toLowerCase() === expectedHash.toLowerCase();
  
  return {
    eventId,
    isValid
  };
};

/**
 * Extrae el parámetro event de la URL actual
 * @returns {string|null} - El valor del parámetro event o null
 */
export const getEventParamFromURL = () => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('event');
};

/**
 * Limpia el parámetro event de la URL sin recargar la página
 */
export const clearEventParamFromURL = () => {
  const url = new URL(window.location);
  url.searchParams.delete('event');
  
  // Actualizar la URL sin recargar la página
  window.history.replaceState({}, '', url.pathname + url.search + url.hash);
};
