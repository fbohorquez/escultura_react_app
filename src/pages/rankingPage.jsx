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
			
			<div className="ranking-container">
				{!isAdmin && currentTeamPosition && (
					<div className="current-team-position">
						<h3>{t("ranking.your_position", "Tu posición")}</h3>
						<div className="position-badge">
							<span className="position-number">{currentTeamPosition}°</span>
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


