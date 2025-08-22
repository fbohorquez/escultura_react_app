import { useState } from 'react';
import { useNotifications } from '../../hooks/useNotifications';
import './NotificationPermissionBanner.css';
import { useTranslation } from "react-i18next";

/**
 * Banner que aparece cuando no hay permisos de notificación
 * Solicita permisos de forma amigable con explicación clara
 */
export default function NotificationPermissionBanner() {
  const {
    isSupported,
    permission,
    isSubscribed,
    canEnableNotifications,
    statusMessage,
    requestPermissionAndSubscribe,
    isLoading
  } = useNotifications();

  const { t } = useTranslation();

  const [isDismissed, setIsDismissed] = useState(false);

  // Mostrar el banner si:
  // - Las notificaciones están soportadas
  // - No está ya suscrito
  // - Los permisos están en 'default' (nunca se preguntó) o 'granted' (permitido pero no suscrito)
  // - No fue cerrado manualmente
  const shouldShow = (
    isSupported && 
    !isSubscribed && 
    (permission === 'default' || permission === 'granted') &&
    !isDismissed
  );

  if (!shouldShow) {
    return null;
  }

  const handleEnableNotifications = async () => {
    try {
      await requestPermissionAndSubscribe();
    } catch (error) {
      console.error('Error habilitando notificaciones:', error);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
  };

  return (
    <div className="notification-banner">
      <div className="notification-banner-content">
        <div className="notification-banner-icon">
          🔔
        </div>
        
        <div className="notification-banner-text">
          <h4>{t("¿Quieres recibir notificaciones?")}</h4>
          <p>
            {t("Recibirás notificaciones relacionadas con el evento y las actividades.")}
          </p>
        </div>
        
        <div className="notification-banner-actions">
          <button
            className="btn-enable-notifications"
            onClick={handleEnableNotifications}
            disabled={isLoading}
          >
            {isLoading ? 'Habilitando...' : 'Habilitar'}
          </button>
          
          <button
            className="btn-dismiss"
            onClick={handleDismiss}
            disabled={isLoading}
          >
            Ahora no
          </button>
        </div>
      </div>
      
      <button
        className="notification-banner-close"
        onClick={handleDismiss}
        aria-label="Cerrar"
      >
        ✕
      </button>
    </div>
  );
}

