// src/components/SuspendedEventPopup.jsx
import React from "react";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { closeCurrentPopup } from "../features/popup/popupSlice";
import bloqueoImage from "../assets/Bloqueo.png";
import "../styles/SuspendedEventPopup.css";

const SuspendedEventPopup = ({ popup }) => {
	const dispatch = useDispatch();
	const { t } = useTranslation();

	const handleClose = () => {
		dispatch(closeCurrentPopup());
	};

	if (!popup || popup.titulo !== "suspend.event_suspended_title") {
		return null;
	}

	return (
		<div className="suspended-event-overlay">
			<div className="suspended-event-container">
				<div className="suspended-event-image">
					<img src={bloqueoImage} alt={t("suspend.event_suspended_title")} />
				</div>
				<div className="suspended-event-content">
					<h2 className="suspended-event-title">
						{t("suspend.event_suspended_title")}
					</h2>
					<p className="suspended-event-message">
						{t("suspend.event_suspended_message")}
					</p>
					<button 
						className="suspended-event-button"
						onClick={handleClose}
					>
						{t("close")}
					</button>
				</div>
			</div>
		</div>
	);
};

export default SuspendedEventPopup;
