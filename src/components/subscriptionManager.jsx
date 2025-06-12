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
import { clearSession } from "../features/session/sessionSlice";

export default function SubscriptionManager() {
	const dispatch = useDispatch();
	const eventId = useSelector((s) => s.event.id);
	const teams = useSelector((s) => s.teams.items);
  const refresh = useSelector((s) => s.session.refresh);
	const sessionToken = useSelector((s) => s.session.token);
	const selectedTeam = useSelector((s) => s.session.selectedTeam);
	

  

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
				const currentItems = teams;
				const teamExists = currentItems.some((item) => item.id === teamData.id);
				if (!teamExists) {
					dispatch(setTeams([...currentItems, teamData]));
				} else {
					const updatedItems = currentItems.map((item) =>
						item.id === teamData.id ? teamData : item
					);
					dispatch(setTeams(updatedItems));
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
	}, [eventId, dispatch, refresh, selectedTeam]);

	return null;
}









