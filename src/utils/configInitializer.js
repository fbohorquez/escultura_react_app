// src/utils/configInitializer.js

import i18n from '../i18n';
import { getUrlConfig } from './urlConfig';

const CONFIG_STORAGE_KEY = 'dynamic_config';

const resolveSupportedLanguage = (languageValue) => {
  if (typeof languageValue !== 'string') {
    return null;
  }

  const trimmedLanguage = languageValue.trim();

  if (!trimmedLanguage) {
    return null;
  }

  const normalizedLanguage = trimmedLanguage.toLowerCase();
  const availableLanguages = Object.keys(i18n.options?.resources || {});

  return (
    availableLanguages.find((lng) => lng === normalizedLanguage) ||
    availableLanguages.find((lng) => normalizedLanguage.startsWith(`${lng}-`)) ||
    null
  );
};

const normalizeConfig = (config) => {
  if (!config || typeof config !== 'object') {
    return null;
  }

  const normalizedConfig = { ...config };
  const appConfig = { ...(config.app || {}) };

  if (typeof config.language === 'string') {
    const trimmedLanguage = config.language.trim();
    if (trimmedLanguage) {
      appConfig.language = trimmedLanguage;
    }
  }

  if (typeof appConfig.language === 'string') {
    const trimmedLanguage = appConfig.language.trim();
    if (trimmedLanguage) {
      appConfig.language = trimmedLanguage;
    } else {
      delete appConfig.language;
    }
  } else if (appConfig.language !== undefined) {
    delete appConfig.language;
  }

  if (Object.keys(appConfig).length > 0) {
    normalizedConfig.app = appConfig;
  } else if ('app' in normalizedConfig) {
    delete normalizedConfig.app;
  }

  if ('language' in normalizedConfig) {
    delete normalizedConfig.language;
  }

  return normalizedConfig;
};

const applyLanguageFromConfig = (config) => {
  if (!config || typeof config !== 'object') {
    return;
  }

  const appConfig = config.app;

  if (!appConfig || typeof appConfig !== 'object') {
    return;
  }

  const matchedLanguage = resolveSupportedLanguage(appConfig.language);

  if (!matchedLanguage) {
    if (typeof appConfig.language === 'string' && appConfig.language.trim()) {
      console.warn(`Idioma configurado '${appConfig.language}' no está soportado.`);
    }
    if ('language' in appConfig) {
      const { language: _LANGUAGE, ...rest } = appConfig;
      config.app = rest;
    }
    return;
  }

  if (appConfig.language !== matchedLanguage) {
    config.app = {
      ...appConfig,
      language: matchedLanguage,
    };
  }

  if (i18n.language !== matchedLanguage) {
    i18n
      .changeLanguage(matchedLanguage)
      .catch((error) => console.warn('No se pudo aplicar el idioma configurado:', error));
  }
};

/**
 * Inicializa la configuración dinámica leyendo los parámetros de URL
 * y guardándolos en localStorage para persistencia
 */
export const initializeDynamicConfig = () => {
  try {
    // Leer configuración de URL
    const urlConfig = getUrlConfig();

    if (urlConfig && Object.keys(urlConfig).length > 0) {
      const normalizedConfig = normalizeConfig(urlConfig) || {};
      applyLanguageFromConfig(normalizedConfig);

      // Si hay configuración en URL, guardarla en localStorage
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(normalizedConfig));
      console.log('Configuración dinámica cargada desde URL:', normalizedConfig);
    } else {
      // Si no hay configuración en URL, verificar si existe en localStorage
      const storedConfig = localStorage.getItem(CONFIG_STORAGE_KEY);
      if (storedConfig) {
        let parsedConfig = null;
        try {
          parsedConfig = JSON.parse(storedConfig);
        } catch (parseError) {
          console.error('Error al parsear configuración dinámica almacenada:', parseError);
        }

        const normalizedConfig = normalizeConfig(parsedConfig);
        applyLanguageFromConfig(normalizedConfig);

        if (normalizedConfig) {
          localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(normalizedConfig));
        }

        console.log('Configuración dinámica cargada desde localStorage');
      }
    }
  } catch (error) {
    console.error('Error al inicializar configuración dinámica:', error);
  }
};

/**
 * Obtiene la configuración actual desde localStorage
 */
export const getCurrentDynamicConfig = () => {
  try {
    const storedConfig = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (!storedConfig) {
      return null;
    }

    const parsedConfig = JSON.parse(storedConfig);
    return normalizeConfig(parsedConfig);
  } catch (error) {
    console.error('Error al leer configuración dinámica:', error);
    return null;
  }
};

/**
 * Limpia la configuración dinámica del localStorage
 */
export const clearDynamicConfig = () => {
  try {
    localStorage.removeItem(CONFIG_STORAGE_KEY);
    console.log('Configuración dinámica limpiada');
  } catch (error) {
    console.error('Error al limpiar configuración dinámica:', error);
  }
};

export { resolveSupportedLanguage };
