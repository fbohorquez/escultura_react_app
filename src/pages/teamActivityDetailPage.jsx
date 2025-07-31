// src/pages/teamActivityDetailPage.jsx
import React, { useMemo, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import BackgroundLayout from "../components/backgroundLayout";
import BackButton from "../components/backButton";
import { addToQueue } from "../features/popup/popupSlice";
import { updateTeamData } from "../features/teams/teamsSlice";
import "../styles/teamActivities.css";

const TeamActivityDetailPage = () => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const dispatch = useDispatch();
	const { eventId, teamId } = useParams();

	const event = useSelector((state) => state.event.event);
	const teams = useSelector((state) => state.teams.items);

	const handleBack = () => {
		navigate(`/admin/team-activities/${eventId}`);
	};

	// Encontrar el equipo
	const team = useMemo(() => {
		return teams.find(t => t.id === parseInt(teamId));
	}, [teams, teamId]);

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

	// Preparar actividades con información de estado
	const activities = useMemo(() => {
		if (!team?.activities_data) return [];
		
		return team.activities_data.map(activity => ({
			...activity,
			statusKey: getActivityStatus(activity)
		}));
	}, [team, getActivityStatus]);

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
			default: return t("valorate.type_unknown", "Desconocido");
		}
	};

	const formatCompletedTime = (timestamp) => {
		if (!timestamp) return "--";
		
		const date = new Date(timestamp * 1000);
		return date.toLocaleString();
	};

	const handleSendActivity = (activity) => {
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

	const handleActivityClick = (activity) => {
		// Si la actividad está completada, navegar a la página de valoración
		if (activity.complete) {
			navigate(`/admin/valorate/${eventId}/activity/${team.id}/${activity.id}`, {
				state: { from: 'team-activities' }
			});
		}
	};

	if (!team) {
		return (
			<BackgroundLayout
				title={t("team_activities.title", "Actividades por Equipos")}
				subtitle={event?.name}
			>
				<BackButton onClick={handleBack} />
				<div className="error-container">
					<div className="error-content">
						<h2>{t("valorate.not_found", "Equipo no encontrado")}</h2>
						<p>{t("valorate.not_found_desc", "No se pudo encontrar el equipo solicitado")}</p>
					</div>
				</div>
			</BackgroundLayout>
		);
	}

	return (
		<BackgroundLayout
			title={`${t("team_activities.team", "Equipo")}: ${team.name}`}
			subtitle={event?.name}
		>
			<BackButton onClick={handleBack} />
			
			<div className="team-activities-container">
				<div className="team-activities-stats">
					<div className="stat-item">
						<span className="stat-number">{activities.length}</span>
						<span className="stat-label">{t("team_activities.activities_count", "Actividades totales")}</span>
					</div>
					<div className="stat-item">
						<span className="stat-number">{activities.filter(a => a.complete).length}</span>
						<span className="stat-label">{t("team_activities.completed", "Completadas")}</span>
					</div>
					<div className="stat-item">
						<span className="stat-number">{activities.filter(a => !a.complete).length}</span>
						<span className="stat-label">{t("team_activities.pending", "Pendientes")}</span>
					</div>
					<div className="stat-item">
						<span className="stat-number">{team.points || 0}</span>
						<span className="stat-label">{t("team_activities.points", "Puntos")}</span>
					</div>
				</div>

				{activities.length === 0 ? (
					<div className="no-activities">
						<div className="empty-icon">📋</div>
						<h3>{t("valorate.no_pending", "No hay actividades")}</h3>
						<p>{t("valorate.no_pending_desc", "Este equipo no tiene actividades asignadas")}</p>
					</div>
				) : (
					<div className="activities-list">
						{activities.map((activity) => (
							<div 
								key={activity.id}
								className={`activity-item ${activity.complete ? 'activity-clickable' : ''}`}
								onClick={() => activity.complete ? handleActivityClick(activity) : null}
							>
								<div className="activity-header">
									<h4 className="activity-name">{activity.name}</h4>
									<div className="activity-actions">
										<span className={`activity-status ${getActivityStatusClass(activity.statusKey)}`}>
											{getActivityStatusText(activity.statusKey)}
										</span>
										<span className="activity-type">
											{getActivityTypeText(activity.type?.id)}
										</span>
									</div>
								</div>
								
								<div className="activity-details">
									<div className="detail-item">
										<span className="detail-label">{t("team_activities.points", "Puntos")}:</span>
										<span className="detail-value">
											{activity.valorate === 1 && activity.awarded_points !== undefined 
												? `${activity.awarded_points} (${t("photo_management.awarded", "otorgados")})`
												: activity.points || 0
											}
										</span>
									</div>
									<div className="detail-item">
										<span className="detail-label">{t("valorate.completed", "Completada")}:</span>
										<span className="detail-value">{formatCompletedTime(activity.complete_time)}</span>
									</div>
								</div>

								<div className="activity-bottom">
									<button
										className="send-activity-btn"
										onClick={(e) => {
											e.stopPropagation();
											handleSendActivity(activity);
										}}
										title={t("team_activities.send_activity", "Enviar Actividad")}
									>
										📤 {t("team_activities.send_activity", "Enviar")}
									</button>
									{activity.complete && (
										<div className="activity-arrow">›</div>
									)}
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</BackgroundLayout>
	);
};

export default TeamActivityDetailPage;
