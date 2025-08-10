import React from 'react';
import useForceOrientation from '../hooks/useForceOrientation';

/**
 * Componente para mostrar información sobre la orientación forzada
 * Útil para debugging y configuración
 */
const OrientationController = ({ showDebugInfo = false }) => {
	const {
		isOrientationForced,
		deviceType,
		forcePortrait,
		deviceTypes,
		lockToPortrait,
		unlockOrientation
	} = useForceOrientation();

	// Si no se debe mostrar información de debug, no renderizar nada
	if (!showDebugInfo) {
		return null;
	}

	return (
		<div style={{
			position: 'fixed',
			top: '10px',
			right: '10px',
			background: 'rgba(0, 0, 0, 0.8)',
			color: 'white',
			padding: '10px',
			borderRadius: '5px',
			fontSize: '12px',
			zIndex: 9999,
			fontFamily: 'monospace',
			maxWidth: '300px'
		}}>
			<h4 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>🔒 Orientación Debug</h4>
			<div><strong>Dispositivo:</strong> {deviceType}</div>
			<div><strong>Forzar Portrait:</strong> {forcePortrait ? 'Sí' : 'No'}</div>
			<div><strong>Tipos Objetivo:</strong> {deviceTypes}</div>
			<div><strong>Forzando Orientación:</strong> {isOrientationForced ? 'Sí' : 'No'}</div>
			<div><strong>Orientación Actual:</strong> {
				screen.orientation ? 
				`${screen.orientation.type} (${screen.orientation.angle}°)` : 
				'No disponible'
			}</div>
			
			<div style={{ marginTop: '10px' }}>
				<button 
					onClick={lockToPortrait}
					style={{
						marginRight: '5px',
						padding: '5px 10px',
						fontSize: '11px',
						backgroundColor: '#007bff',
						color: 'white',
						border: 'none',
						borderRadius: '3px',
						cursor: 'pointer'
					}}
				>
					Forzar Portrait
				</button>
				<button 
					onClick={unlockOrientation}
					style={{
						padding: '5px 10px',
						fontSize: '11px',
						backgroundColor: '#dc3545',
						color: 'white',
						border: 'none',
						borderRadius: '3px',
						cursor: 'pointer'
					}}
				>
					Liberar
				</button>
			</div>
		</div>
	);
};

export default OrientationController;
