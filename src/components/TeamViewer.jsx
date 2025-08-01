// src/components/TeamViewer.jsx
import React, { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import webrtcService from '../services/webrtcService';

const TeamViewer = ({ eventId, teamId }) => {
	console.log('🏗️ TeamViewer: Component initialized with props:', { eventId, teamId, eventIdType: typeof eventId, teamIdType: typeof teamId });
	
	const { t } = useTranslation();
	const mainVideoRef = useRef(null);
	const cameraVideoRef = useRef(null);
	const isInitializedRef = useRef(false);
	const isInitializingRef = useRef(false);
	const streamCallbackRef = useRef(null);
	const [isConnecting, setIsConnecting] = useState(false);
	const [error, setError] = useState('');
	const [hasCamera, setHasCamera] = useState(false);
	const [needsUserInteraction, setNeedsUserInteraction] = useState(true);
	const [connectionState, setConnectionState] = useState('');
	const [reconnectionInfo, setReconnectionInfo] = useState(null);

	// Función para manejar cambios en el estado de conexión
	const handleConnectionStateChange = useCallback((state, data = {}) => {
		console.log('📡 TeamViewer: Connection state changed:', state, data);
		setConnectionState(state);
		
		switch (state) {
			case 'connecting':
				setIsConnecting(true);
				setError('');
				setReconnectionInfo(null);
				break;
			case 'connected':
				setIsConnecting(false);
				setError('');
				setReconnectionInfo(null);
				break;
			case 'disconnected':
			case 'failed':
				setError(t('viewer.connection_lost', 'Conexión perdida'));
				break;
			case 'reconnecting':
				setIsConnecting(true);
				setError('');
				setReconnectionInfo(data);
				break;
			case 'host-disconnected':
				setError(t('viewer.host_disconnected', 'Host desconectado. Reintentando...'));
				setIsConnecting(true);
				break;
			case 'host-not-available':
				setError(t('viewer.host_not_available', 'Host no disponible. Reintentando...'));
				setIsConnecting(true);
				break;
			case 'host-available':
				setError('');
				setIsConnecting(true);
				break;
			case 'failed-max-attempts':
				setError(t('viewer.max_reconnect_attempts', 'No se pudo reconectar después de varios intentos'));
				setIsConnecting(false);
				break;
			default:
				break;
		}
	}, [t]);

	// Función para manejar el stream remoto de forma segura
	const handleRemoteStreamSafely = useCallback((remoteStream) => {
		console.log('🎥 TeamViewer: *** REMOTE STREAM RECEIVED IN COMPONENT ***');
		console.log('📊 TeamViewer: Stream details:', {
			streamId: remoteStream?.id,
			tracks: remoteStream?.getTracks()?.length || 0,
			videoTracks: remoteStream?.getVideoTracks()?.length || 0,
			audioTracks: remoteStream?.getAudioTracks()?.length || 0,
			trackDetails: remoteStream?.getTracks()?.map(track => ({
				kind: track.kind,
				id: track.id,
				enabled: track.enabled,
				readyState: track.readyState,
				label: track.label
			})) || []
		});

		// Verificar que las refs estén disponibles
		if (!mainVideoRef.current) {
			console.log('⏳ TeamViewer: mainVideoRef not ready yet, storing stream...');
			streamCallbackRef.current = remoteStream;
			return;
		}

		// Procesar el stream
		const videoTracks = remoteStream.getVideoTracks();
		const audioTracks = remoteStream.getAudioTracks();
		
		console.log('📊 TeamViewer: Processing tracks:', { 
			video: videoTracks.length, 
			audio: audioTracks.length 
		});
		
		// Crear stream principal (pantalla)
		const mainStream = new MediaStream();
		
		// Crear stream de cámara
		const cameraStream = new MediaStream();
		
		let hasCameraTracks = false;
		
		videoTracks.forEach(track => {
			if (track.cameraTrack) {
				// Track de cámara
				cameraStream.addTrack(track);
				hasCameraTracks = true;
			} else {
				// Track de pantalla
				mainStream.addTrack(track);
			}
		});
		
		// Agregar audio al stream principal
		audioTracks.forEach(track => {
			mainStream.addTrack(track);
		});
		
		// Asignar streams a los elementos de video
		if (mainVideoRef.current) {
			console.log('🖥️ TeamViewer: Setting main video srcObject');
			console.log('🔍 TeamViewer: Main stream details:', {
				streamId: mainStream.id,
				tracks: mainStream.getTracks().length,
				videoTracks: mainStream.getVideoTracks().length,
				audioTracks: mainStream.getAudioTracks().length
			});
			
			mainVideoRef.current.srcObject = mainStream;
			mainVideoRef.current.play().then(() => {
				console.log('▶️ TeamViewer: Main video playing successfully');
			}).catch(error => {
				console.error('❌ TeamViewer: Error playing main video:', error);
			});
		} else {
			console.warn('⚠️ TeamViewer: mainVideoRef.current is still null');
		}
		
		if (hasCameraTracks && cameraVideoRef.current) {
			console.log('📹 TeamViewer: Setting camera video srcObject');
			cameraVideoRef.current.srcObject = cameraStream;
			cameraVideoRef.current.play().catch(console.error);
			setHasCamera(true);
		}
		
		console.log('✅ TeamViewer: *** STREAM SETUP COMPLETED - UPDATING STATE ***');
		setIsConnecting(false);
		setError('');
	}, []);

	// Función para inicializar el viewer
	const initializeViewer = useCallback(async () => {
		console.log('🎬 TeamViewer: *** ENTERING INITIALIZE VIEWER ***');
		console.log('🎬 TeamViewer: Starting initialization for', { eventId, teamId });
		console.log('🎬 TeamViewer: webrtcService available:', !!webrtcService);
		console.log('🎬 TeamViewer: webrtcService.initializeAsViewer available:', typeof webrtcService?.initializeAsViewer);
		console.log('🎬 TeamViewer: Refs status:', {
			isInitialized: isInitializedRef.current,
			isInitializing: isInitializingRef.current
		});
		
		if (isInitializedRef.current || isInitializingRef.current) {
			console.log('⚠️ TeamViewer: Already initialized or initializing, skipping...');
			return;
		}
		
		console.log('🔄 TeamViewer: Setting isInitializing to true...');
		isInitializingRef.current = true;
		setError('');
		
		try {
			console.log('📞 TeamViewer: *** SETTING UP REMOTE STREAM CALLBACK ***');
			console.log('📞 TeamViewer: webrtcService.setOnRemoteStreamCallback available:', typeof webrtcService?.setOnRemoteStreamCallback);
			webrtcService.setOnRemoteStreamCallback(handleRemoteStreamSafely);
			console.log('✅ TeamViewer: Remote stream callback set');
			
			// Configurar callback para estados de conexión
			console.log('📡 TeamViewer: Setting up connection state callback...');
			webrtcService.onConnectionState(handleConnectionStateChange);
			console.log('✅ TeamViewer: Connection state callback set');
			
			console.log('🚀 TeamViewer: About to call webrtcService.initializeAsViewer...');
			console.log('🚀 TeamViewer: Parameters:', { eventId, teamId, eventIdType: typeof eventId, teamIdType: typeof teamId });
			
			const result = await webrtcService.initializeAsViewer(eventId, teamId);
			
			console.log('✅ TeamViewer: webrtcService.initializeAsViewer completed successfully');
			console.log('✅ TeamViewer: Result:', result);
			
			isInitializedRef.current = true;
			console.log('✅ TeamViewer: *** INITIALIZE VIEWER COMPLETED ***');
		} catch (error) {
			console.error('❌ TeamViewer: *** ERROR DURING INITIALIZATION ***');
			console.error('❌ TeamViewer: Error during initialization:', error);
			console.error('❌ TeamViewer: Error message:', error.message);
			console.error('❌ TeamViewer: Error stack:', error.stack);
			console.error('❌ TeamViewer: Error name:', error.name);
			setError(error.message || t('viewer.connection_error', 'Error de conexión'));
			setIsConnecting(false);
			throw error; // Re-throw para que se capture en handleStartViewing
		} finally {
			console.log('🏁 TeamViewer: Setting isInitializing to false...');
			isInitializingRef.current = false;
			console.log('🏁 TeamViewer: *** INITIALIZE VIEWER FINALLY BLOCK ***');
		}
	}, [eventId, teamId, t, handleRemoteStreamSafely, handleConnectionStateChange]);

	// Función para iniciar la conexión después de la interacción del usuario
	const handleStartViewing = useCallback(async () => {
		console.log('🚀 TeamViewer: *** ENTERING handleStartViewing ***');
		
		try {
			console.log('🎯 TeamViewer: User clicked start viewing button');
			console.log('🎯 TeamViewer: Setting state variables...');
			setNeedsUserInteraction(false);
			setIsConnecting(true);
			console.log('✅ TeamViewer: State variables set');
			
			// Simplificamos - omitimos el video play por ahora
			console.log('🎵 TeamViewer: Skipping video play preparation for now...');
			
			console.log('🔗 TeamViewer: About to call initializeViewer...');
			
			// Inicializar la conexión WebRTC
			try {
				await initializeViewer();
				console.log('✅ TeamViewer: initializeViewer completed successfully');
			} catch (initError) {
				console.error('❌ TeamViewer: Error in initializeViewer:', initError);
				throw initError; // Re-throw para que se capture en el catch externo
			}
			
			console.log('🎉 TeamViewer: *** handleStartViewing COMPLETED SUCCESSFULLY ***');
		} catch (error) {
			console.error('❌ TeamViewer: *** ERROR IN handleStartViewing ***');
			console.error('❌ TeamViewer: Error starting viewer:', error);
			console.error('❌ TeamViewer: Error message:', error.message);
			console.error('❌ TeamViewer: Error stack:', error.stack);
			console.error('❌ TeamViewer: Error name:', error.name);
			setError(error.message || 'Error al iniciar la visualización');
			setIsConnecting(false);
		}
		
		console.log('🏁 TeamViewer: *** EXITING handleStartViewing ***');
	}, [initializeViewer]);

	// useLayoutEffect para procesar streams pendientes una vez que las refs están listas
	useLayoutEffect(() => {
		console.log('🔍 TeamViewer: useLayoutEffect triggered');
		console.log('📊 TeamViewer: Refs status:', {
			mainVideoRef: !!mainVideoRef.current,
			streamCallback: !!streamCallbackRef.current,
			isConnecting
		});
		
		if (streamCallbackRef.current && mainVideoRef.current) {
			console.log('📺 TeamViewer: Processing pending stream...');
			handleRemoteStreamSafely(streamCallbackRef.current);
			streamCallbackRef.current = null;
		} else if (streamCallbackRef.current && !mainVideoRef.current) {
			console.log('⏳ TeamViewer: Stream pending, but mainVideoRef still not ready');
		} else if (!streamCallbackRef.current && mainVideoRef.current) {
			console.log('✅ TeamViewer: mainVideoRef ready, but no pending stream');
		}
	});

	// Función para manejar reintentos manuales
	const handleRetry = useCallback(async () => {
		console.log('🔄 TeamViewer: Manual retry triggered');
		setError('');
		isInitializedRef.current = false;
		setNeedsUserInteraction(true);
		setIsConnecting(false);
		
		// Limpiar el servicio
		webrtcService.cleanup();
	}, []);

	useEffect(() => {
		// Solo validar parámetros en el mount, no inicializar automáticamente
		if (!eventId || !teamId) {
			console.error('❌ TeamViewer: Missing eventId or teamId', { eventId, teamId });
			setError('Parámetros de evento o equipo faltantes');
			return;
		}

		// Cleanup al desmontar
		return () => {
			console.log('🧹 TeamViewer: Component unmounting');
			if (!isInitializingRef.current) {
				console.log('🧹 TeamViewer: Performing cleanup...');
				webrtcService.cleanup();
			} else {
				console.log('⏳ TeamViewer: Skipping cleanup - initialization in progress');
			}
		};
	}, [eventId, teamId]);

	if (error) {
		return (
			<div className="viewer-container viewer-error">
				<div className="error-content">
					<h2>{t('viewer.connection_failed', 'Conexión Fallida')}</h2>
					<p>{error}</p>
					<button 
						onClick={handleRetry}
						className="retry-button"
						disabled={isConnecting}
					>
						{isConnecting ? t('viewer.retrying', 'Reintentando...') : t('viewer.retry', 'Reintentar')}
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="viewer-container">
			{/* Botón de inicio para interacción del usuario */}
			{needsUserInteraction && (
				<div className="viewer-start-overlay">
					<div className="start-content">
						<div className="start-icon">📺</div>
						<h2>{t('viewer.start_viewing', 'Iniciar Visualización')}</h2>
						<p>{t('viewer.start_desc', 'Haz clic para conectarte y ver la pantalla del equipo')}</p>
						<button 
							onClick={handleStartViewing}
							className="start-button"
							disabled={isConnecting}
						>
							{t('viewer.start_button', 'Conectar')}
						</button>
					</div>
				</div>
			)}
			
			{/* Loading overlay que se muestra encima del video */}
			{isConnecting && (
				<div className="viewer-loading-overlay">
					<div className="loading-content">
						<div className="loading-spinner"></div>
						{connectionState === 'reconnecting' && reconnectionInfo ? (
							<>
								<h2>{t('viewer.reconnecting', 'Reconectando...')}</h2>
								<p>
									{t('viewer.reconnecting_desc', 'Intento {{attempt}} de {{maxAttempts}}', {
										attempt: reconnectionInfo.attempt,
										maxAttempts: reconnectionInfo.maxAttempts
									})}
								</p>
								<p className="reconnect-delay">
									{t('viewer.next_attempt', 'Próximo intento en {{seconds}}s', {
										seconds: Math.ceil(reconnectionInfo.delay / 1000)
									})}
								</p>
							</>
						) : connectionState === 'host-disconnected' ? (
							<>
								<h2>{t('viewer.host_disconnected', 'Host Desconectado')}</h2>
								<p>{t('viewer.host_disconnected_desc', 'El host se ha desconectado. Reintentando conexión...')}</p>
							</>
						) : connectionState === 'host-not-available' ? (
							<>
								<h2>{t('viewer.host_not_available', 'Host No Disponible')}</h2>
								<p>{t('viewer.host_not_available_desc', 'El host no está disponible. Reintentando...')}</p>
							</>
						) : connectionState === 'host-available' ? (
							<>
								<h2>{t('viewer.host_available', 'Host Disponible')}</h2>
								<p>{t('viewer.host_available_desc', 'Host detectado. Estableciendo conexión...')}</p>
							</>
						) : (
							<>
								<h2>{t('viewer.connecting', 'Conectando...')}</h2>
								<p>{t('viewer.connecting_desc', 'Estableciendo conexión con el equipo')}</p>
							</>
						)}
					</div>
				</div>
			)}
			
			{/* Video principal (pantalla del equipo) - SIEMPRE renderizado */}
			<video 
				ref={mainVideoRef}
				className={`main-video ${isConnecting || needsUserInteraction ? 'hidden' : ''}`}
				autoPlay
				playsInline
				muted={false}
				controls={false}
			/>
			
			{/* Video de cámara (si está disponible) */}
			{hasCamera && (
				<video 
					ref={cameraVideoRef}
					className={`camera-video ${isConnecting || needsUserInteraction ? 'hidden' : ''}`}
					autoPlay
					playsInline
					muted={true}
					controls={false}
				/>
			)}
			
			{/* Información del equipo - solo cuando no está conectando */}
			{!isConnecting && !needsUserInteraction && (
				<div className="viewer-info">
					<div className="team-info">
						<span className="team-label">{t('viewer.watching', 'Viendo equipo')}:</span>
						<span className="team-id">#{teamId}</span>
					</div>
				</div>
			)}
		</div>
	);
};

export default TeamViewer;
