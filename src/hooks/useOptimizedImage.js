// src/hooks/useOptimizedImage.js
import { useState, useEffect } from 'react';
import { getPreferredVersionUrl } from '../services/uploadQueue';

/**
 * Hook personalizado para cargar imágenes optimizadas con fallback
 * @param {string} baseImageUrl - URL base de la imagen
 * @param {string} preferredVersion - Versión preferida ('compressed', 'thumbnail', etc.)
 * @param {Object} options - Opciones adicionales
 * @returns {Object} - Estado de la imagen optimizada
 */
export function useOptimizedImage(baseImageUrl, preferredVersion = 'compressed', options = {}) {
  const [imageState, setImageState] = useState({
    src: null,
    isLoading: true,
    isError: false,
    version: null,
    fallbackSrc: null
  });

  const {
    enableFallback = true,
    retryCount = 1,
    onError = null,
    onLoad = null
  } = options;

  useEffect(() => {
    if (!baseImageUrl) {
      setImageState({
        src: null,
        isLoading: false,
        isError: true,
        version: null,
        fallbackSrc: null
      });
      return;
    }

    // Reiniciar estado
    setImageState(prev => ({
      ...prev,
      isLoading: true,
      isError: false
    }));

    let isCancelled = false;

    const loadImage = async () => {
      try {
        // Obtener URL de la versión preferida
        const { url: preferredUrl, version, fallbackUrl } = getPreferredVersionUrl(
          baseImageUrl, 
          preferredVersion
        );

        // Intentar cargar la versión preferida
        const success = await attemptImageLoad(preferredUrl, retryCount);
        
        if (isCancelled) return;

        if (success) {
          setImageState({
            src: preferredUrl,
            isLoading: false,
            isError: false,
            version: version,
            fallbackSrc: fallbackUrl
          });
          onLoad && onLoad(preferredUrl, version);
        } else if (enableFallback && fallbackUrl !== preferredUrl) {
          // Intentar fallback si la versión preferida falla
          const fallbackSuccess = await attemptImageLoad(fallbackUrl, retryCount);
          
          if (isCancelled) return;

          if (fallbackSuccess) {
            setImageState({
              src: fallbackUrl,
              isLoading: false,
              isError: false,
              version: 'original',
              fallbackSrc: null
            });
            onLoad && onLoad(fallbackUrl, 'original');
          } else {
            // Ambas versiones fallaron
            setImageState({
              src: null,
              isLoading: false,
              isError: true,
              version: null,
              fallbackSrc: null
            });
            onError && onError(new Error('Failed to load both preferred and fallback images'));
          }
        } else {
          // No hay fallback o falló la única opción
          setImageState({
            src: null,
            isLoading: false,
            isError: true,
            version: null,
            fallbackSrc: null
          });
          onError && onError(new Error('Failed to load image'));
        }

      } catch (error) {
        if (isCancelled) return;
        
        setImageState({
          src: null,
          isLoading: false,
          isError: true,
          version: null,
          fallbackSrc: null
        });
        onError && onError(error);
      }
    };

    loadImage();

    // Cleanup
    return () => {
      isCancelled = true;
    };

  }, [baseImageUrl, preferredVersion, enableFallback, retryCount]);

  return imageState;
}

/**
 * Intenta cargar una imagen con reintentos
 * @param {string} imageUrl - URL de la imagen
 * @param {number} maxRetries - Número máximo de reintentos
 * @returns {Promise<boolean>} - True si se cargó exitosamente
 */
async function attemptImageLoad(imageUrl, maxRetries = 1) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const success = await loadImagePromise(imageUrl);
      if (success) return true;
    } catch (error) {
      if (attempt === maxRetries) {
        console.warn(`Failed to load image after ${maxRetries + 1} attempts:`, imageUrl);
        return false;
      }
      // Esperar un poco antes del siguiente intento
      await new Promise(resolve => setTimeout(resolve, 200 * (attempt + 1)));
    }
  }
  return false;
}

/**
 * Promesa para cargar una imagen
 * @param {string} imageUrl - URL de la imagen
 * @returns {Promise<boolean>} - Promise que resuelve cuando la imagen se carga
 */
function loadImagePromise(imageUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      resolve(true);
    };
    
    img.onerror = () => {
      reject(new Error(`Failed to load image: ${imageUrl}`));
    };
    
    // Configurar CORS si es necesario
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;
  });
}

/**
 * Hook simplificado para imágenes con compresión automática
 * @param {string} baseImageUrl - URL base de la imagen
 * @returns {string|null} - URL de la imagen optimizada o null si está cargando/error
 */
export function useCompressedImage(baseImageUrl) {
  const { src, isLoading, isError } = useOptimizedImage(baseImageUrl, 'compressed');
  
  if (isLoading || isError) {
    return null;
  }
  
  return src;
}

/**
 * Hook para imágenes de equipo con compresión
 * @param {number} eventId - ID del evento
 * @param {number} teamId - ID del equipo
 * @returns {string|null} - URL de la imagen del equipo optimizada
 */
export function useTeamImage(eventId, teamId) {
  const baseUrl = `${(import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api').replace('/api', '')}/uploads/events/event_${eventId}/team_${teamId}/photo.jpeg`;
  
  return useCompressedImage(baseUrl);
}

export default {
  useOptimizedImage,
  useCompressedImage,
  useTeamImage
};
