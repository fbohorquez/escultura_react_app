import { useNotifications } from '../../hooks/useNotifications';
import './NotificationSettings.css';

/**
 * Componente para configurar preferencias de notificación
 * Permite activar/desactivar notificaciones y ver estado
 */
export default function NotificationSettings() {
  const {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    error,
    statusMessage,
    toggleSubscription,
    clearError,
    canEnableNotifications
  } = useNotifications();

  // No mostrar si no hay soporte
  if (!isSupported) {
    return (
      <div className="notification-settings">
        <div className="notification-status unsupported">
          <span className="status-icon">❌</span>
          <span>Las notificaciones no están disponibles en este navegador</span>
        </div>
      </div>
    );
  }

  // Determinar estado visual
  const getStatusInfo = () => {
    if (permission === 'denied') {
      return {
        icon: '🔕',
        text: 'Permisos denegados',
        className: 'denied',
        showButton: false
      };
    }
    
    if (isSubscribed) {
      return {
        icon: '🔔',
        text: 'Notificaciones activas',
        className: 'active',
        showButton: true,
        buttonText: 'Desactivar'
      };
    }
    
    if (canEnableNotifications) {
      return {
        icon: '🔕',
        text: 'Notificaciones desactivadas',
        className: 'inactive',
        showButton: true,
        buttonText: 'Activar'
      };
    }
    
    return {
      icon: '⚠️',
      text: 'No disponible',
      className: 'unavailable',
      showButton: false
    };
  };

  const statusInfo = getStatusInfo();

  const handleToggle = async () => {
    if (error) {
      clearError();
    }
    
    try {
      await toggleSubscription();
    } catch (err) {
      // Error ya manejado por el hook
      console.error('Error en toggle:', err);
    }
  };

  return (
    <div className="notification-settings">
      <div className="notification-header">
        <h3>Notificaciones Push</h3>
        <p>Recibe alertas de nuevos mensajes</p>
      </div>
      
      <div className={`notification-status ${statusInfo.className}`}>
        <div className="status-info">
          <span className="status-icon">{statusInfo.icon}</span>
          <div className="status-text">
            <strong>{statusInfo.text}</strong>
            <p>{statusMessage}</p>
          </div>
        </div>
        
        {statusInfo.showButton && (
          <button
            className={`toggle-btn ${isSubscribed ? 'active' : 'inactive'}`}
            onClick={handleToggle}
            disabled={isLoading}
          >
            {isLoading ? '...' : statusInfo.buttonText}
          </button>
        )}
      </div>
      
      {error && (
        <div className="notification-error">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
          <button className="error-close" onClick={clearError}>✕</button>
        </div>
      )}
      
      {permission === 'denied' && (
        <div className="help-text">
          <p>Para habilitar las notificaciones:</p>
          <ol>
            <li>Haz clic en el icono de candado en la barra de direcciones</li>
            <li>Cambia los permisos de notificaciones a "Permitir"</li>
            <li>Recarga la página</li>
          </ol>
        </div>
      )}
    </div>
  );
}
