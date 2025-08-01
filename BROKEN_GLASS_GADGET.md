# Gadget: Cristal Roto (broken_glass)

## Descripción
El gadget "Cristal Roto" es un nuevo tipo de gadget que crea un efecto visual de pantalla rota sobre la interfaz del equipo objetivo, bloqueando temporalmente la interacción con la aplicación.

## Características
- **ID**: `broken_glass`
- **Nombre**: "Cristal Roto"
- **Descripción**: "Bloquea la interfaz con un efecto de cristal roto"
- **Icono**: 🔨
- **Cooldown**: 8 minutos
- **Duración**: 10 segundos

## Funcionamiento

### Efectos Visuales
1. **Overlay de Pantalla**: Se superpone una imagen de cristal roto (`glass-background.png`) sobre toda la pantalla
2. **Texto Informativo**: Muestra un mensaje "¡Pantalla Rota!" con información de que la interfaz está temporalmente bloqueada
3. **Animación**: El texto tiene una animación de vibración (`glassShake`) que simula el efecto de cristal roto
4. **Cursor**: El cursor cambia a `not-allowed` para indicar que no se puede interactuar

### Bloqueo de Interfaz
- El overlay tiene un `z-index: 9999` que lo coloca por encima de todos los elementos
- Cubre toda la pantalla (`position: fixed` con top, left, right, bottom a 0)
- Previene cualquier interacción del usuario con la interfaz subyacente

### Temporización
- **Duración total**: 10 segundos
- **Auto-eliminación**: El efecto se elimina automáticamente después de 10 segundos
- **Limpieza**: Se eliminan tanto el overlay como los estilos CSS añadidos

## Implementación Técnica

### Archivos Modificados
1. **`/src/services/firebase.js`**: Añadido a la definición de `GADGETS`
2. **`/src/components/GadgetDetector.jsx`**: 
   - Import de la imagen `glass-background.png`
   - Función `executeBrokenGlass()`
   - Caso en el switch statement
   - Actualización de dependencias useCallback

### Integración con el Sistema de Cola
- Compatible con el sistema de cola de gadgets existente
- Se ejecuta secuencialmente con otros gadgets
- Respeta el tiempo de espera configurado en `VITE_GADGET_SLEEP`
- Devuelve una promesa que se resuelve cuando termina la ejecución

### Asset Requerido
- **Archivo**: `/src/assets/glass-background.png`
- **Uso**: Imagen de fondo para el efecto de cristal roto
- **Configuración**: `background-size: cover`, `background-position: center`

## Logs del Sistema
El gadget genera los siguientes logs:
- `"Broken glass gadget started"` - Al iniciar la ejecución
- `"Broken glass gadget completed"` - Al completar la ejecución
- Logs estándar del sistema de cola de gadgets

## Ejemplo de Uso
```javascript
// El gadget se ejecuta automáticamente cuando es recibido
// Duración: 10 segundos
// Efecto: Pantalla bloqueada con imagen de cristal roto
// Mensaje: "¡Pantalla Rota! Interfaz bloqueada temporalmente"
```

## Configuración CSS
```css
/* Overlay principal */
position: fixed;
top: 0; left: 0; right: 0; bottom: 0;
background-image: url('glass-background.png');
background-size: cover;
z-index: 9999;
cursor: not-allowed;

/* Animación de vibración */
@keyframes glassShake {
  0% { transform: translate(0px, 0px) rotate(0deg); }
  25% { transform: translate(1px, -1px) rotate(0.5deg); }
  50% { transform: translate(-1px, 1px) rotate(-0.5deg); }
  75% { transform: translate(-1px, -1px) rotate(0.5deg); }
  100% { transform: translate(1px, 1px) rotate(0deg); }
}
```

## Compatibilidad
- ✅ Sistema de cola de gadgets
- ✅ Configuraciones de restricción (`VITE_GADGET_PREVENT_ACTIVITY`)
- ✅ Sistema de notificaciones
- ✅ Cooldown de equipos
- ✅ Logs detallados
- ✅ Auto-limpieza de elementos DOM
