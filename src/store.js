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

import { firebaseSyncMiddleware } from "./services/firebase";

const rootReducer = combineReducers({
  events: eventsReducer,
  event:  eventReducer,
  admin:  adminReducer,
  teams:  teamsReducer,
  activities:  activitiesReducer,
  session: sessionReducer,
  popup: popupReducer
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
	]
};
const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = configureStore({
  reducer: persistedReducer,
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware({
			serializableCheck: {
				ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
			},
		}).prepend(firebaseSyncMiddleware),
});

export const persistor = persistStore(store);
export default store;




