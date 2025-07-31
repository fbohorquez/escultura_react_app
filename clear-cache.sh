#!/bin/bash
# Script para limpiar caché completo de Vite

echo "🧹 Limpiando caché de Vite..."

# Matar procesos existentes
echo "📴 Deteniendo procesos..."
pkill -f "npm run dev" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true

# Limpiar directorios de caché
echo "🗑️  Eliminando caché..."
rm -rf node_modules/.vite
rm -rf .vite
rm -rf dist

# Verificar que todo está bien
echo "✅ Verificando build..."
npm run build

echo "🚀 Listo! Ahora ejecuta: npm run dev"
echo "💡 Y haz un hard refresh en el navegador (Ctrl+Shift+R)"
