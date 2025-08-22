const webpush = require('web-push');

// Configurar VAPID
const vapidDetails = {
  publicKey: process.env.VAPID_PUBLIC_KEY,
  privateKey: process.env.VAPID_PRIVATE_KEY,
  subject: process.env.VAPID_EMAIL || 'mailto:admin@escultura.dev2bit.com'
};

// Validar que las claves VAPID estén configuradas
if (!vapidDetails.publicKey || !vapidDetails.privateKey) {
  console.error('❌ VAPID keys no configuradas. Ejecuta: npm run generate-vapid');
  process.exit(1);
}

// Configurar web-push
webpush.setVapidDetails(
  vapidDetails.subject,
  vapidDetails.publicKey,
  vapidDetails.privateKey
);

module.exports = {
  webpush,
  vapidDetails
};
