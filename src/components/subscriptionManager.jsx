// src/components/subscriptionManager.jsx
import { useEffect } from "react";
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
		teams.forEach((team) => {
			const unsubTeam = subscribeTeam(eventId, team.id, (teamData) => {
				console.log('🔄 Team update received:', {
					id: teamData.id, 
					name: teamData.name, 
					gadget: teamData.gadget,
					gadgetType: typeof teamData.gadget
				});
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










