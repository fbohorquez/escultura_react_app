/**
 * Constantes para el estado/ubicación actual del equipo en la aplicación
 */

export const APP_STATES = {
  EN_MAPA: 'EN_MAPA',
  REALIZANDO_PRUEBA: 'REALIZANDO_PRUEBA',
  FINALIZANDO_PRUEBA: 'FINALIZANDO_PRUEBA'
};

export const APP_STATE_LABELS = {
  [APP_STATES.EN_MAPA]: 'InMap',
  [APP_STATES.REALIZANDO_PRUEBA]: 'InAct',
  [APP_STATES.FINALIZANDO_PRUEBA]: 'EndAct'
};

/**
 * Obtiene la etiqueta descriptiva del estado de la aplicación
 * @param {string} state - Estado de la aplicación
 * @param {string} activityName - Nombre de la actividad (opcional)
 * @returns {string} Etiqueta descriptiva
 */
export const getAppStateLabel = (state, activityName = null) => {
  if (!state) return 'Undef';
  
  switch (state) {
    case APP_STATES.EN_MAPA:
      return APP_STATE_LABELS[APP_STATES.EN_MAPA];
    case APP_STATES.REALIZANDO_PRUEBA:
      return activityName
				? `${APP_STATE_LABELS[APP_STATES.REALIZANDO_PRUEBA]} "${activityName}"`
				: APP_STATE_LABELS[APP_STATES.REALIZANDO_PRUEBA];
    case APP_STATES.FINALIZANDO_PRUEBA:
      return activityName ? `${APP_STATE_LABELS[APP_STATES.FINALIZANDO_PRUEBA]} "${activityName}"` : APP_STATE_LABELS[APP_STATES.FINALIZANDO_PRUEBA];
    default:
      return 'Undef';
  }
};

