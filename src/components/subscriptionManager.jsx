// src/components/subscriptionManager.jsx
import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";

import {
	subscribeToEvent,
	subscribeTeam,
	subscribeAdmin,
} from "../services/firebase";
import { setEvent } from "../features/event/eventSlice";
import { setTeams } from "../features/teams/teamsSlice";
import { setAdmin } from "../features/admin/adminSlice";
import { clearSession, updateSelectedTeam } from "../features/session/sessionSlice";

export default function SubscriptionManager() {
	const dispatch = useDispatch();
	const eventId = useSelector((s) => s.event.id);
	const teams = useSelector((s) => s.teams.items);
  const refresh = useSelector((s) => s.session.refresh);
	const sessionToken = useSelector((s) => s.session.token);
	const selectedTeam = useSelector((s) => s.session.selectedTeam);
	

  let compareRecursive = (obj1, obj2) => {
		if (Array.isArray(obj1) && Array.isArray(obj2)) {
			if (obj1.length !== obj2.length) return false;
			return obj1.every((item, index) => compareRecursive(item, obj2[index]));
		} else if (typeof obj1 === "object" && typeof obj2 === "object") {
			const keys1 = Object.keys(obj1);
			const keys2 = Object.keys(obj2);
			if (keys1.length !== keys2.length) return false;
			return keys1.every((key) => {
				if (!keys2.includes(key)) return false;
				return compareRecursive(obj1[key], obj2[key]);
			});
		} else {
			return obj1 === obj2;
		}
	};

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
				console.log('🔄 Team update received:', teamData.id, teamData.activities_data?.length);
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
						if (!compareRecursive(teamData, selectedTeam)) {
							dispatch(updateSelectedTeam(teamData));
						}					
					}
					
					if (
						teamData && selectedTeam &&
						teamData.id === selectedTeam.id &&
						teamData.device !== sessionToken &&
						sessionToken !== ""
					) {
						dispatch(clearSession());
						localStorage.removeItem("lastRoute");
						localStorage.removeItem("persist:root");
						window.location.reload();
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












