import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import notificationNavigationService from '../services/notificationNavigation';

/**
 * Componente para inicializar y gestionar la navegación desde notificaciones push
 * Compatible con MemoryRouter
 */
export default function NotificationNavigationManager() {
  const navigate = useNavigate();

  useEffect(() => {
    // Inicializar el servicio con la función de navegación
    notificationNavigationService.initialize(navigate);

    console.log('NotificationNavigationManager initialized');

    // Cleanup en desmontaje
    return () => {
      console.log('NotificationNavigationManager cleanup');
    };
  }, [navigate]);

  // Este componente no renderiza nada, solo gestiona la navegación
  return null;
}
