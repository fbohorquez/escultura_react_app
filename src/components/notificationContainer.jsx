// src/components/notificationContainer.jsx

import React from "react";
import { useSelector } from "react-redux";
import Notification from "./notification";

const NotificationContainer = () => {
  const { notifications, position } = useSelector((state) => state.notification);

  if (notifications.length === 0) {
    return null;
  }

  const getPositionClass = () => {
    switch (position) {
      case "top":
        return "notification-container-top";
      case "bottom":
        return "notification-container-bottom";
      case "center":
      default:
        return "notification-container-center";
    }
  };

  return (
    <div className={`notification-container ${getPositionClass()}`}>
      {notifications.map((notification) => (
        <Notification 
          key={notification.id} 
          notification={notification} 
        />
      ))}
    </div>
  );
};

export default NotificationContainer;
