// src/pages/NotFoundPage.jsx
import React from "react";
import { useTranslation } from "react-i18next";
import BackgroundLayout from "../components/backgroundLayout";

const NotFoundPage = () => {
	const { t } = useTranslation();

	return (
		<BackgroundLayout
			title={t("notFound.title", "Página no encontrada")}
			subtitle={t("notFound.subtitle", "Error 404")}
		>
			<div className="not-found-container">
				<div className="not-found-content">
					<h1 className="not-found-code">404</h1>
					<h2 className="not-found-title">
						{t("notFound.accessDenied", "Acceso no autorizado")}
					</h2>
					<p className="not-found-message">
						{t(
							"notFound.tokenRequired",
							"Se requieren tokens válidos de evento y equipo para acceder a esta aplicación."
						)}
					</p>
					<p className="not-found-suggestion">
						{t(
							"notFound.contactAdmin",
							"Por favor, contacta con el administrador para obtener un enlace de acceso válido."
						)}
					</p>
				</div>
			</div>
		</BackgroundLayout>
	);
};

export default NotFoundPage;
