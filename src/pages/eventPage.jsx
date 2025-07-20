import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import EventHeader from "../components/eventHeader";
import EventMap from "../components/eventMap";
import ActivityRunner from "../components/ActivityRunner";
import DebugPanel from "../components/DebugPanel";
import AdminTaskbar from "../components/adminTaskbar";
import { endActivity } from "../features/activities/activitiesSlice";

const EventPage = () => {
	const { t } = useTranslation();
	const dispatch = useDispatch();

	const event = useSelector((state) => state.event.event);
	const selectedTeam = useSelector((state) => state.session.selectedTeam);
	const teamPhoto = useSelector((state) => state.session.teamPhoto);
	const isAdmin = useSelector((state) => state.session.isAdmin);
	const { currentActivity, isActivityActive } = useSelector((state) => state.activities);
	const [collapsed, setCollapsed] = useState(false);

	const handleCollapse = () => setCollapsed((prev) => !prev);

	const handleActivityComplete = (success, media) => {
		// ActivityRunner ya ha completado la actividad con Firebase sync
		// Solo necesitamos manejar cualquier lógica adicional aquí si es necesario
		console.log('Activity completed:', { success, media });
	};

	const handleActivityExit = () => {
		dispatch(endActivity());
	};

	if (isActivityActive && currentActivity) {
		return (
			<ActivityRunner
				activity={currentActivity}
				onComplete={handleActivityComplete}
				onExit={handleActivityExit}
			/>
		);
	}

	return (
		<div className="event-page">
			<EventHeader
				eventName={event.name}
				teamName={selectedTeam?.name || t("admin")}
				teamPhoto={teamPhoto}
				logo={event.logo}
				onCollapse={handleCollapse}
				collapsed={collapsed}
			/>
			{isAdmin && (
				<AdminTaskbar />
			)}
			<div className="map-container">
				<EventMap />
			</div>
			<DebugPanel />
			{/* Aquí va la barra de acciones (chat, cronómetro, bromas) */}
		</div>
	);
};

export default EventPage;





