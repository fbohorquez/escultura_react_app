import { useState } from 'react';
import { useSelector } from 'react-redux';
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
    requestPermissionAndSubscribe,
    isLoading
  } = useNotifications();

  const { t } = useTranslation();

  const [isDismissed, setIsDismissed] = useState(false);
  const selectedTeam = useSelector((state) => state.session.selectedTeam);

  // Mostrar el banner si:
  // - Las notificaciones están soportadas
  // - No está ya suscrito
  // - Los permisos están en 'default' (nunca se preguntó) o 'granted' (permitido pero no suscrito)
  // - No fue cerrado manualmente
  // - Existe un equipo seleccionado
  const shouldShow = (
    isSupported && 
    !isSubscribed && 
    (permission === 'default' || permission === 'granted') &&
    !isDismissed &&
    !!selectedTeam
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
    <div className="notification-permission-overlay">
      <div className="notification-permission-card">
        <div className="notification-permission-icon" aria-hidden="true">🔔</div>
        <h3 className="notification-permission-title">
          {t("notifications.permission_title", "Necesitamos activar las notificaciones")}
        </h3>
        <p className="notification-permission-description">
          {t(
            "notifications.permission_description",
            "Recibirás avisos importantes del evento, recordatorios y mensajes del equipo organizador."
          )}
        </p>
        <div className="notification-permission-actions">
          <button
            className="notification-permission-primary"
            onClick={handleEnableNotifications}
            disabled={isLoading}
          >
            {isLoading ? t("notifications.permission_enabling", "Habilitando...") : t("notifications.permission_enable", "Activar notificaciones")}
          </button>
          <button
            className="notification-permission-secondary"
            onClick={handleDismiss}
            disabled={isLoading}
          >
            {t("notifications.permission_later", "Ahora no")}
          </button>
        </div>
      </div>
    </div>
  );
}

