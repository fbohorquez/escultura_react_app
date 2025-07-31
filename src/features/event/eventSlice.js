import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { initEvent } from "../../services/api";
import { initTeams } from "../teams/teamsSlice";
import { initActivities } from "../activities/activitiesSlice";

import {
	fetchInitialEvent,
	updateEvent,
} from "../../services/firebase";


export const initEventRoot = createAsyncThunk(
	"event/init",
	async ({ eventId }, { dispatch, rejectWithValue }) => {
		try {
			const firebaseId = await initEvent(eventId);
			dispatch(setEventId(firebaseId));

			const initialData = await fetchInitialEvent(firebaseId);
			if (initialData) {
				dispatch(setEvent(initialData));
				dispatch(initActivities(firebaseId, initialData.activities_data));
				dispatch(initTeams(firebaseId, initialData.teams_data));
			}

			return firebaseId;
		} catch (err) {
			return rejectWithValue(err.message);
		}
	}
);

export const suspendEvent = createAsyncThunk(
	"event/suspend",
	async (_, { getState, dispatch, rejectWithValue }) => {
		try {
			const { event } = getState();
			if (!event.id) {
				throw new Error("No event ID found");
			}

			// Actualizar en Firebase
			await updateEvent(event.id, { suspend: true });
			
			// Actualizar en el store local
			dispatch(setSuspendEvent(true));

			return true;
		} catch (err) {
			return rejectWithValue(err.message);
		}
	}
);

export const reactivateEvent = createAsyncThunk(
	"event/reactivate",
	async (_, { getState, dispatch, rejectWithValue }) => {
		try {
			const { event } = getState();
			if (!event.id) {
				throw new Error("No event ID found");
			}

			// Actualizar en Firebase
			await updateEvent(event.id, { suspend: false });
			
			// Actualizar en el store local
			dispatch(setSuspendEvent(false));

			return false;
		} catch (err) {
			return rejectWithValue(err.message);
		}
	}
);

const slice = createSlice({
	name: "event",
	initialState: {
		id: null,
		event: null,
		status: "idle",
		error: null,
	},
	reducers: {
		setEventId(state, { payload }) {
			state.id = payload;
		},
		setEvent(state, { payload }) {
			state.event = payload;
		},
		setSuspendEvent(state, { payload }) {
			if (state.event) {
				state.event.suspend = payload;
			}
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(initEventRoot.pending, (state) => {
				state.status = "loading";
				state.error = null;
			})
			.addCase(initEventRoot.fulfilled, (state) => {
				state.status = "succeeded";
			})
			.addCase(initEventRoot.rejected, (state, { payload }) => {
				state.status = "failed";
				state.error = payload;
			});
	},
});

export const { setEventId, setEvent, setSuspendEvent } = slice.actions;

export default slice.reducer;