// src/services/eventLoadBehavior.js
import { clearSession } from "../features/session/sessionSlice";
import { updateTeamData } from "../features/teams/teamsSlice";

/**
 * Tipos de comportamiento al cargar evento
 */
export const EVENT_LOAD_BEHAVIORS = {
  RESET_EVENT: 'reset_event',
  KEEP_ASSIGNATION: 'keep_assignation',
  KEEP_EVENT: 'keep_event',
  KEEP_TEAM: 'keep_team',
  KEEP_PAGE: 'keep_page'
};

/**
 * Obtiene el comportamiento configurado desde las variables de entorno
 */
export const getEventLoadBehavior = () => {
  const behavior = import.meta.env.VITE_EVENT_LOAD_BEHAVIOR || EVENT_LOAD_BEHAVIORS.KEEP_PAGE;
  return behavior;
};

/**
 * Verifica si existe una sesión activa con un evento cargado
 * @param {Object} state - Estado de Redux
 * @returns {boolean}
 */
export const hasActiveEventSession = (state) => {
  return !!(state.event.event && (state.session.selectedTeam || state.session.isAdmin));
};

/**
 * Guarda una copia de la sesión actual en el almacenamiento local
 * @param {Object} state - Estado de Redux
 */
export const saveSessionCopy = (state) => {
  if (!state.event.event || !state.session.selectedTeam) return;
  
  const eventId = state.event.event.id;
  const sessionData = {
    eventId,
    selectedTeam: state.session.selectedTeam,
    teamPhoto: state.session.teamPhoto,
    token: state.session.token,
    timestamp: Date.now()
  };
  
  // Obtener sesiones guardadas existentes
  const savedSessions = JSON.parse(localStorage.getItem('savedEventSessions') || '{}');
  
  // Guardar la sesión actual
  savedSessions[eventId] = sessionData;
  
  localStorage.setItem('savedEventSessions', JSON.stringify(savedSessions));
  console.log('✅ Session saved for event:', eventId);
};

/**
 * Recupera una sesión guardada para un evento específico
 * @param {string|number} eventId 
 * @returns {Object|null}
 */
export const getSavedSession = (eventId) => {
  const savedSessions = JSON.parse(localStorage.getItem('savedEventSessions') || '{}');
  return savedSessions[eventId] || null;
};

/**
 * Borra una sesión guardada específica
 * @param {string|number} eventId 
 */
export const removeSavedSession = (eventId) => {
  const savedSessions = JSON.parse(localStorage.getItem('savedEventSessions') || '{}');
  delete savedSessions[eventId];
  localStorage.setItem('savedEventSessions', JSON.stringify(savedSessions));
};

/**
 * Borra todas las sesiones guardadas
 */
export const clearAllSavedSessions = () => {
  localStorage.removeItem('savedEventSessions');
};

/**
 * Desasocia el dispositivo del equipo en Firebase
 * @param {Function} dispatch 
 * @param {Object} state 
 */
export const resetEventAssociation = async (dispatch, state) => {
  if (!state.event.event || !state.session.selectedTeam) return;
  
  const eventId = state.event.event.id;
  const teamId = state.session.selectedTeam.id;
  
  try {
    // Desasociar dispositivo en Firebase
    await dispatch(updateTeamData({
      eventId,
      teamId,
      changes: { device: "" }
    })).unwrap();
    
    console.log('✅ Device disassociated from team in Firebase');
  } catch (error) {
    console.error('❌ Error disassociating device:', error);
  }
};

/**
 * Limpia el almacenamiento local completamente
 */
export const clearLocalStorage = () => {
  localStorage.removeItem("lastRoute");
  localStorage.removeItem("persist:root");
  localStorage.removeItem("currentActivity");
  localStorage.removeItem("savedEventSessions");
  console.log('✅ Local storage cleared');
};

/**
 * Maneja el comportamiento al detectar una sesión activa
 * @param {Function} dispatch 
 * @param {Object} state 
 * @param {Function} navigate 
 */
export const handleExistingSession = async (dispatch, state, navigate) => {
  const behavior = getEventLoadBehavior();
  
  console.log('🔄 Handling existing session with behavior:', behavior);
  
  switch (behavior) {
    case EVENT_LOAD_BEHAVIORS.KEEP_TEAM:
      // Mantener la asignación del equipo actual
      navigate(`/team/${state.session.selectedTeam.id}`);
      break;
    case EVENT_LOAD_BEHAVIORS.RESET_EVENT:
      // Desasociar dispositivo y limpiar todo
      await resetEventAssociation(dispatch, state);
      clearLocalStorage();
      dispatch(clearSession());
      
      // Recargar página para empezar desde cero
      window.location.href = "/";
      break;
      
    case EVENT_LOAD_BEHAVIORS.KEEP_ASSIGNATION:
      // Guardar copia de sesión y limpiar
      saveSessionCopy(state);
      clearLocalStorage();
      dispatch(clearSession());
      
      // Ir a selección de eventos
      navigate("/events");
      break;
      
    case EVENT_LOAD_BEHAVIORS.KEEP_EVENT: {
      // Ir al mapa del evento actual
      const eventId = state.event.event.id;
      navigate(`/event/${eventId}`);
      break;
    }
      
    case EVENT_LOAD_BEHAVIORS.KEEP_PAGE:
    default:
      // Mantener comportamiento actual (no hacer nada especial)
      // La aplicación continuará con la ruta que ya tenía
      break;
  }
};

/**
 * Verifica si hay una sesión guardada para restaurar al seleccionar un evento
 * @param {string|number} eventId 
 * @returns {boolean} - true si se restauró una sesión
 */
export const tryRestoreSavedSession = (eventId) => {
  const behavior = getEventLoadBehavior();
  
  if (behavior !== EVENT_LOAD_BEHAVIORS.KEEP_ASSIGNATION) {
    return false;
  }
  
  const savedSession = getSavedSession(eventId);
  if (!savedSession) {
    return false;
  }
  
  // Verificar que la sesión no sea muy antigua (opcional, por ejemplo 7 días)
  const MAX_SESSION_AGE = 7 * 24 * 60 * 60 * 1000; // 7 días en ms
  if (Date.now() - savedSession.timestamp > MAX_SESSION_AGE) {
    removeSavedSession(eventId);
    return false;
  }
  
  console.log('🔄 Restoring saved session for event:', eventId);
  
  // Restaurar sesión (esto se hará en el componente que maneja la selección de equipos)
  return true;
};
