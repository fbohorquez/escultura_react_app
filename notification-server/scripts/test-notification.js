#!/usr/bin/env node

/**
 * Script para probar envío de notificaciones de desarrollo
 * 
 * Uso:
 *   npm run test-notification
 *   
 * NOTA: Solo funciona si el servidor está corriendo y tienes una suscripción válida
 */

require('dotenv').config();

async function testNotification() {
  try {
    console.log('🧪 Probando notificación de desarrollo...\n');
    
    // Verificar que las variables de entorno estén configuradas
    if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
      console.error('❌ Claves VAPID no configuradas. Ejecuta: npm run generate-vapid');
      process.exit(1);
    }
    
    const serverUrl = `http://localhost:${process.env.PORT || 3089}`;
    
    // Verificar que el servidor esté corriendo
    console.log(`📡 Verificando servidor en ${serverUrl}...`);
    
    const healthResponse = await fetch(`${serverUrl}/health`);
    if (!healthResponse.ok) {
      throw new Error('Servidor no disponible');
    }
    
    console.log('✅ Servidor disponible');
    
    // Obtener estadísticas del servidor
    console.log('\n📊 Estadísticas del servidor:');
    
    const statsResponse = await fetch(`${serverUrl}/api/stats`);
    if (statsResponse.ok) {
      const stats = await statsResponse.json();
      console.log(`- Suscripciones activas: ${stats.totalSubscriptions}`);
      console.log(`- Eventos con suscripciones: ${stats.totalEvents}`);
      console.log(`- Usuarios activos en chat: ${stats.activeUsers}`);
    } else {
      console.log('- Estadísticas no disponibles (modo producción)');
    }
    
    // Ejemplo de uso para enviar notificación de prueba
    console.log('\n📝 Para enviar una notificación de prueba, usa:');
    console.log('curl -X POST http://localhost:3089/api/send-test-notification \\');
    console.log('  -H "Content-Type: application/json" \\');
    console.log('  -d \'{"userId":"USER_ID","eventId":"EVENT_ID","title":"Prueba","body":"Mensaje de prueba"}\'');
    
    console.log('\n🔑 Clave pública VAPID (para el cliente React):');
    console.log(process.env.VAPID_PUBLIC_KEY);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Sugerencias:');
      console.log('1. Asegúrate de que el servidor esté corriendo: npm start');
      console.log('2. Verifica que el puerto 3089 esté disponible');
    }
    
    process.exit(1);
  }
}

// Solo ejecutar si es llamado directamente
if (require.main === module) {
  testNotification();
}

module.exports = testNotification;
