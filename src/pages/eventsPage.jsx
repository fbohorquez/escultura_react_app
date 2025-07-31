// src/pages/eventsPage.jsx
import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchEvents } from "../features/events/eventsSlice";
import { initEventRoot } from "../features/event/eventSlice";
import { setSelectedTeam, setTeamPhoto, setToken } from "../features/session/sessionSlice";
import { tryRestoreSavedSession, getSavedSession, removeSavedSession } from "../services/eventLoadBehavior";
import iconDate from "../assets/icon_date.png";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import BackgroundLayout from "../components/backgroundLayout";

const EventsPage = () => {
  const { t } = useTranslation();
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const { items: events, status } = useSelector((state) => state.events);
  
	useEffect(() => {
		if (status === "idle") {
			dispatch(fetchEvents());
		}
	}, [status, dispatch]);

	const handleSelect = async (eventId) => {
		try {
			// Verificar si hay una sesión guardada para este evento
			if (tryRestoreSavedSession(eventId)) {
				const savedSession = getSavedSession(eventId);
				if (savedSession) {
					console.log('🔄 Restoring saved session for event:', eventId);
					
					// Inicializar el evento
					await dispatch(initEventRoot({ eventId }));
					
					// Restaurar la sesión
					dispatch(setSelectedTeam(savedSession.selectedTeam));
					dispatch(setTeamPhoto(savedSession.teamPhoto));
					dispatch(setToken(savedSession.token));
					
					// Ir directamente al evento
					navigate(`/event/${eventId}`);
					
					// Remover la sesión guardada (ya se restauró)
					removeSavedSession(eventId);
					return;
				}
			}
			
			// Comportamiento normal si no hay sesión guardada
			await dispatch(initEventRoot({ eventId }));
			navigate(`/teams/${eventId}`);
		} catch (err) {
			console.error(err);
		}
	};

	return (
		<BackgroundLayout title={t("events.title")} subtitle={t("events.subtitle")}>
			<div className="listing">
				{events.map((event) => (
					<div
						key={event.id}
						className="listing-item"
						onClick={() => handleSelect(event.id)}
					>
						<img src={event.logo} alt={event.name} className="listing-item-img" />
            <div className="listing-item-details">
              <h3 className="listing-item-name">{event.name}</h3>
              <div className="eventLabelDate">
                <img src={iconDate} alt="icon date" className="iconDate" />
                <p className="eventLabel">Fecha:</p>
              </div>
              <p className="eventDate">
                {new Date(event.event_at).toLocaleDateString()}
              </p>
            </div>
					</div>
				))}
			</div>
		</BackgroundLayout>
	);
};

export default EventsPage;










