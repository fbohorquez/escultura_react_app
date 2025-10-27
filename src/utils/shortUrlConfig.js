// src/utils/shortUrlConfig.js

/**
 * Utilidades para crear URLs de configuración más cortas
 * evitando problemas de longitud en navegadores
 */

// Configuraciones predefinidas cortas
const PRESET_CONFIGS = {
  'corp': {
    header: { showEsculturaLogo: false },
    app: {
      title: 'Evento Corporativo',
      iconUrl: 'https://placehold.co/32x32/blue/white?text=C'
    }
  },
  'enterprise': {
    header: { showEsculturaLogo: false },
    app: {
      title: 'App Empresarial',
      iconUrl: 'https://placehold.co/32x32/purple/white?text=E',
      manifestBlob: {
        name: 'App Empresarial',
        short_name: 'AppEmp',
        display: 'standalone',
        background_color: '#663399',
        theme_color: '#663399'
      }
    }
  },
  'custom': {
    header: { showEsculturaLogo: false },
    app: {
      title: 'Evento Personalizado',
      iconUrl: 'https://placehold.co/32x32/green/white?text=P'
    }
  }
};

/**
 * Crear URL con configuración usando preset
 * @param {string} baseUrl - URL base
 * @param {string} presetName - Nombre del preset
 * @param {Object} extraParams - Parámetros adicionales
 */
export const createPresetUrl = (baseUrl, presetName, extraParams = {}) => {
  const config = PRESET_CONFIGS[presetName];
  if (!config) {
    throw new Error(`Preset '${presetName}' no encontrado`);
  }

  const url = new URL(baseUrl);
  
  // Agregar parámetros adicionales
  Object.entries(extraParams).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  // Agregar configuración
  const configBase64 = btoa(JSON.stringify(config));
  url.searchParams.set('config', configBase64);

  return url.toString();
};

/**
 * Crear URL con configuración personalizada compacta
 * @param {string} baseUrl - URL base
 * @param {Object} config - Configuración personalizada
 * @param {Object} extraParams - Parámetros adicionales
 */
export const createCompactUrl = (baseUrl, config, extraParams = {}) => {
  const url = new URL(baseUrl);
  
  // Agregar parámetros adicionales
  Object.entries(extraParams).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  // Crear configuración compacta (solo campos necesarios)
  const compactConfig = {};
  
  if (config.header) {
    compactConfig.h = config.header;
  }
  
  if (config.app) {
    compactConfig.a = {};
    if (config.app.title) compactConfig.a.t = config.app.title;
    if (config.app.iconUrl) compactConfig.a.i = config.app.iconUrl;
    if (config.app.manifestBlob) compactConfig.a.m = config.app.manifestBlob;
  }

  const configBase64 = btoa(JSON.stringify(compactConfig));
  url.searchParams.set('config', configBase64);

  return url.toString();
};

/**
 * Lista de presets disponibles
 */
export const getAvailablePresets = () => {
  return Object.keys(PRESET_CONFIGS);
};

/**
 * Obtener configuración de un preset
 */
export const getPresetConfig = (presetName) => {
  return PRESET_CONFIGS[presetName];
};

export default {
  createPresetUrl,
  createCompactUrl,
  getAvailablePresets,
  getPresetConfig,
  PRESET_CONFIGS
};
