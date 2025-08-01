import { initializeApp } from "firebase/app";
import {
	getFirestore,
	doc,
	getDoc,
	updateDoc,
	setDoc,
	onSnapshot,
	collection,
	arrayUnion,
} from "firebase/firestore";

import { createListenerMiddleware } from "@reduxjs/toolkit";
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

/**
 * Actualiza el estado de actividad activa para un equipo
 * @param {string|number} eventId
 * @param {string|number} teamId
 * @param {boolean} isActivityActive
 */
export const updateTeamActivityStatus = async (eventId, teamId, isActivityActive) => {
	const teamRef = doc(db, "events", `event_${eventId}`, "teams", `team_${teamId}`);
	
	try {
		await updateDoc(teamRef, {
			isActivityActive: isActivityActive
		});
		console.log(`Team ${teamId} activity status updated: ${isActivityActive}`);
	} catch (error) {
		console.error("Error updating team activity status:", error);
		throw error;
	}
};





const listener = createListenerMiddleware();

// Sincronizar event
listener.startListening({
	predicate: (action) => action.type === setEvent.type, // sólo cuando cambie event completo
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

// === FUNCIONES DE CHAT ===

/**
 * Envía un mensaje a un chat específico
 * @param {string|number} eventId
 * @param {string} chatId
 * @param {Object} message
 */
export const sendMessage = async (eventId, chatId, message) => {
	const chatRef = doc(db, "events", `event_${eventId}`, "chats", chatId);
	
	try {
		const chatDoc = await getDoc(chatRef);
		
		if (chatDoc.exists()) {
			// Si el chat existe, agregar el mensaje al array
			await updateDoc(chatRef, {
				messages: arrayUnion(message)
			});
		} else {
			// Si no existe, crear el chat con el primer mensaje usando setDoc
			await setDoc(chatRef, {
				messages: [message]
			});
		}
	} catch (error) {
		console.error("Error sending message:", error);
		throw error;
	}
};

/**
 * Suscribirse a los mensajes de un chat específico
 * @param {string|number} eventId
 * @param {string} chatId
 * @param {Function} callback
 * @returns {Function} Función para cancelar la suscripción
 */
export const subscribeToChat = (eventId, chatId, callback) => {
	const chatRef = doc(db, "events", `event_${eventId}`, "chats", chatId);
	return onSnapshot(chatRef, (doc) => {
		if (doc.exists()) {
			const data = doc.data();
			callback(data.messages || []);
		} else {
			callback([]);
		}
	});
};

/**
 * Obtiene las salas de chat disponibles según el tipo de usuario
 * @param {string|number} eventId
 * @param {string|number} teamId
 * @param {boolean} isAdmin
 * @param {Array} teams - Array de equipos del evento
 * @returns {Array} Lista de salas de chat
 */
export const getChatRooms = async (eventId, teamId, isAdmin, teams = []) => {
	const rooms = [];
	
	console.log('getChatRooms called with:', { eventId, teamId, isAdmin, teams });
	
	if (isAdmin) {
		// El admin ve todos los chats admin_* y el grupo
		console.log('Admin getting chat rooms, teams:', teams);
		
		// Agregar sala de grupo
		rooms.push({
			id: "group",
			name: "Grupo",
			type: "group",
			description: "Chat grupal del evento"
		});
		
		// Agregar salas admin con cada equipo que tenga device asignado
		teams.forEach(team => {
			if (team.device && team.device !== "") {
				rooms.push({
					id: `admin_${team.id}`,
					name: team.name,
					type: "admin",
					description: `Chat privado con ${team.name}`
				});
			}
		});
	} else {
		// Los equipos ven: grupo, su chat con admin, y chats con otros equipos
		console.log('Team getting chat rooms, teamId:', teamId, 'teams:', teams);
		
		// Agregar sala de grupo
		rooms.push({
			id: "group",
			name: "Grupo",
			type: "group",
			description: "Chat grupal del evento"
		});
		
		// Agregar chat con administrador
		rooms.push({
			id: `admin_${teamId}`,
			name: "Organizador",
			type: "admin",
			description: "Chat privado con el organizador"
		});
		
		// Filtrar otros equipos que tengan device asignado y no sean el equipo actual
		const otherTeams = teams.filter(team => 
			team.id !== parseInt(teamId) && 
			team.device && 
			team.device !== ""
		);
		
		console.log('Other teams for chat:', otherTeams);
		
		otherTeams.forEach(team => {
			// Crear ID consistente para el chat (menor ID primero)
			const chatId = parseInt(teamId) < team.id 
				? `team_${teamId}_${team.id}` 
				: `team_${team.id}_${teamId}`;
			
			rooms.push({
				id: chatId,
				name: team.name,
				type: "team",
				description: `Chat con ${team.name}`
			});
		});
	}
	
	console.log('Final chat rooms:', rooms);
	return rooms;
};

// === FUNCIONES DE GADGETS ===

/**
 * Definición de gadgets disponibles en el sistema
 */
export const GADGETS = {
	rotate_screen: {
		id: "rotate_screen",
		name: "Rotar Pantalla",
		description: "Rota la pantalla del equipo objetivo",
		icon: "🔄",
		cooldownMinutes: 5
	},
	susto: {
		id: "susto",
		name: "Susto",
		description: "Provoca un efecto de susto en el equipo objetivo",
		icon: "😱",
		cooldownMinutes: 10
	},
	broken_glass: {
		id: "broken_glass",
		name: "Cristal Roto",
		description: "Bloquea la interfaz con un efecto de cristal roto",
		icon: "🔨",
		cooldownMinutes: 8
	},
	hearts: {
		id: "hearts",
		name: "Lluvia de Corazones",
		description: "Muestra corazones flotando por la pantalla",
		icon: "💕",
		cooldownMinutes: 6
	},
	kiss: {
		id: "kiss",
		name: "Beso",
		description: "Muestra un beso gigante en la pantalla",
		icon: "💋",
		cooldownMinutes: 5
	}
};

/**
 * Envía un gadget a un equipo específico
 * @param {string|number} eventId
 * @param {string|number} fromTeamId - ID del equipo que envía el gadget
 * @param {string|number} toTeamId - ID del equipo que recibe el gadget
 * @param {string} gadgetId - ID del gadget a enviar
 * @returns {Promise<boolean>} true si se envió correctamente, false si hay restricciones
 */
export const sendGadget = async (eventId, fromTeamId, toTeamId, gadgetId) => {
	const gadgetLogRef = doc(db, "events", `event_${eventId}`, "gadget_log", `log_${fromTeamId}`);
	const targetTeamRef = doc(db, "events", `event_${eventId}`, "teams", `team_${toTeamId}`);
	
	try {
		// Los administradores pueden enviar gadgets sin restricciones
		const isAdmin = fromTeamId === "admin";
		
		if (!isAdmin) {
			// Obtener configuración de los parámetros de entorno (solo para equipos normales)
			const gadgetTimeout = parseInt(import.meta.env.VITE_GADGET_TIMEOUT) || 30000; // ms
			const allowSameTeam = import.meta.env.VITE_GADGET_SAME_TEAM === 'true';
			const preventActivity = import.meta.env.VITE_GADGET_PREVENT_ACTIVITY === 'true';
			
			// Verificar si el equipo objetivo está haciendo una actividad
			if (preventActivity) {
				const targetTeamDoc = await getDoc(targetTeamRef);
				if (targetTeamDoc.exists()) {
					const targetTeamData = targetTeamDoc.data();
					// Verificar si hay una actividad activa
					if (targetTeamData.isActivityActive) {
						console.log('Target team is currently doing an activity, gadget prevented');
						return false;
					}
				}
			}
			
			// Verificar restricciones de cooldown
			const logDoc = await getDoc(gadgetLogRef);
			const now = Date.now();
			
			if (logDoc.exists()) {
				const logData = logDoc.data();
				const lastGadgetTime = logData.lastGadgetTime || 0;
				const lastTargetTeam = logData.lastTargetTeam;
				
				// Verificar cooldown global del equipo
				if (now - lastGadgetTime < gadgetTimeout) {
					console.log('Team is in cooldown period');
					return false;
				}
				
				// Verificar que no sea el mismo equipo objetivo consecutivo
				if (!allowSameTeam && lastTargetTeam === toTeamId) {
					console.log('Cannot send gadget to the same team consecutively');
					return false;
				}
			}
		}
		
		// Actualizar el gadget del equipo objetivo
		await updateDoc(targetTeamRef, {
			gadget: gadgetId
		});
		
		console.log(`🚀 Firebase: Gadget ${gadgetId} sent from team ${fromTeamId} to team ${toTeamId}`);
		
		// Registrar el envío en el log (incluso para administradores para estadísticas)
		if (!isAdmin) {
			const logDoc = await getDoc(gadgetLogRef);
			const now = Date.now();
			await setDoc(gadgetLogRef, {
				lastGadgetTime: now,
				lastTargetTeam: toTeamId,
				totalGadgetsSent: (logDoc.exists() ? (logDoc.data().totalGadgetsSent || 0) + 1 : 1)
			});
		}
		
		console.log(`Gadget ${gadgetId} sent from team ${fromTeamId} to team ${toTeamId}`);
		return true;
		
	} catch (error) {
		console.error("Error sending gadget:", error);
		throw error;
	}
};

/**
 * Marca un gadget como completado para un equipo
 * @param {string|number} eventId
 * @param {string|number} teamId
 */
export const completeGadget = async (eventId, teamId) => {
	const teamRef = doc(db, "events", `event_${eventId}`, "teams", `team_${teamId}`);
	
	try {
		await updateDoc(teamRef, {
			gadget: "0"
		});
		console.log(`Gadget completed for team ${teamId}`);
	} catch (error) {
		console.error("Error completing gadget:", error);
		throw error;
	}
};

/**
 * Obtiene la información de cooldown de un equipo
 * @param {string|number} eventId
 * @param {string|number} teamId
 * @returns {Promise<Object>} Información de cooldown
 */
export const getGadgetCooldown = async (eventId, teamId) => {
	// Los administradores no tienen cooldown
	if (teamId === "admin") {
		return {
			canSendGadget: true,
			remainingCooldown: 0,
			lastTargetTeam: null
		};
	}
	
	const gadgetLogRef = doc(db, "events", `event_${eventId}`, "gadget_log", `log_${teamId}`);
	
	try {
		const logDoc = await getDoc(gadgetLogRef);
		const now = Date.now();
		
		if (!logDoc.exists()) {
			return {
				canSendGadget: true,
				remainingCooldown: 0,
				lastTargetTeam: null
			};
		}
		
		const logData = logDoc.data();
		const lastGadgetTime = logData.lastGadgetTime || 0;
		const lastTargetTeam = logData.lastTargetTeam;
		
		// Usar el timeout configurado en el .env
		const gadgetTimeout = parseInt(import.meta.env.VITE_GADGET_TIMEOUT) || 30000; // ms
		
		const remainingCooldown = Math.max(0, gadgetTimeout - (now - lastGadgetTime));
		
		return {
			canSendGadget: remainingCooldown === 0,
			remainingCooldown,
			lastTargetTeam
		};
		
	} catch (error) {
		console.error("Error getting gadget cooldown:", error);
		return {
			canSendGadget: false,
			remainingCooldown: 0,
			lastTargetTeam: null
		};
	}
};







