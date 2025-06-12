import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getEvents } from "../../services/api";

// Thunk para obtener eventos
export const fetchEvents = createAsyncThunk(
	"events/fetchEvents",
	async (_, { rejectWithValue }) => {
		try {
			const events = await getEvents();
			return events;
		} catch (error) {
			return rejectWithValue(error.message);
		}
	}
);

const eventsSlice = createSlice({
	name: "events",
	initialState: {
		items: [], // Array de eventos
		status: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
		error: null, // Mensaje de error
	},
	reducers: {},
	extraReducers: (builder) => {
		builder
			.addCase(fetchEvents.pending, (state) => {
				state.status = "loading";
				state.error = null;
			})
			.addCase(fetchEvents.fulfilled, (state, action) => {
				state.status = "succeeded";
				state.items = action.payload;
			})
			.addCase(fetchEvents.rejected, (state, action) => {
				state.status = "failed";
				state.error = action.payload;
			});
	},
});

export default eventsSlice.reducer;
