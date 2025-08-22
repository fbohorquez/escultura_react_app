// Debug script para verificar el estado de notificaciones
// Ejecutar en la consola del navegador

console.log('🔍 Debug de sistema de notificaciones');
console.log('=====================================');

// Verificar Redux store
if (window.__REDUX_DEVTOOLS_EXTENSION__ || window.store) {
  const state = window.store?.getState() || {};
  
  console.log('📊 Estado de Redux:');
  console.log('- session:', state.session);
  console.log('- event:', state.event);
  console.log('- notifications:', state.notifications);
  
  // Verificar usuario actual
  const { selectedTeam, isAdmin } = state.session || {};
  const currentUserId = isAdmin ? 'admin' : selectedTeam?.id;
  const currentEventId = state.event?.event?.id;
  
  console.log('👤 Usuario actual:');
  console.log('- currentUserId:', currentUserId);
  console.log('- currentEventId:', currentEventId);
  console.log('- isAdmin:', isAdmin);
  console.log('- selectedTeam:', selectedTeam);
  
} else {
  console.log('❌ No se puede acceder al store de Redux');
}

// Verificar soporte de notificaciones
console.log('🔔 Soporte de notificaciones:');
console.log('- serviceWorker:', 'serviceWorker' in navigator);
console.log('- PushManager:', 'PushManager' in window);
console.log('- Notification:', 'Notification' in window);
console.log('- permission:', Notification.permission);

// Verificar variables de entorno
console.log('🌍 Variables de entorno:');
console.log('- VITE_NOTIFICATIONS_SERVER_URL:', import.meta.env.VITE_NOTIFICATIONS_SERVER_URL);
console.log('- VITE_ENABLE_NOTIFICATIONS:', import.meta.env.VITE_ENABLE_NOTIFICATIONS);
console.log('- VITE_VAPID_PUBLIC_KEY length:', import.meta.env.VITE_VAPID_PUBLIC_KEY?.length);

// Función para probar conexión al servidor
window.testNotificationServer = async function() {
  try {
    const response = await fetch('http://localhost:3089/health');
    const data = await response.json();
    console.log('✅ Servidor de notificaciones OK:', data);
  } catch (error) {
    console.log('❌ Servidor de notificaciones ERROR:', error.message);
  }
};

console.log('');
console.log('💡 Comandos disponibles:');
console.log('- testNotificationServer() - Probar conexión al servidor');
console.log('- Notification.requestPermission() - Solicitar permisos manualmente');

export default null; // Solo para que sea un módulo válido
