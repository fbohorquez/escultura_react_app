// src/features/chats/chatsSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { 
  sendMessage as sendMessageToFirebase,
  subscribeToChat,
  getChatRooms 
} from "../../services/firebase";

// Thunk para enviar mensaje
export const sendMessage = createAsyncThunk(
  "chats/sendMessage",
  async ({ eventId, chatId, message, senderName, senderId, senderType }, { rejectWithValue }) => {
    try {
      await sendMessageToFirebase(eventId, chatId, {
        date: Date.now(),
        message,
        name: senderName,
        team: senderType === "admin" ? null : senderId,
        type: senderType
      });
      return { chatId, message: { date: Date.now(), message, name: senderName, team: senderId, type: senderType } };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Thunk para obtener salas de chat
export const fetchChatRooms = createAsyncThunk(
  "chats/fetchChatRooms",
  async ({ eventId, teamId, isAdmin }, { rejectWithValue }) => {
    try {
      const rooms = await getChatRooms(eventId, teamId, isAdmin);
      return rooms;
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
    sendingMessage: false
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
    clearChats(state) {
      state.rooms = [];
      state.messages = {};
      state.activeChat = null;
      state.status = "idle";
      state.error = null;
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
      });
  },
});

export const { 
  setActiveChat, 
  setChatMessages, 
  addMessageToChat, 
  setChatRooms,
  clearChats 
} = chatsSlice.actions;

export default chatsSlice.reducer;
