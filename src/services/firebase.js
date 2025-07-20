import { initializeApp } from "firebase/app";
import {
	getFirestore,
	doc,
	getDoc,
	updateDoc,
	onSnapshot,
	collection,
} from "firebase/firestore";

import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit";
import {
	setEvent, // de eventSlice
	setSuspendEvent, // de eventSlice
} from "../features/event/eventSlice";

import {
	setAdmin, // de adminSlice
} from "../features/admin/adminSlice";

import {
	updateTeamData, // thunk de teamsSlice
} from "../features/teams/teamsSlice";

// Configuración de Firebase desde variables de entorno
const firebaseConfig = {
	apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
	authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
	projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
	storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
	messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
	appId: import.meta.env.VITE_FIREBASE_APP_ID,
	// Si usas otras variables opcionales puedes añadirlas aquí
};

// Inicializa Firebase y Firestore
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

/**
 * Obtiene una única vez el documento de Firestore
 * @param {string|number} eventId
 * @returns {Object|null} Datos del evento o null si no existe
 */
export const fetchInitialEvent = async (eventId) => {
	const id = "event_" + eventId.toString();
	const docRef = doc(db, "events", id);
	const snapshot = await getDoc(docRef);
	return snapshot.exists() ? snapshot.data() : null;
};

/**
 * Suscribe a actualizaciones del documento de Firestore
 * @param {string|number} eventId
 * @param {(data: object) => void} onEventUpdate
 * @returns {Function} Función para cancelar la suscripción
 */
export const subscribeToEvent = (eventId, onEventUpdate) => {
	const id = eventId.toString();
	const docRef = doc(db, "events", `event_${id}`);
	// onSnapshot devuelve la función de desuscripción
	const unsubscribe = onSnapshot(docRef, (snapshot) => {
		if (snapshot.exists()) {
			onEventUpdate(snapshot.data());
		}
	});
	return unsubscribe;
};

export const fetchInitialTeams = async (eventId, teamsInit) => {
  const eventDocRef = doc(db, "events", `event_${eventId}`);
  const teamsColRef = collection(eventDocRef, "teams");

  let teams = [];
  for (const team of teamsInit) {
    const teamDocRef = doc(teamsColRef, `team_${team.id}`);
    const snapshot = await getDoc(teamDocRef);
    if (snapshot.exists()) {
      teams.push({ id: team.id, ...snapshot.data() });
    }
  }
  return teams;
};


export const subscribeTeam = (eventId, teamId, onTeamsUpdate) => {
	const eventDocRef = doc(db, "events", `event_${eventId}`);
	const teamsColRef = collection(eventDocRef, "teams");

	const teamDocRef = doc(teamsColRef, `team_${teamId}`);

	// onSnapshot devuelve la función unsubscribe
	const unsubscribe = onSnapshot(
		teamDocRef,
		(snapshot) => {
			if (snapshot.exists()) {
				onTeamsUpdate({ id: snapshot.id, ...snapshot.data() });
			} else {
				console.log("No hay datos de equipo");
			}
		},
		(error) => {
			console.error("Error escuchando teams:", error);
		}
	);

	return unsubscribe;
};

export const subscribeAdmin = (eventId, onAdminUpdate) => {
  const eventDocRef = doc(db, "events", `event_${eventId}`);
  const adminColRef = collection(eventDocRef, "admin");
  const adminDocRef = doc(adminColRef, "admin");

  const unsubscribe = onSnapshot(
		adminDocRef,
		(snapshot) => {
			if (snapshot.exists()) {
				const adminData = {
					id: adminDocRef.id,
					...snapshot.data(),
				};
				onAdminUpdate(adminData);
			} else {
				console.log("No hay datos de admin");
			}
		},
		(error) => {
			console.error("Error escuchando admin:", error);
		}
	);

  return unsubscribe;
};

/**
 * Cancela una suscripción devuelta por subscribeToEvent
 * @param {Function} unsubscribeFn
 */
export const unsubscribe = (unsubscribeFn) => {
	if (typeof unsubscribeFn === "function") {
		unsubscribeFn();
	}
};

export const updateEvent = async (eventId, partial) => {
	const ref = doc(db, "events", `event_${eventId}`);
	await updateDoc(ref, partial);
};

export const updateAdmin = async (eventId, partial) => {
	const ref = doc(db, "events", `event_${eventId}`, "admin", "admin");
	await updateDoc(ref, partial);
};

export const updateTeam = async (eventId, teamId, partial) => {
	const ref = doc(db, "events", `event_${eventId}`, "teams", `team_${teamId}`);
	await updateDoc(ref, partial);
};





const listener = createListenerMiddleware();

// Sincronizar event
listener.startListening({
	predicate: (action, currentState, prevState) => action.type === setEvent.type, // sólo cuando cambie event completo
	effect: async (action, listenerApi) => {
		const eventId = listenerApi.getState().event.id;
		await updateEvent(eventId, action.payload);
	},
});

// Sincronizar admin
listener.startListening({
	actionCreator: setAdmin,
	effect: async (action, listenerApi) => {
		const eventId = listenerApi.getState().event.id;
		await updateAdmin(eventId, action.payload);
	},
});

// Sincronizar equipos (optimista)
listener.startListening({
	actionCreator: updateTeamData.fulfilled,
	effect: async (action, listenerApi) => {
		const eventId = listenerApi.getState().event.id;
		const { teamId, changes } = action.payload;
		await updateTeam(eventId, teamId, changes);
	},
});

// Sincronizar cambio de suspensión del evento
listener.startListening({
	actionCreator: setSuspendEvent,
	effect: async (action, listenerApi) => {
		const eventId = listenerApi.getState().event.id;
		if (eventId) {
			await updateEvent(eventId, { suspend: action.payload });
		}
	},
});

const firebaseSyncMiddleware = listener.middleware;
export { firebaseSyncMiddleware };







