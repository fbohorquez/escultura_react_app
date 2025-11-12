// src/features/chats/chatsSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { 
  sendMessage as sendMessageToFirebase,
  getChatRooms,
  markChatAsRead as markChatAsReadInFirebase,
  getChatReadStatus
} from "../../services/firebase";
import { sendChatNotification } from "../../services/chatNotifications";

// Thunk para enviar mensaje
export const sendMessage = createAsyncThunk(
  "chats/sendMessage",
  async ({ eventId, chatId, message, senderName, senderId, senderType }, { rejectWithValue, getState }) => {
    try {
      const messageData = {
        date: Date.now(),
        message,
        name: senderName,
        team: senderType === "admin" ? null : senderId,
        type: senderType
      };
      
      // PASO 1: Enviar mensaje a Firebase (como siempre)
      await sendMessageToFirebase(eventId, chatId, messageData);
      
      // PASO 2: NUEVP Y ADICIONAL - Enviar notificación push
      // Esto NO interfiere con Firebase, es complementario
      try {
        const state = getState();
        const chatRooms = state.chats.rooms || [];
        const currentRoom = chatRooms.find(room => room.id === chatId);
        const chatName = currentRoom?.name || `Chat ${chatId}`;
        
        await sendChatNotification(
          eventId,
          chatId,
          messageData,
          {
            senderId,
            senderName,
            senderType
          },
          chatName
        );
      } catch (notificationError) {
        // Error en notificaciones NO debe afectar el chat
        console.warn('Error enviando notificación push (no crítico):', notificationError);
      }
      
      // Marcar inmediatamente como leído para el remitente
      const state = getState();
      const currentMessages = state.chats.messages[chatId] || [];
      const newMessageIndex = currentMessages.length; // El índice del nuevo mensaje
      
      return { 
        chatId, 
        message: messageData, 
        markAsReadForSender: true,
        senderMessageIndex: newMessageIndex
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Thunk para obtener salas de chat
export const fetchChatRooms = createAsyncThunk(
  "chats/fetchChatRooms",
  async ({ eventId, teamId, isAdmin, teams }, { rejectWithValue }) => {
    try {
      const rooms = await getChatRooms(eventId, teamId, isAdmin, teams);
      return rooms;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Thunk para inicializar conexiones automáticas a todas las salas
export const initializeChatConnections = createAsyncThunk(
  "chats/initializeChatConnections",
  async ({ eventId, teamId, isAdmin }, { rejectWithValue, getState }) => {
    try {
      // Obtener los equipos del estado actual
      const teams = getState().teams.items || [];
      
      // Primero obtenemos las salas de chat
      const rooms = await getChatRooms(eventId, teamId, isAdmin, teams);
      
      // Luego inicializamos las conexiones automáticas
      console.log(`[ChatSlice] Inicializando conexiones automáticas para ${rooms.length} salas`);
      
      return { rooms, eventId, teamId, isAdmin };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// ✅ OPTIMIZACIÓN: Helper function para calcular unreadCounts de manera consistente
const calculateUnreadCount = (messages, readStatus) => {
  if (!messages || messages.length === 0) return 0;
  if (!readStatus) return messages.length;
  
  return messages.filter((_, index) => !readStatus[index]).length;
};

// Thunk para marcar un chat como leído
export const markChatAsReadThunk = createAsyncThunk(
  "chats/markChatAsRead",
  async ({ eventId, chatId, userId, userType }, { rejectWithValue }) => {
    try {
      await markChatAsReadInFirebase(eventId, chatId, userId, userType);
      return { chatId, userId };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Thunk para obtener el estado de lectura de un chat
export const fetchChatReadStatus = createAsyncThunk(
  "chats/fetchChatReadStatus",
  async ({ eventId, chatId, userId }, { rejectWithValue }) => {
    try {
      const readStatus = await getChatReadStatus(eventId, chatId, userId);
      return { chatId, readStatus };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const chatsSlice = createSlice({
  name: "chats",
  initialState: {
    rooms: [], // Lista de salas de chat disponibles
    messages: {}, // Mensajes por chatId: { chatId: [messages] }
    activeChat: null, // Chat actualmente abierto
    status: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
    sendingMessage: false,
    readStatus: {}, // Estado de lectura por chatId: { chatId: { messageIndex: true/false } }
    unreadCounts: {}, // Contadores de mensajes no leídos por chatId: { chatId: number }
    connections: {
      status: "disconnected", // 'disconnected' | 'connecting' | 'connected' | 'error'
      connectedRooms: [], // Lista de IDs de salas conectadas
      lastConnectedAt: null
    }
  },
  reducers: {
    setActiveChat(state, action) {
      state.activeChat = action.payload;
    },
    setChatMessages(state, action) {
      const { chatId, messages } = action.payload;
      state.messages[chatId] = messages;
      
      // Recalcular mensajes no leídos basándose en el estado de lectura existente
      if (!state.readStatus[chatId]) {
        state.readStatus[chatId] = {};
      }
      
      // ✅ OPTIMIZACIÓN: Usar helper function para cálculo consistente
      state.unreadCounts[chatId] = calculateUnreadCount(messages, state.readStatus[chatId]);
    },
    addMessageToChat(state, action) {
      const { chatId, message } = action.payload;
      if (!state.messages[chatId]) {
        state.messages[chatId] = [];
      }
      state.messages[chatId].push(message);
      
      // Incrementar contador de no leídos
      const messageIndex = state.messages[chatId].length - 1;
      if (!state.readStatus[chatId]) {
        state.readStatus[chatId] = {};
      }
      if (!state.readStatus[chatId][messageIndex]) {
        state.unreadCounts[chatId] = (state.unreadCounts[chatId] || 0) + 1;
      }
    },
    setChatRooms(state, action) {
      state.rooms = action.payload;
      state.status = "succeeded";
    },
    // Nuevos reducers para manejar conexiones
    setConnectionStatus(state, action) {
      const { status, connectedRooms } = action.payload;
      state.connections.status = status;
      if (connectedRooms) {
        state.connections.connectedRooms = connectedRooms;
      }
      if (status === "connected") {
        state.connections.lastConnectedAt = Date.now();
      }
    },
    addConnectedRoom(state, action) {
      const roomId = action.payload;
      if (!state.connections.connectedRooms.includes(roomId)) {
        state.connections.connectedRooms.push(roomId);
      }
    },
    removeConnectedRoom(state, action) {
      const roomId = action.payload;
      state.connections.connectedRooms = state.connections.connectedRooms.filter(
        id => id !== roomId
      );
    },
    markChatAsRead(state, action) {
      const { chatId } = action.payload;
      if (state.messages[chatId]) {
        if (!state.readStatus[chatId]) {
          state.readStatus[chatId] = {};
        }
        // Marcar todos los mensajes como leídos
        state.messages[chatId].forEach((_, index) => {
          state.readStatus[chatId][index] = true;
        });
        // Resetear contador de no leídos
        state.unreadCounts[chatId] = 0;
      }
    },
    updateMessageReadStatus(state, action) {
      const { chatId, messageIndex, isRead } = action.payload;
      if (!state.readStatus[chatId]) {
        state.readStatus[chatId] = {};
      }
      state.readStatus[chatId][messageIndex] = isRead;
      
      // ✅ OPTIMIZACIÓN: Usar helper function para cálculo consistente
      if (state.messages[chatId]) {
        state.unreadCounts[chatId] = calculateUnreadCount(state.messages[chatId], state.readStatus[chatId]);
      }
    },
    clearChats(state) {
      state.rooms = [];
      state.messages = {};
      state.activeChat = null;
      state.status = "idle";
      state.error = null;
      state.readStatus = {};
      state.unreadCounts = {};
      state.connections = {
        status: "disconnected",
        connectedRooms: [],
        lastConnectedAt: null
      };
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendMessage.pending, (state) => {
        state.sendingMessage = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.sendingMessage = false;
        const { markAsReadForSender, senderMessageIndex, chatId } = action.payload;
        
        // Si es un mensaje enviado por el usuario actual, marcarlo como leído
        if (markAsReadForSender && senderMessageIndex !== undefined) {
          if (!state.readStatus[chatId]) {
            state.readStatus[chatId] = {};
          }
          state.readStatus[chatId][senderMessageIndex] = true;
          
          // ✅ OPTIMIZACIÓN: Usar helper function para cálculo consistente
          if (state.messages[chatId]) {
            state.unreadCounts[chatId] = calculateUnreadCount(state.messages[chatId], state.readStatus[chatId]);
          }
        }
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.sendingMessage = false;
        state.error = action.payload;
      })
      .addCase(fetchChatRooms.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchChatRooms.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.rooms = action.payload;
      })
      .addCase(fetchChatRooms.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      // Nuevos casos para inicialización de conexiones
      .addCase(initializeChatConnections.pending, (state) => {
        state.connections.status = "connecting";
        state.error = null;
      })
      .addCase(initializeChatConnections.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.rooms = action.payload.rooms;
        state.connections.status = "connected";
        state.connections.lastConnectedAt = Date.now();
      })
      .addCase(initializeChatConnections.rejected, (state, action) => {
        state.connections.status = "error";
        state.error = action.payload;
      })
      // Casos para marcar chat como leído
      .addCase(markChatAsReadThunk.fulfilled, (state, action) => {
        const { chatId } = action.payload;
        // Marcar todos los mensajes como leídos localmente
        if (state.messages[chatId]) {
          if (!state.readStatus[chatId]) {
            state.readStatus[chatId] = {};
          }
          state.messages[chatId].forEach((_, index) => {
            state.readStatus[chatId][index] = true;
          });
          state.unreadCounts[chatId] = 0;
        }
      })
      // Casos para obtener estado de lectura
      .addCase(fetchChatReadStatus.fulfilled, (state, action) => {
        const { chatId, readStatus } = action.payload;
        const lastReadIndex = readStatus.lastReadMessageIndex || -1;
        
        if (state.messages[chatId]) {
          if (!state.readStatus[chatId]) {
            state.readStatus[chatId] = {};
          }
          
          // Marcar mensajes como leídos hasta el último índice leído
          state.messages[chatId].forEach((_, index) => {
            state.readStatus[chatId][index] = index <= lastReadIndex;
          });
          
          // ✅ OPTIMIZACIÓN: Usar helper function para cálculo consistente
          state.unreadCounts[chatId] = calculateUnreadCount(state.messages[chatId], state.readStatus[chatId]);
        }
      });
  },
});

export const { 
  setActiveChat, 
  setChatMessages, 
  addMessageToChat, 
  setChatRooms,
  setConnectionStatus,
  addConnectedRoom,
  removeConnectedRoom,
  markChatAsRead,
  updateMessageReadStatus,
  clearChats 
} = chatsSlice.actions;

// ✅ OPTIMIZACIÓN: Selectores memoizados con createSelector para evitar re-renders innecesarios
import { createSelector } from '@reduxjs/toolkit';

/**
 * Selector base para obtener el estado de chats
 */
const selectChatsState = (state) => state.chats;

/**
 * Selector memoizado para obtener mensajes de una sala específica
 */
export const selectChatMessages = createSelector(
  [selectChatsState, (_, chatId) => chatId],
  (chatsState, chatId) => chatsState.messages[chatId] || []
);

/**
 * Selector memoizado para obtener contador de no leídos de una sala
 */
export const selectUnreadCount = createSelector(
  [selectChatsState, (_, chatId) => chatId],
  (chatsState, chatId) => chatsState.unreadCounts[chatId] || 0
);

/**
 * Selector memoizado para obtener total de mensajes no leídos
 */
export const selectTotalUnread = createSelector(
  [selectChatsState],
  (chatsState) => Object.values(chatsState.unreadCounts).reduce((sum, count) => sum + count, 0)
);

/**
 * Selector memoizado para obtener estado de lectura de una sala
 */
export const selectChatReadStatus = createSelector(
  [selectChatsState, (_, chatId) => chatId],
  (chatsState, chatId) => chatsState.readStatus[chatId] || {}
);

/**
 * Selector memoizado para obtener salas disponibles
 */
export const selectChatRooms = createSelector(
  [selectChatsState],
  (chatsState) => chatsState.rooms
);

/**
 * Selector memoizado para obtener estado de conexiones
 */
export const selectConnectionStatus = createSelector(
  [selectChatsState],
  (chatsState) => chatsState.connections
);

export default chatsSlice.reducer;
