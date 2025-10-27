// src/hooks/useDynamicConfig.js
import { useMemo } from 'react';
import { getCurrentDynamicConfig } from '../utils/configInitializer.js';

const DEFAULT_CONFIG = {
  header: {
    showEsculturaLogo: true, // Por defecto sí mostrar el logo
  },
  app: {
    title: 'Escultura Eventos', // Título por defecto de la aplicación
    iconUrl: '/icons/favicon.svg', // Icono por defecto de la aplicación
    manifestBlob: null, // Manifest personalizado como objeto JSON (null = usar el default)
    language: null, // Idioma forzado por configuración (null = usar el predeterminado de la app)
  },
};

/**
 * Hook personalizado para gestionar la configuración dinámica de la aplicación
 * Lee la configuración desde localStorage (previamente inicializada desde URL)
 * @returns {Object} El objeto de configuración fusionado
 */
const useDynamicConfig = () => {
  const config = useMemo(() => {
    const storedConfig = getCurrentDynamicConfig();
    
    // Combinar configuración por defecto con la almacenada
    return {
      ...DEFAULT_CONFIG,
      ...storedConfig,
      header: {
        ...DEFAULT_CONFIG.header,
        ...(storedConfig?.header || {}),
      },
      app: {
        ...DEFAULT_CONFIG.app,
        ...(storedConfig?.app || {}),
      },
    };
  }, []);

  return config;
};

export default useDynamicConfig;
