// src/components/subscriptionManager.jsx
import { useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
	subscribeToEvent,
	subscribeAdmin,
	subscribeTeam,
} from "../services/firebase";

import { setEvent } from "../features/event/eventSlice";
import { setAdmin } from "../features/admin/adminSlice";
import { setTeams } from "../features/teams/teamsSlice";
import { updateSelectedTeam } from "../features/session/sessionSlice";
import { useDeviceAssignmentWatcher } from "../hooks/useDeviceAssignmentWatcher";
import { 
	getLocallyCompletedActivities, 
	removeLocalCompletionMark 
} from "../services/activityCompletionQueue";

// ✅ Constante de throttle para actualizaciones de equipos desde Firebase
const TEAM_UPDATE_THROTTLE_MS = 30000; // 30 segundos

// Función de comparación recursiva mejorada
function compareRecursive(obj1, obj2) {
	if (obj1 === obj2) return true;
	if (obj1 == null || obj2 == null) return false;
	if (typeof obj1 !== typeof obj2) return false;
	
	if (typeof obj1 === 'object') {
		const keys1 = Object.keys(obj1);
		const keys2 = Object.keys(obj2);
		
		if (keys1.length !== keys2.length) return false;
		
		for (let key of keys1) {
			if (!keys2.includes(key) || !compareRecursive(obj1[key], obj2[key])) {
				return false;
			}
		}
		return true;
	}
	
	return obj1 === obj2;
}

export default function SubscriptionManager() {
	const dispatch = useDispatch();
	const eventId = useSelector((s) => s.event.id);
	const teams = useSelector((s) => s.teams.items);
  const refresh = useSelector((s) => s.session.refresh);
	const sessionToken = useSelector((s) => s.session.token);
	const selectedTeam = useSelector((s) => s.session.selectedTeam);

	// ✅ Ref para trackear última actualización de cada equipo
	const lastTeamUpdateTime = useRef({});

	// Usar el watcher global para detectar cambios en device assignment
	useDeviceAssignmentWatcher();

	useEffect(() => {
		if (!eventId) return;

		const unsubEvent = subscribeToEvent(eventId, (data) => {
			dispatch(setEvent(data));
		});

		const unsubAdmin = subscribeAdmin(eventId, (adminData) => {
			dispatch(setAdmin(adminData));
		});

		const unsubTeams = [];
		
		// Determinar qué equipos necesitan suscripción
		const teamsToSubscribe = (() => {
			// Si es admin o no tiene selectedTeam, suscribirse a TODOS los equipos
			if (!selectedTeam || selectedTeam.id === undefined) {
				console.log('🔗 Admin/No-team mode: Subscribing to ALL teams');
				return teams;
			}
			
			// Si es un equipo normal, suscribirse SOLO a su propio equipo
			const ownTeam = teams.find((team) => team.id === selectedTeam.id);
			if (ownTeam) {
				console.log(`🔗 Team mode: Subscribing only to team ${selectedTeam.id}`);
				return [ownTeam];
			}
			
			// Fallback: no suscribirse a ningún equipo
			console.warn('⚠️ No team found to subscribe');
			return [];
		})();
		
		teamsToSubscribe.forEach((team) => {
			const unsubTeam = subscribeTeam(eventId, team.id, async (teamData) => {
				// ✅ THROTTLE: Aplicar throttle de 30 segundos para actualizaciones de equipos
				// EXCEPTO para el equipo seleccionado actualmente (para mantener tiempo real)
				const isOwnTeam = selectedTeam && teamData.id === selectedTeam.id;
				const now = Date.now();
				const lastUpdate = lastTeamUpdateTime.current[teamData.id] || 0;
				const timeSinceLastUpdate = now - lastUpdate;

				// Si no es el equipo propio Y no han pasado 30 segundos, ignorar actualización
				if (!isOwnTeam && timeSinceLastUpdate < TEAM_UPDATE_THROTTLE_MS) {
					console.log(`⏳ Throttling update for team ${teamData.id} (${Math.floor(timeSinceLastUpdate/1000)}s since last update)`);
					return; // Ignorar esta actualización
				}

				// Actualizar timestamp de última actualización procesada
				lastTeamUpdateTime.current[teamData.id] = now;

				// console.log('🔄 Team update received:', {
				// 	id: teamData.id, 
				// 	name: teamData.name, 
				// 	gadget: teamData.gadget,
				// 	gadgetType: typeof teamData.gadget
				// });
				
				// ========== PRIORIZAR ACTIVIDADES COMPLETADAS LOCALMENTE ==========
				// Obtener actividades marcadas localmente como completadas
				try {
					const localCompletedActivities = await getLocallyCompletedActivities(eventId, teamData.id);
					
					if (localCompletedActivities.length > 0) {
						console.log(`🔒 ${localCompletedActivities.length} actividades marcadas localmente como completadas para equipo ${teamData.id}`);
						
						// Procesar cada actividad del equipo
						if (teamData.activities_data && Array.isArray(teamData.activities_data)) {
							teamData.activities_data = teamData.activities_data.map(activity => {
								// Verificar si esta actividad está marcada localmente como completada
								const localCompletion = localCompletedActivities.find(
									lc => lc.activityId === activity.id
								);
								
								if (localCompletion) {
									// Si Firebase confirma que está completada, eliminar marca local
									if (activity.complete === true) {
										console.log(`✅ Firebase confirma actividad ${activity.id} completada, eliminando marca local`);
										removeLocalCompletionMark(eventId, teamData.id, activity.id)
											.catch(err => console.error("Error eliminando marca local:", err));
										return activity; // Usar el de Firebase
									} else {
										// Firebase dice que NO está completada, pero localmente SÍ
										// PREVALECE EL ESTADO LOCAL
										console.log(`🔒 Actividad ${activity.id} prevalece estado local (completada) sobre Firebase`);
										return {
											...activity,
											complete: true,
											complete_time: activity.complete_time || Math.floor(localCompletion.completedAt / 1000)
										};
									}
								}
								
								return activity;
							});
						}
					}
				} catch (error) {
					console.error("Error procesando actividades localmente completadas:", error);
					// Continuar sin bloquear la actualización
				}
				
				const currentItems = teams;
				const teamExists = currentItems.some((item) => item.id === teamData.id);
				if (!teamExists) {
					dispatch(setTeams([...currentItems, teamData]));
				} else {
					let changes = false;
					const updatedItems = currentItems.map((item) => {
						if (item.id === teamData.id) {
							if (!compareRecursive(item, teamData)) {
								changes = true;
							}
							return teamData;
						}
						return item;
					});
					if (!changes) return; // No changes, no need to update
					dispatch(setTeams(updatedItems));
					
					// NUEVO: Sincronizar selectedTeam si es el mismo equipo
					if (selectedTeam && teamData.id === selectedTeam.id) {
						console.log('🔄 Updating selectedTeam:', {
							oldGadget: selectedTeam.gadget,
							newGadget: teamData.gadget,
							changed: !compareRecursive(teamData, selectedTeam)
						});
						if (!compareRecursive(teamData, selectedTeam)) {
									dispatch(updateSelectedTeam(teamData));
								}

								// Verificar si se solicita refresh para este equipo
								if (teamData.refreshRequested && teamData.refreshRequested === true) {
									console.log('🔄 Refresh requested for current team, reloading page...');
									
									// Limpiar flag de refresh antes de recargar
									import('../services/firebase').then(({ updateTeam }) => {
										updateTeam(eventId, teamData.id, { 
											refreshRequested: false,
											refreshTimestamp: null
										}).then(() => {
											// Recargar página después de limpiar el flag
											window.location.reload();
										}).catch(error => {
											console.error('Error clearing refresh flag:', error);
											// Recargar de todas formas
											window.location.reload();
										});
									});
						}					
					}
				}
			});
			unsubTeams.push(unsubTeam);
		});

		return () => {
			unsubEvent();
			unsubAdmin();
			unsubTeams.forEach((unsub) => unsub());
		};
	}, [eventId, dispatch, refresh, selectedTeam, sessionToken, teams]);

	return null;
}










