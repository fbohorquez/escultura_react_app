// src/features/admin/adminSlice.js
import { createSlice } from "@reduxjs/toolkit";

const adminSlice = createSlice({
	name: "admin",
	initialState: {
		admin: null,
		status: "idle",
		error: null,
	},
	reducers: {
		setAdmin(state, action) {
			state.admin = action.payload;
			state.status = "succeeded";
			state.error = null;
		},
		setAdminLoading(state) {
			state.status = "loading";
			state.error = null;
		},
		setAdminError(state, action) {
			state.status = "failed";
			state.error = action.payload;
		},
	},
});

export const { setAdmin, setAdminLoading, setAdminError } = adminSlice.actions;
export default adminSlice.reducer;


