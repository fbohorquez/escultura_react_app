// src/components/eventFooter.jsx
import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PropTypes from "prop-types";

import iconChat from "../assets/icon_chat.png";
import formPoint from "../assets/form_point.png";
import iconGadgets from "../assets/icon_gadgets.png";

const EventFooter = ({ eventId }) => {
	const { t } = useTranslation();
	const navigate = useNavigate();

	const teams = useSelector((state) => state.teams.items);
	const selectedTeam = useSelector((state) => state.session.selectedTeam);
	const isAdmin = useSelector((state) => state.session.isAdmin);

	// Calcular la posición del equipo en el ranking
	const teamPosition = useMemo(() => {
		if (isAdmin || !selectedTeam) return null;

		const rankedTeams = [...teams]
			.filter(team => team.device !== "") // Solo equipos activos
			.sort((a, b) => (b.points || 0) - (a.points || 0));

		const position = rankedTeams.findIndex(team => team.id === selectedTeam.id) + 1;
		return position > 0 ? position : null;
	}, [teams, selectedTeam, isAdmin]);

	const handleChatClick = () => {
		navigate(`/chat/${eventId}`);
	};

	const handlePositionClick = () => {
		navigate(`/ranking/${eventId}`);
	};

	const handleGadgetsClick = () => {
		navigate(`/gadgets/${eventId}`);
	};

	return (
		<div className="event-footer">
			<div className="footer-controls">
				{/* Control de Chat */}
				<button 
					className="footer-control chat-control"
					onClick={handleChatClick}
					title={t("footer.chat", "Chat")}
				>
					<img src={iconChat} alt="Chat" className="control-icon" />
					<span className="control-label">{t("footer.chat", "Chat")}</span>
				</button>

				{/* Control de Posición */}
				<button 
					className="footer-control position-control"
					onClick={handlePositionClick}
					title={t("footer.ranking", "Ranking")}
				>
					<div 
						className="position-background"
						style={{ backgroundImage: `url(${formPoint})` }}
					>
						{!isAdmin && teamPosition && (
							<span className="position-number">{teamPosition}</span>
						)}
						{isAdmin && (
							<span className="admin-icon">👑</span>
						)}
					</div>
					<span className="control-label">
						{isAdmin ? t("footer.manage", "Gestión") : t("footer.position", "Posición")}
					</span>
				</button>

				{/* Control de Gadgets */}
				<button 
					className="footer-control gadgets-control"
					onClick={handleGadgetsClick}
					title={t("footer.gadgets", "Gadgets")}
				>
					<img src={iconGadgets} alt="Gadgets" className="control-icon" />
					<span className="control-label">{t("footer.gadgets", "Gadgets")}</span>
				</button>
			</div>
		</div>
	);
};

EventFooter.propTypes = {
	eventId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
};

export default EventFooter;
