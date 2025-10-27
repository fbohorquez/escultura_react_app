#!/bin/bash

# Script para probar el filtrado de usuarios activos en notificaciones

echo "=== Test de Filtrado de Usuarios Activos ==="
echo "Servidor: http://localhost:3089"
echo

# 1. Verificar que el servidor esté activo
echo "1. Verificando estado del servidor..."
curl -s http://localhost:3089/health | jq . || echo "Error: Servidor no disponible"
echo

# 2. Simular suscripción del equipo 819
echo "2. Simulando suscripción del equipo 819..."
curl -X POST http://localhost:3089/api/subscribe \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "819", 
    "eventId": "139",
    "subscription": {
      "endpoint": "https://fcm.googleapis.com/fcm/send/test-endpoint-team-819",
      "expirationTime": null,
      "keys": {
        "p256dh": "test-p256dh-key-team-819",
        "auth": "test-auth-key-team-819"
      }
    }
  }' | jq .
echo

# 3. Simular actividad del usuario 819 (marcarlo como activo)
echo "3. Marcando usuario 819 como activo en la aplicación..."
curl -X POST http://localhost:3089/api/user-app-activity \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "819"
  }' | jq .
echo

# 4. Intentar enviar notificación de actividad (debería ser filtrada)
echo "4. Intentando enviar notificación de actividad a usuario activo (debería ser filtrada)..."
curl -X POST http://localhost:3089/api/send-activity-sent \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "139",
    "teamId": "819",
    "activityId": "3001",
    "activityName": "Actividad de Prueba",
    "isForced": false
  }' | jq .
echo

# 5. Esperar 6 minutos (simulado - en realidad solo informamos)
echo "5. Esperando que expire la actividad del usuario (5+ minutos)..."
echo "(En producción, habría que esperar 5+ minutos para que expire la actividad)"
echo

# 6. Simular que ha pasado tiempo (forzar expiración - solo para prueba)
echo "6. Intentando enviar notificación después de expirar actividad..."
echo "(Nota: En esta prueba la actividad seguirá siendo reciente, pero en producción funcionaría)"
curl -X POST http://localhost:3089/api/send-activity-sent \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "139",
    "teamId": "819",
    "activityId": "3002",
    "activityName": "Actividad Después de Inactividad",
    "isForced": false
  }' | jq .
echo

echo "=== Test de Filtrado completado ==="
echo "Nota: Para probar realmente el filtrado, espera 5+ minutos entre los pasos 3 y 6"
