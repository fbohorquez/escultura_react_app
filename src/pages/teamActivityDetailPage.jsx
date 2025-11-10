// src/pages/teamActivityDetailPage.jsx
import React, { useMemo, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import BackgroundLayout from "../components/backgroundLayout";
import BackButton from "../components/backButton";
import { addToQueue } from "../features/popup/popupSlice";
import { updateTeamData, updateTeamActivityLocal } from "../features/teams/teamsSlice";
import { updateSelectedTeamActivityLocal } from "../features/session/sessionSlice";
import { notifyActivitySent } from "../services/notificationService";
import "../styles/teamActivities.css";
import { requiresManualReview } from "../utils/activityValidation";

const TeamActivityDetailPage = () => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const dispatch = useDispatch();
	const { eventId, teamId } = useParams();

	const event = useSelector((state) => state.event.event);
	const teams = useSelector((state) => state.teams.items);
	const selectedTeam = useSelector((state) => state.session.selectedTeam);

	const handleBack = () => {
		navigate(`/event/${eventId}/admin/team-activities`);
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
			statusKey: getActivityStatus(activity),
			isDeleted: activity.del === true
		}));
	}, [team, getActivityStatus]);

	// Separar actividades por tipo (en ruta / sin ruta)
	const { inRouteActivities, withoutRouteActivities, hasBothTypes } = useMemo(() => {
		const inRoute = activities.filter(a => !a.without_route);
		const withoutRoute = activities.filter(a => a.without_route === true);
		
		return {
			inRouteActivities: inRoute,
			withoutRouteActivities: withoutRoute,
			hasBothTypes: inRoute.length > 0 && withoutRoute.length > 0
		};
	}, [activities]);

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

	const formatCompletedTime = (timestamp) => {
		if (!timestamp) return "--";
		
		const date = new Date(timestamp * 1000);
		return date.toLocaleString();
	};

	// Nuevo: renderizado de puntos por actividad según si requiere valoración o no
	const renderActivityPoints = useCallback((activity) => {
		const manual = requiresManualReview(activity);
		if (manual) {
			if (activity.valorate === 1 && activity.awarded_points !== undefined) {
				return `${activity.awarded_points} (${t("photo_management.awarded", "otorgados")})`;
			}
			return t("team_activities.activity_status.pending_review", "Pendiente de valorar");
		}
		// Automática: mostrar base y conseguidos
		const base = activity.points || 0;
		const achieved = activity.complete && activity.valorate === 1 ? base : 0;
		return `${base} • ${t("points_earned", "Puntos ganados")}: ${achieved}`;
	}, [t]);

	const handleDeleteActivity = async (activity) => {
		// Mostrar confirmación
		const confirmed = await window.confirm(
			t("team_activities.delete_confirm", "¿Estás seguro de que quieres eliminar la actividad \"{{activityName}}\" del equipo \"{{teamName}}\"?", {
				activityName: activity.name,
				teamName: team.name
			}) + "\n\n" + 
			t("team_activities.delete_confirm_desc", "La actividad se marcará como eliminada y no aparecerá en el mapa ni contará para la puntuación.")
		);

		if (!confirmed) return;

		try {
			console.log("handleDeleteActivity - Deleting activity:", {
				activityId: activity.id,
				activityName: activity.name,
				teamId: team.id,
				eventId: event.id
			});
			
			// Convertir IDs a números para asegurar consistencia
			const teamIdNumber = parseInt(team.id);
			const eventIdNumber = parseInt(event.id);
			
			// Actualizar estado local primero (optimistic update)
			dispatch(updateTeamActivityLocal({
				teamId: teamIdNumber,
				activityId: activity.id,
				updates: { del: true }
			}));
			
			// Si es el equipo seleccionado, actualizarlo también
			if (selectedTeam && selectedTeam.id === teamIdNumber) {
				dispatch(updateSelectedTeamActivityLocal({
					activityId: activity.id,
					updates: { del: true }
				}));
			}
			
			// Actualizar solo esta actividad de forma atómica en Firebase
			const { updateTeamActivity } = await import('../services/firebase');
			await updateTeamActivity(eventIdNumber, teamIdNumber, activity.id, {
				del: true // Marcar esta actividad como eliminada
			});
			
			console.log("Activity deleted successfully");

			// Mostrar mensaje de éxito
			dispatch(addToQueue({
				titulo: t("team_activities.activity_deleted", "Actividad Eliminada"),
				texto: t("team_activities.activity_deleted_message", "La actividad \"{{activityName}}\" ha sido eliminada del equipo \"{{teamName}}\".", {
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
			console.error("Error deleting activity:", error);
			dispatch(addToQueue({
				titulo: t("error", "Error"),
				texto: t("team_activities.delete_error", "Error al eliminar la actividad"),
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
	};

	const handleRestoreActivity = async (activity) => {
		// Mostrar confirmación
		const confirmed = await window.confirm(
			t("team_activities.restore_confirm", "¿Estás seguro de que quieres restaurar la actividad \"{{activityName}}\" del equipo \"{{teamName}}\"?", {
				activityName: activity.name,
				teamName: team.name
			}) + "\n\n" + 
			t("team_activities.restore_confirm_desc", "La actividad volverá a aparecer en el mapa y contará para la puntuación.")
		);

		if (!confirmed) return;

		try {
			console.log("handleRestoreActivity - Restoring activity:", {
				activityId: activity.id,
				activityName: activity.name,
				teamId: team.id,
				eventId: event.id
			});
			
			// Convertir IDs a números para asegurar consistencia
			const teamIdNumber = parseInt(team.id);
			const eventIdNumber = parseInt(event.id);
			
			// Actualizar estado local primero (optimistic update)
			dispatch(updateTeamActivityLocal({
				teamId: teamIdNumber,
				activityId: activity.id,
				updates: { del: false }
			}));
			
			// Si es el equipo seleccionado, actualizarlo también
			if (selectedTeam && selectedTeam.id === teamIdNumber) {
				dispatch(updateSelectedTeamActivityLocal({
					activityId: activity.id,
					updates: { del: false }
				}));
			}
			
			// Actualizar solo esta actividad de forma atómica en Firebase, poniendo del a false
			const { updateTeamActivity } = await import('../services/firebase');
			await updateTeamActivity(eventIdNumber, teamIdNumber, activity.id, {
				del: false
			});
			
			console.log("Activity restored successfully");

			// Mostrar mensaje de éxito
			dispatch(addToQueue({
				titulo: t("team_activities.activity_restored", "Actividad Restaurada"),
				texto: t("team_activities.activity_restored_message", "La actividad \"{{activityName}}\" ha sido restaurada en el equipo \"{{teamName}}\".", {
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
			console.error("Error restoring activity:", error);
			dispatch(addToQueue({
				titulo: t("error", "Error"),
				texto: t("team_activities.restore_error", "Error al restaurar la actividad"),
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
	};

	const handleSendActivity = async (activity) => {
		// Mostrar popup con 3 opciones: Cancelar, Enviar, Forzar
		dispatch(addToQueue({
			titulo: t("team_activities.send_confirm_title", "Enviar Actividad"),
			texto: t("team_activities.send_options_message", "¿Cómo quieres enviar la actividad \"{{activityName}}\" al equipo \"{{teamName}}\"?", {
				activityName: activity.name,
				teamName: team.name
			}) + "\n\n" + 
			t("team_activities.send_options_desc", "• Enviar: El equipo puede aceptar o rechazar la actividad\n• Forzar: El equipo debe realizar la actividad obligatoriamente"),
			array_botones: [
				{
					titulo: t("team_activities.cancel_button", "Cancelar"),
					callback: () => {
						// No hacer nada, solo cerrar el popup
						console.log('🚫 Envío de actividad cancelado');
					}
				},
				{
					titulo: t("team_activities.send_button", "Enviar"),
					callback: async () => {
						try {
							// Enviar con ID normal
							await dispatch(updateTeamData({
								eventId: event.id,
								teamId: team.id,
								changes: {
									send: activity.id
								}
							})).unwrap();

							// Enviar notificación push al equipo sobre la nueva actividad
							try {
								await notifyActivitySent(
									event.id, 
									team.id, 
									activity.id, 
									activity.name, 
									false // isForced = false
								);
								console.log('Notificación de actividad enviada al equipo');
							} catch (notificationError) {
								console.warn('Error enviando notificación de actividad:', notificationError);
								// No fallar el envío por error de notificación
							}

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
								texto: t("team_activities.send_error", "Error al enviar la actividad"),
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
				},
				{
					titulo: t("team_activities.force_button", "Forzar"),
					callback: async () => {
						try {
							// Enviar con ID forzado (100 millones + ID de actividad)
							const forcedId = 100000000 + activity.id;
							await dispatch(updateTeamData({
								eventId: event.id,
								teamId: team.id,
								changes: {
									send: forcedId
								}
							})).unwrap();

							// Enviar notificación push al equipo sobre la actividad forzada
							try {
								await notifyActivitySent(
									event.id, 
									team.id, 
									activity.id, 
									activity.name, 
									true // isForced = true
								);
								console.log('Notificación de actividad forzada enviada al equipo');
							} catch (notificationError) {
								console.warn('Error enviando notificación de actividad forzada:', notificationError);
								// No fallar el forzado por error de notificación
							}

							// Mostrar mensaje de éxito
							dispatch(addToQueue({
								titulo: t("team_activities.activity_forced", "Actividad Forzada"),
								texto: t("team_activities.activity_forced_message", "La actividad \"{{activityName}}\" ha sido enviada de forma obligatoria al equipo \"{{teamName}}\".", {
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
							console.error("Error forcing activity:", error);
							dispatch(addToQueue({
								titulo: t("error", "Error"),
								texto: t("team_activities.force_error", "Error al forzar la actividad"),
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
			close_button: false, // No permitir cerrar sin elegir una opción
			layout: "center",
			claseCss: "popup-send-activity-options"
		}));
	};

	const handleActivityClick = (activity) => {
		// Si la actividad está completada, navegar a la página de valoración
		if (activity.complete) {
				navigate(`/event/${eventId}/admin/valorate/activity/${team.id}/${activity.id}`, {
				state: { from: 'team-activities' }
			});
		}
	};

	// Función para renderizar una lista de actividades
	const renderActivitiesList = (activitiesList) => (
		activitiesList.map((activity) => (
			<div
				key={activity.id}
				className={`activity-item ${
					activity.complete ? "activity-clickable" : ""
				} ${activity.isDeleted ? "deleted" : ""}`}
				onClick={() =>
					activity.complete && !activity.isDeleted
						? handleActivityClick(activity)
						: null
				}
			>
				<div className="activity-header">
					<h4 className="activity-name">{activity.name}</h4>
					<div className="activity-actions">
						<span
							className={`activity-status ${getActivityStatusClass(
								activity.statusKey
							)}`}
						>
							{getActivityStatusText(activity.statusKey)}
						</span>
						<span className="activity-type">
							{getActivityTypeText(activity.type?.id)}
						</span>
					</div>
				</div>

				<div className="activity-details">
					<div className="detail-item">
						<span className="detail-label">
							{t("team_activities.points", "Puntos")}:
						</span>
						<span className="detail-value">
							{renderActivityPoints(activity)}
						</span>
					</div>
					<div className="detail-item">
						<span className="detail-label">
							{t("valorate.completed", "Completada")}:
						</span>
						<span className="detail-value">
							{formatCompletedTime(activity.complete_time)}
						</span>
					</div>
				</div>

				<div className="activity-bottom">
					<div
						style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}
					>
						<button
							className="send-activity-btn"
							onClick={async (e) => {
								e.stopPropagation();
								await handleSendActivity(activity);
							}}
							title={t(
								"team_activities.send_activity",
								"Enviar Actividad"
							)}
						>
							<svg
								viewBox="0 0 24 24"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
								width="16"
								height="16"
							>
								<g id="SVGRepo_bgCarrier" stroke-width="0"></g>
								<g
									id="SVGRepo_tracerCarrier"
									stroke-linecap="round"
									stroke-linejoin="round"
								></g>
								<g id="SVGRepo_iconCarrier">
									{" "}
									<path
										d="M10.3009 13.6949L20.102 3.89742M10.5795 14.1355L12.8019 18.5804C13.339 19.6545 13.6075 20.1916 13.9458 20.3356C14.2394 20.4606 14.575 20.4379 14.8492 20.2747C15.1651 20.0866 15.3591 19.5183 15.7472 18.3818L19.9463 6.08434C20.2845 5.09409 20.4535 4.59896 20.3378 4.27142C20.2371 3.98648 20.013 3.76234 19.7281 3.66167C19.4005 3.54595 18.9054 3.71502 17.9151 4.05315L5.61763 8.2523C4.48114 8.64037 3.91289 8.83441 3.72478 9.15032C3.56153 9.42447 3.53891 9.76007 3.66389 10.0536C3.80791 10.3919 4.34498 10.6605 5.41912 11.1975L9.86397 13.42C10.041 13.5085 10.1295 13.5527 10.2061 13.6118C10.2742 13.6643 10.3352 13.7253 10.3876 13.7933C10.4468 13.87 10.491 13.9585 10.5795 14.1355Z"
										stroke="#FFFFFF"
										stroke-width="2"
										stroke-linecap="round"
										stroke-linejoin="round"
									></path>{" "}
								</g>
							</svg>
							{t("team_activities.send_activity", "Enviar")}
						</button>

						{activity.isDeleted ? (
							<button
								className="restore-activity-btn"
								onClick={async (e) => {
									e.stopPropagation();
									await handleRestoreActivity(activity);
								}}
								title={t(
									"team_activities.restore_activity",
									"Restaurar Actividad"
								)}
							>
								🔄 {t("team_activities.restore_activity", "Restaurar")}
							</button>
						) : (
							<button
								className="delete-activity-btn"
								onClick={async (e) => {
									e.stopPropagation();
									await handleDeleteActivity(activity);
								}}
								title={t(
									"team_activities.delete_activity",
									"Eliminar Actividad"
								)}
							>
								<svg
									viewBox="0 0 24 24"
									fill="none"
									xmlns="http://www.w3.org/2000/svg"
									width="16"
									height="16"
								>
									<g id="SVGRepo_bgCarrier" stroke-width="0"></g>
									<g
										id="SVGRepo_tracerCarrier"
										stroke-linecap="round"
										stroke-linejoin="round"
									></g>
									<g id="SVGRepo_iconCarrier">
										{" "}
										<path
											d="M10 11V17"
											stroke="#FFFFFF"
											stroke-width="2"
											stroke-linecap="round"
											stroke-linejoin="round"
										></path>{" "}
										<path
											d="M14 11V17"
											stroke="#FFFFFF"
											stroke-width="2"
											stroke-linecap="round"
											stroke-linejoin="round"
										></path>{" "}
										<path
											d="M4 7H20"
											stroke="#FFFFFF"
											stroke-width="2"
											stroke-linecap="round"
											stroke-linejoin="round"
										></path>{" "}
										<path
											d="M6 7H12H18V18C18 19.6569 16.6569 21 15 21H9C7.34315 21 6 19.6569 6 18V7Z"
											stroke="#FFFFFF"
											stroke-width="2"
											stroke-linecap="round"
											stroke-linejoin="round"
										></path>{" "}
										<path
											d="M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5V7H9V5Z"
											stroke="#FFFFFF"
											stroke-width="2"
											stroke-linecap="round"
											stroke-linejoin="round"
										></path>{" "}
									</g>
								</svg>

								{t("team_activities.delete_activity", "Eliminar")}
							</button>
						)}
					</div>
					{activity.complete && !activity.isDeleted && (
						<div className="activity-arrow">›</div>
					)}
				</div>
			</div>
		))
	);

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
			title={`${team.name}`}
			subtitle={event?.name}
		>
			<BackButton onClick={handleBack} />

			<div className="team-activities-container">
				<div className="team-activities-stats">
					<div className="stat-item">
						<span className="stat-number">
							{activities.filter((a) => !a.isDeleted).length}
						</span>
						<span className="stat-label">
							{t("team_activities.activities_count", "Actividades activas")}
						</span>
					</div>
					<div className="stat-item">
						<span className="stat-number">
							{activities.filter((a) => a.complete && !a.isDeleted).length}
						</span>
						<span className="stat-label">
							{t("team_activities.completed", "Completadas")}
						</span>
					</div>
					<div className="stat-item">
						<span className="stat-number">
							{activities.filter((a) => !a.complete && !a.isDeleted).length}
						</span>
						<span className="stat-label">
							{t("team_activities.pending", "Pendientes")}
						</span>
					</div>
					<div className="stat-item">
						<span className="stat-number">
							{activities.filter((a) => a.isDeleted).length}
						</span>
						<span className="stat-label">
							{t("team_activities.deleted", "Eliminadas")}
						</span>
					</div>
					<div className="stat-item">
						<span className="stat-number">{team.points || 0}</span>
						<span className="stat-label">
							{t("team_activities.points", "Puntos")}
						</span>
					</div>
				</div>


			{activities.length === 0 ? (
				<div className="no-activities">
					<div className="empty-icon">📋</div>
					<h3>{t("valorate.no_pending", "No hay actividades")}</h3>
					<p>
						{t(
							"valorate.no_pending_desc",
							"Este equipo no tiene actividades asignadas"
						)}
					</p>
				</div>
			) : hasBothTypes ? (
				<>
					{/* Sección de Actividades en Ruta */}
					{inRouteActivities.length > 0 && (
						<>
							<h3 className="activities-section-title">
								{t("team_activities.in_route_activities", "Actividades en ruta")}
							</h3>
							<div className="activities-list">
								{renderActivitiesList(inRouteActivities)}
							</div>
						</>
					)}

					{/* Sección de Actividades sin Ruta */}
					{withoutRouteActivities.length > 0 && (
						<>
							<h3 className="activities-section-title">
								{t("team_activities.without_route_activities", "Actividades sin ruta")}
							</h3>
							<div className="activities-list">
								{renderActivitiesList(withoutRouteActivities)}
							</div>
						</>
					)}
				</>
			) : (
				<div className="activities-list">
					{renderActivitiesList(activities)}
				</div>
			)}
		</div>
		</BackgroundLayout>
	);
};

export default TeamActivityDetailPage;
