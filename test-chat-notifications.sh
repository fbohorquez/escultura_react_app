#!/bin/bash

# Script de prueba para verificar notificaciones de chat

echo "🧪 Probando envío de notificaciones de chat..."

# Paso 1: Verificar que el servidor esté funcionando
echo "1. Verificando servidor de notificaciones..."
curl -s http://localhost:3089/health && echo " ✅ Servidor OK" || echo " ❌ Servidor no disponible"

# Paso 2: Simular suscripción de prueba
echo "2. Enviando suscripción de prueba..."
curl -s -X POST http://localhost:3089/api/subscribe \
  -H "Content-Type: application/json" \
  -d '{
    "subscription": {
      "endpoint": "https://fcm.googleapis.com/fcm/send/test-endpoint",
      "keys": {
        "p256dh": "test-p256dh-key",
        "auth": "test-auth-key"
      }
    },
    "userId": "test-user-123",
    "eventId": "test-event-456"
  }' && echo " ✅ Suscripción enviada"

# Paso 3: Simular envío de notificación de chat
echo "3. Simulando mensaje de chat..."
curl -s -X POST http://localhost:3089/api/send-chat-message \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "test-event-456",
    "chatId": "test-chat-789",
    "senderId": "otro-usuario-999",
    "senderName": "Usuario de Prueba",
    "senderType": "participant",
    "message": "¡Hola! Este es un mensaje de prueba",
    "chatName": "Chat de Prueba"
  }' && echo " ✅ Notificación enviada"

echo ""
echo "✅ Prueba completada"
echo "📝 Si ves errores, revisa:"
echo "  - Que el servidor esté ejecutándose en puerto 3089"
echo "  - Que las claves VAPID sean válidas"
echo "  - Que no haya errores en los logs del servidor"
