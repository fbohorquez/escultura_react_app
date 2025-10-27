import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { APP_STATES } from "../../constants/appStates";

// Thunk para actualizar el keepalive
export const updateKeepalive = createAsyncThunk(
  'keepalive/update',
  async ({ teamId, sessionId }, { rejectWithValue }) => {
    try {
      const timestamp = Date.now();
      return { teamId, sessionId, timestamp };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  isOnline: navigator.onLine,
  lastHeartbeat: null,
  heartbeatCount: 0,
  teamId: null,
  sessionId: null,
  connectionStatus: 'disconnected', // 'connecting', 'connected', 'disconnected', 'error'
  reconnectAttempts: 0,
  maxReconnectAttempts: 5,
  heartbeatInterval: 30000, // 30 segundos
  teams: {}, // Estado de otros equipos { teamId: { lastSeen, status } }
  loading: false,
  error: null,
  // Nuevo estado para tracking de ubicación en la app
  appState: APP_STATES.EN_MAPA,
  currentActivity: null, // Información de la actividad actual { id, name }
  appStateTimestamp: null // Timestamp del último cambio de estado
};

const keepaliveSlice = createSlice({
  name: 'keepalive',
  initialState,
  reducers: {
    setOnlineStatus: (state, action) => {
      state.isOnline = action.payload;
    },
    setConnectionStatus: (state, action) => {
      state.connectionStatus = action.payload;
    },
    setTeamId: (state, action) => {
      state.teamId = action.payload;
    },
    setSessionId: (state, action) => {
      state.sessionId = action.payload;
    },
    updateLastHeartbeat: (state, action) => {
      state.lastHeartbeat = action.payload || Date.now();
  state.heartbeatCount += 1;
    },
    incrementReconnectAttempts: (state) => {
      state.reconnectAttempts += 1;
    },
    resetReconnectAttempts: (state) => {
      state.reconnectAttempts = 0;
    },
    updateTeamStatus: (state, action) => {
      const { teamId, lastSeen, sleepTimestamp, status, appState, currentActivity, appStateTimestamp } = action.payload;
      state.teams[teamId] = {
        lastSeen,
        sleepTimestamp,
        status,
        appState,
        currentActivity,
        appStateTimestamp
      };
    },
    removeTeam: (state, action) => {
      delete state.teams[action.payload];
    },
    clearTeams: (state) => {
      state.teams = {};
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    setHeartbeatInterval: (state, action) => {
      state.heartbeatInterval = action.payload;
    },
    setMaxReconnectAttempts: (state, action) => {
      state.maxReconnectAttempts = action.payload;
    },
    // Nuevas acciones para el estado de la aplicación
    setAppState: (state, action) => {
			const { appState, currentActivity = null } = action.payload;
			state.appState = appState;
			state.currentActivity = currentActivity;
			state.appStateTimestamp = Date.now();
		},
    clearCurrentActivity: (state) => {
      state.currentActivity = null;
      state.appState = APP_STATES.EN_MAPA;
      state.appStateTimestamp = Date.now();
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(updateKeepalive.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateKeepalive.fulfilled, (state, action) => {
        state.loading = false;
        state.lastHeartbeat = action.payload.timestamp;
        state.connectionStatus = 'connected';
        state.error = null;
      })
      .addCase(updateKeepalive.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.connectionStatus = 'error';
      });
  }
});

export const {
  setOnlineStatus,
  setConnectionStatus,
  setTeamId,
  setSessionId,
  updateLastHeartbeat,
  incrementReconnectAttempts,
  resetReconnectAttempts,
  updateTeamStatus,
  removeTeam,
  clearTeams,
  setError,
  clearError,
  setHeartbeatInterval,
  setMaxReconnectAttempts,
  setAppState,
  clearCurrentActivity
} = keepaliveSlice.actions;

export default keepaliveSlice.reducer;
