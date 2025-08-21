// src/components/OptimizedImage.jsx
import React from 'react';
import { useOptimizedImage } from '../hooks/useOptimizedImage';

/**
 * Componente de imagen optimizada con compresión automática y fallback
 * @param {Object} props - Propiedades del componente
 * @param {string} props.src - URL base de la imagen
 * @param {string} props.alt - Texto alternativo
 * @param {string} props.preferredVersion - Versión preferida ('compressed', 'thumbnail')
 * @param {string} props.className - Clases CSS
 * @param {Object} props.style - Estilos inline
 * @param {React.Component} props.LoadingComponent - Componente de carga personalizado
 * @param {React.Component} props.ErrorComponent - Componente de error personalizado
 * @param {Function} props.onLoad - Callback cuando la imagen se carga
 * @param {Function} props.onError - Callback cuando hay error
 * @param {boolean} props.enableFallback - Habilitar fallback a original
 * @param {...Object} props.otherProps - Otras propiedades para el elemento img
 * @returns {React.Element} - Elemento imagen optimizada
 */
const OptimizedImage = ({
  src,
  alt = '',
  preferredVersion = 'compressed',
  className = '',
  style = {},
  LoadingComponent = null,
  ErrorComponent = null,
  onLoad = null,
  onError = null,
  enableFallback = true,
  ...otherProps
}) => {
  const { 
    src: optimizedSrc, 
    isLoading, 
    isError, 
    version 
  } = useOptimizedImage(src, preferredVersion, {
    enableFallback,
    onLoad,
    onError
  });

  // Componente de carga personalizado o spinner por defecto
  if (isLoading) {
    if (LoadingComponent) {
      return <LoadingComponent />;
    }
    
    return (
      <div 
        className={`optimized-image-loading ${className}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f0f0f0',
          color: '#666',
          minHeight: '100px',
          ...style
        }}
        aria-label={`Cargando imagen: ${alt}`}
      >
        <div className="loading-spinner" style={{
          width: '20px',
          height: '20px',
          border: '2px solid #ddd',
          borderTop: '2px solid #666',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      </div>
    );
  }

  // Componente de error personalizado o mensaje por defecto
  if (isError || !optimizedSrc) {
    if (ErrorComponent) {
      return <ErrorComponent />;
    }
    
    return (
      <div 
        className={`optimized-image-error ${className}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f8f8f8',
          color: '#999',
          border: '1px dashed #ddd',
          minHeight: '100px',
          ...style
        }}
        aria-label={`Error cargando imagen: ${alt}`}
      >
        <span>📷</span>
      </div>
    );
  }

  // Imagen optimizada cargada exitosamente
  return (
    <img
      src={optimizedSrc}
      alt={alt}
      className={`optimized-image ${className}`}
      style={style}
      data-version={version}
      loading="lazy"
      {...otherProps}
    />
  );
};

/**
 * Componente especializado para fotos de equipo
 */
export const TeamPhoto = ({ 
  eventId, 
  teamId, 
  alt = 'Foto del equipo',
  className = 'team-preview',
  ...props 
}) => {
  const baseUrl = `${(import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api').replace('/api', '')}/uploads/events/event_${eventId}/team_${teamId}/photo.jpeg`;
  
  return (
    <OptimizedImage
      src={baseUrl}
      alt={alt}
      className={className}
      preferredVersion="compressed"
      {...props}
    />
  );
};

/**
 * Componente especializado para imágenes de actividades
 */
export const ActivityImage = ({
  eventId,
  teamId,
  activityId,
  fileExtension = 'jpg',
  alt = 'Imagen de actividad',
  className = 'activity-image',
  ...props
}) => {
  const baseUrl = `${(import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api').replace('/api', '')}/uploads/events/event_${eventId}/team_${teamId}/activity_${activityId}.${fileExtension}`;
  
  return (
    <OptimizedImage
      src={baseUrl}
      alt={alt}
      className={className}
      preferredVersion="compressed"
      {...props}
    />
  );
};

// Estilos CSS inline para evitar dependencias externas
const injectStyles = () => {
  if (typeof document !== 'undefined' && !document.getElementById('optimized-image-styles')) {
    const style = document.createElement('style');
    style.id = 'optimized-image-styles';
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      .optimized-image {
        transition: opacity 0.2s ease-in-out;
      }
      
      .optimized-image-loading,
      .optimized-image-error {
        border-radius: 4px;
      }
    `;
    document.head.appendChild(style);
  }
};

// Inyectar estilos cuando se importa el componente
if (typeof window !== 'undefined') {
  injectStyles();
}

export default OptimizedImage;
