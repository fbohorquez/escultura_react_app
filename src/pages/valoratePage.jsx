// src/pages/valoratePage.jsx
import React, { useMemo, useEffect } from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import BackgroundLayout from "../components/backgroundLayout";
import BackButton from "../components/backButton";

const ValoratePage = () => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { eventId } = useParams();

	const event = useSelector((state) => state.event.event);
	const teams = useSelector((state) => state.teams.items);

	// Log para debug
	useEffect(() => {
		console.log('🔍 [ValoratePage] Teams data updated:', {
			teamsCount: teams.length,
			teamsWithActivities: teams.filter(t => t.activities_data?.length > 0).length,
			timestamp: new Date().toISOString()
		});
	}, [teams]);

	const handleBack = () => {
		navigate(`/event/${eventId}`);
	};

	// Obtener todas las actividades pendientes de valoración
	const pendingActivities = useMemo(() => {
		console.log('🔍 [ValoratePage] Calculating pending activities...');
		const activities = [];
		
		teams.forEach(team => {
			if (team.activities_data) {
				team.activities_data.forEach(activity => {
					// Solo incluir actividades completadas pero no valoradas (valorate === 0)
					if (activity.complete && activity.valorate === 0) {
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
		const sortedActivities = activities.sort((a, b) => (b.complete_time || 0) - (a.complete_time || 0));
		
		console.log('🔍 [ValoratePage] Pending activities found:', {
			count: sortedActivities.length,
			activities: sortedActivities.map(a => ({
				team: a.teamName,
				activity: a.name,
				complete: a.complete,
				valorate: a.valorate,
				complete_time: a.complete_time
			}))
		});
		
		return sortedActivities;
	}, [teams]);

	// Forzar actualización cuando cambien los equipos específicamente 
	const teamsDataHash = useMemo(() => {
		return JSON.stringify(teams.map(t => ({
			id: t.id,
			activities_count: t.activities_data?.length || 0,
			completed_activities: t.activities_data?.filter(a => a.complete).length || 0,
			pending_valoration: t.activities_data?.filter(a => a.complete && a.valorate === 0).length || 0
		})));
	}, [teams]);

	useEffect(() => {
		console.log('🔍 [ValoratePage] Teams data hash changed:', teamsDataHash);
	}, [teamsDataHash]);

	const handleActivityClick = (activity) => {
		navigate(`/admin/valorate/${eventId}/activity/${activity.teamId}/${activity.id}`);
	};

	const formatCompletedTime = (timestamp) => {
		if (!timestamp) return t("valorate.unknown_time", "Tiempo desconocido");
		
		const date = new Date(timestamp * 1000);
		return date.toLocaleString();
	};

	const getActivityTypeText = (typeId) => {
		switch (typeId) {
			case 1: return t("valorate.type_question", "Pregunta");
			case 2: return t("valorate.type_clue", "Pista");
			case 3: return t("valorate.type_media", "Foto/Video");
			default: return t("valorate.type_unknown", "Desconocido");
		}
	};

	return (
		<BackgroundLayout
			title={t("valorate.title", "Valorar Actividades")}
			subtitle={event?.name}
		>
			<BackButton onClick={handleBack} />
			
			<div className="valorate-container">
				{pendingActivities.length === 0 ? (
					<div className="no-pending-activities">
						<div className="empty-icon">✅</div>
						<h3>{t("valorate.no_pending", "No hay actividades pendientes de valoración")}</h3>
						<p>{t("valorate.all_reviewed", "Todas las actividades han sido revisadas")}</p>
					</div>
				) : (
					<>
						<div className="valorate-stats">
							<div className="stat-item">
								<span className="stat-number">{pendingActivities.length}</span>
								<span className="stat-label">{t("valorate.pending_count", "Pendientes de valorar")}</span>
							</div>
						</div>

						<div className="activities-list">
							{pendingActivities.map((activity) => (
								<div 
									key={activity.teamKey}
									className="activity-item"
									onClick={() => handleActivityClick(activity)}
								>
									<div className="activity-header">
										<h4 className="activity-name">{activity.name}</h4>
										<span className="activity-type">
											{getActivityTypeText(activity.type?.id)}
										</span>
									</div>
									
									<div className="activity-team">
										<span className="team-label">{t("valorate.team", "Equipo")}:</span>
										<span className="team-name">{activity.teamName}</span>
									</div>
									
									<div className="activity-details">
										<div className="detail-item">
											<span className="detail-label">{t("valorate.points", "Puntos")}:</span>
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

export default ValoratePage;
