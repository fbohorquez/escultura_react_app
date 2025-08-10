# Control de Orientación Forzada

## Descripción

La aplicación ahora incluye un sistema de control de orientación que permite forzar la orientación portrait en dispositivos móviles y tablets según configuración. Esta funcionalidad es especialmente útil para actividades que requieren una orientación específica.

## Variables de Configuración

### `VITE_FORCE_PORTRAIT_ORIENTATION`
- **Tipo**: `boolean`
- **Valores**: `true` | `false`
- **Por defecto**: `false`
- **Descripción**: Activa o desactiva el forzado de orientación portrait

```bash
# Activar orientación forzada
VITE_FORCE_PORTRAIT_ORIENTATION=true

# Desactivar orientación forzada (comportamiento por defecto)
VITE_FORCE_PORTRAIT_ORIENTATION=false
```

### `VITE_FORCE_PORTRAIT_DEVICE_TYPES`
- **Tipo**: `string`
- **Valores**: `mobile` | `tablet` | `todos` | `mobile,tablet`
- **Por defecto**: `mobile`
- **Descripción**: Especifica qué tipos de dispositivos se verán afectados por la orientación forzada

```bash
# Solo móviles (por defecto)
VITE_FORCE_PORTRAIT_DEVICE_TYPES=mobile

# Solo tablets
VITE_FORCE_PORTRAIT_DEVICE_TYPES=tablet

# Móviles y tablets
VITE_FORCE_PORTRAIT_DEVICE_TYPES=mobile,tablet

# Todos los dispositivos (incluyendo desktop)
VITE_FORCE_PORTRAIT_DEVICE_TYPES=todos
```

## Funcionamiento

### Detección de Dispositivo
El sistema detecta automáticamente el tipo de dispositivo basándose en:
- User Agent del navegador
- Dimensiones de la pantalla
- Relación de aspecto

### Métodos de Control

1. **Screen Orientation API** (Preferido)
   - Utiliza `screen.orientation.lock('portrait')` 
   - Funciona en navegadores modernos que soportan la API
   - Bloqueo real de la orientación física

2. **CSS Hint Visual** (Fallback)
   - Muestra un overlay cuando el dispositivo está en landscape
   - Mensaje solicitando rotar a portrait
   - Se aplica cuando la Screen Orientation API no está disponible

### Hook: `useForceOrientation`

```jsx
import useForceOrientation from './hooks/useForceOrientation';

function MyComponent() {
  const {
    isOrientationForced,  // ¿Está siendo forzada la orientación?
    deviceType,           // Tipo de dispositivo detectado
    forcePortrait,        // Configuración de forzado activa
    deviceTypes,          // Tipos de dispositivos objetivo
    lockToPortrait,       // Función para forzar portrait
    unlockOrientation     // Función para liberar orientación
  } = useForceOrientation();

  return (
    <div>
      <p>Dispositivo: {deviceType}</p>
      <p>Forzando orientación: {isOrientationForced ? 'Sí' : 'No'}</p>
    </div>
  );
}
```

### Componente de Debug: `OrientationController`

```jsx
import OrientationController from './components/OrientationController';

function MyPage() {
  return (
    <div>
      {/* Mostrar información de debug solo en modo desarrollo */}
      <OrientationController showDebugInfo={process.env.NODE_ENV === 'development'} />
      
      {/* Resto del contenido */}
    </div>
  );
}
```

## Integración Automática

El control de orientación se integra automáticamente en:
- **App.jsx**: Hook principal activado globalmente
- **Modo Debug**: Panel de información y controles manuales
- **Detección automática**: Sin intervención del usuario

## Casos de Uso

### Configuración para Móviles únicamente
```bash
VITE_FORCE_PORTRAIT_ORIENTATION=true
VITE_FORCE_PORTRAIT_DEVICE_TYPES=mobile
```

### Configuración para Móviles y Tablets
```bash
VITE_FORCE_PORTRAIT_ORIENTATION=true
VITE_FORCE_PORTRAIT_DEVICE_TYPES=mobile,tablet
```

### Desactivar en Producción
```bash
VITE_FORCE_PORTRAIT_ORIENTATION=false
```

## Comportamiento en Diferentes Navegadores

- **Chrome/Firefox (Android)**: Screen Orientation API + CSS Fallback
- **Safari (iOS)**: CSS Fallback (limitaciones de iOS)
- **Edge Mobile**: Screen Orientation API + CSS Fallback
- **Desktop**: Sin efecto (a menos que se configure `todos`)

## Debugging

En modo debug, se muestra un panel flotante con:
- Tipo de dispositivo detectado
- Estado de la configuración
- Orientación actual del dispositivo
- Botones para forzar/liberar orientación manualmente

## Consideraciones

1. **Permisos**: Algunos navegadores requieren interacción del usuario antes de permitir el bloqueo de orientación
2. **PWA**: Funciona mejor en aplicaciones web progresivas instaladas
3. **iOS Safari**: Limitaciones por políticas de Apple, fallback a CSS visual
4. **Fullscreen**: Mejor compatibilidad en modo pantalla completa

## Logs de Consola

El sistema proporciona logs detallados para debugging:
```
🔒 Attempting to lock screen orientation to portrait
✅ Screen orientation locked to portrait successfully
📱 Applied CSS orientation hint for landscape warning
🔄 Force orientation disabled or device type not targeted
```
