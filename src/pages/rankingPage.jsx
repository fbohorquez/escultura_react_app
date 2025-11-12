// src/pages/rankingPage.jsx
import React, { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import BackgroundLayout from "../components/backgroundLayout";
import BackButton from "../components/backButton";

const RankingPage = () => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { eventId } = useParams();

	const event = useSelector((state) => state.event.event);
	const teams = useSelector((state) => state.teams.items);
	const selectedTeam = useSelector((state) => state.session.selectedTeam);
	const isAdmin = useSelector((state) => state.session.isAdmin);

	// Estado para cambiar entre vistas
	const [currentView, setCurrentView] = useState('ranking');

	const handleBack = () => {
		navigate(`/event/${eventId}`);
	};

	// Calcular ranking ordenado por puntos
	const rankedTeams = useMemo(() => {
		const activeTeams = [...teams].filter(team => team.device !== ""); // Solo equipos que han empezado
		
		// Detectar si hay equipos con "#" (grupos)
		const hasGroups = activeTeams.some(team => team.name.includes('#'));
		
		if (!hasGroups) {
			// Comportamiento normal sin grupos
			return activeTeams
				.sort((a, b) => (b.points || 0) - (a.points || 0))
				.map((team, index) => ({
					...team,
					position: index + 1
				}));
		}
		
		// Agrupar equipos por nombre base y sumar puntos
		const teamGroups = {};
		activeTeams.forEach(team => {
			const baseName = team.name.includes('#') 
				? team.name.split('#')[0].trim() 
				: team.name;
			
			if (!teamGroups[baseName]) {
				teamGroups[baseName] = {
					name: baseName,
					points: 0,
					groups: []
				};
			}
			
			teamGroups[baseName].points += (team.points || 0);
			teamGroups[baseName].groups.push(team);
		});
		
		// Convertir a array y ordenar por puntos
		return Object.values(teamGroups)
			.sort((a, b) => b.points - a.points)
			.map((team, index) => ({
				...team,
				position: index + 1
			}));
	}, [teams]);

	// Encontrar la posición del equipo actual
	const currentTeamPosition = useMemo(() => {
		if (!selectedTeam) return null;
		const team = rankedTeams.find(t => t.id === selectedTeam.id);
		return team?.position || null;
	}, [rankedTeams, selectedTeam]);

	// Obtener actividades completadas del equipo actual
	const completedActivities = useMemo(() => {
		if (!selectedTeam || !selectedTeam.activities_data) return [];
		
		return selectedTeam.activities_data
			.filter(activity => activity.complete && activity.del !== true) // Solo completadas y no eliminadas
			.sort((a, b) => (b.complete_time || 0) - (a.complete_time || 0)) // Más recientes primero
			.map(activity => ({
				...activity,
				statusKey: activity.valorate === 0 ? 'pending_review' : 'reviewed'
			}));
	}, [selectedTeam]);

	// Función para determinar el estado de la actividad
	const getActivityStatusText = (statusKey) => {
		const statusMap = {
			pending_review: t("ranking.activity_status.pending_review", "Pendiente de valorar"),
			reviewed: t("ranking.activity_status.reviewed", "Valorada")
		};
		return statusMap[statusKey] || statusKey;
	};

	const getActivityStatusClass = (statusKey) => {
		const classMap = {
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

	const renderActivityPoints = (activity) => {
		if (activity.valorate === 1 && activity.awarded_points !== undefined) {
			return `${activity.awarded_points} ${t("ranking.points_awarded", "puntos otorgados")}`;
		}
		if (activity.valorate === 0) {
			return t("ranking.activity_status.pending_review", "Pendiente de valorar");
		}
		return `${activity.points || 0} ${t("ranking.points", "puntos")}`;
	};

	const handleActivityClick = (activity) => {
		if (!eventId || !selectedTeam) return;
		navigate(`/event/${eventId}/team/activity/${selectedTeam.id}/${activity.id}`);
	};

	const getMedalIcon = (position) => {
		if (position === 1) {
			return (
				<>
					<span>{position}°</span>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="24px"
						height="24px"
						style={{ transform: "translate(4px, -3px)", position: "absolute" }}	
						viewBox="0 0 24 24"
						fill="none"
					>
						<path
							d="M4 8L6 20H18L20 8M4 8L5.71624 9.37299C6.83218 10.2657 7.39014 10.7121 7.95256 10.7814C8.4453 10.8421 8.94299 10.7173 9.34885 10.4314C9.81211 10.1051 10.0936 9.4483 10.6565 8.13476L12 5M4 8C4.55228 8 5 7.55228 5 7C5 6.44772 4.55228 6 4 6C3.44772 6 3 6.44772 3 7C3 7.55228 3.44772 8 4 8ZM20 8L18.2838 9.373C17.1678 10.2657 16.6099 10.7121 16.0474 10.7814C15.5547 10.8421 15.057 10.7173 14.6511 10.4314C14.1879 10.1051 13.9064 9.4483 13.3435 8.13476L12 5M20 8C20.5523 8 21 7.55228 21 7C21 6.44772 20.5523 6 20 6C19.4477 6 19 6.44772 19 7C19 7.55228 19.4477 8 20 8ZM12 5C12.5523 5 13 4.55228 13 4C13 3.44772 12.5523 3 12 3C11.4477 3 11 3.44772 11 4C11 4.55228 11.4477 5 12 5ZM12 4H12.01M20 7H20.01M4 7H4.01"
							stroke="#000000"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>
				</>
			);
		}
		return <span>{position}°</span>;
	};

	return (
		<BackgroundLayout
			title={t("ranking.title", "Clasificación")}
			subtitle={event?.name}
		>
			<BackButton onClick={handleBack} />

			{/* Navegación entre vistas - solo para equipos no admin */}
			{!isAdmin && selectedTeam && (
				<div className="ranking-navigation">
					<button
						className={`nav-button ${
							currentView === "ranking" ? "active" : ""
						}`}
						onClick={() => setCurrentView("ranking")}
					>
						{t("ranking.general_ranking", "Ranking General")}
					</button>
					<button
						className={`nav-button ${
							currentView === "activities" ? "active" : ""
						}`}
						onClick={() => setCurrentView("activities")}
					>
						{t("ranking.my_activities", "Mis Actividades")}
					</button>
				</div>
			)}

			<div className="ranking-container">
				{/* Vista de Ranking General */}
				{(currentView === "ranking" || isAdmin) && (
					<>
						{!isAdmin && currentTeamPosition && (
							<div className="current-team-position">
								<h3>{t("ranking.your_position", "Tu posición")}</h3>
								<div className="position-badge">
									<span className="position-number">
										{currentTeamPosition}°
									</span>
									<span className="team-name">{selectedTeam.name}</span>
									<span className="points">{selectedTeam.points || 0} pts</span>
								</div>
							</div>
						)}

						<div className="ranking-list">
							<h3>{t("ranking.general", "Clasificación General")}</h3>

							{rankedTeams.length === 0 ? (
								<div className="no-teams">
									<p>
										{t("ranking.no_teams", "Aún no hay equipos clasificados")}
									</p>
								</div>
							) : (
								<div className="teams-list">
									{rankedTeams.map((team) => (
										<div
											key={team.id}
											className={`team-rank-item ${
												team.id === selectedTeam?.id ? "current-team" : ""
											}`}
										>
											<div className="position">
												{getMedalIcon(team.position)}
											</div>
											<div className="team-info">
												<span className="team-name">{team.name}</span>
												{team.device && (
													<span className="status online">●</span>
												)}
											</div>
											<div className="points">{team.points || 0} pts</div>
										</div>
									))}
								</div>
							)}
						</div>

						{isAdmin && (
							<div className="admin-stats">
								<h4>{t("ranking.stats", "Estadísticas")}</h4>
								<div className="stats-grid">
									<div className="stat-item">
										<span className="stat-label">
											{t("ranking.total_teams", "Equipos totales")}:
										</span>
										<span className="stat-value">{teams.length}</span>
									</div>
									<div className="stat-item">
										<span className="stat-label">
											{t("ranking.active_teams", "Equipos activos")}:
										</span>
										<span className="stat-value">{rankedTeams.length}</span>
									</div>
									<div className="stat-item">
										<span className="stat-label">
											{t("ranking.avg_points", "Puntos promedio")}:
										</span>
										<span className="stat-value">
											{rankedTeams.length > 0
												? Math.round(
														rankedTeams.reduce(
															(sum, team) => sum + (team.points || 0),
															0
														) / rankedTeams.length
												  )
												: 0}
										</span>
									</div>
								</div>
							</div>
						)}
					</>
				)}

				{/* Vista de Actividades del Equipo */}
				{currentView === "activities" && !isAdmin && selectedTeam && (
					<div className="team-activities-section">
						<div className="activities-stats">
							<h3>
								{t(
									"ranking.my_activities_title",
									"Mis Actividades Completadas"
								)}
							</h3>
							<div className="stats-summary">
								<div className="stat-item">
									<span className="stat-number">
										{completedActivities.length}
									</span>
									<span className="stat-label">
										{t("ranking.completed_count", "Completadas")}
									</span>
								</div>
								<div className="stat-item">
									<span className="stat-number">
										{
											completedActivities.filter(
												(a) => a.statusKey === "pending_review"
											).length
										}
									</span>
									<span className="stat-label">
										{t("ranking.pending_review_count", "Pendientes")}
									</span>
								</div>
								<div className="stat-item">
									<span className="stat-number">
										{selectedTeam.points || 0}
									</span>
									<span className="stat-label">
										{t("ranking.total_points", "Puntos totales")}
									</span>
								</div>
							</div>
						</div>

						{completedActivities.length === 0 ? (
							<div className="no-activities">
								<div className="empty-icon">📋</div>
								<h3>
									{t(
										"ranking.no_completed_activities",
										"No hay actividades completadas"
									)}
								</h3>
								<p>
									{t(
										"ranking.no_completed_activities_desc",
										"Aún no has completado ninguna actividad en este evento"
									)}
								</p>
							</div>
						) : (
							<div className="activities-list">
								{completedActivities.map((activity) => (
									<div
										key={activity.id}
										className="activity-item activity-clickable"
										onClick={() => handleActivityClick(activity)}
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
													{t("ranking.points", "Puntos")}:
												</span>
												<span className="detail-value">
													{renderActivityPoints(activity)}
												</span>
											</div>
											<div className="detail-item">
												<span className="detail-label">
													{t("ranking.completed_time", "Completada")}:
												</span>
												<span className="detail-value">
													{formatCompletedTime(activity.complete_time)}
												</span>
											</div>
										</div>

										<div className="activity-arrow">›</div>
									</div>
								))}
								{/* Botón para ver medios subidos */}
								<div className="media-access-section">
									<button
										className="media-list-button"
										onClick={() => navigate(`/event/${eventId}/media-list`)}
									>
										<span className="media-icon">📱</span>
										{t("ranking.view_uploaded_media", "Ver Medios Subidos")}
									</button>
								</div>
							</div>
						)}
					</div>
				)}
			</div>
		</BackgroundLayout>
	);
};

export default RankingPage;



