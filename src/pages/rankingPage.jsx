// src/pages/rankingPage.jsx
import React, { useMemo } from "react";
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

	const handleBack = () => {
		navigate(`/event/${eventId}`);
	};

	// Calcular ranking ordenado por puntos
	const rankedTeams = useMemo(() => {
		return [...teams]
			.filter(team => team.device !== "") // Solo equipos que han empezado
			.sort((a, b) => (b.points || 0) - (a.points || 0))
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

	const getMedalIcon = (position) => {
		switch (position) {
			case 1: return "🥇";
			case 2: return "🥈";
			case 3: return "🥉";
			default: return `${position}°`;
		}
	};

	return (
		<BackgroundLayout
			title={t("ranking.title", "Clasificación")}
			subtitle={event?.name}
		>
			<BackButton onClick={handleBack} />
			
			<div className="ranking-container">
				{!isAdmin && currentTeamPosition && (
					<div className="current-team-position">
						<h3>{t("ranking.your_position", "Tu posición")}</h3>
						<div className="position-badge">
							<span className="position-number">{getMedalIcon(currentTeamPosition)}</span>
							<span className="team-name">{selectedTeam.name}</span>
							<span className="points">{selectedTeam.points || 0} pts</span>
						</div>
					</div>
				)}

				<div className="ranking-list">
					<h3>{t("ranking.general", "Clasificación General")}</h3>
					
					{rankedTeams.length === 0 ? (
						<div className="no-teams">
							<p>{t("ranking.no_teams", "Aún no hay equipos clasificados")}</p>
						</div>
					) : (
						<div className="teams-list">
							{rankedTeams.map((team) => (
								<div 
									key={team.id} 
									className={`team-rank-item ${team.id === selectedTeam?.id ? 'current-team' : ''}`}
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
									<div className="points">
										{team.points || 0} pts
									</div>
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
								<span className="stat-label">{t("ranking.total_teams", "Equipos totales")}:</span>
								<span className="stat-value">{teams.length}</span>
							</div>
							<div className="stat-item">
								<span className="stat-label">{t("ranking.active_teams", "Equipos activos")}:</span>
								<span className="stat-value">{rankedTeams.length}</span>
							</div>
							<div className="stat-item">
								<span className="stat-label">{t("ranking.avg_points", "Puntos promedio")}:</span>
								<span className="stat-value">
									{rankedTeams.length > 0 
										? Math.round(rankedTeams.reduce((sum, team) => sum + (team.points || 0), 0) / rankedTeams.length)
										: 0
									}
								</span>
							</div>
						</div>
					</div>
				)}
			</div>
		</BackgroundLayout>
	);
};

export default RankingPage;
