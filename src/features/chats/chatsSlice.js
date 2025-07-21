// src/features/chats/chatsSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { 
  sendMessage as sendMessageToFirebase,
  getChatRooms 
} from "../../services/firebase";

// Thunk para enviar mensaje
export const sendMessage = createAsyncThunk(
  "chats/sendMessage",
  async ({ eventId, chatId, message, senderName, senderId, senderType }, { rejectWithValue }) => {
    try {
      const messageData = {
        date: Date.now(),
        message,
        name: senderName,
        team: senderType === "admin" ? null : senderId,
        type: senderType
      };
      
      await sendMessageToFirebase(eventId, chatId, messageData);
      return { chatId, message: messageData };
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
  async ({ eventId, teamId, isAdmin }, { rejectWithValue }) => {
    try {
      // Primero obtenemos las salas de chat
      const rooms = await getChatRooms(eventId, teamId, isAdmin);
      
      // Luego inicializamos las conexiones automáticas
      console.log(`[ChatSlice] Inicializando conexiones automáticas para ${rooms.length} salas`);
      
      return { rooms, eventId, teamId, isAdmin };
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
    },
    addMessageToChat(state, action) {
      const { chatId, message } = action.payload;
      if (!state.messages[chatId]) {
        state.messages[chatId] = [];
      }
      state.messages[chatId].push(message);
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
    clearChats(state) {
      state.rooms = [];
      state.messages = {};
      state.activeChat = null;
      state.status = "idle";
      state.error = null;
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
      .addCase(sendMessage.fulfilled, (state) => {
        state.sendingMessage = false;
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
  clearChats 
} = chatsSlice.actions;

export default chatsSlice.reducer;
