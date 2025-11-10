// src/components/ClearCacheButton.jsx
import { useDispatch } from 'react-redux';
import { persistor } from '../store';

/**
 * Botón de utilidad para limpiar todo el cache de Redux Persist e IndexedDB
 * Útil cuando se reinicia la base de datos Firebase y hay datos antiguos persistidos
 */
export default function ClearCacheButton() {
	const dispatch = useDispatch();

	const handleClearCache = async () => {
		const confirmed = window.confirm(
			'⚠️ Esto eliminará todos los datos almacenados localmente y recargará la aplicación.\n\n' +
			'Los datos se volverán a cargar desde Firebase.\n\n' +
			'¿Estás seguro?'
		);

		if (!confirmed) return;

		try {
			console.log('🧹 Limpiando cache...');

			// 1. Purgar Redux Persist
			await persistor.purge();
			console.log('✅ Redux Persist limpiado');

			// 2. Limpiar localStorage
			localStorage.clear();
			console.log('✅ localStorage limpiado');

			// 3. Limpiar sessionStorage
			sessionStorage.clear();
			console.log('✅ sessionStorage limpiado');

			// 4. Limpiar IndexedDB (usado por activityCompletionQueue)
			if (window.indexedDB) {
				const databases = await window.indexedDB.databases();
				for (const db of databases) {
					if (db.name) {
						window.indexedDB.deleteDatabase(db.name);
						console.log(`✅ IndexedDB "${db.name}" eliminada`);
					}
				}
			}

			console.log('✅ Cache completamente limpiado. Recargando...');

			// 5. Recargar la página para empezar limpio
			window.location.reload();
		} catch (error) {
			console.error('❌ Error limpiando cache:', error);
			alert('Error al limpiar el cache. Revisa la consola para más detalles.');
		}
	};

	// Solo mostrar en desarrollo o si el usuario es admin
	if (import.meta.env.PROD && !window.location.search.includes('debug=true')) {
		return null;
	}

	return (
		<button
			onClick={handleClearCache}
			style={{
				position: 'fixed',
				bottom: '10px',
				left: '10px',
				padding: '8px 12px',
				backgroundColor: '#dc2626',
				color: 'white',
				border: 'none',
				borderRadius: '6px',
				fontSize: '12px',
				fontWeight: '600',
				cursor: 'pointer',
				zIndex: 9999,
				boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
				opacity: 0.7,
				transition: 'opacity 0.2s'
			}}
			onMouseEnter={(e) => e.target.style.opacity = '1'}
			onMouseLeave={(e) => e.target.style.opacity = '0.7'}
			title="Limpiar todos los datos almacenados localmente (localStorage, IndexedDB, Redux Persist)"
		>
			🧹 Limpiar Cache
		</button>
	);
}
