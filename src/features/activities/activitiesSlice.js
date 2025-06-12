// src/features/activities/activitiesSlice.js
import { createSlice } from "@reduxjs/toolkit";

const activitiesSlice = createSlice({
	name: "activities",
	initialState: {
		items: [],
		status: "idle",
		error: null,
	},
	reducers: {
		setActivities(state, action) {
			state.items = action.payload;
			state.status = "succeeded";
			state.error = null;
		},
		setActivitiesLoading(state) {
			state.status = "loading";
			state.error = null;
		},
		setActivitiesError(state, action) {
			state.status = "failed";
			state.error = action.payload;
		},
	},
});

export const { setActivities, setActivitiesLoading, setActivitiesError } = activitiesSlice.actions;
export default activitiesSlice.reducer;

export const initActivities = (firebaseId, initialActivitiesData) => (dispatch) => {
	dispatch(setActivitiesLoading());
	dispatch(setActivities(initialActivitiesData));
};

