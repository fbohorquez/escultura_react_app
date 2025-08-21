// firebase-diagnostics.js
// Herramientas de diagnóstico para Firebase que se pueden usar desde la consola del navegador

import { 
	getConnectionInfo, 
	forceReconnectAll, 
	cleanupStaleListeners, 
	checkOverallConnection,
	setDetailedLogging 
} from './firebase.js';

/**
 * Herramientas de diagnóstico disponibles en window.firebaseDiagnostics
 */
const firebaseDiagnostics = {
	/**
	 * Muestra información detallada sobre todas las conexiones
	 */
	info: () => {
		const info = getConnectionInfo();
		console.table(info.activeListeners);
		if (info.staleListeners.length > 0) {
			console.warn('Stale listeners:', info.staleListeners);
		}
		console.log('Summary:', {
			total: info.totalListeners,
			active: info.activeListeners.length,
			stale: info.staleListeners.length
		});
		return info;
	},

	/**
	 * Fuerza la reconexión de todos los listeners
	 */
	reconnect: () => {
		forceReconnectAll();
		console.log('Reconnection initiated for all listeners');
	},

	/**
	 * Limpia listeners inactivos
	 */
	cleanup: () => {
		cleanupStaleListeners();
		console.log('Stale listeners cleaned up');
	},

	/**
	 * Verifica la conectividad general
	 */
	check: async () => {
		console.log('Checking Firebase connection...');
		const result = await checkOverallConnection();
		console.log('Connection check result:', result);
		return result;
	},

	/**
	 * Habilita logging detallado
	 */
	enableLogs: () => {
		setDetailedLogging(true);
		console.log('Detailed logging enabled');
	},

	/**
	 * Deshabilita logging detallado
	 */
	disableLogs: () => {
		setDetailedLogging(false);
		console.log('Detailed logging disabled');
	},

	/**
	 * Ejecuta un diagnóstico completo
	 */
	fullDiagnostic: async () => {
		console.log('🔍 Running full Firebase diagnostic...');
		
		const connectionInfo = getConnectionInfo();
		console.log('📊 Connection Info:', connectionInfo);
		
		const overallStatus = await checkOverallConnection();
		console.log('🌐 Overall Status:', overallStatus);
		
		if (connectionInfo.staleListeners.length > 0) {
			console.warn('⚠️ Found stale listeners, attempting cleanup...');
			cleanupStaleListeners();
		}
		
		if (!overallStatus.connected) {
			console.warn('🔴 Connection issues detected, attempting reconnection...');
			forceReconnectAll();
		}
		
		console.log('✅ Diagnostic complete');
		return {
			connectionInfo,
			overallStatus,
			timestamp: new Date().toISOString()
		};
	},

	/**
	 * Muestra ayuda sobre las funciones disponibles
	 */
	help: () => {
		console.log(`
🔧 Firebase Diagnostics Tools

Available commands:
• firebaseDiagnostics.info() - Show connection information
• firebaseDiagnostics.reconnect() - Force reconnect all listeners
• firebaseDiagnostics.cleanup() - Clean up stale listeners
• firebaseDiagnostics.check() - Check overall connectivity
• firebaseDiagnostics.enableLogs() - Enable detailed logging
• firebaseDiagnostics.disableLogs() - Disable detailed logging
• firebaseDiagnostics.fullDiagnostic() - Run complete diagnostic
• firebaseDiagnostics.help() - Show this help

Usage example:
firebaseDiagnostics.fullDiagnostic().then(result => console.log(result));
		`);
	}
};

// Hacer disponible globalmente en desarrollo
if (typeof window !== 'undefined' && import.meta.env.DEV) {
	window.firebaseDiagnostics = firebaseDiagnostics;
	console.log('🔧 Firebase diagnostics available at window.firebaseDiagnostics');
	console.log('Run firebaseDiagnostics.help() for available commands');
}

export default firebaseDiagnostics;
