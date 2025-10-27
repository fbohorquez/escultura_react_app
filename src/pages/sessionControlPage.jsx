// src/pages/sessionControlPage.jsx
import React, { useEffect, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import BackgroundLayout from "../components/backgroundLayout";
import BackButton from "../components/backButton";
import { clearSession, refreshSession } from "../features/session/sessionSlice";
import { updateTeamData, requestTeamRefresh } from "../features/teams/teamsSlice";
import "../styles/sessionControl.css";
import TeamConnectionStatus from "../components/TeamConnectionStatus";

const SessionControlPage = () => {
	const { t } = useTranslation();
	const dispatch = useDispatch();
	const navigate = useNavigate();
	
	const event = useSelector((state) => state.event.event);
	const teams = useSelector((state) => state.teams.items);
	// Estado keepalive para detectar status sleep
	const keepaliveTeams = useSelector((state) => state.keepalive.teams || {});
	const session = useSelector((state) => state.session);

	// Forzar actualización cuando se monta el componente
	useEffect(() => {
		dispatch(refreshSession());
	}, [dispatch]);

	// Calcular equipos asociados usando useMemo para optimizar re-renders
	const associatedTeams = useMemo(() => {
		return teams.filter(team => team.device && team.device !== "").map(team => {
			const keep = keepaliveTeams[team.id];
			return {
				...team,
				_keepaliveStatus: keep?.status,
				_keepaliveLastSeen: keep?.lastSeen
			};
		});
	}, [teams, keepaliveTeams]);

	const handleBack = () => {
		navigate(-1);
	};

	const handleClearLocalSession = async () => {
		if (await window.confirm(t("session_control.confirm_clear_local"))) {
			// Limpiar datos locales
			dispatch(clearSession());
			localStorage.removeItem("lastRoute");
			localStorage.removeItem("persist:root");
			localStorage.removeItem("currentActivity");
			localStorage.removeItem("validatedEventId");
			localStorage.removeItem("validatedTeamId");
			localStorage.removeItem("goToMap");
			
			// Recargar página para aplicar cambios
			navigate("/device-not-assigned", { replace: true });
		}
	};

	const handleDisassociateTeam = async (teamId) => {
		const team = teams.find(t => t.id === teamId);
		if (team && await window.confirm(t("session_control.confirm_disassociate", { teamName: team.name }))) {
			dispatch(
				updateTeamData({
					eventId: event.id,
					teamId: teamId,
					changes: {
						device: "",
					},
				})
			);
			
			// Mostrar feedback al usuario
			console.log(`✅ Equipo "${team.name}" desasociado del dispositivo. El cliente será desconectado automáticamente.`);
			
			// Opcional: Mostrar notificación temporal
			const notification = document.createElement('div');
			notification.textContent = `Equipo "${team.name}" desasociado correctamente`;
			notification.style.cssText = `
				position: fixed;
				top: 20px;
				right: 20px;
				background: #4CAF50;
				color: white;
				padding: 12px 20px;
				border-radius: 6px;
				z-index: 10000;
				box-shadow: 0 2px 10px rgba(0,0,0,0.3);
			`;
			document.body.appendChild(notification);
			setTimeout(() => document.body.removeChild(notification), 3000);
		}
	};

	const handleRefreshTeam = async (teamId) => {
		const team = teams.find(t => t.id === teamId);
		if (team && await window.confirm(t("session_control.confirm_refresh", { teamName: team.name }))) {
			dispatch(
				requestTeamRefresh({
					eventId: event.id,
					teamId: teamId,
				})
			);
			
			// Mostrar feedback al usuario
			console.log(`✅ Refresh solicitado para equipo "${team.name}"`);
			
			// Mostrar notificación temporal
			const notification = document.createElement('div');
			notification.textContent = `Refresh enviado a "${team.name}"`;
			notification.style.cssText = `
				position: fixed;
				top: 20px;
				right: 20px;
				background: #2196F3;
				color: white;
				padding: 12px 20px;
				border-radius: 6px;
				z-index: 10000;
				box-shadow: 0 2px 10px rgba(0,0,0,0.3);
			`;
			document.body.appendChild(notification);
			setTimeout(() => document.body.removeChild(notification), 3000);
		}
	};

	return (
		<BackgroundLayout>
			<BackButton onClick={handleBack} />
			<div className="session-control-page">
				<div className="session-control-header">
					<h1>{t("session_control.title")}</h1>
					<p>{t("session_control.subtitle")}</p>
				</div>

				<div className="session-control-content">
					{/* Información de sesión actual */}
					<div className="session-info-section">
						<h2>{t("session_control.current_session")}</h2>
						<div className="session-info">
							<p><strong>{t("session_control.mode")}:</strong> {session.isAdmin ? t("admin") : t("session_control.team_mode")}</p>
							{session.selectedTeam && (
								<p><strong>{t("session_control.selected_team")}:</strong> {session.selectedTeam.name}</p>
							)}
							{session.token && (
								<p><strong>{t("session_control.device_token")}:</strong> {session.token.substring(0, 8)}...</p>
							)}
						</div>
						<button 
							className="btn-clear-session"
							onClick={handleClearLocalSession}
						>
							{t("session_control.clear_local_session")}
						</button>
					</div>

					{/* Lista de equipos asociados - se actualiza automáticamente con Redux */}
					<div className="associated-teams-section">
						<h2>
							{t("session_control.associated_teams")} ({associatedTeams.length})
							<span className="realtime-indicator" title="Actualización en tiempo real"></span>
						</h2>
						{associatedTeams.length === 0 ? (
							<p className="no-teams">{t("session_control.no_associated_teams")}</p>
						) : (
							<div className="teams-list">
								{associatedTeams.map(team => (
									<div key={team.id} className="team-item">
										<div className="team-info">
											<span className="team-name">{team.name}</span>
											<span className="team-device">
												{t("session_control.device")}: {team.device.substring(0, 8)}...
											</span>
															{team._keepaliveStatus === 'sleep' && (
																<span className="team-sleep-status" style={{ color: '#ffa500', fontSize: '0.7rem', marginLeft: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
																	Pantalla bloqueada
																</span>
															)}
										</div>
										<div  style={{ marginLeft: '10px', marginRight: '10px' }}>
											<TeamConnectionStatus teamId={team.id} eventId={event.id} />
										</div>
										<div className="team-actions">
											<button 
												className="btn-refresh-team"
												onClick={() => handleRefreshTeam(team.id)}
												title={t("session_control.refresh_team_tooltip")}
											>
												{t("session_control.refresh_team")}
											</button>
											<button 
												className="btn-disassociate"
												onClick={() => handleDisassociateTeam(team.id)}
											>
												{t("session_control.disassociate")}
											</button>
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				</div>
			</div>
		</BackgroundLayout>
	);
};

export default SessionControlPage;



