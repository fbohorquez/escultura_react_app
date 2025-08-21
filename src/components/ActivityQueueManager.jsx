// src/components/ActivityQueueManager.jsx
import { useEffect, useRef, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { addToQueue } from "../features/popup/popupSlice";
import { updateTeamData } from "../features/teams/teamsSlice";
import { startActivityWithSuspensionCheck } from "../features/activities/activitiesSlice";

/**
 * Componente que gestiona una cola de actividades enviadas al equipo.
 * - Mantiene una cola persistente de actividades recibidas vía "send"
 * - Procesa la cola cada 30 segundos solo en la página del mapa
 * - Solo procesa si no hay actividades ejecutándose ni popups abiertos
 * - Asegura que ninguna actividad se pierda
 */
const ActivityQueueManager = () => {
	const { t } = useTranslation();
	const dispatch = useDispatch();
	const location = useLocation();
	
	// Referencias para evitar re-renders innecesarios
	const lastSendValue = useRef(null);
	const processingInterval = useRef(null);
	const activityQueue = useRef([]);
	const isProcessingPopup = useRef(false);
	
	// Estado de Redux
	const selectedTeam = useSelector((state) => state.session.selectedTeam);
	const teams = useSelector((state) => state.teams.items);
	const event = useSelector((state) => state.event.event);
	const isAdmin = useSelector((state) => state.session.isAdmin);
	const isActivityActive = useSelector((state) => state.activities.isActivityActive);
	const popupQueue = useSelector((state) => state.popup.queue);
	const currentPopup = useSelector((state) => state.popup.currentPopup);
	const isPopupOpen = useSelector((state) => state.popup.isOpen);

	// Obtener datos actualizados del equipo seleccionado
	const currentTeamData = teams.find(team => 
		selectedTeam && team.id === selectedTeam.id
	);

	// Función para guardar la cola en localStorage
	const saveQueueToStorage = useCallback(() => {
		if (currentTeamData && event) {
			const storageKey = `activityQueue_${event.id}_${currentTeamData.id}`;
			localStorage.setItem(storageKey, JSON.stringify(activityQueue.current));
		}
	}, [currentTeamData, event]);

	// Función para cargar la cola desde localStorage
	const loadQueueFromStorage = useCallback(() => {
		if (currentTeamData && event) {
			const storageKey = `activityQueue_${event.id}_${currentTeamData.id}`;
			const stored = localStorage.getItem(storageKey);
			if (stored) {
				try {
					activityQueue.current = JSON.parse(stored);
					console.log('🗂️ Cola de actividades cargada desde localStorage:', activityQueue.current);
				} catch (error) {
					console.error('Error cargando cola de actividades:', error);
					activityQueue.current = [];
				}
			}
		}
	}, [currentTeamData, event]);

	// Función para añadir actividad a la cola
	const addActivityToQueue = useCallback((activityId, activityData, isForced = false) => {
		// Para actividades forzadas, usar el ID original de la actividad para buscarla
		const originalActivityId = isForced ? activityId - 100000000 : activityId;
		
		// Verificar que no esté ya en la cola
		const existsInQueue = activityQueue.current.some(item => item.originalId === originalActivityId);
		if (existsInQueue) {
			console.log('🔄 Actividad ya existe en la cola:', originalActivityId);
			return;
		}

		const queueItem = {
			id: activityId, // ID completo (puede incluir el modificador de forzado)
			originalId: originalActivityId, // ID original de la actividad
			activity: activityData,
			timestamp: Date.now(),
			attempts: 0,
			isForced: isForced
		};

		activityQueue.current.push(queueItem);
		saveQueueToStorage();
		
		console.log('📥 Actividad añadida a la cola:', {
			activityId: originalActivityId,
			activityName: activityData?.name,
			isForced: isForced,
			queueSize: activityQueue.current.length
		});
	}, [saveQueueToStorage]);

	// Función para resetear el valor send a 0
	const resetSendValue = useCallback(async () => {
		if (!currentTeamData || !event) return;
		
		try {
			await dispatch(updateTeamData({
				eventId: event.id,
				teamId: currentTeamData.id,
				changes: { send: 0 }
			})).unwrap();
			
			console.log('✅ Send value reset to 0 for team:', currentTeamData.name);
		} catch (error) {
			console.error("Error resetting send value:", error);
		}
	}, [currentTeamData, event, dispatch]);

	// Función para remover actividad de la cola
	const removeActivityFromQueue = useCallback((originalActivityId) => {
		const initialLength = activityQueue.current.length;
		activityQueue.current = activityQueue.current.filter(item => item.originalId !== originalActivityId);
		
		if (activityQueue.current.length !== initialLength) {
			saveQueueToStorage();
			console.log('🗑️ Actividad removida de la cola:', originalActivityId);
		}
	}, [saveQueueToStorage]);

	// Función para mostrar popup de actividad
	const showActivityPopup = useCallback((queueItem) => {
		if (isProcessingPopup.current) {
			console.log('🚫 Ya hay un popup de actividad procesándose');
			return;
		}

		isProcessingPopup.current = true;
		
		// Determinar el tipo de popup según si es forzada o no
		const isForced = queueItem.isForced;
		const titleKey = isForced ? "activity_notification.forced_title" : "activity_notification.title";
		const messageKey = isForced ? "activity_notification.forced_message" : "activity_notification.message";
		
		// Preparar botones según si es forzada o no
		const buttons = [];
		
		if (!isForced) {
			// Actividad normal: permitir rechazar
			buttons.push({
				titulo: t("activity_notification.decline", "Ahora No"),
				callback: () => {
					isProcessingPopup.current = false;
					// Remover de la cola cuando se rechaza
					removeActivityFromQueue(queueItem.originalId);
					// Resetear send a 0 en Firebase
					resetSendValue();
				}
			});
		}
		
		// Botón de aceptar (siempre presente)
		buttons.push({
			titulo: t("activity_notification.accept", "Hacer Prueba"),
			callback: async () => {
				try {
					isProcessingPopup.current = false;
					// Remover de la cola cuando se acepta
					removeActivityFromQueue(queueItem.originalId);
					// Resetear send a 0 en Firebase
					await resetSendValue();
					// Iniciar la actividad
					dispatch(startActivityWithSuspensionCheck(queueItem.activity));
				} catch (error) {
					console.error("Error starting assigned activity:", error);
					isProcessingPopup.current = false;
				}
			}
		});
		
		dispatch(addToQueue({
			titulo: t(titleKey, isForced ? "Actividad Obligatoria Asignada" : "Nueva Actividad Asignada"),
			texto: t(messageKey, isForced 
				? "El organizador te ha asignado una actividad obligatoria: \"{{activityName}}\". Debes realizarla."
				: "El organizador te ha asignado una nueva actividad: \"{{activityName}}\"", {
				activityName: queueItem.activity.name
			}),
			array_botones: buttons,
			overlay: true, // Overlay visible para efecto visual
			close_button: false, // Tanto actividades normales como forzadas no tienen botón X
			layout: "center",
			claseCss: isForced ? "popup-activity-forced" : "popup-activity-notification"
		}));
	}, [t, dispatch, removeActivityFromQueue, resetSendValue]);

	// Función para procesar la cola de actividades
	const processActivityQueue = useCallback(() => {
		// Solo procesar si estamos en el mapa
		const isOnMapPage = location.pathname.includes('/event/');
		if (!isOnMapPage) {
			console.log('🗺️ No estamos en la página del mapa, saltando procesamiento de cola');
			return;
		}

		// No procesar si hay una actividad ejecutándose
		if (isActivityActive) {
			console.log('🏃 Hay una actividad ejecutándose, saltando procesamiento de cola');
			return;
		}

		// No procesar si hay popups abiertos
		if (popupQueue.length > 0) {
			console.log('🔔 Hay popups abiertos, saltando procesamiento de cola');
			return;
		}

		// No procesar si ya hay un popup de actividad procesándose
		if (isProcessingPopup.current) {
			console.log('⏳ Ya hay un popup de actividad procesándose');
			return;
		}

		// Procesar el primer elemento de la cola
		if (activityQueue.current.length > 0) {
			const nextActivity = activityQueue.current[0];
			console.log('🎯 Procesando actividad de la cola:', {
				activityId: nextActivity.id,
				activityName: nextActivity.activity?.name,
				timestamp: new Date(nextActivity.timestamp).toLocaleTimeString()
			});
			
			showActivityPopup(nextActivity);
		} else {
			console.log('📭 Cola de actividades vacía');
		}
	}, [location.pathname, isActivityActive, popupQueue.length, showActivityPopup]);

	// Effect para detectar cambios en el campo "send"
	useEffect(() => {
		// Solo para equipos (no admin)
		if (isAdmin || !currentTeamData || !event) return;

		const currentSendValue = currentTeamData.send;
		
		// Si es la primera vez, solo guardar el valor actual
		if (lastSendValue.current === null) {
			lastSendValue.current = currentSendValue;
			loadQueueFromStorage(); // Cargar cola existente
			return;
		}

		// Detectar cambio en el campo send (nueva actividad enviada)
		if (currentSendValue !== lastSendValue.current && currentSendValue > 0) {
			console.log('🔔 Detected activity send change:', {
				oldValue: lastSendValue.current,
				newValue: currentSendValue,
				teamId: currentTeamData.id,
				teamName: currentTeamData.name
			});

			// Determinar si es una actividad forzada
			const isForced = currentSendValue > 100000000;
			const originalActivityId = isForced ? currentSendValue - 100000000 : currentSendValue;

			console.log('🎯 Processing activity:', {
				receivedId: currentSendValue,
				originalId: originalActivityId,
				isForced: isForced
			});

			// Buscar la actividad asignada usando el ID original
			const assignedActivity = currentTeamData.activities_data?.find(
				activity => activity.id === originalActivityId
			);

			if (assignedActivity) {
				console.log('🎯 Found assigned activity:', assignedActivity, 'Forced:', isForced);
				addActivityToQueue(currentSendValue, assignedActivity, isForced);
			} else {
				console.warn('⚠️ Activity not found for original ID:', originalActivityId);
			}
		}

		// Actualizar el valor anterior
		lastSendValue.current = currentSendValue;
	}, [currentTeamData?.send, isAdmin, currentTeamData, event, addActivityToQueue, loadQueueFromStorage]);

	// Effect para configurar el procesamiento periódico de la cola
	useEffect(() => {
		// Solo para equipos (no admin)
		if (isAdmin || !currentTeamData || !event) {
			// Limpiar intervalo si no se cumplen las condiciones
			if (processingInterval.current) {
				clearInterval(processingInterval.current);
				processingInterval.current = null;
			}
			return;
		}

		// Configurar procesamiento cada 30 segundos
		processingInterval.current = setInterval(() => {
			processActivityQueue();
		}, 30000); // 30 segundos

		// Procesamiento inicial inmediato
		setTimeout(() => {
			processActivityQueue();
		}, 1000); // Dar tiempo para que se cargue todo

		// Limpiar al desmontar
		return () => {
			if (processingInterval.current) {
				clearInterval(processingInterval.current);
				processingInterval.current = null;
			}
		};
	}, [isAdmin, currentTeamData, event, processActivityQueue]);

	// Effect para detectar si el popup se cierra externamente 
	useEffect(() => {
		// Si había un popup procesándose pero ya no hay popup abierto,
		// significa que se cerró externamente
		if (isProcessingPopup.current && !isPopupOpen) {
			console.log('🚨 Popup cerrado externamente, detectando tipo de actividad');
			
			// Si era una actividad forzada, necesitamos seguir procesando la cola
			// ya que no se puede saltear una actividad forzada
			if (currentPopup?.claseCss?.includes('popup-activity-forced')) {
				console.log('⚠️ Actividad forzada cerrada externamente, continuando procesamiento...');
				isProcessingPopup.current = false;
				// No resetear la cola, la actividad forzada seguirá apareciendo
				setTimeout(() => {
					processActivityQueue();
				}, 1000); // Darle un segundo antes de reprocessar
			} else {
				// Para actividades normales, el callback personalizado ya se encargó del rechazo
				// Solo necesitamos resetear el estado si no se manejó por el callback
				console.log('� Actividad normal cerrada - callback personalizado ya aplicó lógica de rechazo');
				isProcessingPopup.current = false;
			}
		}
	}, [isPopupOpen, currentPopup, processActivityQueue]);

	// Effect para cargar la cola cuando cambie el equipo/evento
	useEffect(() => {
		if (currentTeamData && event) {
			loadQueueFromStorage();
		}
	}, [currentTeamData, event, loadQueueFromStorage]);

	// Este componente no renderiza nada visible
	return null;
};

export default ActivityQueueManager;
