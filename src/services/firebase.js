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

// Variables para el monitoreo de conexiones
let connectionListeners = new Map(); // Para almacenar listeners activos
let reconnectionAttempts = new Map(); // Para contar intentos de reconexión
let lastHeartbeat = new Map(); // Para trackear última actividad

// Configuración de monitoreo
const HEARTBEAT_INTERVAL = 30000; // 30 segundos
const MAX_RECONNECTION_ATTEMPTS = 5;
const RECONNECTION_DELAY = 2000; // 2 segundos

/**
 * Función para verificar la conectividad con Firebase
 * @returns {Promise<boolean>} true si hay conexión, false si no
 */
const checkFirebaseConnection = async () => {
	try {
		// Intentar una operación simple para verificar conectividad
		const testRef = doc(db, "connection_test", "ping");
		await getDoc(testRef);
		return true;
	} catch (error) {
		console.warn("Firebase connection check failed:", error);
		return false;
	}
};

/**
 * Función para reintentar conexión con backoff exponencial
 * @param {string} listenerId - ID único del listener
 * @param {Function} retryCallback - Función para reintentar la suscripción
 */
const scheduleReconnection = (listenerId, retryCallback) => {
	const attempts = reconnectionAttempts.get(listenerId) || 0;
	
	if (attempts >= MAX_RECONNECTION_ATTEMPTS) {
		console.error(`Max reconnection attempts reached for listener ${listenerId}`);
		return;
	}
	
	const delay = RECONNECTION_DELAY * Math.pow(2, attempts); // backoff exponencial
	
	setTimeout(async () => {
		console.log(`Attempting reconnection ${attempts + 1}/${MAX_RECONNECTION_ATTEMPTS} for ${listenerId}`);
		const isConnected = await checkFirebaseConnection();
		
		if (isConnected) {
			reconnectionAttempts.set(listenerId, 0);
			retryCallback();
		} else {
			reconnectionAttempts.set(listenerId, attempts + 1);
			scheduleReconnection(listenerId, retryCallback);
		}
	}, delay);
};

/**
 * Función para crear un wrapper de onSnapshot con reconexión automática
 * @param {string} listenerId - ID único para este listener
 * @param {DocumentReference|Query} ref - Referencia de Firestore
 * @param {Function} onNext - Callback para datos
 * @param {Function} onError - Callback para errores (opcional)
 * @returns {Function} Función para cancelar la suscripción
 */
const createRobustListener = (listenerId, ref, onNext, onError = null) => {
	let unsubscribe = null;
	let isActive = true;
	
	const startListening = () => {
		if (!isActive) return;
		
		console.log(`Starting listener ${listenerId}`);
		lastHeartbeat.set(listenerId, Date.now());
		
		unsubscribe = onSnapshot(
			ref,
			(snapshot) => {
				lastHeartbeat.set(listenerId, Date.now());
				reconnectionAttempts.set(listenerId, 0); // Reset attempts on successful data
				onNext(snapshot);
			},
			(error) => {
				console.error(`Error in listener ${listenerId}:`, error);
				
				if (onError) {
					onError(error);
				}
				
				// Programar reconexión en caso de error
				if (isActive) {
					scheduleReconnection(listenerId, startListening);
				}
			}
		);
	};
	
	// Iniciar el listener
	startListening();
	
	// Almacenar referencia del listener
	connectionListeners.set(listenerId, {
		startListening,
		isActive: () => isActive
	});
	
	// Función de cleanup
	return () => {
		isActive = false;
		if (unsubscribe) {
			unsubscribe();
		}
		connectionListeners.delete(listenerId);
		reconnectionAttempts.delete(listenerId);
		lastHeartbeat.delete(listenerId);
		console.log(`Listener ${listenerId} unsubscribed`);
	};
};

// Importar y configurar el servicio de keepalive
import KeepaliveService from './keepalive';

// Variable para almacenar la instancia del servicio de keepalive
let keepaliveService = null;

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
 * Suscribe a actualizaciones del documento de Firestore con reconexión automática
 * @param {string|number} eventId
 * @param {(data: object) => void} onEventUpdate
 * @returns {Function} Función para cancelar la suscripción
 */
export const subscribeToEvent = (eventId, onEventUpdate) => {
	const id = eventId.toString();
	const docRef = doc(db, "events", `event_${id}`);
	const listenerId = `event_${id}`;
	
	console.log(`🔗 Setting up robust subscription for event ${id}`);
	
	return createRobustListener(
		listenerId,
		docRef,
		(snapshot) => {
			if (snapshot.exists()) {
				if (DETAILED_LOGGING) {
					console.log(`📡 Event data received for ${id}:`, snapshot.data());
				}
				onEventUpdate(snapshot.data());
			} else {
				console.warn(`⚠️ Event document ${id} does not exist`);
			}
		},
		(error) => {
			console.error(`❌ Event subscription error for ${id}:`, error);
		}
	);
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
	const listenerId = `team_${eventId}_${teamId}`;

	console.log(`🔗 Setting up robust team subscription for event ${eventId}, team ${teamId}`);

	return createRobustListener(
		listenerId,
		teamDocRef,
		(snapshot) => {
			if (snapshot.exists()) {
				const teamData = { id: snapshot.id, ...snapshot.data() };
				if (DETAILED_LOGGING) {
					console.log(`📡 Team data received for ${teamId}:`, teamData);
				}
				onTeamsUpdate(teamData);
			} else {
				console.warn(`⚠️ Team document ${teamId} does not exist`);
			}
		},
		(error) => {
			console.error(`❌ Team subscription error for ${teamId}:`, error);
		}
	);
};

export const subscribeAdmin = (eventId, onAdminUpdate) => {
	const eventDocRef = doc(db, "events", `event_${eventId}`);
	const adminColRef = collection(eventDocRef, "admin");
	const adminDocRef = doc(adminColRef, "admin");
	const listenerId = `admin_${eventId}`;

	console.log(`🔗 Setting up robust admin subscription for event ${eventId}`);

	return createRobustListener(
		listenerId,
		adminDocRef,
		(snapshot) => {
			if (snapshot.exists()) {
				const adminData = {
					id: adminDocRef.id,
					...snapshot.data(),
				};
				if (DETAILED_LOGGING) {
					console.log(`📡 Admin data received for event ${eventId}:`, adminData);
				}
				onAdminUpdate(adminData);
			} else {
				console.warn(`⚠️ Admin document for event ${eventId} does not exist`);
			}
		},
		(error) => {
			console.error(`❌ Admin subscription error for event ${eventId}:`, error);
		}
	);
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
	console.log("Firebase updateTeam called with:", {
		eventId,
		teamId,
		partial,
		docPath: `events/event_${eventId}/teams/team_${teamId}`
	});
	await updateDoc(ref, partial);
	console.log("Firebase updateTeam completed successfully");
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
	const listenerId = `chat_${eventId}_${chatId}`;

	console.log(`🔗 Setting up robust chat subscription for event ${eventId}, chat ${chatId}`);

	return createRobustListener(
		listenerId,
		chatRef,
		(doc) => {
			if (doc.exists()) {
				const data = doc.data();
				if (DETAILED_LOGGING) {
					console.log(`📡 Chat data received for ${chatId}:`, data.messages?.length || 0, "messages");
				}
				callback(data.messages || []);
			} else {
				if (DETAILED_LOGGING) {
					console.log(`📡 Chat ${chatId} does not exist, sending empty array`);
				}
				callback([]);
			}
		},
		(error) => {
			console.error(`❌ Chat subscription error for ${chatId}:`, error);
		}
	);
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

/**
 * Marca todos los mensajes de un chat como leídos por un usuario
 * @param {string|number} eventId
 * @param {string} chatId
 * @param {string|number} userId
 * @param {string} userType - "admin" o "team"
 */
export const markChatAsRead = async (eventId, chatId, userId, userType) => {
	const readStatusRef = doc(db, "events", `event_${eventId}`, "chat_read_status", `${chatId}_${userId}`);
	
	try {
		// Obtener la cantidad actual de mensajes en el chat
		const chatRef = doc(db, "events", `event_${eventId}`, "chats", chatId);
		const chatDoc = await getDoc(chatRef);
		
		if (chatDoc.exists()) {
			const chatData = chatDoc.data();
			const messageCount = chatData.messages ? chatData.messages.length : 0;
			
			// Marcar todos los mensajes como leídos
			await setDoc(readStatusRef, {
				userId,
				userType,
				lastReadMessageIndex: messageCount - 1,
				lastReadAt: Date.now(),
				chatId
			});
			
			console.log(`Chat ${chatId} marked as read for user ${userId} (${messageCount} messages)`);
		}
	} catch (error) {
		console.error("Error marking chat as read:", error);
		throw error;
	}
};

/**
 * Obtiene el estado de lectura de un chat para un usuario
 * @param {string|number} eventId
 * @param {string} chatId
 * @param {string|number} userId
 * @returns {Promise<Object>} Estado de lectura
 */
export const getChatReadStatus = async (eventId, chatId, userId) => {
	const readStatusRef = doc(db, "events", `event_${eventId}`, "chat_read_status", `${chatId}_${userId}`);
	
	try {
		const readDoc = await getDoc(readStatusRef);
		
		if (readDoc.exists()) {
			return readDoc.data();
		}
		
		return {
			lastReadMessageIndex: -1,
			lastReadAt: 0
		};
	} catch (error) {
		console.error("Error getting chat read status:", error);
		return {
			lastReadMessageIndex: -1,
			lastReadAt: 0
		};
	}
};

/**
 * Suscribirse a los cambios de estado de lectura de todos los chats de un usuario
 * @param {string|number} eventId
 * @param {string|number} userId
 * @param {Function} callback
 * @returns {Function} Función para cancelar la suscripción
 */
export const subscribeToUserReadStatus = (eventId, userId, callback) => {
	const readStatusCollection = collection(db, "events", `event_${eventId}`, "chat_read_status");
	const listenerId = `read_status_${eventId}_${userId}`;

	console.log(`🔗 Setting up robust read status subscription for event ${eventId}, user ${userId}`);
	
	return createRobustListener(
		listenerId,
		readStatusCollection,
		(snapshot) => {
			const readStatuses = {};
			snapshot.forEach((doc) => {
				const data = doc.data();
				if (data.userId === userId.toString()) {
					readStatuses[data.chatId] = data;
				}
			});
			if (DETAILED_LOGGING) {
				console.log(`📡 Read status data received for user ${userId}:`, Object.keys(readStatuses).length, "statuses");
			}
			callback(readStatuses);
		},
		(error) => {
			console.error(`❌ Read status subscription error for user ${userId}:`, error);
		}
	);
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

/**
 * Inicializa el servicio de keepalive para un evento y equipo
 * @param {string|number} eventId - ID del evento
 * @param {string|number} teamId - ID del equipo
 * @param {Object} store - Store de Redux
 * @returns {Promise<KeepaliveService>} Instancia del servicio de keepalive
 */
export const initializeKeepalive = async (eventId, teamId, store) => {
	try {
		if (keepaliveService) {
			await keepaliveService.cleanup();
		}
		
		keepaliveService = new KeepaliveService(db, store);
		await keepaliveService.initialize(eventId, teamId);
		
		console.log(`Keepalive service initialized for event ${eventId}, team ${teamId}`);
		return keepaliveService;
	} catch (error) {
		console.error("Error initializing keepalive service:", error);
		throw error;
	}
};

/**
 * Inicializa el servicio de keepalive en modo solo lectura
 * Útil para administradores que necesitan leer estados sin tener equipo asignado
 * @param {string} eventId - ID del evento
 * @param {Object} store - Store de Redux
 * @returns {Promise<KeepaliveService>} Instancia del servicio de keepalive
 */
export const initializeKeepaliveReadOnly = async (eventId, store) => {
	try {
		if (keepaliveService) {
			await keepaliveService.cleanup();
		}
		
		keepaliveService = new KeepaliveService(db, store);
		await keepaliveService.initializeReadOnly(eventId);
		
		console.log(`Keepalive service initialized in read-only mode for event ${eventId}`);
		return keepaliveService;
	} catch (error) {
		console.error("Error initializing keepalive service in read-only mode:", error);
		throw error;
	}
};

/**
 * Obtiene la instancia actual del servicio de keepalive
 * @returns {KeepaliveService|null} Instancia del servicio o null si no está inicializado
 */
export const getKeepaliveService = () => {
	return keepaliveService;
};

/**
 * Fuerza un heartbeat inmediato
 * @returns {void}
 */
export const forceKeepaliveHeartbeat = () => {
	if (keepaliveService) {
		keepaliveService.forceHeartbeat();
	}
};

/**
 * Limpia y desconecta el servicio de keepalive
 * @returns {Promise<void>}
 */
export const cleanupKeepalive = async () => {
	if (keepaliveService) {
		await keepaliveService.cleanup();
		keepaliveService = null;
		console.log("Keepalive service cleaned up");
	}
};

/**
 * Obtiene el estado de conexión actual
 * @returns {string} Estado de conexión: 'connecting', 'connected', 'disconnected', 'error'
 */
export const getConnectionStatus = () => {
	return keepaliveService ? keepaliveService.getConnectionStatus() : 'disconnected';
};

/**
 * Obtiene la lista de equipos conectados
 * @returns {Array} Array de equipos conectados
 */
export const getConnectedTeams = () => {
	return keepaliveService ? keepaliveService.getConnectedTeams() : [];
};

/**
 * Obtiene el número total de equipos conectados
 * @returns {number} Número de equipos conectados
 */
export const getTeamCount = () => {
	return keepaliveService ? keepaliveService.getTeamCount() : 0;
};

/**
 * Obtiene el estado de conexión de un equipo específico
 * @param {string|number} teamId - ID del equipo
 * @param {string} eventId - ID del evento (opcional, se obtiene del servicio si no se proporciona)
 * @returns {Promise<Object>} Estado del equipo { status, lastSeen, sessionId }
 */
export const getTeamConnectionStatus = async (teamId, eventId = null) => {
	const service = getKeepaliveService();
	
	if (service) {
		// Si el servicio está disponible, usarlo
		return await service.getTeamStatus(teamId);
	} else {
		// Si no hay servicio, hacer consulta directa a Firebase
		if (!teamId) {
			return { status: 'offline', lastSeen: null };
		}

		// Si no se proporciona eventId, intentar obtenerlo del localStorage o devolver offline
		let targetEventId = eventId;
		if (!targetEventId) {
			try {
				const storedEventId = localStorage.getItem('selectedEventId');
				targetEventId = storedEventId;
			} catch (error) {
				console.warn('No se pudo obtener eventId:', error);
			}
		}

		if (!targetEventId) {
			return { status: 'offline', lastSeen: null };
		}

		try {
			const teamRef = doc(db, 'events', `event_${targetEventId}`, 'teams_keepalive', `team_${teamId}`);
			const teamDoc = await getDoc(teamRef);
			
			if (!teamDoc.exists()) {
				return { status: 'offline', lastSeen: null };
			}

			const teamData = teamDoc.data();
			const now = Date.now();
			const lastSeen = teamData.timestamp || 0;
			const isActive = (now - lastSeen) < 60000; // 1 minuto
			
			return {
				status: isActive ? 'online' : 'offline',
				lastSeen: teamData.timestamp,
				sessionId: teamData.sessionId,
				userAgent: teamData.userAgent,
				url: teamData.url
			};
		} catch (error) {
			console.error('Error getting team status from Firebase:', error);
			return { status: 'offline', lastSeen: null };
		}
	}
};

// === FUNCIONES DE MONITOREO Y DIAGNÓSTICO ===

/**
 * Obtiene información sobre las conexiones activas
 * @returns {Object} Información de las conexiones
 */
export const getConnectionInfo = () => {
	const now = Date.now();
	const activeListeners = [];
	const staleListeners = [];
	
	connectionListeners.forEach((listener, listenerId) => {
		const lastActivity = lastHeartbeat.get(listenerId) || 0;
		const timeSinceActivity = now - lastActivity;
		
		const info = {
			id: listenerId,
			lastActivity: new Date(lastActivity).toISOString(),
			timeSinceActivity: Math.floor(timeSinceActivity / 1000) + 's',
			isActive: listener.isActive(),
			reconnectionAttempts: reconnectionAttempts.get(listenerId) || 0
		};
		
		if (timeSinceActivity > HEARTBEAT_INTERVAL * 2) {
			staleListeners.push(info);
		} else {
			activeListeners.push(info);
		}
	});
	
	return {
		totalListeners: connectionListeners.size,
		activeListeners,
		staleListeners,
		timestamp: new Date().toISOString()
	};
};

/**
 * Fuerza la reconexión de todos los listeners
 */
export const forceReconnectAll = () => {
	console.log('🔄 Forcing reconnection of all listeners...');
	connectionListeners.forEach((listener, listenerId) => {
		if (listener.isActive()) {
			console.log(`🔄 Restarting listener: ${listenerId}`);
			reconnectionAttempts.set(listenerId, 0);
			listener.startListening();
		}
	});
};

/**
 * Limpia listeners inactivos o con muchos errores
 */
export const cleanupStaleListeners = () => {
	console.log('🧹 Cleaning up stale listeners...');
	const now = Date.now();
	
	connectionListeners.forEach((listener, listenerId) => {
		const lastActivity = lastHeartbeat.get(listenerId) || 0;
		const timeSinceActivity = now - lastActivity;
		const attempts = reconnectionAttempts.get(listenerId) || 0;
		
		// Limpiar si no hay actividad por mucho tiempo o muchos intentos fallidos
		if (timeSinceActivity > HEARTBEAT_INTERVAL * 10 || attempts >= MAX_RECONNECTION_ATTEMPTS) {
			console.log(`🗑️ Removing stale listener: ${listenerId}`);
			connectionListeners.delete(listenerId);
			reconnectionAttempts.delete(listenerId);
			lastHeartbeat.delete(listenerId);
		}
	});
};

/**
 * Inicia un monitor que verifica la salud de las conexiones periódicamente
 */
export const startConnectionMonitor = () => {
	// Monitor cada 60 segundos
	setInterval(() => {
		const info = getConnectionInfo();
		
		if (info.staleListeners.length > 0) {
			console.warn('⚠️ Detected stale listeners:', info.staleListeners);
			
			// Intentar reconectar listeners con problemas
			info.staleListeners.forEach(staleInfo => {
				const listener = connectionListeners.get(staleInfo.id);
				if (listener && listener.isActive()) {
					console.log(`🔄 Attempting to restart stale listener: ${staleInfo.id}`);
					listener.startListening();
				}
			});
		}
		
		// Limpiar listeners muertos cada 5 minutos
		if (Math.random() < 0.083) { // ~1 en 12 (5 min / 60 seg)
			cleanupStaleListeners();
		}
		
		console.log(`📊 Connection monitor: ${info.activeListeners.length} active, ${info.staleListeners.length} stale`);
	}, 60000);
	
	console.log('📊 Connection monitor started');
};

/**
 * Verifica la conectividad general con Firebase
 * @returns {Promise<Object>} Estado de la conexión
 */
export const checkOverallConnection = async () => {
	try {
		const startTime = Date.now();
		const isConnected = await checkFirebaseConnection();
		const responseTime = Date.now() - startTime;
		
		return {
			connected: isConnected,
			responseTime,
			timestamp: new Date().toISOString(),
			listeners: getConnectionInfo()
		};
	} catch (error) {
		return {
			connected: false,
			error: error.message,
			timestamp: new Date().toISOString(),
			listeners: getConnectionInfo()
		};
	}
};

/**
 * Función para habilitar/deshabilitar logs detallados
 */
let DETAILED_LOGGING = false;
export const setDetailedLogging = (enabled) => {
	DETAILED_LOGGING = enabled;
	console.log(`🔧 Detailed Firebase logging ${enabled ? 'enabled' : 'disabled'}`);
};

// Exportar la instancia de db para otros usos
export { db };







