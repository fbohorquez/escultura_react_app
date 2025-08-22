const webpush = require('web-push');
const fs = require('fs');

console.log('Generando claves VAPID...');
const vapidKeys = webpush.generateVAPIDKeys();

console.log('Claves generadas:');
console.log('PUBLIC:', vapidKeys.publicKey);
console.log('PRIVATE:', vapidKeys.privateKey);

// Actualizar .env
const envContent = `# Configuración del servidor de notificaciones push
NODE_ENV=development
PORT=3089

# Claves VAPID para push notifications
# Generadas usando web-push
VAPID_PUBLIC_KEY=${vapidKeys.publicKey}
VAPID_PRIVATE_KEY=${vapidKeys.privateKey}
VAPID_SUBJECT=mailto:admin@escultura.dev2bit.com

# Base de datos y logs
LOG_LEVEL=info
CLEANUP_INTERVAL_HOURS=24
BACKUP_RETENTION_DAYS=7

# Configuración de servidor
MAX_SUBSCRIPTIONS_PER_USER=5
MAX_NOTIFICATIONS_PER_MINUTE=10
NOTIFICATION_TTL_SECONDS=86400
`;

fs.writeFileSync('.env', envContent);
console.log('Archivo .env actualizado');
console.log('Clave pública para React:', vapidKeys.publicKey);
