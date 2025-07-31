# Guía para limpiar caché - Escultura App

## Problema
Error: `The requested module '/src/features/event/eventSlice.js' does not provide an export named 'reactivateEvent'`

## Solución confirmada
El build se ejecuta sin errores, confirmando que las importaciones están correctas. El problema es de caché.

## Pasos para limpiar caché

### 1. Limpiar caché de Vite (servidor)
```bash
cd /home/franj/projects/escultura
rm -rf node_modules/.vite
rm -rf .vite
rm -rf dist
```

### 2. Limpiar caché del navegador
- **Chrome/Edge**: `Ctrl + Shift + R` o `F12 > Network > Disable cache`
- **Firefox**: `Ctrl + Shift + R` o `F12 > Network > Settings > Disable cache`
- **Modo más agresivo**: Abrir DevTools > Application > Storage > Clear storage

### 3. Reiniciar servidor de desarrollo
```bash
# Matar cualquier proceso que esté corriendo
pkill -f "npm run dev"
pkill -f "vite"

# Limpiar e iniciar de nuevo
npm run build  # Para verificar que todo está bien
npm run dev    # Iniciar servidor limpio
```

### 4. Si persiste el problema
```bash
# Limpiar node_modules completo
rm -rf node_modules
npm install
npm run dev
```

### 5. Hard refresh en navegador
1. Abrir DevTools (F12)
2. Click derecho en el botón refresh
3. Seleccionar "Empty Cache and Hard Reload"

## Estado actual
- ✅ Build exitoso sin errores
- ✅ Todas las importaciones son correctas
- ✅ `reactivateEvent` existe en eventSlice.js
- ✅ Archivos limpios sin caracteres extraños

El problema es 100% caché.
