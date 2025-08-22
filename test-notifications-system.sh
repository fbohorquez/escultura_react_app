#!/bin/bash

# Script de prueba para el sistema de notificaciones push

set -e

echo "🧪 Iniciando pruebas del sistema de notificaciones push"
echo "=================================================="

# Verificar que existen los archivos necesarios
echo "📋 Verificando archivos del sistema..."

files=(
    "notification-server/package.json"
    "notification-server/server.js"
    "notification-server/.env"
    "notification-server/Dockerfile"
    "src/services/notificationService.js"
    "src/hooks/useNotifications.js"
    "src/features/notifications/notificationsSlice.js"
    "public/sw.js"
)

for file in "${files[@]}"; do
    if [[ -f "$file" ]]; then
        echo "✅ $file"
    else
        echo "❌ $file - NO ENCONTRADO"
        exit 1
    fi
done

echo ""
echo "🔧 Verificando configuración..."

# Verificar variables de entorno
if grep -q "VITE_NOTIFICATIONS_SERVER_URL" .env; then
    echo "✅ VITE_NOTIFICATIONS_SERVER_URL configurada"
else
    echo "❌ VITE_NOTIFICATIONS_SERVER_URL NO configurada"
    exit 1
fi

if grep -q "VITE_VAPID_PUBLIC_KEY" .env; then
    echo "✅ VITE_VAPID_PUBLIC_KEY configurada"
else
    echo "❌ VITE_VAPID_PUBLIC_KEY NO configurada"
    exit 1
fi

if grep -q "VAPID_PRIVATE_KEY" notification-server/.env; then
    echo "✅ VAPID_PRIVATE_KEY configurada en servidor"
else
    echo "❌ VAPID_PRIVATE_KEY NO configurada en servidor"
    exit 1
fi

echo ""
echo "🐳 Verificando configuración Docker..."

if grep -q "notification-server" deploy/docker-compose.yml; then
    echo "✅ Servicio notification-server en docker-compose.yml"
else
    echo "❌ Servicio notification-server NO en docker-compose.yml"
    exit 1
fi

if grep -q "notification-server" deploy/docker-compose.prod.yml; then
    echo "✅ Servicio notification-server en docker-compose.prod.yml"
else
    echo "❌ Servicio notification-server NO en docker-compose.prod.yml"
    exit 1
fi

echo ""
echo "📱 Verificando integración frontend..."

if grep -q "notificationsSlice" src/store.js; then
    echo "✅ notificationsSlice integrado en Redux store"
else
    echo "❌ notificationsSlice NO integrado en Redux store"
    exit 1
fi

if grep -q "initializeNotifications" src/main.jsx; then
    echo "✅ Inicialización de notificaciones en main.jsx"
else
    echo "❌ Inicialización de notificaciones NO en main.jsx"
    exit 1
fi

if grep -q "sendChatNotification" src/features/chats/chatsSlice.js; then
    echo "✅ Integración de notificaciones en chat"
else
    echo "❌ Integración de notificaciones NO en chat"
    exit 1
fi

echo ""
echo "🎉 ¡Todas las verificaciones pasaron exitosamente!"
echo ""
echo "📝 Instrucciones para prueba manual:"
echo "1. Ejecutar: cd notification-server && npm install && npm start"
echo "2. En otra terminal: npm run dev (desde la raíz del proyecto)"
echo "3. Abrir navegador en http://localhost:5173"
echo "4. Permitir notificaciones cuando se solicite"
echo "5. Ir a configuración de notificaciones y hacer prueba"
echo "6. Abrir un chat y verificar notificaciones al recibir mensajes"
echo ""
echo "🚀 Para deployment:"
echo "1. Ejecutar: ./deploy/deploy-remote.sh"
echo "2. Verificar que los 3 servicios estén funcionando"
echo "3. Probar notificaciones en producción"
