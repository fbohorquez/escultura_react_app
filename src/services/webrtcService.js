// src/services/webrtcService.js

class WebRTCService {
	constructor() {
		this.ws = null;
		this.peerConnection = null;
		this.localStream = null;
		this.remoteStream = null;
		this.isHost = false;
		this.isConnected = false;
		this.eventId = null;
		this.teamId = null;
		this.onRemoteStreamCallback = null;
		this.signalingServer = import.meta.env.VITE_SHARE_TEAM_SIGNALING_SERVER || 'ws://localhost:3088';
		
		// Sistema de reconexión
		this.reconnectAttempts = 0;
		this.maxReconnectAttempts = 10;
		this.reconnectDelay = 2000; // Comienza con 2 segundos
		this.maxReconnectDelay = 30000; // Máximo 30 segundos
		this.reconnectTimer = null;
		this.isReconnecting = false;
		this.onConnectionStateCallback = null;
		this.lastConnectionTime = null;
		this.heartbeatInterval = null;
		this.heartbeatTimer = null;
		this.isIntentionalDisconnect = false;
	}

	// Detectar si es un dispositivo móvil
	isMobileDevice() {
		return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
			   (navigator.maxTouchPoints && navigator.maxTouchPoints > 2 && /MacIntel/.test(navigator.platform));
	}

	// Inicializar como host (quien comparte)
	async initializeAsHost(eventId, teamId) {
		try {
			console.log('🎯 WebRTCService: *** INITIALIZING AS HOST ***', { eventId, teamId });
			
			this.isHost = true;
			this.eventId = eventId;
			this.teamId = teamId;
			this.isIntentionalDisconnect = false;

			// Guardar estado de compartición en localStorage
			this.saveHostSession(eventId, teamId);

			// Conectar al servidor de señalización
			console.log('🔌 WebRTCService: Host connecting to signaling server...');
			await this.connectToSignalingServer();

			// Obtener permisos de captura
			console.log('📹 WebRTCService: Host getting streams...');
			await this.getHostStreams();
			
			console.log('✅ WebRTCService: Host streams obtained:', {
				streamId: this.localStream?.id,
				tracks: this.localStream?.getTracks().length || 0,
				videoTracks: this.localStream?.getVideoTracks().length || 0,
				audioTracks: this.localStream?.getAudioTracks().length || 0,
				trackDetails: this.localStream?.getTracks().map(track => ({
					kind: track.kind,
					id: track.id,
					enabled: track.enabled,
					readyState: track.readyState,
					label: track.label
				})) || []
			});

			// Configurar PeerConnection
			console.log('⚙️ WebRTCService: Host setting up PeerConnection...');
			this.setupPeerConnection();

			// Registrarse como host en el servidor
			console.log('📢 WebRTCService: Host registering with server...');
			this.sendMessage({
				type: 'register-host',
				eventId,
				teamId
			});

			// Iniciar heartbeat para detectar desconexiones
			this.startHeartbeat();

			console.log('🎉 WebRTCService: *** HOST INITIALIZATION COMPLETED ***');
			return true;
		} catch (error) {
			console.error('❌ WebRTCService: Error initializing as host:', error);
			// Limpiar estado guardado si hay error
			this.clearHostSession();
			// Intentar reconectar automáticamente
			this.scheduleReconnection();
			throw error;
		}
	}

	// Inicializar como viewer (quien ve)
	async initializeAsViewer(eventId, teamId) {
		try {
			console.log('🎬 WebRTCService: Initializing as viewer', { eventId, teamId });
			
			this.isHost = false;
			this.eventId = eventId;
			this.teamId = teamId;
			this.isIntentionalDisconnect = false;

			console.log('🔌 WebRTCService: About to connect to signaling server...');
			
			// Conectar al servidor de señalización
			await this.connectToSignalingServer();

			console.log('⚙️ WebRTCService: Setting up peer connection...');
			
			// Configurar PeerConnection
			this.setupPeerConnection();

			console.log('📤 WebRTCService: Sending request-connection message...');
			
			// Solicitar conexión al host
			this.sendMessage({
				type: 'request-connection',
				eventId,
				teamId
			});

			// Iniciar heartbeat para detectar desconexiones
			this.startHeartbeat();

			// Timeout para evitar que se quede cargando indefinidamente
			setTimeout(() => {
				if (!this.remoteStream && this.onRemoteStreamCallback) {
					console.log('⏰ WebRTCService: Connection timeout, checking PeerConnection state...');
					console.log('🔍 WebRTCService: PeerConnection state:', this.peerConnection?.connectionState);
					console.log('🔍 WebRTCService: ICE state:', this.peerConnection?.iceConnectionState);
					console.log('🔍 WebRTCService: Signaling state:', this.peerConnection?.signalingState);
					console.log('🔍 WebRTCService: Remote description:', !!this.peerConnection?.remoteDescription);
					console.log('🔍 WebRTCService: Local description:', !!this.peerConnection?.localDescription);
					
					// Solo mostrar error, no crear stream de prueba
					console.warn('⚠️ WebRTCService: No remote stream received after timeout');
					console.warn('⚠️ WebRTCService: This could indicate that the viewer never received the offer from the host');
					
					// Intentar reconectar
					this.scheduleReconnection();
				}
			}, 15000); // Aumentamos a 15 segundos

			console.log('✅ WebRTCService: Viewer initialization completed');
			return true;
		} catch (error) {
			console.error('❌ WebRTCService: Error initializing as viewer:', error);
			// Intentar reconectar automáticamente
			this.scheduleReconnection();
			throw error;
		}
	}

	// Obtener streams del host
	async getHostStreams() {
		try {
			let displayStream;
			let cameraStream;

			// 1. Capturar la pestaña actual
			if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
				displayStream = await navigator.mediaDevices.getDisplayMedia({
					video: {
						displaySurface: 'browser' // Forzar captura de pestaña del navegador
					},
					audio: true
				});
			} else {
				throw new Error('getDisplayMedia no está soportado');
			}

			// 2. Si es móvil, obtener también la cámara frontal
			if (this.isMobileDevice()) {
				try {
					cameraStream = await navigator.mediaDevices.getUserMedia({
						video: { facingMode: 'user' }, // Cámara frontal
						audio: true
					});
				} catch (cameraError) {
					console.warn('No se pudo acceder a la cámara frontal:', cameraError);
				}
			}

			// Crear un stream combinado
			this.localStream = new MediaStream();

			// Agregar tracks de la pantalla
			displayStream.getVideoTracks().forEach(track => {
				this.localStream.addTrack(track);
			});
			displayStream.getAudioTracks().forEach(track => {
				this.localStream.addTrack(track);
			});

			// Agregar tracks de la cámara si está disponible
			if (cameraStream) {
				// Marcar los tracks de la cámara para identificarlos después
				cameraStream.getVideoTracks().forEach(track => {
					track.cameraTrack = true;
					this.localStream.addTrack(track);
				});
			}

			return this.localStream;
		} catch (error) {
			console.error('Error getting host streams:', error);
			throw error;
		}
	}

	// Configurar PeerConnection
	setupPeerConnection() {
		console.log('⚙️ WebRTCService: Setting up PeerConnection...');
		
		this.peerConnection = new RTCPeerConnection({
			iceServers: [
				// Servidores STUN de Google
				{ urls: 'stun:stun.l.google.com:19302' },
				{ urls: 'stun:stun1.l.google.com:19302' },
				{ urls: 'stun:stun2.l.google.com:19302' },
				{ urls: 'stun:stun3.l.google.com:19302' },
				{ urls: 'stun:stun4.l.google.com:19302' },
				
				// Servidores TURN públicos gratuitos para Firefox
				{
					urls: 'turn:openrelay.metered.ca:80',
					username: 'openrelayproject',
					credential: 'openrelayproject'
				},
				{
					urls: 'turn:openrelay.metered.ca:443',
					username: 'openrelayproject',
					credential: 'openrelayproject'
				},
				{
					urls: 'turn:openrelay.metered.ca:443?transport=tcp',
					username: 'openrelayproject',
					credential: 'openrelayproject'
				},
				
				// Servidor TURN alternativo
				{
					urls: 'turn:relay1.expressturn.com:3478',
					username: 'ef8NQWNFGC60V9DZP7',
					credential: 'L24yE1cEdvECJ1WK'
				}
			],
			iceCandidatePoolSize: 10
		});

		console.log('🔗 WebRTCService: PeerConnection created, isHost:', this.isHost);

		// Agregar tracks locales si es host
		if (this.isHost && this.localStream) {
			console.log('📤 WebRTCService: *** ADDING LOCAL TRACKS TO PEERCONNECTION ***');
			console.log('📊 WebRTCService: Stream details before adding:', {
				streamId: this.localStream.id,
				tracks: this.localStream.getTracks().length,
				videoTracks: this.localStream.getVideoTracks().length,
				audioTracks: this.localStream.getAudioTracks().length
			});
			
			this.localStream.getTracks().forEach((track, index) => {
				console.log(`🎵 WebRTCService: Adding track ${index + 1}:`, {
					kind: track.kind,
					id: track.id,
					enabled: track.enabled,
					readyState: track.readyState,
					label: track.label
				});
				this.peerConnection.addTrack(track, this.localStream);
			});
			
			console.log('✅ WebRTCService: All tracks added to PeerConnection');
		} else if (this.isHost && !this.localStream) {
			console.error('❌ WebRTCService: Host has no localStream to add tracks!');
		}

		// Manejar stream remoto
		this.peerConnection.ontrack = (event) => {
			console.log('🎥 WebRTCService: *** REMOTE STREAM RECEIVED ***');
			console.log('📊 WebRTCService: Event details:', {
				streams: event.streams.length,
				track: {
					kind: event.track.kind,
					id: event.track.id,
					enabled: event.track.enabled,
					readyState: event.track.readyState,
					label: event.track.label
				}
			});
			
			if (event.streams && event.streams[0]) {
				console.log('🎬 WebRTCService: Stream details:', {
					streamId: event.streams[0].id,
					tracks: event.streams[0].getTracks().length,
					videoTracks: event.streams[0].getVideoTracks().length,
					audioTracks: event.streams[0].getAudioTracks().length,
					trackDetails: event.streams[0].getTracks().map(track => ({
						kind: track.kind,
						id: track.id,
						enabled: track.enabled,
						readyState: track.readyState,
						label: track.label
					}))
				});
				
				this.remoteStream = event.streams[0];
				
				console.log('📞 WebRTCService: onRemoteStreamCallback exists:', !!this.onRemoteStreamCallback);
				if (this.onRemoteStreamCallback) {
					console.log('📞 WebRTCService: *** CALLING onRemoteStreamCallback ***');
					this.onRemoteStreamCallback(this.remoteStream);
					console.log('✅ WebRTCService: onRemoteStreamCallback called successfully');
				} else {
					console.error('❌ WebRTCService: onRemoteStreamCallback NOT SET! This is the problem!');
				}
			} else {
				console.warn('⚠️ WebRTCService: No streams in track event');
			}
		};

		// Manejar candidatos ICE
		this.peerConnection.onicecandidate = (event) => {
			if (event.candidate) {
				console.log('🧊 WebRTCService: Sending ICE candidate:', {
					type: event.candidate.type,
					protocol: event.candidate.protocol,
					address: event.candidate.address,
					port: event.candidate.port,
					priority: event.candidate.priority,
					foundation: event.candidate.foundation
				});
				this.sendMessage({
					type: 'ice-candidate',
					candidate: event.candidate,
					eventId: this.eventId,
					teamId: this.teamId
				});
			} else {
				console.log('🔚 WebRTCService: ICE gathering completed (no more candidates)');
			}
		};

		// Manejar cambios de estado de conexión
		this.peerConnection.onconnectionstatechange = () => {
			console.log('🔄 WebRTCService: Connection state changed to:', this.peerConnection.connectionState);
			
			if (this.peerConnection.connectionState === 'connected') {
				console.log('🎉 WebRTCService: PeerConnection established successfully!');
				this.resetReconnectionState();
				this.lastConnectionTime = Date.now();
				this.notifyConnectionState('connected');
			} else if (this.peerConnection.connectionState === 'failed') {
				console.error('💥 WebRTCService: PeerConnection failed!');
				this.notifyConnectionState('failed');
				this.scheduleReconnection();
			} else if (this.peerConnection.connectionState === 'disconnected') {
				console.warn('⚠️ WebRTCService: PeerConnection disconnected');
				this.notifyConnectionState('disconnected');
				// Dar un tiempo para reconexión automática antes de forzar reconexión
				setTimeout(() => {
					if (this.peerConnection && this.peerConnection.connectionState === 'disconnected') {
						console.log('🔄 WebRTCService: Still disconnected after timeout, attempting reconnection...');
						this.scheduleReconnection();
					}
				}, 5000);
			} else if (this.peerConnection.connectionState === 'connecting') {
				this.notifyConnectionState('connecting');
			}
		};

		// Manejar cambios de estado de ICE
		this.peerConnection.oniceconnectionstatechange = () => {
			console.log('🧊 WebRTCService: ICE connection state changed to:', this.peerConnection.iceConnectionState);
			
			if (this.peerConnection.iceConnectionState === 'connected' || 
				this.peerConnection.iceConnectionState === 'completed') {
				console.log('🎉 WebRTCService: ICE connection established!');
			} else if (this.peerConnection.iceConnectionState === 'failed') {
				console.error('💥 WebRTCService: ICE connection failed!');
				console.error('🔍 Firefox users: This may indicate NAT/firewall issues');
				console.error('💡 Suggestion: Try using Chrome or add TURN server configuration');
				
				// En Firefox, esperar más tiempo antes de reconectar debido a problemas de ICE
				const isFirefox = navigator.userAgent.toLowerCase().includes('firefox');
				const reconnectDelay = isFirefox ? 10000 : 5000; // 10s para Firefox, 5s para otros
				
				setTimeout(() => {
					if (this.peerConnection && this.peerConnection.iceConnectionState === 'failed') {
						console.log('🔄 WebRTCService: ICE still failed after timeout, attempting reconnection...');
						this.scheduleReconnection();
					}
				}, reconnectDelay);
			} else if (this.peerConnection.iceConnectionState === 'disconnected') {
				console.warn('⚠️ WebRTCService: ICE connection disconnected');
				// Dar tiempo para recuperación automática
				setTimeout(() => {
					if (this.peerConnection && this.peerConnection.iceConnectionState === 'disconnected') {
						console.log('🔄 WebRTCService: ICE still disconnected, attempting reconnection...');
						this.scheduleReconnection();
					}
				}, 8000);
			} else if (this.peerConnection.iceConnectionState === 'checking') {
				console.log('🔍 WebRTCService: ICE checking candidates...');
			} else if (this.peerConnection.iceConnectionState === 'new') {
				console.log('🆕 WebRTCService: ICE connection new');
			}
		};

		console.log('✅ WebRTCService: PeerConnection setup completed');
	}

	// Conectar al servidor de señalización
	connectToSignalingServer() {
		return new Promise((resolve, reject) => {
			try {
				console.log('🔌 WebRTCService: Connecting to signaling server:', this.signalingServer);
				console.log('🔍 WebRTCService: Current WebSocket state:', this.ws ? this.ws.readyState : 'null');
				
				// Si ya hay una conexión activa, usarla
				if (this.ws && this.ws.readyState === WebSocket.OPEN) {
					console.log('♻️ WebRTCService: Using existing WebSocket connection');
					resolve();
					return;
				}
				
				this.ws = new WebSocket(this.signalingServer);

				// Timeout para la conexión
				const connectionTimeout = setTimeout(() => {
					console.error('⏱️ WebRTCService: Connection timeout after 10 seconds');
					this.ws.close();
					reject(new Error(`Connection timeout to signaling server: ${this.signalingServer}`));
				}, 10000);

				this.ws.onopen = () => {
					clearTimeout(connectionTimeout);
					this.isConnected = true;
					console.log('✅ WebRTCService: Connected to signaling server');
					resolve();
				};

				this.ws.onmessage = async (event) => {
					try {
						const message = JSON.parse(event.data);
						console.log('📨 Received signaling message:', message.type);
						
						// Manejar mensaje de bienvenida
						if (message.type === 'welcome') {
							console.log('👋 Server welcome:', message.message);
							return;
						}
						
						await this.handleSignalingMessage(message);
					} catch (error) {
						console.error('❌ Error handling signaling message:', error);
					}
				};

				this.ws.onerror = (error) => {
					clearTimeout(connectionTimeout);
					console.error('❌ WebSocket error:', error);
					console.error('📡 Failed to connect to:', this.signalingServer);
					console.error('🔍 ReadyState:', this.ws?.readyState);
					
					// Solo rechazar si aún no se ha resuelto la promesa
					if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
						reject(new Error(`Failed to connect to signaling server: ${this.signalingServer}`));
					}
				};

				this.ws.onclose = (event) => {
					clearTimeout(connectionTimeout);
					this.isConnected = false;
					console.log('📴 Disconnected from signaling server:', event.code, event.reason);
					
					// Si la conexión falló durante el establecimiento
					if (event.code !== 1000 && this.ws && this.ws.readyState === WebSocket.CLOSED && !this.isConnected) {
						reject(new Error(`Connection closed during establishment: ${event.code} - ${event.reason}`));
						return;
					}
					
					// Solo intentar reconectar si no fue un cierre intencional y tenemos session activa
					if (!this.isIntentionalDisconnect && event.code !== 1000 && event.code !== 1001 && 
						(this.eventId && this.teamId)) {
						console.log('🔄 WebSocket closed unexpectedly, scheduling reconnection...');
						this.scheduleReconnection();
					}
				};

			} catch (error) {
				console.error('❌ Error creating WebSocket:', error);
				reject(error);
			}
		});
	}

	// Manejar mensajes del servidor de señalización
	async handleSignalingMessage(message) {
		console.log('📨 WebRTCService: *** HANDLING SIGNALING MESSAGE ***', {
			type: message.type,
			isHost: this.isHost,
			eventId: message.eventId,
			teamId: message.teamId
		});

		switch (message.type) {
			case 'connection-request':
				if (this.isHost) {
					console.log('🔗 WebRTCService: Host received connection-request, creating offer...');
					// Un viewer quiere conectarse
					await this.handleConnectionRequest();
				} else {
					console.log('⚠️ WebRTCService: Viewer received connection-request (unexpected)');
				}
				break;

			case 'offer':
				if (!this.isHost) {
					console.log('📥 WebRTCService: Viewer received offer, creating answer...');
					await this.handleOffer(message.offer);
				} else {
					console.log('⚠️ WebRTCService: Host received offer (unexpected)');
				}
				break;

			case 'answer':
				if (this.isHost) {
					console.log('📥 WebRTCService: Host received answer, setting remote description...');
					await this.handleAnswer(message.answer);
				} else {
					console.log('⚠️ WebRTCService: Viewer received answer (unexpected)');
				}
				break;

			case 'ice-candidate':
				console.log('🧊 WebRTCService: Received ICE candidate:', {
					type: message.candidate.type,
					protocol: message.candidate.protocol,
					address: message.candidate.address ? 'HIDDEN' : 'unknown', // Ocultar IP por seguridad
					port: message.candidate.port,
					priority: message.candidate.priority,
					sdpMLineIndex: message.candidate.sdpMLineIndex
				});
				await this.handleIceCandidate(message.candidate);
				break;

			case 'host-available':
				if (!this.isHost) {
					console.log('🎯 WebRTCService: Viewer received host-available, waiting for host to send offer...');
					// El host está disponible, resetear estado de reconexión y esperar offer
					this.resetReconnectionState();
					this.notifyConnectionState('host-available');
				} else {
					console.log('⚠️ WebRTCService: Host received host-available (unexpected)');
				}
				break;

			case 'host-disconnected':
				if (!this.isHost) {
					console.log('📴 WebRTCService: Host disconnected, scheduling reconnection...');
					this.notifyConnectionState('host-disconnected');
					this.scheduleReconnection();
				}
				break;

			case 'pong':
				// Respuesta al heartbeat ping
				this.lastConnectionTime = Date.now();
				console.log('💓 WebRTCService: Received pong, connection alive');
				break;

			case 'error':
				console.error('❌ WebRTCService: Signaling server error:', message.error);
				// Si es el error de "Host not available", programar reconexión para viewers
				if (message.error.includes('Host not available') && !this.isHost) {
					console.log('⚠️ WebRTCService: No host available, scheduling reconnection...');
					this.notifyConnectionState('host-not-available');
					this.scheduleReconnection();
				}
				break;

			default:
				console.warn('⚠️ WebRTCService: Unknown message type:', message.type);
				break;
		}
	}

	// Manejar solicitud de conexión (solo host)
	async handleConnectionRequest() {
		try {
			console.log('🔗 WebRTCService: *** HOST CREATING OFFER ***');
			console.log('📊 WebRTCService: Local stream info:', {
				hasStream: !!this.localStream,
				streamId: this.localStream?.id,
				tracks: this.localStream?.getTracks().length || 0,
				videoTracks: this.localStream?.getVideoTracks().length || 0,
				audioTracks: this.localStream?.getAudioTracks().length || 0
			});
			
			const offer = await this.peerConnection.createOffer();
			console.log('✅ WebRTCService: Offer created:', {
				type: offer.type,
				sdpLines: offer.sdp.split('\n').length,
				hasVideo: offer.sdp.includes('m=video'),
				hasAudio: offer.sdp.includes('m=audio')
			});
			
			await this.peerConnection.setLocalDescription(offer);
			console.log('✅ WebRTCService: Local description set');

			this.sendMessage({
				type: 'offer',
				offer: offer,
				eventId: this.eventId,
				teamId: this.teamId
			});
			
			console.log('📤 WebRTCService: Offer sent to viewer');
		} catch (error) {
			console.error('❌ WebRTCService: Error handling connection request:', error);
		}
	}

	// Manejar oferta (solo viewer)
	async handleOffer(offer) {
		try {
			console.log('📥 WebRTCService: *** VIEWER HANDLING OFFER ***');
			console.log('📊 WebRTCService: Offer details:', {
				type: offer.type,
				sdpLines: offer.sdp.split('\n').length,
				hasVideo: offer.sdp.includes('m=video'),
				hasAudio: offer.sdp.includes('m=audio')
			});
			
			await this.peerConnection.setRemoteDescription(offer);
			console.log('✅ WebRTCService: Remote description set');
			
			const answer = await this.peerConnection.createAnswer();
			console.log('✅ WebRTCService: Answer created:', {
				type: answer.type,
				sdpLines: answer.sdp.split('\n').length,
				hasVideo: answer.sdp.includes('m=video'),
				hasAudio: answer.sdp.includes('m=audio')
			});
			
			await this.peerConnection.setLocalDescription(answer);
			console.log('✅ WebRTCService: Local description set');

			this.sendMessage({
				type: 'answer',
				answer: answer,
				eventId: this.eventId,
				teamId: this.teamId
			});
			
			console.log('📤 WebRTCService: Answer sent to host');
		} catch (error) {
			console.error('❌ WebRTCService: Error handling offer:', error);
		}
	}

	// Manejar respuesta (solo host)
	async handleAnswer(answer) {
		try {
			console.log('📥 WebRTCService: *** HOST HANDLING ANSWER ***');
			console.log('📊 WebRTCService: Answer details:', {
				type: answer.type,
				sdpLines: answer.sdp.split('\n').length,
				hasVideo: answer.sdp.includes('m=video'),
				hasAudio: answer.sdp.includes('m=audio')
			});
			
			await this.peerConnection.setRemoteDescription(answer);
			console.log('✅ WebRTCService: Host set remote description (answer)');
		} catch (error) {
			console.error('❌ WebRTCService: Error handling answer:', error);
			console.error('❌ WebRTCService: Answer SDP:', answer.sdp);
		}
	}

	// Manejar candidato ICE
	async handleIceCandidate(candidate) {
		try {
			console.log('🧊 WebRTCService: Adding ICE candidate to peer connection...');
			await this.peerConnection.addIceCandidate(candidate);
			console.log('✅ WebRTCService: ICE candidate added successfully');
		} catch (error) {
			console.error('❌ WebRTCService: Error adding ICE candidate:', error);
			console.error('🔍 WebRTCService: Candidate details:', {
				type: candidate.type,
				protocol: candidate.protocol,
				sdpMLineIndex: candidate.sdpMLineIndex,
				sdpMid: candidate.sdpMid
			});
			
			// En Firefox, algunos errores de ICE candidates son normales
			const isFirefox = navigator.userAgent.toLowerCase().includes('firefox');
			if (isFirefox && error.message.includes('InvalidStateError')) {
				console.warn('⚠️ Firefox: ICE candidate error may be normal, continuing...');
			} else {
				// Para otros errores, podrían indicar problemas más serios
				console.error('💥 Serious ICE candidate error, may affect connection quality');
			}
		}
	}

	// Crear oferta (solo para casos especiales - normalmente el host maneja esto en handleConnectionRequest)
	async createOffer() {
		try {
			console.log('🔗 WebRTCService: *** CREATING OFFER ***');
			console.warn('⚠️ WebRTCService: createOffer called - verify this is intentional');
			
			const offer = await this.peerConnection.createOffer();
			await this.peerConnection.setLocalDescription(offer);

			this.sendMessage({
				type: 'offer',
				offer: offer,
				eventId: this.eventId,
				teamId: this.teamId
			});
		} catch (error) {
			console.error('❌ WebRTCService: Error creating offer:', error);
		}
	}

	// Enviar mensaje al servidor de señalización
	sendMessage(message) {
		if (this.ws && this.ws.readyState === WebSocket.OPEN) {
			console.log('📤 Sending message:', message.type);
			this.ws.send(JSON.stringify(message));
		} else {
			console.error('❌ Cannot send message: WebSocket not connected');
			console.error('📡 WebSocket state:', this.ws ? this.ws.readyState : 'null');
			
			// Intentar reconectar si es necesario
			if (!this.ws || this.ws.readyState === WebSocket.CLOSED) {
				console.log('🔄 Attempting to reconnect...');
				this.scheduleReconnection();
			}
		}
	}

	// Sistema de reconexión automática
	scheduleReconnection() {
		if (this.isIntentionalDisconnect || this.isReconnecting) {
			console.log('⏸️ WebRTCService: Skipping reconnection (intentional disconnect or already reconnecting)');
			return;
		}

		if (this.reconnectAttempts >= this.maxReconnectAttempts) {
			console.error('❌ WebRTCService: Max reconnection attempts reached');
			console.error('🔧 WebRTCService: Firefox troubleshooting tips:');
			console.error('   1. Check network connectivity');
			console.error('   2. Disable VPN if using one');
			console.error('   3. Try using Chrome browser');
			console.error('   4. Check firewall settings');
			console.error('   5. Clear browser cache and cookies');
			this.notifyConnectionState('failed-max-attempts');
			return;
		}

		this.isReconnecting = true;
		this.reconnectAttempts++;
		
		// Delay más largo para Firefox debido a problemas de ICE
		const isFirefox = navigator.userAgent.toLowerCase().includes('firefox');
		const baseDelay = isFirefox ? 4000 : this.reconnectDelay; // 4s base para Firefox vs 2s otros
		
		// Calcular delay progresivo
		const delay = Math.min(
			baseDelay * Math.pow(2, this.reconnectAttempts - 1),
			this.maxReconnectDelay
		);

		console.log(`🔄 WebRTCService: Scheduling reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);
		if (isFirefox) {
			console.log('🦊 Firefox detected: Using longer delays to improve ICE negotiation');
		}
		
		this.notifyConnectionState('reconnecting', { attempt: this.reconnectAttempts, maxAttempts: this.maxReconnectAttempts, delay });

		this.reconnectTimer = setTimeout(async () => {
			try {
				console.log(`🔄 WebRTCService: Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
				await this.attemptReconnection();
			} catch (error) {
				console.error('❌ WebRTCService: Reconnection attempt failed:', error);
				this.isReconnecting = false;
				// Programar próximo intento
				this.scheduleReconnection();
			}
		}, delay);
	}

	async attemptReconnection() {
		try {
			console.log('🔄 WebRTCService: Starting reconnection process...');
			
			// Limpiar conexiones anteriores
			this.cleanupConnections();

			// Reconectar al servidor de señalización
			await this.connectToSignalingServer();

			// Re-inicializar según el rol
			if (this.isHost) {
				console.log('🎯 WebRTCService: Reconnecting as host...');
				
				// Re-obtener streams si es necesario
				if (!this.localStream || this.localStream.getTracks().some(track => track.readyState === 'ended')) {
					await this.getHostStreams();
				}
				
				// Re-configurar PeerConnection
				this.setupPeerConnection();
				
				// Re-registrarse como host
				this.sendMessage({
					type: 'register-host',
					eventId: this.eventId,
					teamId: this.teamId
				});
			} else {
				console.log('🎬 WebRTCService: Reconnecting as viewer...');
				
				// Re-configurar PeerConnection
				this.setupPeerConnection();
				
				// Re-solicitar conexión
				this.sendMessage({
					type: 'request-connection',
					eventId: this.eventId,
					teamId: this.teamId
				});
			}

			// Reiniciar heartbeat
			this.startHeartbeat();

			this.isReconnecting = false;
			console.log('✅ WebRTCService: Reconnection completed successfully');
			
		} catch (error) {
			console.error('❌ WebRTCService: Reconnection failed:', error);
			this.isReconnecting = false;
			throw error;
		}
	}

	resetReconnectionState() {
		console.log('✅ WebRTCService: Resetting reconnection state');
		this.reconnectAttempts = 0;
		this.isReconnecting = false;
		if (this.reconnectTimer) {
			clearTimeout(this.reconnectTimer);
			this.reconnectTimer = null;
		}
	}

	cleanupConnections() {
		console.log('🧹 WebRTCService: Cleaning up connections for reconnection...');
		
		// Cerrar PeerConnection anterior pero mantener localStream
		if (this.peerConnection) {
			this.peerConnection.close();
			this.peerConnection = null;
		}

		// Limpiar remoteStream
		this.remoteStream = null;

		// Cerrar WebSocket anterior
		if (this.ws) {
			this.ws.close();
			this.ws = null;
		}

		this.isConnected = false;
	}

	// Sistema de heartbeat para detectar desconexiones
	startHeartbeat() {
		console.log('💓 WebRTCService: Starting heartbeat...');
		
		// Limpiar heartbeat anterior si existe
		this.stopHeartbeat();

		// Enviar ping cada 30 segundos
		this.heartbeatInterval = setInterval(() => {
			if (this.ws && this.ws.readyState === WebSocket.OPEN) {
				this.sendMessage({ type: 'ping' });
			}
		}, 30000);

		// Timeout para detectar si no recibimos pong
		this.heartbeatTimer = setInterval(() => {
			const now = Date.now();
			const timeSinceLastConnection = now - (this.lastConnectionTime || now);
			
			// Si han pasado más de 60 segundos sin confirmación de conexión
			if (timeSinceLastConnection > 60000) {
				console.warn('⚠️ WebRTCService: Heartbeat timeout detected, connection may be lost');
				this.scheduleReconnection();
			}
		}, 60000);
	}

	stopHeartbeat() {
		if (this.heartbeatInterval) {
			clearInterval(this.heartbeatInterval);
			this.heartbeatInterval = null;
		}
		if (this.heartbeatTimer) {
			clearInterval(this.heartbeatTimer);
			this.heartbeatTimer = null;
		}
	}

	// Notificar cambios de estado de conexión
	notifyConnectionState(state, data = {}) {
		console.log('📡 WebRTCService: Connection state:', state, data);
		if (this.onConnectionStateCallback) {
			this.onConnectionStateCallback(state, data);
		}
	}

	// Configurar callback para estados de conexión
	onConnectionState(callback) {
		this.onConnectionStateCallback = callback;
	}

	// Gestión de sesión de host
	saveHostSession(eventId, teamId) {
		const sessionData = {
			eventId: String(eventId),
			teamId: String(teamId),
			timestamp: Date.now(),
			isHost: true
		};
		localStorage.setItem('webrtc_host_session', JSON.stringify(sessionData));
		console.log('💾 WebRTCService: Host session saved', sessionData);
	}

	getHostSession() {
		try {
			const sessionData = localStorage.getItem('webrtc_host_session');
			if (sessionData) {
				const session = JSON.parse(sessionData);
				console.log('📂 WebRTCService: Host session found', session);
				return session;
			}
		} catch (error) {
			console.error('❌ WebRTCService: Error reading host session:', error);
		}
		return null;
	}

	clearHostSession() {
		localStorage.removeItem('webrtc_host_session');
		console.log('🗑️ WebRTCService: Host session cleared');
	}

	// Verificar si hay una sesión activa que necesita reconexión
	checkForActiveHostSession() {
		const session = this.getHostSession();
		if (session) {
			const timeSinceLastSession = Date.now() - session.timestamp;
			// Solo reconectar si la sesión es reciente (menos de 5 minutos)
			if (timeSinceLastSession < 5 * 60 * 1000) {
				console.log('🔄 WebRTCService: Found recent host session, attempting auto-reconnect');
				return session;
			} else {
				console.log('⏰ WebRTCService: Host session too old, clearing');
				this.clearHostSession();
			}
		}
		return null;
	}

	// Inicializar reconexión automática del host
	async initializeHostAutoReconnect() {
		const session = this.checkForActiveHostSession();
		if (session && session.isHost) {
			try {
				console.log('🎯 WebRTCService: Auto-reconnecting host session...');
				await this.initializeAsHost(session.eventId, session.teamId);
				return true;
			} catch (error) {
				console.error('❌ WebRTCService: Auto-reconnect failed:', error);
				this.clearHostSession();
				return false;
			}
		}
		return false;
	}

	// Generar URL para compartir
	generateShareUrl(eventId, teamId) {
		const baseUrl = window.location.origin;
		return `${baseUrl}/?action=viewer&eventId=${eventId}&teamId=${teamId}`;
	}

	// Establecer callback para stream remoto
	onRemoteStream(callback) {
		console.log('📞 WebRTCService: Setting onRemoteStream callback');
		this.onRemoteStreamCallback = callback;
		console.log('✅ WebRTCService: onRemoteStream callback set successfully');
	}

	// Configurar callback para cuando se reciba stream remoto
	setOnRemoteStreamCallback(callback) {
		console.log('📞 WebRTCService: *** SETTING onRemoteStreamCallback ***');
		console.log('📞 WebRTCService: Callback function provided:', !!callback);
		console.log('📞 WebRTCService: Callback type:', typeof callback);
		
		this.onRemoteStreamCallback = callback;
		
		// Si ya tenemos un stream remoto, llamar al callback inmediatamente
		if (this.remoteStream && callback) {
			console.log('🎬 WebRTCService: *** CALLING CALLBACK IMMEDIATELY - Stream already exists ***');
			callback(this.remoteStream);
		}
	}

	// Limpiar recursos
	cleanup() {
		console.log('🧹 WebRTCService: Cleaning up resources...');
		
		// Marcar como desconexión intencional
		this.isIntentionalDisconnect = true;
		
		// Limpiar sesión guardada solo si es desconexión intencional
		if (this.isHost) {
			this.clearHostSession();
		}
		
		// Detener heartbeat
		this.stopHeartbeat();
		
		// Limpiar timers de reconexión
		this.resetReconnectionState();

		if (this.localStream) {
			this.localStream.getTracks().forEach(track => track.stop());
			this.localStream = null;
		}

		if (this.peerConnection) {
			this.peerConnection.close();
			this.peerConnection = null;
		}

		if (this.ws) {
			this.ws.close();
			this.ws = null;
		}

		this.onRemoteStreamCallback = null;
		this.onConnectionStateCallback = null;
		this.remoteStream = null;
		this.isConnected = false;
		this.eventId = null;
		this.teamId = null;
		this.isHost = false;
		
		console.log('✅ WebRTCService: Cleanup completed');
	}
}

// Instancia singleton
const webrtcService = new WebRTCService();

export default webrtcService;
