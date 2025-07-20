// src/utils/activityValidation.js

/**
 * Determina si una actividad requiere valoración manual por el organizador
 * @param {Object} activity - La actividad a evaluar
 * @param {string|boolean} result - El resultado de la actividad (puede ser boolean para éxito/fallo o "pending_review")
 * @returns {boolean} - true si requiere valoración manual, false si es automática
 */
export const requiresManualReview = (activity, result) => {
	// Si el resultado ya es "pending_review", claramente requiere valoración
	if (result === "pending_review") {
		return true;
	}

	// Verificar por tipo de actividad
	switch (activity.type.id) {
		case 1: // Preguntas y respuestas
			try {
				const typeData = JSON.parse(activity.type_data);
				// Si es tipo test (type_question: "1"), no requiere valoración
				// Si es tipo abierto (type_question: "2"), sí requiere valoración
				return typeData.type_question === "2";
			} catch (error) {
				console.error("Error parsing question type_data:", error);
				return true; // En caso de error, mejor requerir valoración manual
			}

		case 3: // Fotos/Videos
			// Las fotos/videos siempre requieren valoración manual
			return true;

		// Casos futuros se pueden añadir aquí
		case 2: // Ejemplo: Otro tipo de actividad
			return false; // No requiere valoración

		default:
			// Por defecto, requerir valoración manual para tipos desconocidos
			return true;
	}
};

/**
 * Obtiene el valor del campo valorate que debe asignarse en Firebase
 * @param {Object} activity - La actividad
 * @param {string|boolean} result - El resultado de la actividad
 * @returns {number} - 0 si requiere valoración, 1 si ya está valorada automáticamente
 */
export const getValorateValue = (activity, result) => {
	return requiresManualReview(activity, result) ? 0 : 1;
};

/**
 * Determina si mostrar pantalla de "pendiente de valoración" o pantalla de resultados normal
 * @param {Object} activity - La actividad
 * @param {string|boolean} result - El resultado de la actividad
 * @returns {boolean} - true si debe mostrar pantalla de pendiente, false para pantalla normal
 */
export const shouldShowPendingReview = (activity, result) => {
	return requiresManualReview(activity, result);
};
