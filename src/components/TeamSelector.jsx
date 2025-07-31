// src/components/TeamSelector.jsx
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import {
	setShowTeamSelector,
	sendGadgetAction,
	resetGadgetFlow,
	setSelectedGadget,
} from "../features/gadgets/gadgetsSlice";
import { useNotification } from "../hooks/useNotification";

const TeamSelector = () => {
	const { t } = useTranslation();
	const dispatch = useDispatch();
	const { eventId } = useParams();
	const { showNotification } = useNotification();
	
	const { selectedGadget, showTeamSelector, availableGadgets, status } = useSelector((state) => state.gadgets);
	const teams = useSelector((state) => state.teams.items || []);
	const { selectedTeam, isAdmin } = useSelector((state) => state.session);

	// Filtrar equipos válidos (con device asignado y no el equipo actual)
	const availableTeams = teams.filter(team => 
		team.device && 
		team.device !== "" &&
		(!isAdmin ? team.id !== selectedTeam?.id : true)
	);

	const handleTeamSelect = async (targetTeam) => {
		if (!selectedGadget || !selectedTeam) return;

		const fromTeamId = isAdmin ? "admin" : selectedTeam.id;
		
		try {
			await dispatch(sendGadgetAction({
				eventId,
				fromTeamId,
				toTeamId: targetTeam.id,
				gadgetId: selectedGadget
			})).unwrap();

			const gadgetInfo = availableGadgets[selectedGadget];
			
			showNotification({
				type: "success",
				title: t("gadgets.sent_success", "Gadget Enviado"),
				message: t("gadgets.sent_message", "{{gadget}} enviado a {{team}}", {
					gadget: gadgetInfo.name,
					team: targetTeam.name
				}),
				duration: 3000
			});

			dispatch(resetGadgetFlow());
			
		} catch (error) {
			showNotification({
				type: "error", 
				title: t("gadgets.send_error", "Error al Enviar"),
				message: error.message || t("gadgets.send_error_message", "No se pudo enviar el gadget"),
				duration: 5000
			});
		}
	};

	const handleClose = () => {
		dispatch(setShowTeamSelector(false));
	};

	const handleBack = () => {
		dispatch(setShowTeamSelector(false));
		dispatch(setSelectedGadget(null));
	};

	if (!showTeamSelector || !selectedGadget) return null;

	const gadgetInfo = availableGadgets[selectedGadget];
	
	// Si no se encuentra el gadget, cerrar el modal
	if (!gadgetInfo) {
		console.error('Gadget not found:', selectedGadget);
		dispatch(setShowTeamSelector(false));
		return null;
	}

	return (
		<div className="team-selector-overlay">
			<div className="team-selector-modal">
				<div className="team-selector-header">
					<button 
						className="team-back-btn"
						onClick={handleBack}
						aria-label={t("back", "Volver")}
					>
						&larr;
					</button>
					<h3>{t("gadgets.select_team", "Seleccionar Equipo")}</h3>
					<button 
						className="team-close-btn"
						onClick={handleClose}
						aria-label={t("close", "Cerrar")}
					>
						&times;
					</button>
				</div>
				
				<div className="team-selector-content">
					<div className="selected-gadget-info">
						<div className="gadget-preview">
							<span className="gadget-icon">{gadgetInfo.icon}</span>
							<span className="gadget-name">{gadgetInfo.name}</span>
						</div>
					</div>
					
					<p className="team-selector-description">
						{t("gadgets.team_select_description", "Selecciona el equipo al que quieres enviar este gadget:")}
					</p>
					
					{availableTeams.length === 0 ? (
						<div className="no-teams-available">
							<p>{t("gadgets.no_teams", "No hay equipos disponibles")}</p>
						</div>
					) : (
						<div className="teams-list">
							{availableTeams.map((team) => (
								<div
									key={team.id}
									className={`team-option ${status === "loading" ? "disabled" : ""}`}
									onClick={() => status !== "loading" && handleTeamSelect(team)}
								>
									<div className="team-info">
										<h4 className="team-name">{team.name}</h4>
										<p className="team-points">
											{t("gadgets.team_points", "Puntos")}: {team.points || 0}
										</p>
									</div>
									<div className="team-device">
										<small>{team.device}</small>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
				
				{status === "loading" && (
					<div className="loading-overlay">
						<div className="loading-spinner"></div>
						<p>{t("gadgets.sending", "Enviando gadget...")}</p>
					</div>
				)}
			</div>
		</div>
	);
};

export default TeamSelector;
