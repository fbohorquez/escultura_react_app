// src/components/adminTaskbar.jsx
import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { addToQueue } from "../features/popup/popupSlice";
import { suspendEvent, reactivateEvent } from "../features/event/eventSlice";
import iconAsignar from "../assets/icon_asignar.png";
import iconSuspender from "../assets/icon_suspender.png";

const AdminTaskbar = () => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const dispatch = useDispatch();
	const event = useSelector((state) => state.event.event);
	const isSuspended = event?.suspend === true;

	const handleSessionControl = () => {
		navigate("/admin/session-control");
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
				<div className="admin-indicator">
					<span className="admin-badge">{t("admin")}</span>
					<span className="admin-label">{t("admin.mode")}</span>
				</div>
				
				<div className="admin-tools">
					<button 
						className="admin-tool-button"
						onClick={handleSessionControl}
						title={t("admin.session_control")}
					>
						<img src={iconAsignar} alt={t("admin.session_control")} />
					</button>
					
					<button 
						className={`admin-tool-button ${isSuspended ? 'admin-tool-button-active' : ''}`}
						onClick={handleSuspendToggle}
						title={isSuspended ? t("suspend.reactivate_title") : t("admin.suspend_event")}
					>
						<img src={iconSuspender} alt={isSuspended ? t("suspend.reactivate_title") : t("admin.suspend_event")} />
					</button>
				</div>
			</div>
		</div>
	);
};

export default AdminTaskbar;
