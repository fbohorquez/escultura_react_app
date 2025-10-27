#!/bin/sh

# Verificar que los certificados SSL existan
# if [ ! -f /etc/nginx/certs/escultura.dev2bit.com.crt ] || [ ! -f /etc/nginx/certs/escultura.dev2bit.com.key ]; then
#     echo "❌ Certificados SSL no encontrados en /etc/nginx/certs/"
#     echo "   Asegúrate de montar el volumen: /srv/proxy-web/certs:/etc/nginx/certs:ro"
#     exit 1
# fi

echo "✅ Certificados SSL encontrados"
echo "🚀 Iniciando signaling server con SSL en puerto 3088..."

# Iniciar el servidor de signaling
exec node servidor-signaling.cjs
