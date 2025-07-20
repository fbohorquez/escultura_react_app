// src/features/notification/notificationSlice.js

import { createSlice } from "@reduxjs/toolkit";

const notificationSlice = createSlice({
  name: "notification",
  initialState: {
    notifications: [],
    position: "top", // top, center, bottom
  },
  reducers: {
    addNotification: (state, action) => {
      const notification = {
        id: Date.now() + Math.random(),
        title: action.payload.title || "",
        message: action.payload.message || "",
        type: action.payload.type || "info", // info, success, warning, error
        duration: action.payload.duration || 5000, // duración en ms
        position: action.payload.position || state.position,
        closable: action.payload.closable !== undefined ? action.payload.closable : true,
        clickable: action.payload.clickable !== undefined ? action.payload.clickable : false,
        onClick: action.payload.onClick || null, // callback para cuando se hace clic en la notificación
        claseCss: action.payload.claseCss || "",
        createdAt: Date.now(),
      };

      // Agregar la notificación según la posición
      if (notification.position === "bottom") {
        // Para bottom, nuevas notificaciones van arriba (al inicio del array)
        state.notifications.unshift(notification);
      } else {
        // Para top y center, nuevas notificaciones van abajo (al final del array)
        state.notifications.push(notification);
      }
    },
    removeNotification: (state, action) => {
      state.notifications = state.notifications.filter(
        notification => notification.id !== action.payload
      );
    },
    clearAllNotifications: (state) => {
      state.notifications = [];
    },
    setPosition: (state, action) => {
      state.position = action.payload;
    },
  },
});

export const { 
  addNotification, 
  removeNotification, 
  clearAllNotifications, 
  setPosition 
} = notificationSlice.actions;

export default notificationSlice.reducer;
