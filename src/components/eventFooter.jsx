// src/components/eventFooter.jsx
import React, { useMemo, useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PropTypes from "prop-types";

import iconChat from "../assets/icon_chat.png";
import iconGadgets from "../assets/icon_gadgets.png";
import BackgroundDecagon from "../assets/decagon.svg";
import NotificationBubble from "./notificationBubble";

const EventFooter = ({ eventId, collapsed }) => {
	const { t } = useTranslation();
	const navigate = useNavigate();

	const teams = useSelector((state) => state.teams.items);
	const selectedTeam = useSelector((state) => state.session.selectedTeam);
	const isAdmin = useSelector((state) => state.session.isAdmin);
	const unreadCounts = useSelector((state) => state.chats.unreadCounts);
	
	// Calcular el total de mensajes no leídos
	const totalUnreadMessages = useMemo(() => {
		return Object.values(unreadCounts || {}).reduce((total, count) => total + count, 0);
	}, [unreadCounts]);

	// Estado y lógica del cronómetro para admin
	const [seconds, setSeconds] = useState(0);
	const [isRunning, setIsRunning] = useState(false);

	// Formatear tiempo para mostrar (mm:ss)
	const formatTime = (totalSeconds) => {
		const minutes = Math.floor(totalSeconds / 60);
		const secs = totalSeconds % 60;
		return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
	};

	// Iniciar cronómetro automáticamente cuando es admin
	useEffect(() => {
		if (isAdmin) {
			setIsRunning(true);
			setSeconds(0);
		} else {
			setIsRunning(false);
		}
	}, [isAdmin]);

	// Efecto para el cronómetro
	useEffect(() => {
		let interval = null;
		if (isRunning) {
			interval = setInterval(() => {
				setSeconds(prev => prev + 1);
			}, 1000);
		} else if (!isRunning && seconds !== 0) {
			clearInterval(interval);
		}
		return () => clearInterval(interval);
	}, [isRunning, seconds]);

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
		if (isAdmin) {
			// Reiniciar cronómetro para admin
			setSeconds(0);
			setIsRunning(true);
		} else {
			navigate(`/ranking/${eventId}`);
		}
	};

	const handleGadgetsClick = () => {
		navigate(`/gadgets/${eventId}`);
	};

	return (
		<div className={`event-footer ${collapsed ? "collapsed" : ""}`}>
			<div className="footer-controls">
				{/* Control de Chat */}
				<button
					className="footer-control chat-control"
					onClick={handleChatClick}
					title={t("footer.chat", "Chat")}
				>
					<img src={iconChat} alt="Chat" className="control-icon" />
					<NotificationBubble count={totalUnreadMessages} size="small" />
				</button>

				{/* Control de Posición */}
				<button
					className="footer-control position-control"
					onClick={handlePositionClick}
					title={t("footer.ranking", "Ranking")}
				>
					<svg
						width="80" height="80"
						viewBox="-110 -110 220 220"
						xmlns="http://www.w3.org/2000/svg"
					>
						<polygon
							fill="none"
							stroke="var(--primary-color)"
							strokeWidth="2"
							points="
								100,0
								80.90,58.78
								30.90,95.11
								-30.90,95.11
								-80.90,58.78
								-100,0
								-80.90,-58.78
								-30.90,-95.11
								30.90,-95.11
								80.90,-58.78
							"
						/>
					</svg>
					<div
						className="position-background"
						style={{ backgroundImage: `url(${BackgroundDecagon})` }}
					>
						{!isAdmin && teamPosition && (
							<span className="position-number">{teamPosition}</span>
						)}
						{isAdmin && (
							<span className="timer-display">{formatTime(seconds)}</span>
						)}
					</div>
					{/* <span className="control-label">
						{isAdmin ? t("footer.manage", "Gestión") : t("footer.position", "Posición")}
					</span> */}
				</button>

				{/* Control de Gadgets */}
				<button
					className="footer-control gadgets-control"
					onClick={handleGadgetsClick}
					title={t("footer.gadgets", "Gadgets")}
				>
					<img src={iconGadgets} alt="Gadgets" className="control-icon" />
				</button>
			</div>
		</div>
	);
};

EventFooter.propTypes = {
	eventId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
	collapsed: PropTypes.bool,
};

EventFooter.defaultProps = {
	collapsed: false,
};

export default EventFooter;

