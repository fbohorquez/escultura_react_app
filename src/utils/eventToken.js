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
function simpleMD5(input) {
	// --- helpers ---
	const rotl = (x, n) => ((x << n) | (x >>> (32 - n))) >>> 0;
	const toLEHex = (n) => {
		n >>>= 0;
		return (
			(n & 0xff).toString(16).padStart(2, "0") +
			((n >>> 8) & 0xff).toString(16).padStart(2, "0") +
			((n >>> 16) & 0xff).toString(16).padStart(2, "0") +
			((n >>> 24) & 0xff).toString(16).padStart(2, "0")
		);
	};
	const utf8 = new TextEncoder().encode(input); // <-- UTF-8 correcto

	// --- padding ---
	const bytes = Array.from(utf8);
	const len = bytes.length;
	bytes.push(0x80);
	while (bytes.length % 64 !== 56) bytes.push(0);
	const bitLen = BigInt(len) * 8n;
	// longitud en bits, 64-bit little endian:
	for (let i = 0n; i < 8n; i++)
		bytes.push(Number((bitLen >> (8n * i)) & 0xffn));

	// --- init ---
	let a0 = 0x67452301 >>> 0;
	let b0 = 0xefcdab89 >>> 0;
	let c0 = 0x98badcfe >>> 0;
	let d0 = 0x10325476 >>> 0;

	const s = [
		7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5,
		9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11,
		16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10,
		15, 21,
	];
	const K = Array.from(
		{ length: 64 },
		(_, i) => Math.floor(Math.abs(Math.sin(i + 1)) * 4294967296) >>> 0
	);

	// --- process ---
	for (let off = 0; off < bytes.length; off += 64) {
		const M = new Array(16);
		for (let i = 0; i < 16; i++) {
			const j = off + i * 4;
			M[i] =
				bytes[j] |
				(bytes[j + 1] << 8) |
				(bytes[j + 2] << 16) |
				(bytes[j + 3] << 24);
		}

		let A = a0,
			B = b0,
			C = c0,
			D = d0;

		for (let i = 0; i < 64; i++) {
			let F, g;
			if (i < 16) {
				F = (B & C) | (~B & D);
				g = i;
			} else if (i < 32) {
				F = (D & B) | (~D & C);
				g = (5 * i + 1) % 16;
			} else if (i < 48) {
				F = B ^ C ^ D;
				g = (3 * i + 5) % 16;
			} else {
				F = C ^ (B | ~D);
				g = (7 * i) % 16;
			}

			F = (F + A + K[i] + (M[g] >>> 0)) >>> 0;
			A = D;
			D = C;
			C = B;
			B = (B + rotl(F, s[i])) >>> 0;
		}

		a0 = (a0 + A) >>> 0;
		b0 = (b0 + B) >>> 0;
		c0 = (c0 + C) >>> 0;
		d0 = (d0 + D) >>> 0;
	}

	return toLEHex(a0) + toLEHex(b0) + toLEHex(c0) + toLEHex(d0);
}

/**
 * Genera un token para acceso directo al equipo
 * @param {string} teamId - ID del equipo
 * @returns {string} - Token generado (teamId + MD5)
 */
export const generateTeamToken = (teamId) => {
  const hash = generateMD5(teamId);
  return `${teamId}${hash}`;
};

/**
 * Valida un token de equipo
 * @param {string} token - Token a validar
 * @returns {object|null} - {teamId, isValid} o null si el formato es inválido
 */
export const validateTeamToken = (token) => {
  if (!token || typeof token !== 'string') {
    return null;
  }
  
  // El token debe tener al menos 33 caracteres (1 char teamId + 32 chars MD5)
  if (token.length < 33) {
    return null;
  }
  
  // Extraer el teamId y el hash
  // Asumimos que el teamId puede tener longitud variable
  // pero el MD5 siempre son 32 caracteres al final
  const hash = token.slice(-32);
  const teamId = token.slice(0, -32);
  
  if (!teamId) {
    return null;
  }
  
  // Validar que el hash coincida
  const expectedHash = generateMD5(teamId);
  const isValid = hash.toLowerCase() === expectedHash.toLowerCase();
  
  return {
    teamId,
    isValid
  };
};

/**
 * Extrae el parámetro team de la URL actual
 * @returns {string|null} - El valor del parámetro team o null
 */
export const getTeamParamFromURL = () => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('team');
};

/**
 * Limpia el parámetro team de la URL sin recargar la página
 */
export const clearTeamParamFromURL = () => {
  const url = new URL(window.location);
  url.searchParams.delete('team');
  
  // Actualizar la URL sin recargar la página
  window.history.replaceState({}, '', url.pathname + url.search + url.hash);
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

/**
 * Función auxiliar para generar una URL completa con tokens de evento y equipo
 * @param {string} baseUrl - URL base (ej: 'http://localhost:5173/')
 * @param {string} eventId - ID del evento
 * @param {string} teamId - ID del equipo (opcional)
 * @returns {string} - URL completa con tokens
 */
export const generateAccessURL = (baseUrl, eventId, teamId = null) => {
  const eventToken = generateEventToken(eventId);
  
  if (teamId) {
    const teamToken = generateTeamToken(teamId);
    return `${baseUrl}?event=${eventToken}&team=${teamToken}`;
  }
  
  return `${baseUrl}?event=${eventToken}`;
};

/**
 * Función de utilidad para testing - imprime tokens en consola
 * Solo para desarrollo
 */
export const debugTokens = (eventId, teamId = null) => {
  const eventToken = generateEventToken(eventId);
  console.log(`Event ID: ${eventId} -> Token: ${eventToken}`);
  
  if (teamId) {
    const teamToken = generateTeamToken(teamId);
    console.log(`Team ID: ${teamId} -> Token: ${teamToken}`);
    console.log(`Full URL: http://localhost:5173/?event=${eventToken}&team=${teamToken}`);
  } else {
    console.log(`Event URL: http://localhost:5173/?event=${eventToken}`);
  }
};

/**
 * Limpia las credenciales validadas guardadas en localStorage
 * Útil para cerrar sesión o resetear el acceso por tokens
 */
export const clearValidatedCredentials = () => {
  localStorage.removeItem("validatedEventId");
  localStorage.removeItem("validatedTeamId");
  console.log("Validated credentials cleared from localStorage");
};

/**
 * Verifica si hay credenciales validadas guardadas en localStorage
 * @returns {object} - {hasEvent: boolean, hasTeam: boolean, eventId: string|null, teamId: string|null}
 */
export const getValidatedCredentials = () => {
  const eventId = localStorage.getItem("validatedEventId");
  const teamId = localStorage.getItem("validatedTeamId");
  
  return {
    hasEvent: !!eventId,
    hasTeam: !!teamId,
    eventId,
    teamId
  };
};

