#!/bin/sh

# Verificar que los certificados SSL existan
if [ ! -f /etc/nginx/certs/escultura.dev2bit.com.crt ] || [ ! -f /etc/nginx/certs/escultura.dev2bit.com.key ]; then
    echo "❌ Certificados SSL no encontrados en /etc/nginx/certs/"
    echo "   Asegúrate de montar el volumen: /srv/proxy-web/certs:/etc/nginx/certs:ro"
    exit 1
fi

echo "✅ Certificados SSL encontrados"
echo "🚀 Iniciando nginx con SSL en puerto 5173..."

# Crear directorios necesarios
mkdir -p /var/cache/nginx /var/log/nginx /run/nginx

# Verificar configuración de nginx
nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Configuración de nginx válida"
else
    echo "❌ Error en la configuración de nginx"
    exit 1
fi

# Iniciar nginx en primer plano
exec nginx -g "daemon off;"
