// src/hooks/useAppConfig.js
import { useEffect } from 'react';
import i18n from '../i18n';
import { resolveSupportedLanguage } from '../utils/configInitializer';
import useDynamicConfig from './useDynamicConfig';

/**
 * Hook que aplica la configuración dinámica de la aplicación
 * Nota: El icono y manifest se manejan en el index.html para mejor compatibilidad
 */
const useAppConfig = () => {
  const config = useDynamicConfig();

  useEffect(() => {
    // Aplicar título de la aplicación (por si cambia después de la carga inicial)
    if (config.app.title) {
      document.title = config.app.title;
    }
  }, [config.app.title]);

  useEffect(() => {
    const languageValue = config.app.language;
    const matchedLanguage = resolveSupportedLanguage(languageValue);

    if (!matchedLanguage) {
      if (typeof languageValue === 'string' && languageValue.trim()) {
        console.warn(`Idioma configurado '${languageValue}' no está soportado.`);
      }
      return;
    }

    if (i18n.language !== matchedLanguage) {
      i18n
        .changeLanguage(matchedLanguage)
        .catch((error) => console.warn('No se pudo aplicar el idioma configurado:', error));
    }
  }, [config.app.language]);

  return config;
};

export default useAppConfig;
