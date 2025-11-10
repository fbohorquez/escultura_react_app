// src/features/session/sessionSlice.js
import { createSlice } from "@reduxjs/toolkit";

/**
 * 🔒 PROTECCIÓN: Preserva actividades completadas (complete:true)
 * Una actividad marcada como complete:true NUNCA puede volver a complete:false
 */
function protectCompletedActivities(oldActivities, newActivities) {
	if (!oldActivities || !Array.isArray(oldActivities)) {
		return newActivities;
	}
	
	if (!newActivities || !Array.isArray(newActivities)) {
		return oldActivities;
	}
	
	return newActivities.map(newActivity => {
		// Buscar la misma actividad en el estado anterior
		const oldActivity = oldActivities.find(a => a.id === newActivity.id);
		
		// Si la actividad estaba completada (complete:true) en el estado anterior
		if (oldActivity && oldActivity.complete === true) {
			// Si la nueva actividad intenta cambiar a complete:false, RECHAZAR
			if (newActivity.complete === false || !newActivity.complete) {
				console.warn(`🛡️ [SESSION SLICE] Protección activada: Actividad ${newActivity.id} bloqueada (complete:true → false)`);
				
				// Preservar todos los campos del estado completado anterior
				return {
					...newActivity,
					complete: true,
					complete_time: oldActivity.complete_time || newActivity.complete_time,
					data: oldActivity.data || newActivity.data,
					valorate: oldActivity.valorate !== undefined ? oldActivity.valorate : newActivity.valorate,
					awarded_points: oldActivity.awarded_points !== undefined ? oldActivity.awarded_points : newActivity.awarded_points
				};
			}
		}
		
		return newActivity;
	});
}

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
		updateSelectedTeam(state, action) {
			if (state.selectedTeam && state.selectedTeam.id === action.payload.id) {
				console.log('✅ selectedTeam updated:', action.payload.id, 'gadget:', action.payload.gadget);
				
				const updatedTeam = { ...state.selectedTeam, ...action.payload };
				
				// 🔒 PROTEGER actividades completadas si se está actualizando activities_data
				if (action.payload.activities_data && state.selectedTeam.activities_data) {
					updatedTeam.activities_data = protectCompletedActivities(
						state.selectedTeam.activities_data,
						action.payload.activities_data
					);
				}
				
				state.selectedTeam = updatedTeam;
			}
		},
		updateSelectedTeamActivityLocal(state, action) {
			// Actualizar una actividad específica del selectedTeam localmente
			const { activityId, updates } = action.payload;
			
			if (state.selectedTeam && state.selectedTeam.activities_data) {
				const activityIndex = state.selectedTeam.activities_data.findIndex(a => a.id === activityId);
				if (activityIndex !== -1) {
					state.selectedTeam.activities_data[activityIndex] = {
						...state.selectedTeam.activities_data[activityIndex],
						...updates
					};
					console.log(`🔄 Local update selectedTeam: activity ${activityId}`, updates);
				}
			}
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
	updateSelectedTeam,
	updateSelectedTeamActivityLocal,
	setTeamPhoto,
	clearSession,
	setToken,
	refreshSession,
} = sessionSlice.actions;
export default sessionSlice.reducer;




