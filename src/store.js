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

import { firebaseSyncMiddleware } from "./services/firebase";

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
  gadgets: gadgetsReducer
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
			} catch (error) {
				console.error('Error restoring activity:', error);
				localStorage.removeItem('currentActivity');
			}
		}
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
		}).prepend(firebaseSyncMiddleware).concat(activityRestoreMiddleware),
});

export const persistor = persistStore(store);
export default store;




