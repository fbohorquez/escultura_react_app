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

	// ✅ Refs para mantener el estado actualizado sin causar re-render del useEffect
	const teamsRef = useRef(teams);
	const selectedTeamRef = useRef(selectedTeam);
	const lastTeamUpdateTime = useRef({});

	// Actualizar refs cuando cambian los valores
	useEffect(() => {
		teamsRef.current = teams;
	}, [teams]);

	useEffect(() => {
		selectedTeamRef.current = selectedTeam;
	}, [selectedTeam]);

	// Usar el watcher global para detectar cambios en device assignment
	useDeviceAssignmentWatcher();

	// Obtener solo el ID del selectedTeam y la cantidad de equipos para usar como dependencias
	// Esto evita recrear listeners cuando cambian otros campos (lat, lon, etc)
	const selectedTeamId = selectedTeam?.id;
	const teamsCount = teams.length;

	useEffect(() => {
		if (!eventId) return;

		console.log('🔄 SubscriptionManager: Setting up listeners for event', eventId);

		const unsubEvent = subscribeToEvent(eventId, (data) => {
			dispatch(setEvent(data));
		});

		const unsubAdmin = subscribeAdmin(eventId, (adminData) => {
			dispatch(setAdmin(adminData));
		});

		const unsubTeams = [];
		
		// Determinar qué equipos necesitan suscripción
		// Esto solo se ejecuta cuando se CREAN los listeners, no con cada actualización
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
				// Obtener el selectedTeam actual de la ref
				const currentSelectedTeam = selectedTeamRef.current;
				const isOwnTeam = currentSelectedTeam && teamData.id === currentSelectedTeam.id;
				const now = Date.now();
				const lastUpdate = lastTeamUpdateTime.current[teamData.id] || 0;
				const timeSinceLastUpdate = now - lastUpdate;

				// Si no es el equipo propio Y no han pasado 30 segundos, ignorar actualización
				// if (!isOwnTeam && timeSinceLastUpdate < TEAM_UPDATE_THROTTLE_MS) {
				// 	console.log(`⏳ Throttling update for team ${teamData.id} (${Math.floor(timeSinceLastUpdate/1000)}s since last update)`);
				// 	return; // Ignorar esta actualización
				// }

				// Actualizar timestamp de última actualización procesada
				lastTeamUpdateTime.current[teamData.id] = now;

				// console.log('🔄 Team update received:', {
				// 	id: teamData.id, 
				// 	name: teamData.name, 
				// 	gadget: teamData.gadget,
				// 	gadgetType: typeof teamData.gadget
				// });
				
				// ========== PROTECCIÓN: ACTIVIDADES COMPLETADAS NUNCA VUELVEN A INCOMPLETE ==========
				// 🔒 REGLA CRÍTICA: Una vez que una actividad se marca como complete:true localmente,
				// NUNCA puede volver a complete:false, sin importar lo que diga Firebase
				
				// Obtener el estado ACTUAL de la ref
				const currentItems = teamsRef.current;
				
				// Debug: verificar si la ref está actualizada
				if (!currentItems || currentItems.length === 0) {
					console.warn(`⚠️ teamsRef.current is empty for team ${teamData.id}, using teamData as new team`);
					dispatch(setTeams([teamData]));
					return;
				}
				
				try {
					// 1. Obtener el estado actual del equipo en Redux
					const currentTeam = currentItems.find(t => t.id === teamData.id);
					
					// 2. Obtener actividades marcadas en cola local como completadas
					const localCompletedActivities = await getLocallyCompletedActivities(eventId, teamData.id);
					
					// 3. Procesar cada actividad del equipo
					if (teamData.activities_data && Array.isArray(teamData.activities_data)) {
						teamData.activities_data = teamData.activities_data.map(activity => {
							// PROTECCIÓN 1: Verificar cola local de completados
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
									console.log(`🔒 [COLA] Actividad ${activity.id} prevalece estado local (completada) sobre Firebase`);
									return {
										...activity,
										complete: true,
										complete_time: activity.complete_time || Math.floor(localCompletion.completedAt / 1000)
									};
								}
							}
							
							// PROTECCIÓN 2: Verificar estado actual en Redux (más importante)
							// Si la actividad está marcada como completada en Redux, NUNCA permitir que vuelva a false
							if (currentTeam?.activities_data) {
								const currentActivity = currentTeam.activities_data.find(a => a.id === activity.id);
								
								if (currentActivity?.complete === true) {
									// La actividad YA está marcada como completada localmente
									
									if (activity.complete === false || !activity.complete) {
										// 🚨 Firebase está intentando desmarcarla - RECHAZAR
										console.warn(`🛡️ [PROTECCIÓN] Actividad ${activity.id} bloqueada: intento de cambiar complete:true → false`);
										console.warn(`   Estado actual: complete=${currentActivity.complete}, complete_time=${currentActivity.complete_time}`);
										console.warn(`   Firebase enviaba: complete=${activity.complete}, complete_time=${activity.complete_time}`);
										
										// PRESERVAR el estado local completado
										return {
											...activity,
											complete: true,
											complete_time: currentActivity.complete_time || activity.complete_time,
											data: currentActivity.data || activity.data,
											valorate: currentActivity.valorate || activity.valorate,
											awarded_points: currentActivity.awarded_points || activity.awarded_points
										};
									}
								}
							}
							
							return activity;
						});
					}

				} catch (error) {
					console.error("Error procesando protección de actividades:", error);
					// Continuar sin bloquear la actualización
				}
				
				const teamExists = currentItems.some((item) => item.id === teamData.id);
				if (!teamExists) {
					console.log(`➕ Adding new team ${teamData.id} to list`);
					dispatch(setTeams([...currentItems, teamData]));
				} else {
					// Primero verificar si hay cambios
					const currentTeam = currentItems.find(item => item.id === teamData.id);
					const hasChanges = !compareRecursive(currentTeam, teamData);
					
					if (!hasChanges) {
						console.log(`⏭️ No changes detected for team ${teamData.id}, skipping update`);
						return; // No changes, no need to update
					}
					
					// Log específico para cambios de posición
					if (currentTeam.lat !== teamData.lat || currentTeam.lon !== teamData.lon) {
						console.log(`📍 Position update for team ${teamData.id}:`, {
							old: { lat: currentTeam.lat, lon: currentTeam.lon },
							new: { lat: teamData.lat, lon: teamData.lon }
						});
					}
					
					// Crear nuevo array con los cambios
					const updatedItems = currentItems.map((item) => {
						if (item.id === teamData.id) {
							return teamData;
						}
						return item;
					});
					
					console.log(`✅ Dispatching setTeams with changes for team ${teamData.id}`);
					dispatch(setTeams(updatedItems));
					
					// Sincronizar selectedTeam si existe y es el mismo equipo
					const currentSelectedTeam = selectedTeamRef.current;
					if (currentSelectedTeam && teamData.id === currentSelectedTeam.id) {
						console.log('🔄 Updating selectedTeam for team device');
						dispatch(updateSelectedTeam(teamData));
						
						// Verificar si se solicita refresh para este equipo
						if (teamData.refreshRequested && teamData.refreshRequested === true) {
							console.log('🔄 Refresh requested for current team, reloading page...');
							
							// Limpiar flag de refresh antes de recargar
							import('../services/firebase').then(({ updateTeam }) => {
								updateTeam(eventId, teamData.id, { 
									refreshRequested: false,
									refreshTimestamp: null
								}).then(() => {
									window.location.reload();
								}).catch(error => {
									console.error('Error clearing refresh flag:', error);
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
			console.log('🔴 SubscriptionManager: Cleaning up listeners for event', eventId);
			unsubEvent();
			unsubAdmin();
			unsubTeams.forEach((unsub) => unsub());
		};
	}, [eventId, dispatch, refresh, sessionToken, selectedTeamId, teamsCount]);
	// ⚠️ IMPORTANTE sobre las dependencias: 
	// - Incluimos 'teamsCount' para recrear listeners solo cuando se añaden/quitan equipos (no por updates)
	// - Incluimos 'selectedTeamId' (no selectedTeam completo) para recrear cuando cambie el equipo seleccionado
	// - Las refs (teamsRef, selectedTeamRef) se actualizan en useEffects separados
	// - Los callbacks usan las refs para acceder al estado MÁS ACTUAL sin causar recreación de listeners
	// - Esto permite que las actualizaciones de posición (lat/lon) lleguen a Redux SIN recrear listeners
	// - Redux propaga los cambios a todos los componentes que usen useSelector normalmente

	return null;
}










