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

    if (eventId && chatId) {
      console.log('Opening app from notification:', { eventId, chatId });
      
      // Limpiar los parámetros de la URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
      
      // Navegar al chat
      this.handleNavigation({
        eventId,
        chatId,
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

    const { eventId, chatId } = payload;

    if (!eventId || !chatId) {
      console.warn('Invalid navigation payload:', payload);
      return;
    }

    try {
      // Construir la ruta interna para MemoryRouter
      const route = this.buildChatRoute(eventId, chatId);
      
      console.log('Navigating to:', route);
      this.navigate(route);

      // Opcional: Almacenar en sessionStorage para que otros componentes sepan que venimos de notificación
      sessionStorage.setItem('navigationSource', 'notification');
      sessionStorage.setItem('notificationEventId', eventId);
      sessionStorage.setItem('notificationChatId', chatId);

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
