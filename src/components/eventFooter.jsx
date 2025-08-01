// src/components/eventFooter.jsx
import React, { useMemo, useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PropTypes from "prop-types";

import iconChat from "../assets/icon_chat.png";
import iconGadgets from "../assets/icon_gadgets.png";
import shareIcon from "../assets/share.png";
import BackgroundDecagon from "../assets/decagon.svg";
import NotificationBubble from "./notificationBubble";
import webrtcService from '../services/webrtcService';

const EventFooter = ({ eventId }) => {
	const { t } = useTranslation();
	const navigate = useNavigate();

	const teams = useSelector((state) => state.teams.items);
	const selectedTeam = useSelector((state) => state.session.selectedTeam);
	const isAdmin = useSelector((state) => state.session.isAdmin);
	const unreadCounts = useSelector((state) => state.chats.unreadCounts);

	// Estado para el botón de compartir
	const [isSharing, setIsSharing] = useState(false);
	const [shareError, setShareError] = useState('');
	
	// Verificar si está habilitado en configuración
	const isShareEnabled = import.meta.env.VITE_SHARE_TEAM_ALLOW === 'true';

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

	// Funciones para el botón de compartir
	const handleShare = async () => {
		try {
			setIsSharing(true);
			setShareError('');

			// Inicializar WebRTC como host
			await webrtcService.initializeAsHost(eventId, selectedTeam.id);

			// Generar URL de compartir
			const url = webrtcService.generateShareUrl(eventId, selectedTeam.id);

			// Mostrar modal de compartir
			showShareModal(url);
		} catch (err) {
			console.error('Error starting screen share:', err);
			setShareError(t('share.error', 'Error al iniciar la compartición de pantalla'));
		}
	};

	const handleStopShare = async () => {
		try {
			webrtcService.cleanup();
			setIsSharing(false);
		} catch (err) {
			console.error('Error stopping screen share:', err);
		}
	};

	const showShareModal = (url) => {
		// Crear un ID único para el modal
		const modalId = 'share-modal-' + Date.now();
		
		const modalHTML = `
			<div id="${modalId}" style="
				position: fixed;
				top: 0;
				left: 0;
				right: 0;
				bottom: 0;
				background: rgba(0,0,0,0.8);
				display: flex;
				align-items: center;
				justify-content: center;
				z-index: 10000;
				padding: 20px;
			">
				<div style="
					background: white;
					padding: 30px;
					border-radius: 12px;
					max-width: 500px;
					width: 100%;
					text-align: center;
					box-shadow: 0 10px 30px rgba(0,0,0,0.3);
				">
					<h3>${t('share.title', 'Compartir Equipo')}</h3>
					<p>${t('share.instructions', 'Comparte esta URL para que otros puedan ver la pantalla de tu equipo:')}</p>
					<div style="margin: 20px 0; padding: 15px; background: #f5f5f5; border-radius: 8px; word-break: break-all; font-family: monospace; font-size: 14px;">
						${url}
					</div>
					<div style="display: flex; gap: 10px; justify-content: center;">
						<button onclick="
							navigator.clipboard.writeText('${url}');
							alert('${t('share.copied', 'URL copiada al portapapeles')}');
						" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 6px; cursor: pointer;">
							${t('share.copy', 'Copiar URL')}
						</button>
						<button onclick="document.getElementById('${modalId}').remove()" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 6px; cursor: pointer;">
							${t('share.close', 'Cerrar')}
						</button>
					</div>
				</div>
			</div>
		`;

		// Crear y agregar el modal al DOM
		const modalElement = document.createElement('div');
		modalElement.innerHTML = modalHTML;
		document.body.appendChild(modalElement.firstElementChild);

		// También permitir cerrar haciendo clic en el overlay
		const modal = document.getElementById(modalId);
		modal.addEventListener('click', (e) => {
			if (e.target === modal) {
				modal.remove();
			}
		});

		// Auto-copiar al portapapeles
		navigator.clipboard.writeText(url).then(() => {
			console.log('URL copiada automáticamente');
		}).catch(err => {
			console.error('Error copiando URL:', err);
		});
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

				{/* Control de Compartir Equipo - Solo para equipos no admin */}
				{isShareEnabled && !isAdmin && selectedTeam && (
					<button
						className="share-control"
						onClick={isSharing ? handleStopShare : handleShare}
						title={isSharing ? t('share.stop', 'Detener compartir') : t('share.start', 'Compartir equipo')}
					>
						<img src={shareIcon} alt="Share" className="control-icon" />
						{isSharing && <div className="sharing-indicator"></div>}
					</button>
				)}
			</div>
		</div>
	);
};

EventFooter.propTypes = {
	eventId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
};

export default EventFooter;

