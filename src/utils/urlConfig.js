// src/utils/urlConfig.js

/**
 * Extrae y decodifica el parámetro 'config' de la URL
 * @returns {Object|null} El objeto de configuración decodificado o null si no existe
 */
export const getUrlConfig = () => {
	try {
		const urlParams = new URLSearchParams(window.location.search);
		const configParam = urlParams.get('config');
		
		if (!configParam) {
			return null;
		}

		// Decodificar desde base64
		const decodedConfig = atob(configParam);
		
		// Parsear como JSON
		const config = JSON.parse(decodedConfig);
		
		return config;
	} catch (error) {
		console.warn('Error al decodificar configuración de URL:', error);
		return null;
	}
};

/**
 * Codifica un objeto de configuración a base64 para usar en URL
 * @param {Object} config - El objeto de configuración
 * @returns {string} La cadena codificada en base64
 */
export const encodeUrlConfig = (config) => {
	try {
		const jsonString = JSON.stringify(config);
		return btoa(jsonString);
	} catch (error) {
		console.warn('Error al codificar configuración para URL:', error);
		return '';
	}
};

/**
 * Configuración por defecto de la aplicación
 */
export const DEFAULT_CONFIG = {
	header: {
		showEsculturaLogo: true,
	},
};
