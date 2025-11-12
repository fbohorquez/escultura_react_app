// src/features/gadgets/gadgetsSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { sendGadget, getGadgetCooldown } from "../../services/firebase";

// Thunk para verificar si un gadget puede enviarse a un equipo específico
export const canSendGadgetToTeam = createAsyncThunk(
	"gadgets/canSendGadgetToTeam",
	async ({ eventId, fromTeamId, toTeamId }, { getState, rejectWithValue }) => {
		try {
			const state = getState();
			const teams = state.teams.items;
			const allowSameTeam = import.meta.env.VITE_GADGET_SAME_TEAM === 'true';
			const preventActivity = import.meta.env.VITE_GADGET_PREVENT_ACTIVITY === 'true';
			
			// Encontrar equipo objetivo
			const targetTeam = teams.find(team => team.id === toTeamId);
			if (!targetTeam) {
				return rejectWithValue("Equipo objetivo no encontrado");
			}
			
			// Verificar si el equipo objetivo está haciendo una actividad
			if (preventActivity && targetTeam.isActivityActive) {
				return rejectWithValue("El equipo objetivo está realizando una actividad");
			}
			
			// Verificar restricción de mismo equipo usando datos del log
			const cooldownInfo = await getCooldownInfo({ eventId, teamId: fromTeamId });
			if (!allowSameTeam && cooldownInfo.payload?.lastTargetTeam === toTeamId) {
				return rejectWithValue("No puedes enviar gadgets consecutivos al mismo equipo");
			}
			
			return { canSend: true };
		} catch (error) {
			return rejectWithValue(error.message);
		}
	}
);

// Thunk para enviar un gadget
export const sendGadgetAction = createAsyncThunk(
	"gadgets/sendGadget",
	async ({ eventId, fromTeamId, toTeamId, gadgetId }, { rejectWithValue }) => {
		try {
			const success = await sendGadget(eventId, fromTeamId, toTeamId, gadgetId);
			if (!success) {
				return rejectWithValue("No se puede enviar el gadget debido a restricciones de cooldown");
			}
			return { fromTeamId, toTeamId, gadgetId };
		} catch (error) {
			return rejectWithValue(error.message);
		}
	}
);

// Thunk para obtener información de cooldown
export const getCooldownInfo = createAsyncThunk(
	"gadgets/getCooldown",
	async ({ eventId, teamId }, { rejectWithValue }) => {
		try {
			const cooldownInfo = await getGadgetCooldown(eventId, teamId);
			return { teamId, ...cooldownInfo };
		} catch (error) {
			return rejectWithValue(error.message);
		}
	}
);

const gadgetsSlice = createSlice({
	name: "gadgets",
	initialState: {
		availableGadgets: null, // Se cargará dinámicamente con traducciones
		selectedGadget: null,
		showGadgetSelector: false,
		showTeamSelector: false,
		isDirectFlow: false, // Indica si se seleccionó un gadget directamente desde el listado
		cooldownInfo: {},
		status: "idle",
		error: null,
	},
	reducers: {
		// UI state management
		setAvailableGadgets: (state, action) => {
			state.availableGadgets = action.payload;
		},
		setSelectedGadget: (state, action) => {
			state.selectedGadget = action.payload;
		},
		setSelectedGadgetDirect: (state, action) => {
			state.selectedGadget = action.payload;
			state.isDirectFlow = true;
		},
		setShowGadgetSelector: (state, action) => {
			state.showGadgetSelector = action.payload;
			if (action.payload) state.isDirectFlow = false;
		},
		setShowTeamSelector: (state, action) => {
			state.showTeamSelector = action.payload;
		},
		resetGadgetFlow: (state) => {
			state.selectedGadget = null;
			state.showGadgetSelector = false;
			state.showTeamSelector = false;
			state.isDirectFlow = false;
			state.error = null;
		},
		clearError: (state) => {
			state.error = null;
		},
	},
	extraReducers: (builder) => {
		builder
			// Send gadget
			.addCase(sendGadgetAction.pending, (state) => {
				state.status = "loading";
				state.error = null;
			})
			.addCase(sendGadgetAction.fulfilled, (state) => {
				state.status = "succeeded";
				state.selectedGadget = null;
				state.showGadgetSelector = false;
				state.showTeamSelector = false;
			})
			.addCase(sendGadgetAction.rejected, (state, action) => {
				state.status = "failed";
				state.error = action.payload;
			})
			// Get cooldown info
			.addCase(getCooldownInfo.fulfilled, (state, action) => {
				const { teamId, ...cooldownData } = action.payload;
				state.cooldownInfo[teamId] = cooldownData;
			})
			// Can send gadget to team validation
			.addCase(canSendGadgetToTeam.rejected, (state, action) => {
				state.error = action.payload;
			});
	},
});

export const {
	setAvailableGadgets,
	setSelectedGadget,
	setSelectedGadgetDirect,
	setShowGadgetSelector,
	setShowTeamSelector,
	resetGadgetFlow,
	clearError,
} = gadgetsSlice.actions;

export default gadgetsSlice.reducer;
