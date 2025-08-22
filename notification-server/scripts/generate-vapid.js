#!/usr/bin/env node

/**
 * Script para generar claves VAPID para notificaciones push
 * 
 * Uso:
 *   npm run generate-vapid
 *   
 * Las claves generadas deben copiarse al archivo .env:
 *   VAPID_PUBLIC_KEY=<clave_publica>
 *   VAPID_PRIVATE_KEY=<clave_privada>
 */

const webpush = require('web-push');

try {
  console.log('🔑 Generando claves VAPID...\n');
  
  const vapidKeys = webpush.generateVAPIDKeys();
  
  console.log('✅ Claves VAPID generadas exitosamente!\n');
  console.log('📋 Copia estas claves a tu archivo .env:\n');
  
  console.log('VAPID_PUBLIC_KEY=' + vapidKeys.publicKey);
  console.log('VAPID_PRIVATE_KEY=' + vapidKeys.privateKey);
  
  console.log('\n📝 Ejemplo de archivo .env:');
  console.log('PORT=3089');
  console.log('VAPID_PUBLIC_KEY=' + vapidKeys.publicKey);
  console.log('VAPID_PRIVATE_KEY=' + vapidKeys.privateKey);
  console.log('VAPID_EMAIL=admin@escultura.dev2bit.com');
  console.log('NODE_ENV=development');
  console.log('CORS_ORIGIN=http://localhost:5173');
  console.log('BACKUP_ENABLED=true');
  console.log('BACKUP_INTERVAL_HOURS=1');
  console.log('CLEANUP_INTERVAL_HOURS=24');
  
  console.log('\n⚠️  IMPORTANTE:');
  console.log('- Guarda estas claves de forma segura');
  console.log('- NO las compartas públicamente');
  console.log('- La clave pública se usará en el cliente React');
  console.log('- La clave privada solo debe estar en el servidor');
  
} catch (error) {
  console.error('❌ Error generando claves VAPID:', error.message);
  process.exit(1);
}
