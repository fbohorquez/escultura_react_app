// src/pages/teamsPage.jsx
import React, {useEffect} from "react";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";

import BackgroundLayout from "../components/backgroundLayout";
import BackButton from "../components/backButton";
import iconTeam from "../assets/icono_equipo.png";
import iconAdmin from "../assets/icon_admin.png";
import { initEventRoot } from "../features/event/eventSlice";

import { setIsAdmin } from "../features/session/sessionSlice";

import { useNavigate } from "react-router-dom";

const TeamsPage = () => {
	const { t } = useTranslation();

  const dispatch = useDispatch();
  const navigate = useNavigate();

	const eventState = useSelector((s) => s.event);
	const teamsState = useSelector((s) => s.teams);
	const token = useSelector((state) => state.session.token);

	const teams = teamsState.items;
	
	// Verificar si estamos en proceso de auto-selección de equipo
	const isAutoSelectingTeam = sessionStorage.getItem('autoSelectTeamId') !== null;

  const handleAdminClick = () => {
    dispatch(setIsAdmin(true));
		navigate(`/event/${eventState.event.id}`);
  }

  const handleTeamClick = (teamId) => {
    navigate(`/team/${teamId}`);
  }

  const handleBack = () => {
    navigate(`/events`);
  }

	useEffect(() => {
		//sessionStorage.setItem('autoSelectEventId', tokenValidation.eventId);
		let autoSelectEventId = sessionStorage.getItem('autoSelectEventId');
		if (autoSelectEventId) {
			dispatch(initEventRoot({ eventId: autoSelectEventId }));
		}
	}, [dispatch]);

	// Efecto separado para manejar la auto-selección de equipo
	useEffect(() => {
		let autoSelectTeamId = sessionStorage.getItem('autoSelectTeamId');
		if (autoSelectTeamId && eventState.event?.id) {
			const teamId = parseInt(autoSelectTeamId, 10);
			
			// Si el ID es 0, seleccionar automáticamente el organizador
			if (teamId === 0) {
				console.log('Auto-selecting admin (ID: 0)');
				sessionStorage.removeItem('autoSelectTeamId');
				dispatch(setIsAdmin(true));
				navigate(`/event/${eventState.event.id}`, {
					state: {
						fromAutoSelect: true
					}
				});
				return;
			}
			
			// Para equipos normales, esperar a que los equipos estén cargados
			if (teams.length > 0) {
				// Buscar el equipo específico
				const targetTeam = teams.find(team => Number(team.id) === teamId);
				
				if (targetTeam) {
					if (targetTeam.device === "" || targetTeam.device === token) {
						// Equipo disponible, navegar automáticamente
						console.log('Auto-selecting team:', teamId);
						sessionStorage.removeItem('autoSelectTeamId');
						navigate(`/team/${teamId}`, {
							state: {
								fromAutoSelect: true
							}
						});
					} else {
						// Equipo ya está asignado, mostrar información pero no navegar
						console.log('Team already assigned, showing info:', teamId);
					}
				} else {
					console.warn('Team not found:', teamId);
					sessionStorage.removeItem('autoSelectTeamId');
				}
			}
		}
	}, [eventState.event?.id, teams, navigate, token, dispatch]);

	return (
		<div>
			{isAutoSelectingTeam ? (
				(() => {
					// Lógica para determinar qué mostrar cuando hay auto-selección
					const autoSelectTeamId = sessionStorage.getItem('autoSelectTeamId');
					if (autoSelectTeamId) {
						const teamId = parseInt(autoSelectTeamId, 10);
						
						// Si el ID es 0, mostrar mensaje de carga para admin
						if (teamId === 0) {
							return (
								<BackgroundLayout
									title={eventState.event?.name}
									subtitle={t("teams.subtitle")}
								>
									<div className="loading-admin">
										<p>{t("teams.loadingAdmin", "Cargando panel de administración...")}</p>
									</div>
								</BackgroundLayout>
							);
						}
						
						// Para equipos normales, verificar si están cargados
						if (teams.length > 0) {
							const targetTeam = teams.find(team => Number(team.id) === teamId);
							
							if (targetTeam && targetTeam.device !== "") {
								// Equipo ya está asignado, mostrar cuadro informativo
								return (
									<BackgroundLayout
										title={eventState.event?.name}
										subtitle={t("teams.subtitle")}
									>
										<div className="team-already-assigned">
											<div className="info-box">
												<h3>{t("teams.teamAlreadyAssigned", "Equipo ya seleccionado")}</h3>
												<p>{t("teams.teamAssignedMessage", `El equipo "${targetTeam.name}" ya está siendo utilizado por otro dispositivo.`)}</p>
											</div>
										</div>
									</BackgroundLayout>
								);
							}
						}
					}
					
					// Caso por defecto: mostrar mensaje de carga
					return (
						<BackgroundLayout
							title={eventState.event?.name}
							subtitle={t("teams.subtitle")}
						>
							<BackButton onClick={handleBack} />
							<div className="loading-team">
								<p>{t("teams.loadingTeam", "Cargando equipo...")}</p>
							</div>
						</BackgroundLayout>
					);
				})()
			) : (
				<BackgroundLayout
					title={eventState.event?.name}
					subtitle={t("teams.subtitle")}
				>
					<BackButton onClick={handleBack} />
					<div className="eventLabel"></div>
					<div className="grid">
						<div key="0" className="grid-item" onClick={handleAdminClick}>
							<img
								src={iconAdmin}
								alt="icono equipo"
								className="grid-item-img"
							/>
							<div className="grid-item-details">
								<h3 className="grid-item-name">{t("admin")}</h3>
							</div>
						</div>
						{teams
							.filter((team) => {
								return team.device == "";
							})
							.map((team) => (
								<div
									key={team.id}
									className="grid-item"
									onClick={() => handleTeamClick(team.id)}
								>
									<img
										src={iconTeam}
										alt={team.name}
										className="grid-item-img"
									/>
									<div className="grid-item-details">
										<h3 className="grid-item-name">{team.name}</h3>
									</div>
								</div>
							))}
					</div>
				</BackgroundLayout>
			)}
		</div>
	);
};

export default TeamsPage;







