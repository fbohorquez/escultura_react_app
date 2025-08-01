#!/usr/bin/env node

// servidor-signaling.js - Servidor de señalización WebRTC para compartir equipos
const WebSocket = require('ws');
const http = require('http');

const PORT = process.env.PORT || 3088;

// Crear servidor HTTP
const server = http.createServer((req, res) => {
	// Habilitar CORS para todas las rutas
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
	
	if (req.method === 'OPTIONS') {
		res.writeHead(200);
		res.end();
		return;
	}
	
	// Respuesta simple para verificar que el servidor está funcionando
	if (req.url === '/health') {
		res.writeHead(200, { 'Content-Type': 'application/json' });
		res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
		return;
	}
	
	res.writeHead(404);
	res.end('WebRTC Signaling Server');
});

// Crear servidor WebSocket
const wss = new WebSocket.Server({ 
	server,
	perMessageDeflate: false,
	clientTracking: true
});

// Almacén de hosts y conexiones activas
const hosts = new Map(); // teamId -> WebSocket
const viewers = new Map(); // websocket -> { eventId, teamId }
const connections = new Map(); // connectionId -> { host, viewer }

console.log(`🚀 WebRTC Signaling Server starting on port ${PORT}`);

wss.on('connection', (ws, req) => {
	const clientIP = req.socket.remoteAddress;
	const userAgent = req.headers['user-agent'] || 'Unknown';
	const timestamp = new Date().toISOString();
	
	console.log(`📡 [${timestamp}] New client connected from ${clientIP}`);
	console.log(`🌐 User-Agent: ${userAgent.substring(0, 100)}...`);
	console.log(`🔗 WebSocket state: ${ws.readyState} (1=OPEN)`);
	
	// Enviar mensaje de bienvenida inmediatamente
	const welcomeMessage = {
		type: 'welcome',
		message: 'Connected to WebRTC Signaling Server',
		timestamp: timestamp,
		clientIP: clientIP
	};
	
	try {
		ws.send(JSON.stringify(welcomeMessage));
		console.log(`👋 Welcome message sent to ${clientIP}`);
	} catch (error) {
		console.error(`❌ Error sending welcome message to ${clientIP}:`, error.message);
	}
	
	ws.on('message', (data) => {
		try {
			const message = JSON.parse(data.toString());
			console.log('📨 Received message:', message.type, {
				eventId: message.eventId,
				teamId: message.teamId
			});
			
			handleMessage(ws, message);
		} catch (error) {
			console.error('❌ Error parsing message:', error);
			sendError(ws, 'Invalid message format');
		}
	});
	
	ws.on('close', (code, reason) => {
		const timestamp = new Date().toISOString();
		const reasonStr = reason ? reason.toString() : 'No reason';
		console.log(`📴 [${timestamp}] Client disconnected: ${code} ${reasonStr}`);
		console.log(`🔍 Was host: ${ws.isHost || false}, Host key: ${ws.hostKey || 'none'}`);
		handleDisconnection(ws);
	});
	
	ws.on('error', (error) => {
		const timestamp = new Date().toISOString();
		console.error(`❌ [${timestamp}] WebSocket error:`, error.message);
		console.log(`🔍 Client info - Host: ${ws.isHost || false}, Key: ${ws.hostKey || 'none'}`);
		handleDisconnection(ws);
	});
	
	// Ping para mantener la conexión viva
	ws.isAlive = true;
	ws.on('pong', () => {
		ws.isAlive = true;
	});
});

function handleMessage(ws, message) {
	// Convertir eventId y teamId a strings para consistencia
	let { type, eventId, teamId } = message;
	eventId = String(eventId);
	teamId = String(teamId);
	
	// Actualizar el mensaje con los valores convertidos
	message.eventId = eventId;
	message.teamId = teamId;
	
	switch (type) {
		case 'register-host':
			registerHost(ws, eventId, teamId);
			break;
			
		case 'request-connection':
			requestConnection(ws, eventId, teamId);
			break;
			
		case 'offer':
			forwardToViewer(message);
			break;
			
		case 'answer':
			forwardToHost(message);
			break;
			
		case 'ice-candidate':
			forwardIceCandidate(ws, message);
			break;
			
		default:
			console.log('⚠️ Unknown message type:', type);
			sendError(ws, 'Unknown message type');
	}
}

function registerHost(ws, eventId, teamId) {
	const hostKey = `${eventId}-${teamId}`;
	
	// Remover host anterior si existe
	if (hosts.has(hostKey)) {
		const oldHost = hosts.get(hostKey);
		if (oldHost !== ws && oldHost.readyState === WebSocket.OPEN) {
			oldHost.close();
		}
	}
	
	hosts.set(hostKey, ws);
	ws.hostKey = hostKey;
	ws.isHost = true;
	
	console.log(`🎯 Host registered: ${hostKey}`);
	
	sendMessage(ws, {
		type: 'host-registered',
		eventId,
		teamId
	});
}

function requestConnection(ws, eventId, teamId) {
	const hostKey = `${eventId}-${teamId}`;
	const host = hosts.get(hostKey);
	
	console.log(`🔍 [requestConnection] Request from viewer - eventId: ${eventId}, teamId: ${teamId}`);
	console.log(`🔍 [requestConnection] Looking for host with key: ${hostKey}`);
	console.log(`🔍 [requestConnection] Host found: ${!!host}, Host state: ${host?.readyState || 'N/A'}`);
	
	if (!host || host.readyState !== WebSocket.OPEN) {
		console.log(`❌ Host not available: ${hostKey}`);
		sendError(ws, 'Host not available');
		return;
	}
	
	// Marcar como viewer
	viewers.set(ws, { eventId, teamId });
	console.log(`👥 [requestConnection] Viewer registered for ${hostKey}. Total viewers: ${viewers.size}`);
	
	console.log(`👥 Connection requested: ${hostKey}`);
	
	// Notificar al host que hay un viewer esperando
	console.log(`📤 [requestConnection] Sending connection-request to host`);
	sendMessage(host, {
		type: 'connection-request',
		eventId,
		teamId
	});
	
	// Confirmar al viewer que el host está disponible
	console.log(`📤 [requestConnection] Sending host-available to viewer`);
	sendMessage(ws, {
		type: 'host-available',
		eventId,
		teamId
	});
}

function forwardToViewer(message) {
	const { eventId, teamId } = message;
	const hostKey = `${eventId}-${teamId}`;
	
	console.log(`🔍 [forwardToViewer] Looking for viewer with eventId: ${eventId} (${typeof eventId}), teamId: ${teamId} (${typeof teamId})`);
	console.log(`🔍 [forwardToViewer] Total viewers registered: ${viewers.size}`);
	
	// Listar todos los viewers registrados
	let viewerIndex = 0;
	for (const [viewerWs, viewerInfo] of viewers.entries()) {
		console.log(`👥 [forwardToViewer] Viewer ${viewerIndex}: eventId=${viewerInfo.eventId} (${typeof viewerInfo.eventId}), teamId=${viewerInfo.teamId} (${typeof viewerInfo.teamId}), readyState=${viewerWs.readyState}`);
		viewerIndex++;
	}
	
	// Encontrar viewer para este team
	let found = false;
	for (const [viewerWs, viewerInfo] of viewers.entries()) {
		console.log(`🔍 [forwardToViewer] Comparing: ${eventId} === ${viewerInfo.eventId} (${eventId === viewerInfo.eventId}) && ${teamId} === ${viewerInfo.teamId} (${teamId === viewerInfo.teamId})`);
		
		if (viewerInfo.eventId === eventId && viewerInfo.teamId === teamId &&
			viewerWs.readyState === WebSocket.OPEN) {
			
			console.log(`📤 [forwardToViewer] *** FORWARDING ${message.type} TO VIEWER ***`);
			console.log(`📊 [forwardToViewer] Message details:`, {
				type: message.type,
				hasOffer: !!message.offer,
				offerType: message.offer?.type,
				eventId: message.eventId,
				teamId: message.teamId
			});
			
			try {
				sendMessage(viewerWs, message);
				console.log(`✅ [forwardToViewer] Message sent successfully to viewer`);
				found = true;
			} catch (error) {
				console.error(`❌ [forwardToViewer] Error sending message to viewer:`, error);
			}
			break;
		}
	}
	
	if (!found) {
		console.error(`❌ [forwardToViewer] No matching viewer found for eventId: ${eventId}, teamId: ${teamId}`);
	}
}

function forwardToHost(message) {
	const { eventId, teamId } = message;
	const hostKey = `${eventId}-${teamId}`;
	const host = hosts.get(hostKey);
	
	if (host && host.readyState === WebSocket.OPEN) {
		console.log(`📤 Forwarding ${message.type} to host`);
		sendMessage(host, message);
	}
}

function forwardIceCandidate(ws, message) {
	const { eventId, teamId } = message;
	const hostKey = `${eventId}-${teamId}`;
	
	if (ws.isHost) {
		// Forward to viewer
		forwardToViewer(message);
	} else {
		// Forward to host
		forwardToHost(message);
	}
}

function handleDisconnection(ws) {
	// Limpiar si era host
	if (ws.hostKey) {
		hosts.delete(ws.hostKey);
		console.log(`🎯 Host disconnected: ${ws.hostKey}`);
	}
	
	// Limpiar si era viewer
	if (viewers.has(ws)) {
		const viewerInfo = viewers.get(ws);
		viewers.delete(ws);
		console.log(`👥 Viewer disconnected: ${viewerInfo.eventId}-${viewerInfo.teamId}`);
	}
}

function sendMessage(ws, message) {
	console.log(`📤 [sendMessage] Attempting to send ${message.type} message`);
	console.log(`🔍 [sendMessage] WebSocket readyState: ${ws.readyState} (1=OPEN)`);
	
	if (ws.readyState === WebSocket.OPEN) {
		try {
			const messageStr = JSON.stringify(message);
			console.log(`📊 [sendMessage] Message size: ${messageStr.length} characters`);
			ws.send(messageStr);
			console.log(`✅ [sendMessage] Message sent successfully`);
		} catch (error) {
			console.error(`❌ [sendMessage] Error sending message:`, error);
		}
	} else {
		console.error(`❌ [sendMessage] Cannot send message - WebSocket not open. State: ${ws.readyState}`);
	}
}

function sendError(ws, error) {
	sendMessage(ws, {
		type: 'error',
		error: error
	});
}

// Iniciar servidor
server.listen(PORT, () => {
	console.log(`✅ WebRTC Signaling Server running on port ${PORT}`);
	console.log(`🌐 WebSocket endpoint: ws://localhost:${PORT}`);
	console.log(`🏥 Health check available at: http://localhost:${PORT}/health`);
});

// Ping interval para mantener conexiones vivas
const pingInterval = setInterval(() => {
	wss.clients.forEach((ws) => {
		if (ws.isAlive === false) {
			console.log('💀 Terminating dead connection');
			return ws.terminate();
		}
		
		ws.isAlive = false;
		ws.ping();
	});
}, 30000); // 30 segundos

// Limpiar interval al cerrar servidor
wss.on('close', () => {
	clearInterval(pingInterval);
});

// Manejo de señales del sistema
process.on('SIGINT', () => {
	console.log('\n🛑 Shutting down server...');
	clearInterval(pingInterval);
	wss.close(() => {
		server.close(() => {
			console.log('✅ Server closed');
			process.exit(0);
		});
	});
});

process.on('SIGTERM', () => {
	console.log('\n🛑 Shutting down server...');
	clearInterval(pingInterval);
	wss.close(() => {
		server.close(() => {
			console.log('✅ Server closed');
			process.exit(0);
		});
	});
});
