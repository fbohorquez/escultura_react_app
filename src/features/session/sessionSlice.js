// src/features/session/sessionSlice.js
import { createSlice } from "@reduxjs/toolkit";

const sessionSlice = createSlice({
	name: "session",
	initialState: {
		isAdmin: false,
		selectedTeam: null, // { id, name, ... }
		teamPhoto: null, // File or data URL
    refresh: false, // Function to refresh the session
		token: null, // Token device
	},
	reducers: {
    refreshSession(state) {
      state.refresh = !state.refresh;
    },
		setIsAdmin(state, action) {
			state.isAdmin = action.payload;
			if (action.payload) {
				state.selectedTeam = null;
				state.teamPhoto = null;
			}
		},
		setSelectedTeam(state, action) {
			state.selectedTeam = action.payload;
			state.isAdmin = false;
		},
		setTeamPhoto(state, action) {
			state.teamPhoto = action.payload;
			if (state.selectedTeam) {
				state.selectedTeam.photo = action.payload;
			}
		},
		clearSession(state) {
			state.isAdmin = false;
			state.selectedTeam = null;
			state.teamPhoto = null;
			state.token = null;
		},
		setToken(state, action){	
			state.token = action.payload;
		},
	},
});

export const generateTokenUniqueForDevice = () => {
	const randomString = Math.random().toString(36).substring(2, 15);
	const timestamp = Date.now().toString(36);
	return `${randomString}${timestamp}`;
};


export const {
	setIsAdmin,
	setSelectedTeam,
	setTeamPhoto,
	clearSession,
	setToken,
	refreshSession,
} = sessionSlice.actions;
export default sessionSlice.reducer;




