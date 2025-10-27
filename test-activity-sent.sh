#!/bin/bash

# Script para probar notificaciones de actividades enviadas y forzadas

echo "=== Test de Notificaciones de Actividades Enviadas ==="
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

# 3. Verificar suscripción
echo "3. Verificando suscripción del equipo 819..."
curl -s "http://localhost:3089/api/subscription/status?userId=819&eventId=139" | jq .
echo

# 4. Simular envío normal de actividad
echo "4. Simulando envío normal de actividad..."
curl -X POST http://localhost:3089/api/send-activity-sent \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "139",
    "teamId": "819",
    "activityId": "2001",
    "activityName": "Encontrar la Plaza Principal",
    "isForced": false
  }' | jq .
echo

# 5. Simular actividad forzada
echo "5. Simulando actividad forzada..."
curl -X POST http://localhost:3089/api/send-activity-sent \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "139",
    "teamId": "819",
    "activityId": "2002",
    "activityName": "Fotografía Obligatoria en el Ayuntamiento",
    "isForced": true
  }' | jq .
echo

echo "=== Test de Actividades Enviadas completado ==="
