// src/pages/photoManagementPage.jsx
import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import BackgroundLayout from "../components/backgroundLayout";
import BackButton from "../components/backButton";
import "../styles/photoManagement.css";

const PhotoManagementPage = () => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { eventId } = useParams();

	const event = useSelector((state) => state.event.event);
	const teams = useSelector((state) => state.teams.items);

	const handleBack = () => {
		navigate(`/event/${eventId}`);
	};

	// Obtener todas las actividades de foto/video (tipo 3) de todos los equipos
	const photoVideoActivities = useMemo(() => {
		const activities = [];
		
		teams.forEach(team => {
			if (team.activities_data) {
				team.activities_data.forEach(activity => {
					// Solo incluir actividades de tipo foto/video (tipo 3) que estén completadas
					if (activity.type?.id === 3 && activity.complete) {
						activities.push({
							...activity,
							teamId: team.id,
							teamName: team.name,
							teamKey: `${team.id}-${activity.id}`
						});
					}
				});
			}
		});
		
		// Ordenar por tiempo de completado (más recientes primero)
		return activities.sort((a, b) => (b.complete_time || 0) - (a.complete_time || 0));
	}, [teams]);

	const handleActivityClick = (activity) => {
		navigate(`/admin/valorate/${eventId}/activity/${activity.teamId}/${activity.id}`, {
			state: { from: 'photos' }
		});
	};

	const formatCompletedTime = (timestamp) => {
		if (!timestamp) return t("photo_management.unknown_time", "Tiempo desconocido");
		
		const date = new Date(timestamp * 1000);
		return date.toLocaleString();
	};

	const getStatusText = (activity) => {
		if (activity.valorate === 1) {
			return t("photo_management.reviewed", "Revisada");
		}
		return t("photo_management.pending_review", "Pendiente de revisar");
	};

	const getStatusClass = (activity) => {
		if (activity.valorate === 1) {
			return "status-reviewed";
		}
		return "status-pending";
	};

	return (
		<BackgroundLayout
			title={t("photo_management.title", "Gestión de Fotos/Videos")}
			subtitle={event?.name}
		>
			<BackButton onClick={handleBack} />
			
			<div className="photo-management-container">
				{photoVideoActivities.length === 0 ? (
					<div className="no-photo-activities">
						<div className="empty-icon">📸</div>
						<h3>{t("photo_management.no_activities", "No hay actividades de foto/video")}</h3>
						<p>{t("photo_management.no_activities_desc", "Aún no se han completado actividades de foto o video")}</p>
					</div>
				) : (
					<>
						<div className="photo-management-stats">
							<div className="stat-item">
								<span className="stat-number">{photoVideoActivities.length}</span>
								<span className="stat-label">{t("photo_management.total_activities", "Actividades de foto/video")}</span>
							</div>
							<div className="stat-item">
								<span className="stat-number">{photoVideoActivities.filter(a => a.valorate === 0).length}</span>
								<span className="stat-label">{t("photo_management.pending_count", "Pendientes de revisar")}</span>
							</div>
							<div className="stat-item">
								<span className="stat-number">{photoVideoActivities.filter(a => a.valorate === 1).length}</span>
								<span className="stat-label">{t("photo_management.reviewed_count", "Revisadas")}</span>
							</div>
						</div>

						<div className="activities-list">
							{photoVideoActivities.map((activity) => (
								<div 
									key={activity.teamKey}
									className={`activity-item photo-activity-item ${getStatusClass(activity)}`}
									onClick={() => handleActivityClick(activity)}
								>
									<div className="activity-header">
										<h4 className="activity-name">{activity.name}</h4>
										<span className={`activity-status ${getStatusClass(activity)}`}>
											{getStatusText(activity)}
										</span>
									</div>
									
									<div className="activity-team">
										<span className="team-label">{t("photo_management.team", "Equipo")}:</span>
										<span className="team-name">{activity.teamName}</span>
									</div>
									
									<div className="activity-details">
										<div className="detail-item">
											<span className="detail-label">{t("photo_management.points", "Puntos")}:</span>
											<span className="detail-value">
												{activity.valorate === 1 && activity.awarded_points !== undefined 
													? `${activity.awarded_points} (${t("photo_management.awarded", "otorgados")})`
													: activity.points || 0
												}
											</span>
										</div>
										<div className="detail-item">
											<span className="detail-label">{t("photo_management.completed", "Completada")}:</span>
											<span className="detail-value">{formatCompletedTime(activity.complete_time)}</span>
										</div>
									</div>

									{activity.data && (
										<div className="activity-preview">
											<div className="preview-indicator">
												📷 {t("photo_management.has_media", "Contenido multimedia disponible")}
											</div>
										</div>
									)}
									
									<div className="activity-arrow">›</div>
								</div>
							))}
						</div>
					</>
				)}
			</div>
		</BackgroundLayout>
	);
};

export default PhotoManagementPage;
