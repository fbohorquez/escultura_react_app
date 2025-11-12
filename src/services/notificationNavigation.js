/**
 * Servicio para manejar la navegación desde notificaciones push
 * Compatible con MemoryRouter - maneja la navegación interna sin cambiar la URL del navegador
 */

class NotificationNavigationService {
  constructor() {
    this.navigate = null;
    this.initialized = false;
    this.pendingNavigation = null;
  }

  /**
   * Inicializar el servicio con la función de navegación de React Router
   */
  initialize(navigateFunction) {
    this.navigate = navigateFunction;
    this.initialized = true;

    // Procesar navegación pendiente si la hay
    if (this.pendingNavigation) {
      this.handleNavigation(this.pendingNavigation);
      this.pendingNavigation = null;
    }

    // Registrar listener para mensajes del service worker
    this.registerServiceWorkerListener();
    
    // Procesar parámetros de URL si la app se abrió desde una notificación
    this.handleInitialNotificationParams();
  }

  /**
   * Registrar listener para mensajes del service worker
   */
  registerServiceWorkerListener() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'NOTIFICATION_NAVIGATE') {
          this.handleNavigation(event.data.payload);
        }
      });
    }
  }

  /**
   * Procesar parámetros de notificación en la URL inicial
   */
  handleInitialNotificationParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('notification_event');
    const chatId = urlParams.get('notification_chat');
    const teamId = urlParams.get('notification_team');
    const activityId = urlParams.get('notification_activity');
    const type = urlParams.get('notification_type');

    if (eventId && (chatId || (teamId && activityId) || type === 'activity_sent')) {
      console.log('Opening app from notification:', { eventId, chatId, teamId, activityId, type });
      
      // Limpiar los parámetros de la URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
      
      // Navegar según el tipo
      this.handleNavigation({
        eventId,
        chatId,
        teamId,
        activityId,
        type: type || (chatId ? 'chat' : teamId && activityId ? 'activity_valuation' : 'activity_sent'),
        source: 'notification_url'
      });
    }
  }

  /**
   * Manejar navegación desde notificación
   */
  handleNavigation(payload) {
    console.log('Handling notification navigation:', payload);

    if (!this.initialized || !this.navigate) {
      console.log('Navigation service not initialized, storing pending navigation');
      this.pendingNavigation = payload;
      return;
    }

    const { eventId, chatId, teamId, activityId, type } = payload;

    try {
      let route;

      // Construir la ruta según el tipo de notificación
      if (type === 'activity_valuation' && eventId && teamId && activityId) {
        // Notificación de valoración de actividad
        route = `/event/${eventId}/team/activity/${teamId}/${activityId}`;
        console.log('Navigating to activity:', route);
      } else if (type === 'activity_sent' && eventId) {
        // Notificación de actividad enviada - llevar a la página del evento
        route = `/event/${eventId}`;
        console.log('Navigating to event:', route);
      } else if (eventId && chatId) {
        // Notificación de chat
        route = this.buildChatRoute(eventId, chatId);
        console.log('Navigating to chat:', route);
      } else {
        console.warn('Invalid navigation payload:', payload);
        return;
      }

      this.navigate(route);

      // Almacenar en sessionStorage para que otros componentes sepan que venimos de notificación
      sessionStorage.setItem('navigationSource', 'notification');
      sessionStorage.setItem('notificationType', type || 'chat');
      sessionStorage.setItem('notificationEventId', eventId);
      
      if (chatId) {
        sessionStorage.setItem('notificationChatId', chatId);
      }
      
      if (teamId && activityId) {
        sessionStorage.setItem('notificationTeamId', teamId);
        sessionStorage.setItem('notificationActivityId', activityId);
      }

    } catch (error) {
      console.error('Error navigating from notification:', error);
    }
  }

  /**
   * Construir ruta del chat basada en el tipo de chat
   */
  buildChatRoute(eventId, chatId) {
    // Analizar el tipo de chat basado en el chatId
    if (chatId.startsWith('admin_')) {
      // Chat entre admin y equipo - usar ruta de chat del evento
      return `/event/${eventId}/chat/${chatId}`;
    } else if (chatId.includes('_') && !chatId.startsWith('admin_')) {
      // Chat directo entre equipos - usar ruta de chat del evento
      return `/event/${eventId}/chat/${chatId}`;
    } else if (chatId === 'group') {
      // Chat grupal - usar ruta de chat del evento
      return `/event/${eventId}/chat/group`;
    } else {
      // Chat por defecto - usar ruta de chats generales
      return `/event/${eventId}/chats`;
    }
  }

  /**
   * Limpiar datos de navegación por notificación
   */
  clearNotificationData() {
    sessionStorage.removeItem('navigationSource');
    sessionStorage.removeItem('notificationEventId');
    sessionStorage.removeItem('notificationChatId');
  }

  /**
   * Verificar si la navegación actual proviene de una notificación
   */
  isFromNotification() {
    return sessionStorage.getItem('navigationSource') === 'notification';
  }

  /**
   * Obtener datos de la notificación que originó la navegación
   */
  getNotificationData() {
    return {
      eventId: sessionStorage.getItem('notificationEventId'),
      chatId: sessionStorage.getItem('notificationChatId'),
      source: sessionStorage.getItem('navigationSource')
    };
  }
}

// Instancia singleton
const notificationNavigationService = new NotificationNavigationService();

export default notificationNavigationService;
