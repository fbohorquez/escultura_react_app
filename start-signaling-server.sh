#!/bin/bash

# start-signaling-server.sh
# Script para iniciar el servidor de señalización WebRTC

echo "🚀 Iniciando servidor de señalización WebRTC..."

# Verificar si Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado. Por favor instálalo primero."
    exit 1
fi

# Verificar si existe el archivo del servidor
if [ ! -f "servidor-signaling.cjs" ]; then
    echo "❌ No se encontró el archivo servidor-signaling.cjs"
    exit 1
fi

# Instalar dependencias si no existen
if [ ! -d "node_modules" ] || [ ! -f "node_modules/ws/package.json" ]; then
    echo "📦 Instalando dependencias..."
    npm install ws
fi

# Iniciar el servidor
echo "🌐 Iniciando servidor en puerto 3088..."
node servidor-signaling.cjs
