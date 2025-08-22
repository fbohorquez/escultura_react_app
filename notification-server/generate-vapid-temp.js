const crypto = require('crypto');
const fs = require('fs');

// Generar claves VAPID utilizando Node.js crypto
function generateVAPIDKeys() {
    // Generar un par de claves usando el algoritmo P-256 (prime256v1)
    const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', {
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

    // Convertir a base64url
    const publicKeyBase64 = publicKey.toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
    
    const privateKeyBase64 = privateKey.toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');

    return {
        publicKey: publicKeyBase64,
        privateKey: privateKeyBase64
    };
}

const keys = generateVAPIDKeys();

console.log('🔑 Claves VAPID generadas:');
console.log('');
console.log('Clave pública:', keys.publicKey);
console.log('Clave privada:', keys.privateKey);
console.log('');

// Actualizar archivo .env
const envPath = '.env';
let envContent = '';

try {
    envContent = fs.readFileSync(envPath, 'utf8');
} catch (error) {
    console.log('No se encontró archivo .env, creando uno nuevo...');
}

// Reemplazar o agregar las claves
envContent = envContent.replace(/VAPID_PUBLIC_KEY=.*/g, `VAPID_PUBLIC_KEY=${keys.publicKey}`);
envContent = envContent.replace(/VAPID_PRIVATE_KEY=.*/g, `VAPID_PRIVATE_KEY=${keys.privateKey}`);

// Si no existe, agregar las claves
if (!envContent.includes('VAPID_PUBLIC_KEY=')) {
    envContent += `\nVAPID_PUBLIC_KEY=${keys.publicKey}`;
}
if (!envContent.includes('VAPID_PRIVATE_KEY=')) {
    envContent += `\nVAPID_PRIVATE_KEY=${keys.privateKey}`;
}

fs.writeFileSync(envPath, envContent);

console.log('✅ Archivo .env actualizado con las nuevas claves VAPID');
console.log('');
console.log('⚠️  IMPORTANTE: Agrega esta clave pública al .env principal del proyecto React:');
console.log(`VITE_VAPID_PUBLIC_KEY=${keys.publicKey}`);
