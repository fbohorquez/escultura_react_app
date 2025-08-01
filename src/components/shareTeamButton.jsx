// src/components/shareTeamButton.jsx
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import webrtcService from '../services/webrtcService';
import shareIcon from '../assets/share.png';

const ShareTeamButton = ({ eventId }) => {
	const { t } = useTranslation();
	const [isSharing, setIsSharing] = useState(false);
	const [error, setError] = useState('');
	
	const selectedTeam = useSelector((state) => state.session.selectedTeam);
	const isAdmin = useSelector((state) => state.session.isAdmin);

	// Verificar si está habilitado en configuración
	const isShareEnabled = import.meta.env.VITE_SHARE_TEAM_ALLOW === 'true';

	// No mostrar el botón si no está habilitado o es admin o no hay equipo seleccionado
	if (!isShareEnabled || isAdmin || !selectedTeam) {
		return null;
	}

	const handleShare = async () => {
		try {
			setIsSharing(true);
			setError('');

			// Inicializar WebRTC como host
			await webrtcService.initializeAsHost(eventId, selectedTeam.id);

			// Generar URL para compartir
			const url = webrtcService.generateShareUrl(eventId, selectedTeam.id);

			// Mostrar notificación o modal con la URL
			showShareModal(url);

		} catch (err) {
			console.error('Error starting screen share:', err);
			setError(t('share.error', 'Error al iniciar la compartición de pantalla'));
			setIsSharing(false);
		}
	};

	const showShareModal = (url) => {
		// Crear modal temporal para mostrar la URL
		const modal = document.createElement('div');
		modal.style.cssText = `
			position: fixed;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			background: rgba(0, 0, 0, 0.8);
			display: flex;
			align-items: center;
			justify-content: center;
			z-index: 10000;
			padding: 20px;
		`;

		const content = document.createElement('div');
		content.style.cssText = `
			background: white;
			padding: 20px;
			border-radius: 10px;
			max-width: 500px;
			width: 100%;
			text-align: center;
		`;

		content.innerHTML = `
			<h3>${t('share.title', 'Compartir Equipo')}</h3>
			<p>${t('share.instructions', 'Comparte esta URL para que otros puedan ver la pantalla de tu equipo:')}</p>
			<div style="background: #f5f5f5; padding: 10px; border-radius: 5px; margin: 15px 0; word-break: break-all; font-family: monospace;">
				${url}
			</div>
			<div style="display: flex; gap: 10px; justify-content: center;">
				<button id="copy-btn" style="background: var(--primary-color); color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
					${t('share.copy', 'Copiar URL')}
				</button>
				<button id="close-btn" style="background: #ccc; color: black; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
					${t('share.close', 'Cerrar')}
				</button>
			</div>
		`;

		modal.appendChild(content);
		document.body.appendChild(modal);

		// Funcionalidad de botones
		content.querySelector('#copy-btn').onclick = () => {
			navigator.clipboard.writeText(url).then(() => {
				alert(t('share.copied', 'URL copiada al portapapeles'));
			});
		};

		content.querySelector('#close-btn').onclick = () => {
			document.body.removeChild(modal);
		};

		modal.onclick = (e) => {
			if (e.target === modal) {
				document.body.removeChild(modal);
			}
		};
	};

	const handleStop = () => {
		webrtcService.cleanup();
		setIsSharing(false);
	};

	return (
		<button
			className="share-team-button"
			onClick={isSharing ? handleStop : handleShare}
			title={isSharing ? t('share.stop', 'Detener compartir') : t('share.start', 'Compartir equipo')}
			disabled={!!error}
		>
			<img src={shareIcon} alt="Share" className="share-icon" />
			{error && <div className="share-error">{error}</div>}
		</button>
	);
};

export default ShareTeamButton;
