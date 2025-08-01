// src/features/activities/activitiesSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { updateTeamData } from "../teams/teamsSlice";
import { getValorateValue } from "../../utils/activityValidation";
import { addToQueue } from "../popup/popupSlice";
import { updateTeamActivityStatus } from "../../services/firebase";

// Thunk para actualizar estado de actividad en Firebase
export const syncActivityStatus = createAsyncThunk(
	"activities/syncActivityStatus",
	async ({ eventId, teamId, isActivityActive }, { rejectWithValue }) => {
		try {
			await updateTeamActivityStatus(eventId, teamId, isActivityActive);
			return { isActivityActive };
		} catch (error) {
			return rejectWithValue(error.message);
		}
	}
);

// Thunk para terminar actividad y sincronizar con Firebase
export const finishActivityWithSync = createAsyncThunk(
	"activities/finishActivityWithSync",
	async (_, { getState, dispatch }) => {
		const state = getState();
		const event = state.event.event;
		const selectedTeam = state.session.selectedTeam;
		
		// Terminar actividad localmente
		dispatch(finishActivity());
		
		// Sincronizar estado de actividad con Firebase
		if (selectedTeam && event) {
			dispatch(syncActivityStatus({ 
				eventId: event.id, 
				teamId: selectedTeam.id, 
				isActivityActive: false 
			}));
		}
		
		return true;
	}
);

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
		
		// Calcular puntos a sumar si la actividad es exitosa y no requiere valoración manual
		let pointsToAdd = 0;
		if (success && valorateValue === 1) {
			// Si la actividad es exitosa y no requiere valoración manual, sumar puntos automáticamente
			pointsToAdd = activity.points || 0;
		}
		
		// Actualizar activities_data del equipo
		const updatedActivitiesData = team.activities_data.map(activityItem => {
			if (activityItem.id === activityId) {
				return {
					...activityItem,
					complete: true,
					complete_time: Math.floor(Date.now() / 1000),
					data: media.data || null,
					valorate: valorateValue
				};
			}
			return activityItem;
		});
		
		// Preparar cambios para Firebase
		const changes = {
			activities_data: updatedActivitiesData
		};
		
		// Si hay puntos que sumar, actualizar también los puntos del equipo
		if (pointsToAdd > 0) {
			const currentPoints = team.points || 0;
			changes.points = currentPoints + pointsToAdd;
			console.log(`✅ Sumando ${pointsToAdd} puntos al equipo ${team.name}. Total: ${changes.points}`);
		}
		
		// Actualizar Firebase usando el thunk de teams para asegurar sincronización
		await dispatch(updateTeamData({ eventId, teamId, changes })).unwrap();
		
		// Completar actividad localmente
		dispatch(completeActivity({ activityId, success, media, timeTaken }));
		
		return { activityId, success, media, timeTaken, pointsAwarded: pointsToAdd };
	}
);

// Thunk para iniciar actividad verificando suspensión del evento
export const startActivityWithSuspensionCheck = createAsyncThunk(
	"activities/startActivityWithSuspensionCheck",
	async (activity, { getState, dispatch, rejectWithValue }) => {
		const state = getState();
		const event = state.event.event;
		const selectedTeam = state.session.selectedTeam;
		
		// Verificar si el evento está suspendido
		if (event?.suspend === true) {
			// Mostrar popup de evento suspendido que no se puede cerrar
			dispatch(addToQueue({
				titulo: "SUSPENDED_EVENT", // Identificador especial para el popup
				texto: "suspend.event_suspended_message",
				array_botones: [], // Sin botones
				overlay: true,
				close_button: false, // No se puede cerrar
				layout: "center",
				claseCss: "popup-suspended-event"
			}));
			return rejectWithValue("Event is suspended");
		}
		
		// Si no está suspendido, iniciar la actividad normalmente
		dispatch(startActivity(activity));
		
		// Sincronizar estado de actividad con Firebase
		if (selectedTeam && event) {
			dispatch(syncActivityStatus({ 
				eventId: event.id, 
				teamId: selectedTeam.id, 
				isActivityActive: true 
			}));
		}
		
		return activity;
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
			state.activityTimeLeft = activity.time === 0 ? Infinity : activity.time;
			
			// Guardar en localStorage para persistencia
			localStorage.setItem('currentActivity', JSON.stringify({
				activity: activity,
				startTime: now,
				timeLeft: activity.time === 0 ? Infinity : activity.time
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
	extraReducers: (builder) => {
		builder
			.addCase(completeActivityWithSync.pending, (state) => {
				state.status = "loading";
			})
			.addCase(completeActivityWithSync.fulfilled, (state, action) => {
				state.status = "succeeded";
				if (action.payload.pointsAwarded > 0) {
					console.log(`🎉 ¡${action.payload.pointsAwarded} puntos ganados!`);
				}
			})
			.addCase(completeActivityWithSync.rejected, (state, action) => {
				state.status = "failed";
				state.error = action.error.message;
				console.error("Error completando actividad:", action.error.message);
			})
			// Casos para sincronización de estado de actividad
			.addCase(syncActivityStatus.fulfilled, (state, action) => {
				console.log("Activity status synced with Firebase:", action.payload.isActivityActive);
			})
			.addCase(syncActivityStatus.rejected, (state, action) => {
				console.error("Error syncing activity status:", action.error.message);
			})
			// Casos para terminar actividad con sincronización
			.addCase(finishActivityWithSync.fulfilled, () => {
				console.log("Activity finished and synced with Firebase");
			});
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
