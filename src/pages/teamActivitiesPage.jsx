// src/pages/teamActivitiesPage.jsx
import React, { useMemo, useCallback } from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import BackgroundLayout from "../components/backgroundLayout";
import BackButton from "../components/backButton";
import "../styles/teamActivities.css";

const TeamActivitiesPage = () => {
	const { t } = useTranslation();
	const navigate = useNavigate();
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
			// Filtrar actividades eliminadas para el conteo
			const activeActivities = (team.activities_data || []).filter(activity => activity.del !== true);
			const activities = activeActivities.map(activity => ({
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
