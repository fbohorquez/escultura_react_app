/**
 * Constantes para el estado/ubicación actual del equipo en la aplicación
 */

export const APP_STATES = {
  EN_MAPA: 'EN_MAPA',
  REALIZANDO_PRUEBA: 'REALIZANDO_PRUEBA',
  FINALIZANDO_PRUEBA: 'FINALIZANDO_PRUEBA'
};

export const APP_STATE_LABELS = {
  [APP_STATES.EN_MAPA]: 'En mapa',
  [APP_STATES.REALIZANDO_PRUEBA]: 'Realizando prueba',
  [APP_STATES.FINALIZANDO_PRUEBA]: 'Finalizando prueba'
};

/**
 * Obtiene la etiqueta descriptiva del estado de la aplicación
 * @param {string} state - Estado de la aplicación
 * @param {string} activityName - Nombre de la actividad (opcional)
 * @returns {string} Etiqueta descriptiva
 */
export const getAppStateLabel = (state, activityName = null) => {
  if (!state) return 'Desconocido';
  
  switch (state) {
    case APP_STATES.EN_MAPA:
      return APP_STATE_LABELS[APP_STATES.EN_MAPA];
    case APP_STATES.REALIZANDO_PRUEBA:
      return activityName ? `Realizando prueba "${activityName}"` : APP_STATE_LABELS[APP_STATES.REALIZANDO_PRUEBA];
    case APP_STATES.FINALIZANDO_PRUEBA:
      return activityName ? `Finalizando prueba "${activityName}"` : APP_STATE_LABELS[APP_STATES.FINALIZANDO_PRUEBA];
    default:
      return 'Desconocido';
  }
};
