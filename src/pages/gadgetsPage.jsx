// src/pages/gadgetsPage.jsx
import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import BackgroundLayout from "../components/backgroundLayout";
import BackButton from "../components/backButton";
import GadgetSelector from "../components/GadgetSelector";
import TeamSelector from "../components/TeamSelector";
import { 
	getCooldownInfo,
	clearError,
	setSelectedGadgetDirect,
	setShowTeamSelector
} from "../features/gadgets/gadgetsSlice";
import { useNotification } from "../hooks/useNotification";

const GadgetsPage = () => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const dispatch = useDispatch();
	const { eventId } = useParams();
	const { showNotification } = useNotification();

	const event = useSelector((state) => state.event.event);
	const selectedTeam = useSelector((state) => state.session.selectedTeam);
	const isAdmin = useSelector((state) => state.session.isAdmin);
	const { cooldownInfo, error, availableGadgets } = useSelector((state) => state.gadgets);

	const teamId = isAdmin ? "admin" : selectedTeam?.id;

	useEffect(() => {
		// Cargar información de cooldown al montar el componente
		if (teamId && eventId) {
			dispatch(getCooldownInfo({ eventId, teamId }));
		}
	}, [dispatch, eventId, teamId]);

	useEffect(() => {
		// Mostrar errores si los hay
		if (error) {
			showNotification({
				type: "error",
				title: t("gadgets.error", "Error"),
				message: error,
				duration: 5000
			});
			dispatch(clearError());
		}
	}, [error, showNotification, t, dispatch]);

	const handleBack = () => {
		navigate(`/event/${eventId}`);
	};

	const handleGadgetDirectSelect = (gadgetId) => {
		// Verificar cooldown antes de seleccionar gadget
		const currentCooldown = cooldownInfo[teamId];
		if (currentCooldown && !currentCooldown.canSendGadget) {
			const remainingMinutes = Math.ceil(currentCooldown.remainingCooldown / (60 * 1000));
			showNotification({
				type: "warning",
				title: t("gadgets.cooldown_active", "Cooldown Activo"),
				message: t("gadgets.cooldown_message", "Debes esperar {{minutes}} minutos más", {
					minutes: remainingMinutes
				}),
				duration: 4000
			});
			return;
		}

		// Seleccionar gadget y abrir directamente el selector de equipos
		dispatch(setSelectedGadgetDirect(gadgetId));
		dispatch(setShowTeamSelector(true));
	};

	// Calcular tiempo restante de cooldown
	const getCooldownDisplay = () => {
		const currentCooldown = cooldownInfo[teamId];
		if (!currentCooldown || currentCooldown.canSendGadget) {
			return null;
		}

		const remainingMinutes = Math.ceil(currentCooldown.remainingCooldown / (60 * 1000));
		return remainingMinutes;
	};

	const cooldownMinutes = getCooldownDisplay();

	return (
		<BackgroundLayout
			title={t("gadgets.title", "Gadgets")}
			subtitle={event?.name}
		>
			<BackButton onClick={handleBack} />
			
			<div className="gadgets-container">
				{!isAdmin && selectedTeam && (
					<div className="team-info">
						<h3>{selectedTeam.name}</h3>
						<p className="points-info">
							{t("gadgets.current_points", "Puntos actuales")}: <strong>{selectedTeam.points || 0}</strong>
						</p>
					</div>
				)}

				<div className="gadgets-intro">
					<h2>{t("gadgets.new_system_title", "Sistema de Gadgets")}</h2>
					<p>{t("gadgets.new_description", "Envía gadgets a otros equipos para afectar su experiencia de juego.")}</p>
					
					{/* Información de configuración */}
					<div className="gadgets-config-info">
						<h4>{t("gadgets.current_config", "Configuración Actual")}</h4>
						<div className="config-items">
							<div className="config-item">
								<span className="config-label">{t("gadgets.config_timeout", "Tiempo de espera")}:</span>
								<span className="config-value">{Math.round((parseInt(import.meta.env.VITE_GADGET_TIMEOUT) || 30000) / 1000)}s</span>
							</div>
							<div className="config-item">
								<span className="config-label">{t("gadgets.config_same_team", "Envío al mismo equipo")}:</span>
								<span className={`config-value ${import.meta.env.VITE_GADGET_SAME_TEAM === 'true' ? 'enabled' : 'disabled'}`}>
									{import.meta.env.VITE_GADGET_SAME_TEAM === 'true' 
										? t("gadgets.config_allowed", "Permitido") 
										: t("gadgets.config_blocked", "Bloqueado")}
								</span>
							</div>
							<div className="config-item">
								<span className="config-label">{t("gadgets.config_prevent_activity", "Bloqueo durante actividad")}:</span>
								<span className={`config-value ${import.meta.env.VITE_GADGET_PREVENT_ACTIVITY === 'true' ? 'enabled' : 'disabled'}`}>
									{import.meta.env.VITE_GADGET_PREVENT_ACTIVITY === 'true' 
										? t("gadgets.config_active", "Activo") 
										: t("gadgets.config_inactive", "Inactivo")}
								</span>
							</div>
						</div>
					</div>
				</div>

				{/* Sección principal de gadgets */}
				<div className="gadgets-main-section">
					<div className="available-gadgets-preview">
						<h4>{t("gadgets.available_title", "Gadgets Disponibles")}</h4>
						{!cooldownMinutes && (
							<p className="gadgets-click-hint">
								{t("gadgets.click_to_send", "Haz clic en un gadget para enviarlo a otro equipo")}
							</p>
						)}
						<div className="gadgets-preview-grid">
							{Object.values(availableGadgets).map((gadget) => (
								<div 
									key={gadget.id} 
									className={`gadget-preview-item ${!cooldownMinutes ? 'clickable' : 'disabled'}`}
									onClick={() => !cooldownMinutes && handleGadgetDirectSelect(gadget.id)}
								>
									<div className="gadget-preview-info">
										<h5>{gadget.name}</h5>
										<p>{gadget.description}</p>
										{/* <small>{t("gadgets.cooldown", "Cooldown")}: {gadget.cooldownMinutes}min</small> */}
									</div>
								</div>
							))}
						</div>
					</div>

					<div className="gadgets-actions">
						{cooldownMinutes && (
							<p className="cooldown-info">
								{t("gadgets.cooldown_explanation", "Debes esperar antes de enviar otro gadget")}
							</p>
						)}
					</div>
				</div>

				{isAdmin && (
					<div className="admin-gadgets-section">
						<h4>{t("gadgets.admin_controls", "Controles de Administrador")}</h4>
						<p>{t("gadgets.admin_gadget_description", "Como administrador, puedes enviar gadgets a cualquier equipo sin restricciones de cooldown.")}</p>
					</div>
				)}

				{/* Información sobre restricciones */}
				<div className="gadgets-rules">
					<h4>{t("gadgets.rules_title", "Reglas de Uso")}</h4>
					<ul>
						<li>{t("gadgets.rule_timeout", "Tiempo de espera entre envíos: {{seconds}}s", { 
							seconds: Math.round((parseInt(import.meta.env.VITE_GADGET_TIMEOUT) || 30000) / 1000) 
						})}</li>
						{import.meta.env.VITE_GADGET_SAME_TEAM !== 'true' && (
							<li>{t("gadgets.rule_no_repeat", "No puedes enviar dos gadgets seguidos al mismo equipo")}</li>
						)}
						{import.meta.env.VITE_GADGET_PREVENT_ACTIVITY === 'true' && (
							<li>{t("gadgets.rule_activity_block", "Los gadgets no se pueden enviar a equipos que están haciendo actividades")}</li>
						)}
						<li>{t("gadgets.rule_device_required", "Solo equipos con dispositivo asignado pueden recibir gadgets")}</li>
					</ul>
				</div>
			</div>

			{/* Modales */}
			<GadgetSelector />
			<TeamSelector />
		</BackgroundLayout>
	);
};

export default GadgetsPage;
