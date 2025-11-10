#!/bin/bash

# Script para limpiar completamente el almacenamiento local del navegador
# Útil cuando se reinicia la base de datos Firebase

echo "🧹 Limpiando almacenamiento local..."
echo ""
echo "Para limpiar el almacenamiento local de tu navegador:"
echo ""
echo "1. Abre las DevTools del navegador (F12)"
echo "2. Ve a la pestaña 'Application' (Chrome) o 'Storage' (Firefox)"
echo "3. En el menú lateral:"
echo "   - Haz clic derecho en 'Local Storage' → 'Clear'"
echo "   - Haz clic derecho en 'Session Storage' → 'Clear'"
echo "   - Haz clic derecho en 'IndexedDB' → Elimina todas las bases de datos"
echo "4. Recarga la página (Ctrl+R o Cmd+R)"
echo ""
echo "O más rápido:"
echo "1. DevTools → Application → 'Clear site data' → 'Clear data'"
echo "2. Recarga la página"
echo ""
echo "📌 También puedes usar modo incógnito para probar sin cache"
