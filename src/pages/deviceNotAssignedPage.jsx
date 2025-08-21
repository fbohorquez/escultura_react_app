// src/pages/deviceNotAssignedPage.jsx
import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import BackgroundLayout from "../components/backgroundLayout";

const DeviceNotAssignedPage = () => {
	const { t } = useTranslation();
	const navigate = useNavigate();

	const handleReturnHome = () => {
		navigate("/", { replace: true });
	};

	return (
		<BackgroundLayout>
			<div className="device-not-assigned">
				<div className="error-container">
					<div className="error-icon">
						<span className="error-symbol">🚫</span>
					</div>
					
					<h2 className="error-title">
						{t("deviceNotAssigned.title", "Dispositivo no asociado")}
					</h2>
					
					<p className="error-message">
						{t("deviceNotAssigned.message", 
							"Tu dispositivo ya no está asociado a ningún equipo."
						)}
					</p>
					
					<div className="error-details">
						<p>{t("deviceNotAssigned.details", "Para continuar contacta con el organizador del evento")}</p>
					</div>
				</div>
			</div>
		</BackgroundLayout>
	);
};

export default DeviceNotAssignedPage;
