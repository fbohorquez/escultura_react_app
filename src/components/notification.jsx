// src/components/notification.jsx

import React, { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { useNotification } from "../hooks/useNotification";
import closeIcon from "../assets/close-button.svg";

const Notification = ({ notification }) => {
  const { hideNotification } = useNotification();
  const timeoutRef = useRef(null);

  useEffect(() => {
    // Configurar el temporizador para auto-cierre
    if (notification.duration > 0) {
      timeoutRef.current = setTimeout(() => {
        hideNotification(notification.id);
      }, notification.duration);
    }

    // Limpiar el temporizador al desmontar o cambiar la notificación
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [notification.id, notification.duration, hideNotification]);

  const handleClose = () => {
    hideNotification(notification.id);
  };

  const handleClick = () => {
    if (notification.clickable && notification.onClick && typeof notification.onClick === 'function') {
      notification.onClick(notification);
    }
  };

  const handleMouseEnter = () => {
    // Pausar el temporizador cuando el usuario pasa el cursor sobre la notificación
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  const handleMouseLeave = () => {
    // Reanudar el temporizador cuando el usuario quita el cursor
    if (notification.duration > 0) {
      const elapsed = Date.now() - notification.createdAt;
      const remaining = notification.duration - elapsed;
      
      if (remaining > 0) {
        timeoutRef.current = setTimeout(() => {
          hideNotification(notification.id);
        }, remaining);
      } else {
        hideNotification(notification.id);
      }
    }
  };

  const getTypeIcon = () => {
    switch (notification.type) {
      case "success":
        return "✅";
      case "error":
        return "❌";
      case "warning":
        return "⚠️";
      case "info":
      default:
        return "ℹ️";
    }
  };

  return (
    <div
      className={`notification notification-${notification.type} ${notification.clickable ? 'notification-clickable' : ''} ${notification.claseCss}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      style={{ cursor: notification.clickable ? 'pointer' : 'default' }}
    >
      <div className="notification-content">
        <div className="notification-icon">
          {getTypeIcon()}
        </div>
        
        <div className="notification-body">
          {notification.title && (
            <div className="notification-title">
              {notification.title}
            </div>
          )}
          {notification.message && (
            <div className="notification-message">
              {notification.message}
            </div>
          )}
        </div>
        
        {notification.closable && (
          <button
            className="notification-close-button"
            onClick={handleClose}
            aria-label="Cerrar notificación"
          >
            <img src={closeIcon} alt="Cerrar" />
          </button>
        )}
      </div>
      
      {notification.duration > 0 && (
        <div className="notification-progress">
          <div 
            className="notification-progress-bar"
            style={{
              animationDuration: `${notification.duration}ms`,
              animationPlayState: 'running'
            }}
          />
        </div>
      )}
    </div>
  );
};

Notification.propTypes = {
  notification: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title: PropTypes.string,
    message: PropTypes.string,
    type: PropTypes.oneOf(["info", "success", "warning", "error"]),
    duration: PropTypes.number,
    closable: PropTypes.bool,
    clickable: PropTypes.bool,
    onClick: PropTypes.func,
    claseCss: PropTypes.string,
    createdAt: PropTypes.number,
  }).isRequired,
};

export default Notification;
