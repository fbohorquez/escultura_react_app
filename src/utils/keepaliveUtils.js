/**
 * Utilidades para el sistema de keepalive
 */

import { getAppStateLabel } from '../constants/appStates';

// Intervalo de heartbeat (30 segundos por defecto, configurable via VITE_KEEPALIVE_INTERVAL)
export const KEEPALIVE_INTERVAL = parseInt(import.meta.env.VITE_KEEPALIVE_INTERVAL) || 30000;

// Tiempo límite para considerar un equipo como activo (1 minuto por defecto, configurable via VITE_KEEPALIVE_TIMEOUT)
export const KEEPALIVE_TIMEOUT = parseInt(import.meta.env.VITE_KEEPALIVE_TIMEOUT) || 60000;

/**
 * Verifica si un equipo está activo basado en su último timestamp
 * @param {number} lastSeen - Timestamp del último heartbeat
 * @returns {boolean} true si el equipo está activo, false si está desconectado
 */
export const isTeamActive = (lastSeen) => {
  if (!lastSeen) return false;
  
  const now = Date.now();
  return (now - lastSeen) < KEEPALIVE_TIMEOUT;
};

/**
 * Formatea el tiempo transcurrido desde el último heartbeat
 * @param {number} lastSeen - Timestamp del último heartbeat
 * @returns {string} Tiempo formateado (ej: "Hace 30s", "Hace 2m")
 */
export const formatLastSeen = (lastSeen) => {
  if (!lastSeen) return 'Nunca';
  
  const diff = Date.now() - lastSeen;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) return `Hace ${hours}h`;
  if (minutes > 0) return `Hace ${minutes}m`;
  return `Hace ${seconds}s`;
};

/**
 * Verifica si un timestamp está dentro del rango de "recién conectado"
 * @param {number} lastSeen - Timestamp del último heartbeat
 * @returns {boolean} true si se conectó recientemente (menos de 10 segundos)
 */
export const isRecentlyConnected = (lastSeen) => {
  if (!lastSeen) return false;
  
  const now = Date.now();
  return (now - lastSeen) < 10000; // 10 segundos
};

/**
 * Obtiene una lista de equipos activos desde el estado de keepalive
 * @param {Object} teamsState - Estado de teams desde keepalive
 * @returns {Array} Array de equipos activos
 */
export const getActiveTeams = (teamsState) => {
  if (!teamsState) return [];
  const now = Date.now();

  return Object.entries(teamsState)
    .map(([teamId, teamData]) => {
      const lastSeen = teamData.lastSeen;
      const sleepTimestamp = teamData.sleepTimestamp;
      const withinActiveWindow = lastSeen && (now - lastSeen) < KEEPALIVE_TIMEOUT;
      const withinSleepWindow = sleepTimestamp && (now - sleepTimestamp) < KEEPALIVE_TIMEOUT;
      let status = 'offline';
      if (withinActiveWindow) {
        status = 'online';
      } else if (teamData?.status === 'sleep' && withinSleepWindow) {
        status = 'sleep';
      }
      return {
        teamId,
        status,
        lastSeen,
        sleepTimestamp: sleepTimestamp || null,
        isActive: status === 'online' || status === 'sleep',
        sessionId: teamData.sessionId,
        appState: teamData.appState,
        currentActivity: teamData.currentActivity,
        appStateLabel: getAppStateLabel(teamData.appState, teamData.currentActivity?.name)
      };
    })
    .filter(team => team.status === 'online' || team.status === 'sleep');
};

/**
 * Obtiene estadísticas de conexión
 * @param {Object} teamsState - Estado de teams desde keepalive
 * @returns {Object} Estadísticas { total, online, offline, recentlyConnected }
 */
export const getConnectionStats = (teamsState) => {
  if (!teamsState) {
    return { total: 0, online: 0, offline: 0, recentlyConnected: 0 };
  }
  
  const teams = Object.values(teamsState);
  const total = teams.length;
  const online = teams.filter(team => isTeamActive(team.lastSeen)).length;
  const offline = total - online;
  const recentlyConnected = teams.filter(team => isRecentlyConnected(team.lastSeen)).length;
  
  return { total, online, offline, recentlyConnected };
};
