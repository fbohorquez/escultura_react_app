// src/store.js

import { configureStore, combineReducers } from "@reduxjs/toolkit";
import {
	persistStore,
	persistReducer,
	FLUSH,
	REHYDRATE,
	PAUSE,
	PERSIST,
	PURGE,
	REGISTER,
} from "redux-persist";
import storage from "redux-persist/lib/storage";
import eventsReducer from "./features/events/eventsSlice";
import eventReducer from "./features/event/eventSlice";
import teamsReducer from "./features/teams/teamsSlice";
import activitiesReducer from "./features/activities/activitiesSlice";
import adminReducer from "./features/admin/adminSlice";
import sessionReducer from "./features/session/sessionSlice";
import popupReducer from "./features/popup/popupSlice";
import notificationReducer from "./features/notification/notificationSlice";
import chatsReducer from "./features/chats/chatsSlice";
import gadgetsReducer from "./features/gadgets/gadgetsSlice";
import keepaliveReducer from "./features/keepalive/keepaliveSlice";

import { firebaseSyncMiddleware, forceKeepaliveHeartbeat } from "./services/firebase";
import { sessionClearMiddleware } from "./utils/sessionClearMiddleware";

const rootReducer = combineReducers({
  events: eventsReducer,
  event:  eventReducer,
  admin:  adminReducer,
  teams:  teamsReducer,
  activities:  activitiesReducer,
  session: sessionReducer,
  popup: popupReducer,
  notification: notificationReducer,
  chats: chatsReducer,
  gadgets: gadgetsReducer,
  keepalive: keepaliveReducer
});

const persistConfig = {
  key: 'root',
  storage,
  whitelist: [
		'event', 
		'teams', 
		'team', 
		'admin',
		'session',
		'activities',
	]
};
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Middleware para restaurar actividades persistentes
const activityRestoreMiddleware = (store) => (next) => (action) => {
	const result = next(action);
	
	// Solo ejecutar una vez cuando se hidrate el store
	if (action.type === 'persist/REHYDRATE') {
		// Verificar si hay una actividad almacenada en localStorage
		const stored = localStorage.getItem('currentActivity');
		if (stored) {
			try {
				const data = JSON.parse(stored);
				const elapsed = Math.floor((Date.now() - data.startTime) / 1000);
				
				// Si el tiempo es infinito, no calcular remaining
				if (data.timeLeft === Infinity || data.activity.time === 0) {
					store.dispatch({
						type: 'activities/restoreActivity',
						payload: {
							activity: data.activity,
							startTime: data.startTime,
							timeLeft: Infinity
						}
					});
				} else {
					const remaining = Math.max(0, data.timeLeft - elapsed);
					
					// Si aún queda tiempo, restaurar la actividad
					if (remaining > 0) {
						store.dispatch({
							type: 'activities/restoreActivity',
							payload: {
								activity: data.activity,
								startTime: data.startTime,
								timeLeft: remaining
							}
						});
					} else {
						// Si se agotó el tiempo, limpiar
						localStorage.removeItem('currentActivity');
					}
				}
			} catch (error) {
				console.error('Error restoring activity:', error);
				localStorage.removeItem('currentActivity');
			}
		}
	}
	
	return result;
};

// Middleware para forzar heartbeat cuando cambie el estado de la app
const appStateHeartbeatMiddleware = () => (next) => (action) => {
	const result = next(action);
	
	// Debug: mostrar todas las acciones que pasan por el middleware
	if (action.type && action.type.includes('keepalive')) {
		console.log('🔍 Keepalive action:', action.type, action.payload);
	}
	
	// Interceptar acciones que cambian el estado de la app
	if (action.type === 'keepalive/setAppState' || action.type === 'keepalive/clearCurrentActivity') {
		console.log('🔄 App state action intercepted:', action.type, action.payload);
		// Forzar heartbeat inmediato en el próximo tick
		setTimeout(() => {
			console.log('⚡ Forcing heartbeat due to app state change');
			forceKeepaliveHeartbeat();
		}, 0);
	}
	
	return result;
};

const store = configureStore({
  reducer: persistedReducer,
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware({
			serializableCheck: {
				ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
			},
		}).prepend(firebaseSyncMiddleware)
		  .concat(sessionClearMiddleware)
		  .concat(activityRestoreMiddleware)
		  .concat(appStateHeartbeatMiddleware),
});

// Exponer el store globalmente para acceso desde servicios
if (typeof window !== 'undefined') {
  window.__store = store;
}

export const persistor = persistStore(store);
export default store;




