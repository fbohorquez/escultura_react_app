// src/components/adminTaskbar.jsx
import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import iconAsignar from "../assets/icon_asignar.png";

const AdminTaskbar = () => {
	const { t } = useTranslation();
	const navigate = useNavigate();

	const handleSessionControl = () => {
		navigate("/admin/session-control");
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
				</div>
			</div>
		</div>
	);
};

export default AdminTaskbar;
