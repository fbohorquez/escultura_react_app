// src/pages/teamActivitiesPage.jsx
import React, { useMemo, useCallback } from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import BackgroundLayout from "../components/backgroundLayout";
import BackButton from "../components/backButton";
import TeamConnectionStatus from "../components/TeamConnectionStatus";
import { useKeepalive } from "../hooks/useKeepalive";
import { getAppStateLabel } from "../constants/appStates";
import { isTeamActive } from "../utils/keepaliveUtils";
import "../styles/teamActivities.css";

const TeamActivitiesPage = () => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { eventId } = useParams();

	const event = useSelector((state) => state.event.event);
	const teams = useSelector((state) => state.teams.items);
	const keepaliveTeams = useSelector((state) => state.keepalive.teams);

	// Estado para cambiar entre vistas (equipos agrupados o grupos individuales)
	const [currentView, setCurrentView] = React.useState('groups');

	// Inicializar keepalive en modo solo lectura para ver el estado de los equipos
	useKeepalive(eventId, null);

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

	// Detectar si hay equipos agrupados
	const hasGroupedTeams = useMemo(() => {
		return teams.some(team => team.name.includes('#'));
	}, [teams]);

	// Obtener equipos agrupados por nombre base (para vista "Equipos")
	const groupedTeams = useMemo(() => {
		if (!hasGroupedTeams) return [];

		const teamGroups = {};
		teams.forEach(team => {
			const baseName = team.name.includes('#') 
				? team.name.split('#')[0].trim() 
				: team.name;
			
			if (!teamGroups[baseName]) {
				teamGroups[baseName] = {
					id: baseName, // ID único para el grupo
					name: baseName,
					groups: [],
					points: 0,
					totalCount: 0,
					completedCount: 0,
					pendingCount: 0
				};
			}
			
			// Agregar equipo al grupo
			teamGroups[baseName].groups.push(team);
			
			// Sumar puntos
			teamGroups[baseName].points += (team.points || 0);
			
			// Agregar actividades
			const activeActivities = (team.activities_data || []).filter(activity => activity.del !== true);
			const activities = activeActivities.map(activity => ({
				...activity,
				statusKey: getActivityStatus(activity)
			}));
			
			const completed = activities.filter(a => a.complete).length;
			const total = activities.length;
			
			teamGroups[baseName].totalCount += total;
			teamGroups[baseName].completedCount += completed;
			teamGroups[baseName].pendingCount += (total - completed);
		});
		
		return Object.values(teamGroups);
	}, [teams, hasGroupedTeams, getActivityStatus]);

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

			// Obtener información de keepalive para este equipo
			const keepaliveData = keepaliveTeams[team.id];
			const isOnline = keepaliveData && isTeamActive(keepaliveData.lastSeen) || keepaliveData?.status === "sleep";
			const appStateLabel = keepaliveData && isOnline 
				?getAppStateLabel(keepaliveData.appState, keepaliveData.currentActivity?.name)
				: null;

			return {
				...team,
				activities,
				completedCount: completed,
				totalCount: total,
				pendingCount: total - completed,
				// Información de estado en tiempo real
				isOnline,
				appStateLabel,
				keepaliveData
			};
		}); // Solo equipos con dispositivo asignado
	}, [teams, getActivityStatus, keepaliveTeams]);

	const handleTeamClick = (team) => {
		// Si es un equipo agrupado (vista Equipos), navegar a una página especial
		if (currentView === 'teams' && team.groups) {
			navigate(`/admin/team-activities/${eventId}/team-group/${encodeURIComponent(team.name)}`);
		} else {
			navigate(`/admin/team-activities/${eventId}/team/${team.id}`);
		}
	};

	return (
		<BackgroundLayout
			title={t("team_activities.title", "Actividades por Equipos")}
			subtitle={event?.name}
		>
			<BackButton onClick={handleBack} />
			
			{/* Navegación entre vistas - solo si hay equipos agrupados */}
			{hasGroupedTeams && (
				<div className="ranking-navigation">
					<button 
						className={`nav-button ${currentView === 'teams' ? 'active' : ''}`}
						onClick={() => setCurrentView('teams')}
					>
						{t("team_activities.by_teams", "Por Equipos")}
					</button>
					<button 
						className={`nav-button ${currentView === 'groups' ? 'active' : ''}`}
						onClick={() => setCurrentView('groups')}
					>
						{t("team_activities.by_groups", "Por Grupos")}
					</button>
				</div>
			)}
			
			<div className="team-activities-container">
				{/* Vista por Equipos (agrupados) */}
				{currentView === 'teams' && hasGroupedTeams ? (
					groupedTeams.length === 0 ? (
						<div className="no-teams">
							<div className="empty-icon">👥</div>
							<h3>{t("team_activities.no_teams", "No hay equipos disponibles")}</h3>
							<p>{t("team_activities.no_teams_desc", "Aún no se han configurado equipos para este evento")}</p>
						</div>
					) : (
						<div className="teams-list">
							{groupedTeams.map((teamGroup) => (
								<div 
									key={teamGroup.id}
									className="team-item"
									onClick={() => handleTeamClick(teamGroup)}
								>
									<div className="team-header">
										<h4 className="team-name">{teamGroup.name}</h4>
										<div className="team-stats">
											<span className="stat-item">
												<span className="stat-number">{teamGroup.groups.length}</span>
												<span className="stat-label">{t("team_activities.groups_count", "Grupos")}</span>
											</span>
											<span className="stat-item">
												<span className="stat-number">{teamGroup.totalCount}</span>
												<span className="stat-label">{t("team_activities.activities_count", "Actividades")}</span>
											</span>
											<span className="stat-item">
												<span className="stat-number">{teamGroup.completedCount}</span>
												<span className="stat-label">{t("team_activities.completed", "Completadas")}</span>
											</span>
											<span className="stat-item">
												<span className="stat-number">{teamGroup.pendingCount}</span>
												<span className="stat-label">{t("team_activities.pending", "Pendientes")}</span>
											</span>
										</div>
									</div>
									
									<div className="team-details">
										<div className="detail-item">
											<span className="detail-label">{t("ranking.stats", "Estadísticas")}:</span>
											<span className="detail-value">
												{teamGroup.points} {t("team_activities.points", "puntos")}
											</span>
										</div>
									</div>
									
									<div className="team-arrow">›</div>
								</div>
							))}
						</div>
					)
				) : (
					/* Vista por Grupos (comportamiento actual) */
					teamsWithActivities.length === 0 ? (
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
											<TeamConnectionStatus teamId={team.id} />
										</div>
									</div>
									
									<div className="team-details">
										<div className="detail-item">
											<span className="detail-label">{t("ranking.stats", "Estadísticas")}:</span>
											<span className="detail-value">
												{team.points || 0} {t("team_activities.points", "puntos")}
											</span>
										</div>
										{/* Estado actual del equipo */}
										<div className="detail-item">
											<span className="detail-label">{t("team_activities.status", "Estado")}:</span>
											<span className={`detail-value app-state ${team.isOnline ? 'online' : 'offline'}`}>
												{team.isOnline ? team.appStateLabel : t("status.offline", "Desconectado")}
											</span>
										</div>
									</div>
									
									<div className="team-arrow">›</div>
								</div>
							))}
						</div>
					)
				)}
			</div>
		</BackgroundLayout>
	);
};

export default TeamActivitiesPage;
