#!/bin/bash

# Script para probar la configuración del proxy SSL para notificaciones

echo "=== Prueba de configuración de proxy SSL para notificaciones ==="
echo

# Verificar que los servicios estén funcionando
echo "1. Verificando estado de contenedores..."
docker-compose -f deploy/docker-compose.prod.yml ps

echo
echo "2. Probando conectividad interna al servidor de notificaciones..."
docker-compose -f deploy/docker-compose.prod.yml exec escultura-app wget -q --spider http://notification-server:3089/health && echo "✓ Conectividad interna OK" || echo "✗ Error de conectividad interna"

echo
echo "3. Probando proxy SSL en puerto 3089..."
curl -k -s -o /dev/null -w "Status: %{http_code}, Time: %{time_total}s\n" https://escultura.dev2bit.com:3089/health

echo
echo "4. Probando endpoint de suscripciones..."
curl -k -s -o /dev/null -w "Status: %{http_code}, Time: %{time_total}s\n" https://escultura.dev2bit.com:3089/api/subscriptions

echo
echo "5. Verificando configuración SSL..."
echo | openssl s_client -connect escultura.dev2bit.com:3089 -servername escultura.dev2bit.com 2>/dev/null | grep -E '(subject|issuer)='

echo
echo "6. Mostrando logs del contenedor nginx (últimas 10 líneas)..."
docker-compose -f deploy/docker-compose.prod.yml logs --tail=10 escultura-app

echo
echo "=== Fin de la prueba ==="
