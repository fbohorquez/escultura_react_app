// src/components/adminTaskbar.jsx
import React from "react";
import { useTranslation } from "react-i18next";

const AdminTaskbar = () => {
	const { t } = useTranslation();

	return (
		<div className="admin-taskbar">
			<div className="admin-taskbar-content">
				<div className="admin-indicator">
					<span className="admin-badge">{t("admin")}</span>
					<span className="admin-label">{t("admin.mode")}</span>
				</div>
				
				{/* Aquí se agregarán las herramientas del organizador en el futuro */}
				<div className="admin-tools">
					<div className="admin-tools-placeholder">
						{t("admin.tools_coming_soon")}
					</div>
				</div>
			</div>
		</div>
	);
};

export default AdminTaskbar;
