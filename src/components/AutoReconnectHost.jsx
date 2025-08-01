// src/components/AutoReconnectHost.jsx
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import webrtcService from '../services/webrtcService';

const AutoReconnectHost = () => {
	const { t } = useTranslation();
	const [isReconnecting, setIsReconnecting] = useState(false);
	const [reconnectSession, setReconnectSession] = useState(null);
	const [showReconnectPrompt, setShowReconnectPrompt] = useState(false);

	useEffect(() => {
		// Verificar sesión de host al cargar la página
		checkForHostSession();

		// Manejar evento beforeunload para detectar si se cierra la pestaña intencionalmente
		const handleBeforeUnload = () => {
			const session = webrtcService.getHostSession();
			if (session) {
				// Marcar que la página se está cerrando intencionalmente
				localStorage.setItem('webrtc_host_closing', 'true');
			}
		};

		// Detectar cuando la página se carga después de un refresco/cierre
		const handlePageShow = (event) => {
			// Si la página viene de cache (navegador back/forward) 
			if (event.persisted) {
				console.log('🔄 AutoReconnectHost: Page loaded from cache, checking session...');
				checkForHostSession();
			}
		};

		// Limpiar flag de cierre al cargar la página
		const wasClosingIntentionally = localStorage.getItem('webrtc_host_closing');
		if (wasClosingIntentionally) {
			console.log('🗑️ AutoReconnectHost: Page was closed intentionally, clearing session');
			webrtcService.clearHostSession();
			localStorage.removeItem('webrtc_host_closing');
		}

		window.addEventListener('beforeunload', handleBeforeUnload);
		window.addEventListener('pageshow', handlePageShow);

		return () => {
			window.removeEventListener('beforeunload', handleBeforeUnload);
			window.removeEventListener('pageshow', handlePageShow);
		};
	}, []);

	const checkForHostSession = () => {
		const session = webrtcService.checkForActiveHostSession();
		if (session) {
			console.log('🔄 AutoReconnectHost: Found active session, showing reconnect prompt');
			setReconnectSession(session);
			setShowReconnectPrompt(true);
		}
	};

	const handleAutoReconnect = async () => {
		if (!reconnectSession) return;

		try {
			setIsReconnecting(true);
			setShowReconnectPrompt(false);
			
			console.log('🎯 AutoReconnectHost: Starting auto-reconnect...');
			await webrtcService.initializeAsHost(reconnectSession.eventId, reconnectSession.teamId);
			
			console.log('✅ AutoReconnectHost: Auto-reconnect successful');
			setReconnectSession(null);
		} catch (error) {
			console.error('❌ AutoReconnectHost: Auto-reconnect failed:', error);
			// Mostrar error pero mantener la opción de reconectar
			setShowReconnectPrompt(true);
		} finally {
			setIsReconnecting(false);
		}
	};

	const handleDismissReconnect = () => {
		webrtcService.clearHostSession();
		setShowReconnectPrompt(false);
		setReconnectSession(null);
	};

	if (!showReconnectPrompt && !isReconnecting) {
		return null;
	}

	return (
		<>
			{/* Overlay de reconexión automática */}
			{showReconnectPrompt && (
				<div style={{
					position: 'fixed',
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
					background: 'rgba(0,0,0,0.8)',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					zIndex: 10001,
					padding: '20px'
				}}>
					<div style={{
						background: 'white',
						padding: '30px',
						borderRadius: '12px',
						maxWidth: '500px',
						textAlign: 'center',
						boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
					}}>
						<h3 style={{ margin: '0 0 20px 0', color: '#333' }}>
							🔄 {t('host.reconnect_title', 'Reconexión Automática')}
						</h3>
						
						<p style={{ margin: '0 0 20px 0', color: '#666', lineHeight: '1.5' }}>
							{t('host.reconnect_desc', 
								'Se detectó que estabas compartiendo pantalla para el equipo {{teamId}}. ¿Quieres continuar compartiendo?',
								{ teamId: reconnectSession?.teamId }
							)}
						</p>
						
						<div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
							<button
								onClick={handleAutoReconnect}
								style={{
									background: '#28a745',
									color: 'white',
									border: 'none',
									padding: '12px 24px',
									borderRadius: '6px',
									cursor: 'pointer',
									fontSize: '16px',
									fontWeight: 'bold'
								}}
							>
								🎯 {t('host.continue_sharing', 'Continuar Compartiendo')}
							</button>
							
							<button
								onClick={handleDismissReconnect}
								style={{
									background: '#6c757d',
									color: 'white',
									border: 'none',
									padding: '12px 24px',
									borderRadius: '6px',
									cursor: 'pointer',
									fontSize: '16px'
								}}
							>
								❌ {t('host.stop_sharing', 'No Continuar')}
							</button>
						</div>
					</div>
				</div>
			)}
			
			{/* Overlay de reconectando */}
			{isReconnecting && (
				<div style={{
					position: 'fixed',
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
					background: 'rgba(0,0,0,0.8)',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					zIndex: 10001,
					padding: '20px'
				}}>
					<div style={{
						background: 'white',
						padding: '30px',
						borderRadius: '12px',
						textAlign: 'center',
						maxWidth: '400px',
						boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
					}}>
						<div style={{
							width: '50px',
							height: '50px',
							border: '4px solid #f3f3f3',
							borderTop: '4px solid #007bff',
							borderRadius: '50%',
							animation: 'spin 1s linear infinite',
							margin: '0 auto 20px'
						}}></div>
						
						<h3 style={{ margin: '0 0 10px 0', color: '#333' }}>
							{t('host.reconnecting', 'Reconectando...')}
						</h3>
						
						<p style={{ margin: '0', color: '#666' }}>
							{t('host.reconnecting_desc', 'Solicitando permisos de captura de pantalla...')}
						</p>
					</div>
				</div>
			)}
			
			<style jsx>{`
				@keyframes spin {
					0% { transform: rotate(0deg); }
					100% { transform: rotate(360deg); }
				}
			`}</style>
		</>
	);
};

export default AutoReconnectHost;
