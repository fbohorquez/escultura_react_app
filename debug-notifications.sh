#!/bin/bash

# Script para debuggear notificaciones push manualmente

echo "=== Test de Notificaciones Push ==="
echo "Servidor: http://localhost:3089"
echo

# 1. Verificar que el servidor esté activo
echo "1. Verificando estado del servidor..."
curl -s http://localhost:3089/health | jq . || echo "Error: Servidor no disponible"
echo

# 2. Obtener clave VAPID pública
echo "2. Obteniendo clave VAPID..."
VAPID_KEY=$(curl -s http://localhost:3089/api/vapid-public-key | jq -r '.publicKey')
echo "Clave VAPID: $VAPID_KEY"
echo

# 3. Simular suscripción de un usuario equipo
echo "3. Simulando suscripción de usuario equipo (ID: 819)..."
curl -X POST http://localhost:3089/api/subscribe \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "819", 
    "eventId": "139",
    "subscription": {
      "endpoint": "https://fcm.googleapis.com/fcm/send/test-endpoint-team",
      "expirationTime": null,
      "keys": {
        "p256dh": "test-p256dh-key-team",
        "auth": "test-auth-key-team"
      }
    }
  }' | jq .
echo

# 4. Simular suscripción del admin
echo "4. Simulando suscripción de admin..."
curl -X POST http://localhost:3089/api/subscribe \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "admin", 
    "eventId": "139",
    "subscription": {
      "endpoint": "https://fcm.googleapis.com/fcm/send/test-endpoint-admin",
      "expirationTime": null,
      "keys": {
        "p256dh": "test-p256dh-key-admin",
        "auth": "test-auth-key-admin"
      }
    }
  }' | jq .
echo

# 5. Verificar estado de suscripciones
echo "5. Verificando suscripciones..."
echo "Estado equipo 819:"
curl -s "http://localhost:3089/api/subscription/status?userId=819&eventId=139" | jq .
echo
echo "Estado admin:"
curl -s "http://localhost:3089/api/subscription/status?userId=admin&eventId=139" | jq .
echo

# 6. Marcar usuarios como activos en chat
echo "6. Marcando usuarios como activos en chat admin_819..."
curl -X POST http://localhost:3089/api/user-active-chat \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "admin",
    "eventId": "139", 
    "chatId": "admin_819"
  }' | jq .

curl -X POST http://localhost:3089/api/user-active-chat \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "819",
    "eventId": "139",
    "chatId": "admin_819"  
  }' | jq .
echo

# 7. Simular envío de mensaje (admin -> equipo)
echo "7. Simulando mensaje de admin a equipo..."
curl -X POST http://localhost:3089/api/send-chat-message \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "139",
    "chatId": "admin_819",
    "senderId": "admin",
    "senderName": "Organizador",
    "senderType": "admin",
    "message": "Mensaje de prueba desde el organizador",
    "chatName": "Chat con Equipo 819"
  }' | jq .
echo

echo "=== Test completado ==="
