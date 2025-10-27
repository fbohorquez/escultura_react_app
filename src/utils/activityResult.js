// src/utils/activityResult.js

/**
 * Determina si una actividad debe mostrar la pantalla de resultados tras completarse.
 * @param {Object} activity - Actividad evaluada.
 * @returns {boolean} - true si se debe mostrar la pantalla, false si se debe omitir.
 */
export const shouldShowActivityResult = (activity) => {
	if (!activity || !activity.type) {
		return true;
	}

	const typeId = Number(activity.type.id);
	if (Number.isNaN(typeId)) {
		return true;
	}

	switch (typeId) {
		case 3:
			// Las actividades de foto/video finalizan sin pantalla de resultados.
			return false;
		default:
			return true;
	}
};
