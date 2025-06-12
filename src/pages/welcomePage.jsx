import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { fetchEvents } from "../features/events/eventsSlice";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import BackgroundLayout from "../components/backgroundLayout";
import brandLogo from "../assets/escultura_brand.png";
import { version as appVersion } from "../../package.json";

const WelcomePage = () => {
	const { t } = useTranslation();
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const [loading, setLoading] = useState(false);

	const handleEnter = async () => {
		setLoading(true);
		try {
			await dispatch(fetchEvents()).unwrap();
			navigate("/events");
		} catch (error) {
			console.error("Error fetching events:", error);
		} finally {
			setLoading(false);
		}
	};

	return (
		<BackgroundLayout>
			<img src={brandLogo} alt="Escultura" className="logo" />
			<h1 className="welcome-title">{t("welcome.title")}</h1>
			<p className="welcome-subtitle">{t("welcome.subtitle")}</p>
			<button onClick={handleEnter} className="button" disabled={loading}>
				{loading ? t("loading") : t("enter")}
			</button>
			<span className="version">Versión: {appVersion}</span>
		</BackgroundLayout>
	);
};


export default WelcomePage;








