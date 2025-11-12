// src/components/TeamSelector.jsx
import React, { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { usePopup } from "../hooks/usePopup";
import {
	setShowTeamSelector,
	sendGadgetAction,
	resetGadgetFlow,
	setSelectedGadget,
	setShowGadgetSelector,
} from "../features/gadgets/gadgetsSlice";

const TeamSelector = () => {
	const { t } = useTranslation();
	const dispatch = useDispatch();
	const { eventId } = useParams();
	const { openPopup } = usePopup();
	
	const { selectedGadget, showTeamSelector, availableGadgets, status, cooldownInfo, isDirectFlow } = useSelector((state) => state.gadgets);
	const teams = useSelector((state) => state.teams.items || []);
	const { selectedTeam, isAdmin } = useSelector((state) => state.session);

	// Filtrar equipos válidos (con device asignado y no el equipo actual)
	const availableTeams = teams.filter(team => 
		team.device && 
		team.device !== "" &&
		(!isAdmin ? team.id !== selectedTeam?.id : true)
	);

	// Función para determinar si un equipo puede recibir gadgets
	const getTeamStatus = useMemo(() => {
		const allowSameTeam = import.meta.env.VITE_GADGET_SAME_TEAM === 'true';
		const preventActivity = import.meta.env.VITE_GADGET_PREVENT_ACTIVITY === 'true';
		
		return (team) => {
			const reasons = [];
			
			// Los administradores pueden enviar gadgets sin restricciones
			if (isAdmin) {
				return {
					canReceive: true,
					reasons: []
				};
			}
			
			// Verificar si está haciendo actividad
			if (preventActivity && team.isActivityActive) {
				reasons.push(t("gadgets.team_busy", "Haciendo actividad"));
			}
			
			// Verificar último equipo objetivo (si no se permite mismo equipo)
			const fromTeamId = selectedTeam?.id;
			const teamCooldownInfo = cooldownInfo[fromTeamId];
			if (!allowSameTeam && teamCooldownInfo?.lastTargetTeam === team.id) {
				reasons.push(t("gadgets.team_last_target", "Último equipo seleccionado"));
			}
			
			return {
				canReceive: reasons.length === 0,
				reasons: reasons
			};
		};
	}, [isAdmin, selectedTeam?.id, cooldownInfo, t]);

	const handleTeamSelect = async (targetTeam) => {
		if (!selectedGadget) return;
		
		// Para administradores no se requiere selectedTeam
		if (!isAdmin && !selectedTeam) return;

		const fromTeamId = isAdmin ? "admin" : selectedTeam.id;
		const teamStatus = getTeamStatus(targetTeam);
		
		// Verificar si el equipo puede recibir gadgets
		if (!teamStatus.canReceive) {
			openPopup({
				titulo: t("gadgets.cannot_send", "No se puede enviar"),
				texto: teamStatus.reasons.join(', '),
				array_botones: [
					{
						titulo: t("close", "Cerrar"),
						callback: () => {}
					}
				],
				layout: "center",
				overlay: true,
				close_button: true
			});
			return;
		}
		
		try {
			await dispatch(sendGadgetAction({
				eventId,
				fromTeamId,
				toTeamId: targetTeam.id,
				gadgetId: selectedGadget
			})).unwrap();

			const gadgetInfo = availableGadgets[selectedGadget];
			
			openPopup({
				titulo: t("gadgets.sent_success", "Gadget Enviado"),
				texto: t("gadgets.sent_message", "{{gadget}} enviado a {{team}}", {
					gadget: gadgetInfo.name,
					team: targetTeam.name
				}),
				array_botones: [
					{
						titulo: t("close", "Cerrar"),
						callback: () => {}
					}
				],
				layout: "center",
				overlay: true,
				close_button: true
			});

			dispatch(resetGadgetFlow());
			
		} catch (error) {
			openPopup({
				titulo: t("gadgets.send_error", "Error al Enviar"),
				texto: error.message || t("gadgets.send_error_message", "No se pudo enviar el gadget"),
				array_botones: [
					{
						titulo: t("close", "Cerrar"),
						callback: () => {}
					}
				],
				layout: "center",
				overlay: true,
				close_button: true
			});
		}
	};

	const handleClose = () => {
		dispatch(setShowTeamSelector(false));
	};

	const handleBack = () => {
		if (isDirectFlow) {
			// Si venimos del flujo directo, cerrar completamente y resetear
			dispatch(resetGadgetFlow());
		} else {
			// Si venimos del selector de gadgets, volver al selector
			dispatch(setShowTeamSelector(false));
			dispatch(setSelectedGadget(null));
			dispatch(setShowGadgetSelector(true));
		}
	};

	if (!showTeamSelector || !selectedGadget || !availableGadgets) return null;

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
							{availableTeams.map((team) => {
								const teamStatus = getTeamStatus(team);
								const isDisabled = status === "loading" || !teamStatus.canReceive;
								
								return (
									<div
										key={team.id}
										className={`team-option ${isDisabled ? "disabled" : ""} ${!teamStatus.canReceive ? "blocked" : ""}`}
										onClick={() => !isDisabled && handleTeamSelect(team)}
									>
										<div className="team-info">
											<h4 className="team-name">{team.name}</h4>
											<p className="team-points">
												{t("gadgets.team_points", "Puntos")}: {team.points || 0}
											</p>
											{teamStatus.reasons.length > 0 && (
												<div className="team-restrictions">
													{teamStatus.reasons.map((reason, index) => (
														<small key={index} className="restriction-reason">
															{reason}
														</small>
													))}
												</div>
											)}
										</div>
										<div className="team-device">
											<small>{team.device}</small>
											{team.isActivityActive && (
												<div className="activity-indicator">
													🔄 {t("gadgets.doing_activity", "En actividad")}
												</div>
											)}
										</div>
									</div>
								);
							})}
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
