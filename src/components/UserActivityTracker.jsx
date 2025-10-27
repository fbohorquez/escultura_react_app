import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { reportUserActivity } from '../services/notificationService';

/**
 * Componente para reportar actividad del usuario al servidor de notificaciones
 * Evita que salten notificaciones cuando el usuario está activo en la app
 */
export default function UserActivityTracker() {
  const intervalRef = useRef(null);
  const lastReportRef = useRef(0);
  
  const session = useSelector(state => state.session);
  const { selectedTeam, isAdmin } = session || {};
  
  // En este sistema, el "usuario" es el selectedTeam.id o admin
  const currentUserId = isAdmin ? 'admin' : selectedTeam?.id;

  useEffect(() => {
    // Solo trackear si hay un usuario identificado
    if (!currentUserId) {
      return;
    }

    console.log('UserActivityTracker initialized for user:', currentUserId);

    // Función para reportar actividad
    const reportActivity = async () => {
      const now = Date.now();
      
      // Reportar máximo cada 2 minutos para no saturar
      if (now - lastReportRef.current < 2 * 60 * 1000) {
        return;
      }

      lastReportRef.current = now;
      
      try {
        await reportUserActivity(currentUserId);
        console.log('User activity reported for:', currentUserId);
      } catch (error) {
        console.warn('Error reporting user activity:', error);
      }
    };

    // Reportar actividad inicial
    reportActivity();

    // Reportar actividad cada 3 minutos mientras la app esté activa
    intervalRef.current = setInterval(reportActivity, 3 * 60 * 1000);

    // Eventos de actividad del usuario
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    let activityTimeout;
    
    const handleUserActivity = () => {
      // Debounce: reportar actividad máximo cada 30 segundos por eventos de usuario
      clearTimeout(activityTimeout);
      activityTimeout = setTimeout(() => {
        const now = Date.now();
        if (now - lastReportRef.current > 30 * 1000) { // 30 segundos
          reportActivity();
        }
      }, 1000); // Esperar 1 segundo de inactividad antes de reportar
    };

    // Agregar listeners de actividad
    activityEvents.forEach(event => {
      document.addEventListener(event, handleUserActivity, { passive: true });
    });

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      clearTimeout(activityTimeout);
      
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleUserActivity);
      });
      
      console.log('UserActivityTracker cleanup for user:', currentUserId);
    };
  }, [currentUserId]);

  // Este componente no renderiza nada
  return null;
}
