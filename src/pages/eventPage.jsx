import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import EventHeader from "../components/eventHeader";
import EventMap from "../components/eventMap";
import ActivityRunner from "../components/ActivityRunner";
import DebugPanel from "../components/DebugPanel";
import AdminTaskbar from "../components/adminTaskbar";
import EventFooter from "../components/eventFooter";
import { endActivity } from "../features/activities/activitiesSlice";
import { useKeepalive } from "../hooks/useKeepalive";
import { useAppStateTracker } from "../hooks/useAppStateTracker";

const EventPage = () => {
	const { t } = useTranslation();
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const { setMapState, clearActivity } = useAppStateTracker();

	const event = useSelector((state) => state.event.event);
	const selectedTeam = useSelector((state) => state.session.selectedTeam);
	const teamPhoto = useSelector((state) => state.session.teamPhoto);
	const isAdmin = useSelector((state) => state.session.isAdmin);
	const { currentActivity, isActivityActive } = useSelector((state) => state.activities);
	const [collapsed, setCollapsed] = useState(false);

	

	// Construir la URL de la foto del equipo usando la misma lógica que en teamPage
	const getTeamPhotoUrl = () => {
		if (teamPhoto) {
			// Si hay foto local, usar esa
			return teamPhoto;
		} else if (selectedTeam?.photo && selectedTeam.photo !== "default_team_photo") {
			// Si el equipo tiene foto en el servidor, construir la URL
			return `${(import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api').replace('/api', '')}/uploads/events/event_${event.id}/team_${selectedTeam.id}/photo.jpeg`;
		}
		return null;
	};

	const handleCollapse = () => setCollapsed((prev) => !prev);

	const handleActivityComplete = (success, media) => {
		// ActivityRunner ya ha completado la actividad con Firebase sync
		// Solo necesitamos manejar cualquier lógica adicional aquí si es necesario
		console.log('Activity completed:', { success, media });
	};

	const handleActivityExit = () => {
		dispatch(endActivity());
		// Limpiar actividad y volver al estado de mapa
		clearActivity();
	};

	const handleSystemStatusClick = () => {
		navigate('/system-status');
	};

	// Actualizar estado a "mapa" cuando no hay actividad activa
	useEffect(() => {
		if (!isActivityActive) {
			setMapState();
		}
		localStorage.setItem("goToMap", "true");
	}, [isActivityActive, setMapState]);

	useKeepalive(event.id, selectedTeam?.id);

	return (
		<div className="event-page">
			<EventHeader
				eventName={event.name}
				teamName={selectedTeam?.name || t("admin")}
				teamPhoto={getTeamPhotoUrl()}
				logo={event.logo}
				onCollapse={handleCollapse}
				collapsed={collapsed}
			/>
			{isAdmin && (
				<div>
					<AdminTaskbar />
				</div>
			)}
			<div className="map-container">
				<EventMap />
				
				{/* Botón flotante del sistema de estado */}
				{isAdmin && (
					<button
						onClick={handleSystemStatusClick}
						className="btn-status fixed bottom-20 right-4 z-50 bg-gray-800 hover:bg-gray-700 text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
						title="Sistema de Estado"
					>
						<svg fill="#000000" version="1.1" id="Icon" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 24 24" enable-background="new 0 0 24 24" xml:space="preserve"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M12,0C5.38,0,0,5.38,0,12s5.38,12,12,12s12-5.38,12-12S18.62,0,12,0z M12,22C6.49,22,2,17.51,2,12S6.49,2,12,2 s10,4.49,10,10S17.51,22,12,22z M10.5,10h3v8h-3V10z M10.5,5h3v3h-3V5z"></path> </g></svg>
					</button>
				)}
			</div>
			{/* <DebugPanel /> */}
			{/* Footer flotante con controles */}
			<EventFooter eventId={event.id} collapsed={collapsed} />

			{/* Mantener el mapa montado y mostrar ActivityRunner como overlay cuando hay actividad */}
			{isActivityActive && currentActivity && (
				<ActivityRunner
					activity={currentActivity}
					onComplete={handleActivityComplete}
					onExit={handleActivityExit}
				/>
			)}
		</div>
	);
};

export default EventPage;









