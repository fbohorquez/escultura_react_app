// src/components/adminTaskbar.jsx
import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { addToQueue } from "../features/popup/popupSlice";
import { suspendEvent, reactivateEvent } from "../features/event/eventSlice";
import iconAsignar from "../assets/icon_asignar.png";
import iconSuspender from "../assets/icon_suspender.png";
import iconPuntuar from "../assets/Puntuar.png";
import iconResultados from "../assets/icon_resultados.png";
import iconFoto from "../assets/icon_foto.png";

const AdminTaskbar = () => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const dispatch = useDispatch();
	const event = useSelector((state) => state.event.event);
	const isSuspended = event?.suspend === true;

	const handleSessionControl = () => {
		navigate("/admin/session-control");
	};

	const handleRanking = () => {
		navigate(`/ranking/${event.id}`);
	};

	const handleValorateActivities = () => {
		navigate(`/admin/valorate/${event.id}`);
	};

	const handlePhotoManagement = () => {
		navigate(`/admin/photos/${event.id}`);
	};

	const handleSuspendToggle = () => {
		if (isSuspended) {
			// Reactivar evento
			dispatch(addToQueue({
				titulo: t("suspend.reactivate_title"),
				texto: t("suspend.reactivate_message"),
				array_botones: [
					{
						titulo: t("suspend.cancel_button"),
						callback: null
					},
					{
						titulo: t("suspend.reactivate_button"),
						callback: () => {
							dispatch(reactivateEvent());
						}
					}
				],
				overlay: true,
				close_button: true,
				layout: "center"
			}));
		} else {
			// Suspender evento
			dispatch(addToQueue({
				titulo: t("suspend.confirm_title"),
				texto: t("suspend.confirm_message"),
				array_botones: [
					{
						titulo: t("suspend.cancel_button"),
						callback: null
					},
					{
						titulo: t("suspend.confirm_button"),
						callback: () => {
							dispatch(suspendEvent());
						}
					}
				],
				overlay: true,
				close_button: true,
				layout: "center"
			}));
		}
	};

	return (
		<div className="admin-taskbar">
			<div className="admin-taskbar-content">
				<div className="admin-tools">
					<button
						className="admin-tool-button"
						onClick={handlePhotoManagement}
						title={t("admin.photo_management", "Gestión de Fotos")}
					>
						<img
							src={iconFoto}
							alt={t("admin.photo_management", "Gestión de Fotos")}
						/>
					</button>
					<button
						className="admin-tool-button"
						onClick={handleRanking}
						title={t("admin.ranking", "Ver ranking")}
					>
						<img
							src={iconResultados}
							alt={t("admin.ranking", "Ver ranking")}
						/>
					</button>
					<button
						className="admin-tool-button"
						onClick={handleValorateActivities}
						title={t("admin.valorate_activities", "Valorar actividades")}
					>
						<img
							src={iconPuntuar}
							alt={t("admin.valorate_activities", "Valorar actividades")}
						/>
					</button>
					<button
						className="admin-tool-button"
						onClick={handleSessionControl}
						title={t("admin.session_control")}
					>
						<img src={iconAsignar} alt={t("admin.session_control")} />
					</button>
					<button
						className={`admin-tool-button ${
							isSuspended ? "admin-tool-button-active" : ""
						}`}
						onClick={handleSuspendToggle}
						title={
							isSuspended
								? t("suspend.reactivate_title")
								: t("admin.suspend_event")
						}
					>
						<img
							src={iconSuspender}
							alt={
								isSuspended
									? t("suspend.reactivate_title")
									: t("admin.suspend_event")
							}
						/>
					</button>
				</div>
			</div>
		</div>
	);
};

export default AdminTaskbar;

