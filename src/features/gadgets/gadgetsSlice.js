// src/features/gadgets/gadgetsSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { sendGadget, getGadgetCooldown, GADGETS } from "../../services/firebase";

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
		availableGadgets: GADGETS,
		selectedGadget: null,
		showGadgetSelector: false,
		showTeamSelector: false,
		cooldownInfo: {},
		status: "idle",
		error: null,
	},
	reducers: {
		// UI state management
		setSelectedGadget: (state, action) => {
			state.selectedGadget = action.payload;
		},
		setShowGadgetSelector: (state, action) => {
			state.showGadgetSelector = action.payload;
		},
		setShowTeamSelector: (state, action) => {
			state.showTeamSelector = action.payload;
		},
		resetGadgetFlow: (state) => {
			state.selectedGadget = null;
			state.showGadgetSelector = false;
			state.showTeamSelector = false;
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
			});
	},
});

export const {
	setSelectedGadget,
	setShowGadgetSelector,
	setShowTeamSelector,
	resetGadgetFlow,
	clearError,
} = gadgetsSlice.actions;

export default gadgetsSlice.reducer;
