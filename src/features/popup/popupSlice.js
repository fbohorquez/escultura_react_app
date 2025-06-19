// src/features/popup/popupSlice.js

import { createSlice } from "@reduxjs/toolkit";

const popupSlice = createSlice({
  name: "popup",
  initialState: {
    queue: [],
    currentPopup: null,
    isOpen: false,
  },
  reducers: {
    addToQueue: (state, action) => {
      const popupConfig = {
        id: Date.now() + Math.random(),
        titulo: action.payload.titulo || "",
        claseCss: action.payload.claseCss || "",
        texto: action.payload.texto || "",
        array_botones: action.payload.array_botones || [],
        overlay: action.payload.overlay !== undefined ? action.payload.overlay : true,
        close_button: action.payload.close_button !== undefined ? action.payload.close_button : true,
        layout: action.payload.layout || "center",
      };

      state.queue.push(popupConfig);
      
      // Si no hay popup actual, mostrar el siguiente de la cola
      if (!state.currentPopup) {
        state.currentPopup = state.queue.shift();
        state.isOpen = true;
      }
    },
    closeCurrentPopup: (state) => {
      state.currentPopup = null;
      state.isOpen = false;
      
      // Si hay más popups en la cola, mostrar el siguiente
      if (state.queue.length > 0) {
        state.currentPopup = state.queue.shift();
        state.isOpen = true;
      }
    },
    clearQueue: (state) => {
      state.queue = [];
      state.currentPopup = null;
      state.isOpen = false;
    },
  },
});

export const { addToQueue, closeCurrentPopup, clearQueue } = popupSlice.actions;
export default popupSlice.reducer;
