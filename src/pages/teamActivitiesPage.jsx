// src/pages/teamActivitiesPage.jsx
import React, { useMemo, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import BackgroundLayout from "../components/backgroundLayout";
import BackButton from "../components/backButton";
import { addToQueue } from "../features/popup/popupSlice";
import { updateTeamData } from "../features/teams/teamsSlice";
import "../styles/teamActivities.css";

const TeamActivitiesPage = () => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const dispatch = useDispatch();
	const { eventId } = useParams();

	const event = useSelector((state) => state.event.event);
	const teams = useSelector((state) => state.teams.items);

	const handleBack = () => {
		navigate(`/event/${eventId}`);
	};

	// Función para determinar el estado de una actividad (usando useCallback para optimizar)
	const getActivityStatus = useCallback((activity) => {
		if (!activity.complete) {
			return "not_started";
		}
		if (activity.valorate === 0) {
			return "pending_review";
		}
		return "reviewed";
	}, []);

	// Obtener equipos con sus actividades organizadas
	const teamsWithActivities = useMemo(() => {
		return teams.map(team => {
			const activities = (team.activities_data || []).map(activity => ({
				...activity,
				statusKey: getActivityStatus(activity)
			}));

			const completed = activities.filter(a => a.complete).length;
			const total = activities.length;

			return {
				...team,
				activities,
				completedCount: completed,
				totalCount: total,
				pendingCount: total - completed
			};
		}).filter(team => team.device && team.device !== ""); // Solo equipos con dispositivo asignado
	}, [teams, getActivityStatus]);

	const getActivityStatusText = (statusKey) => {
		const statusMap = {
			not_started: t("team_activities.activity_status.not_started", "Sin comenzar"),
			completed: t("team_activities.activity_status.completed", "Completada"),
			pending_review: t("team_activities.activity_status.pending_review", "Pendiente de valorar"),
			reviewed: t("team_activities.activity_status.reviewed", "Valorada")
		};
		return statusMap[statusKey] || statusKey;
	};

	const getActivityStatusClass = (statusKey) => {
		const classMap = {
			not_started: "status-not-started",
			completed: "status-completed",
			pending_review: "status-pending",
			reviewed: "status-reviewed"
		};
		return classMap[statusKey] || "";
	};

	const getActivityTypeText = (typeId) => {
		switch (typeId) {
			case 1: return t("valorate.type_question", "Pregunta");
			case 2: return t("valorate.type_clue", "Pista");
			case 3: return t("valorate.type_media", "Foto/Video");
			case 4: return t("valorate.type_puzzle", "Puzzle");
			case 5: return t("valorate.type_pairs", "Parejas");
			default: return t("valorate.type_unknown", "Desconocido");
		}
	};

	const handleSendActivity = (team, activity) => {
		dispatch(addToQueue({
			titulo: t("team_activities.send_activity", "Enviar Actividad"),
			texto: t("team_activities.send_confirm", "¿Estás seguro de que quieres enviar la actividad \"{{activityName}}\" al equipo \"{{teamName}}\"?", {
				activityName: activity.name,
				teamName: team.name
			}),
			texto_adicional: t("team_activities.send_confirm_desc", "El equipo recibirá una notificación para realizar esta actividad."),
			array_botones: [
				{
					titulo: t("team_activities.cancel_button", "Cancelar"),
					callback: null
				},
				{
					titulo: t("team_activities.send_button", "Sí, enviar"),
					callback: async () => {
						try {
							// Actualizar la clave send en Firebase
							await dispatch(updateTeamData({
								eventId: event.id,
								teamId: team.id,
								changes: {
									send: activity.id
								}
							})).unwrap();

							// Mostrar mensaje de éxito
							dispatch(addToQueue({
								titulo: t("team_activities.activity_sent", "Actividad Enviada"),
								texto: t("team_activities.activity_sent_message", "La actividad \"{{activityName}}\" ha sido enviada al equipo \"{{teamName}}\".", {
									activityName: activity.name,
									teamName: team.name
								}),
								array_botones: [
									{
										titulo: t("close", "Cerrar"),
										callback: null
									}
								],
								overlay: true,
								close_button: true,
								layout: "center"
							}));
						} catch (error) {
							console.error("Error sending activity:", error);
							dispatch(addToQueue({
								titulo: t("error", "Error"),
								texto: t("valorate.update_error", "Error al actualizar la valoración de la actividad"),
								array_botones: [
									{
										titulo: t("close", "Cerrar"),
										callback: null
									}
								],
								overlay: true,
								close_button: true,
								layout: "center"
							}));
						}
					}
				}
			],
			overlay: true,
			close_button: true,
			layout: "center"
		}));
	};

	const handleTeamClick = (team) => {
		navigate(`/admin/team-activities/${eventId}/team/${team.id}`);
	};

	return (
		<BackgroundLayout
			title={t("team_activities.title", "Actividades por Equipos")}
			subtitle={event?.name}
		>
			<BackButton onClick={handleBack} />
			
			<div className="team-activities-container">
				{teamsWithActivities.length === 0 ? (
					<div className="no-teams">
						<div className="empty-icon">👥</div>
						<h3>{t("team_activities.no_teams", "No hay equipos disponibles")}</h3>
						<p>{t("team_activities.no_teams_desc", "Aún no se han configurado equipos para este evento")}</p>
					</div>
				) : (
					<div className="teams-list">
						{teamsWithActivities.map((team) => (
							<div 
								key={team.id}
								className="team-item"
								onClick={() => handleTeamClick(team)}
							>
								<div className="team-header">
									<h4 className="team-name">{team.name}</h4>
									<div className="team-stats">
										<span className="stat-item">
											<span className="stat-number">{team.totalCount}</span>
											<span className="stat-label">{t("team_activities.activities_count", "Actividades")}</span>
										</span>
										<span className="stat-item">
											<span className="stat-number">{team.completedCount}</span>
											<span className="stat-label">{t("team_activities.completed", "Completadas")}</span>
										</span>
										<span className="stat-item">
											<span className="stat-number">{team.pendingCount}</span>
											<span className="stat-label">{t("team_activities.pending", "Pendientes")}</span>
										</span>
									</div>
								</div>
								
								<div className="team-details">
									<div className="detail-item">
										<span className="detail-label">{t("ranking.stats", "Estadísticas")}:</span>
										<span className="detail-value">
											{team.points || 0} {t("team_activities.points", "puntos")}
										</span>
									</div>
								</div>
								
								<div className="team-arrow">›</div>
							</div>
						))}
					</div>
				)}
			</div>
		</BackgroundLayout>
	);
};

export default TeamActivitiesPage;
