// src/hooks/useNotification.js

import { useDispatch } from "react-redux";
import { 
  addNotification, 
  removeNotification, 
  clearAllNotifications, 
  setPosition 
} from "../features/notification/notificationSlice";

export const useNotification = () => {
  const dispatch = useDispatch();

  const showNotification = (config) => {
    dispatch(addNotification(config));
  };

  const hideNotification = (id) => {
    dispatch(removeNotification(id));
  };

  const clearNotifications = () => {
    dispatch(clearAllNotifications());
  };

  const setNotificationPosition = (position) => {
    dispatch(setPosition(position));
  };

  // Funciones de conveniencia para diferentes tipos de notificaciones
  const showSuccess = (title, message, options = {}) => {
    showNotification({
      title,
      message,
      type: "success",
      ...options
    });
  };

  const showError = (title, message, options = {}) => {
    showNotification({
      title,
      message,
      type: "error",
      duration: 8000, // Error notifications last longer
      ...options
    });
  };

  const showWarning = (title, message, options = {}) => {
    showNotification({
      title,
      message,
      type: "warning",
      duration: 6000,
      ...options
    });
  };

  const showInfo = (title, message, options = {}) => {
    showNotification({
      title,
      message,
      type: "info",
      ...options
    });
  };

  // Función de conveniencia para notificaciones clickables
  const showClickableNotification = (title, message, onClickHandler, options = {}) => {
    showNotification({
      title,
      message,
      clickable: true,
      onClick: onClickHandler,
      ...options
    });
  };

  return {
    showNotification,
    hideNotification,
    clearNotifications,
    setNotificationPosition,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showClickableNotification,
  };
};
