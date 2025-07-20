// src/features/activities/activitiesSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { updateTeam } from "../../services/firebase";
import { getValorateValue } from "../../utils/activityValidation";

// Thunk para completar actividad y actualizar Firebase
export const completeActivityWithSync = createAsyncThunk(
	"activities/completeActivityWithSync",
	async ({ eventId, teamId, activityId, success, media, timeTaken }, { getState, dispatch }) => {
		const state = getState();
		const team = state.teams.items.find(t => t.id === teamId);
		
		if (!team) {
			throw new Error("Team not found");
		}
		
		// Encontrar la actividad en el equipo
		const activity = team.activities_data.find(a => a.id === activityId);
		if (!activity) {
			throw new Error("Activity not found in team data");
		}
		
		// Determinar el valor de valorate basado en el tipo de actividad y resultado
		const valorateValue = getValorateValue(activity, success);
		
		// Actualizar activities_data del equipo
		const updatedActivitiesData = team.activities_data.map(activityItem => {
			if (activityItem.id === activityId) {
				return {
					...activityItem,
					complete: true,
					complete_time: Math.floor(Date.now() / 1000),
					valorate: valorateValue
				};
			}
			return activityItem;
		});
		
		// Actualizar Firebase
		await updateTeam(eventId, teamId, {
			activities_data: updatedActivitiesData
		});
		
		// Completar actividad localmente
		dispatch(completeActivity({ activityId, success, media, timeTaken }));
		
		return { activityId, success, media, timeTaken };
	}
);

const activitiesSlice = createSlice({
	name: "activities",
	initialState: {
		items: [],
		status: "idle",
		error: null,
		currentActivity: null,
		isActivityActive: false,
		activityResults: [],
		completedActivities: [],
		activityStartTime: null, // Timestamp de cuando inició la actividad
		activityTimeLeft: null,  // Tiempo restante en segundos
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
		startActivity(state, action) {
			const activity = action.payload;
			const now = Date.now();
			
			state.currentActivity = activity;
			state.isActivityActive = true;
			state.activityStartTime = now;
			state.activityTimeLeft = activity.time;
			
			// Guardar en localStorage para persistencia
			localStorage.setItem('currentActivity', JSON.stringify({
				activity: activity,
				startTime: now,
				timeLeft: activity.time
			}));
		},
		endActivity(state) {
			state.currentActivity = null;
			state.isActivityActive = false;
			state.activityStartTime = null;
			state.activityTimeLeft = null;
			
			// Limpiar localStorage
			localStorage.removeItem('currentActivity');
		},
		updateActivityTime(state, action) {
			state.activityTimeLeft = action.payload;
			
			// Actualizar localStorage
			const stored = localStorage.getItem('currentActivity');
			if (stored) {
				const data = JSON.parse(stored);
				data.timeLeft = action.payload;
				localStorage.setItem('currentActivity', JSON.stringify(data));
			}
		},
		restoreActivity(state, action) {
			const { activity, startTime, timeLeft } = action.payload;
			state.currentActivity = activity;
			state.isActivityActive = true;
			state.activityStartTime = startTime;
			state.activityTimeLeft = timeLeft;
		},
		completeActivity(state, action) {
			const { activityId, success, media, timeTaken } = action.payload;
			
			// Agregar resultado
			state.activityResults.push({
				activityId,
				success,
				media,
				timeTaken,
				completedAt: new Date().toISOString(),
			});
			
			// Marcar como completada
			if (!state.completedActivities.includes(activityId)) {
				state.completedActivities.push(activityId);
			}
			
			// Actualizar el estado de la actividad en items
			const activityIndex = state.items.findIndex(item => item.id === activityId);
			if (activityIndex !== -1) {
				state.items[activityIndex].complete = true;
				state.items[activityIndex].complete_time = Math.floor(Date.now() / 1000);
			}
			
			// NO terminar actividad aquí para permitir mostrar resultados
			// La actividad se cerrará con finishActivity después de mostrar resultados
		},
		finishActivity(state) {
			// Terminar actividad después de mostrar resultados
			state.currentActivity = null;
			state.isActivityActive = false;
			state.activityStartTime = null;
			state.activityTimeLeft = null;
			
			// Limpiar localStorage
			localStorage.removeItem('currentActivity');
		},
		resetActivities(state) {
			state.activityResults = [];
			state.completedActivities = [];
			state.currentActivity = null;
			state.isActivityActive = false;
			state.activityStartTime = null;
			state.activityTimeLeft = null;
			
			// Limpiar localStorage
			localStorage.removeItem('currentActivity');
			// Resetear el estado de completado en items
			state.items.forEach(item => {
				item.complete = false;
				item.complete_time = 0;
			});
		},
	},
});

export const { 
	setActivities, 
	setActivitiesLoading, 
	setActivitiesError,
	startActivity,
	endActivity,
	updateActivityTime,
	restoreActivity,
	completeActivity,
	finishActivity,
	resetActivities
} = activitiesSlice.actions;

// Thunk para inicializar actividades
export const initActivities = (firebaseId, initialActivitiesData) => (dispatch) => {
	dispatch(setActivitiesLoading());
	dispatch(setActivities(initialActivitiesData));
};

export default activitiesSlice.reducer;
