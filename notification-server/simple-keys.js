// Script simple para generar claves VAPID válidas
const crypto = require('crypto');

// Generar claves VAPID usando el formato correcto para web-push
function generateVapidKeys() {
  const keyPair = crypto.generateKeyPairSync('ec', {
    namedCurve: 'prime256v1',
    publicKeyEncoding: {
      type: 'spki',
      format: 'der'
    },
    privateKeyEncoding: {
      type: 'pkcs8', 
      format: 'der'
    }
  });

  // Convertir a base64url como espera web-push
  const publicKey = urlBase64(keyPair.publicKey);
  const privateKey = urlBase64(keyPair.privateKey);

  return { publicKey, privateKey };
}

function urlBase64(buffer) {
  return buffer.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

const keys = generateVapidKeys();
console.log('PUBLIC_KEY=' + keys.publicKey);
console.log('PRIVATE_KEY=' + keys.privateKey);
console.log('Length public:', keys.publicKey.length);
console.log('Length private:', keys.privateKey.length);
