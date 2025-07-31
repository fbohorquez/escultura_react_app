# Sistema de Comportamiento de Carga de Eventos

Este sistema permite configurar diferentes comportamientos cuando se accede a la aplicación y ya hay un evento cargado previamente.

## Configuración

El comportamiento se configura a través de la variable de entorno `VITE_EVENT_LOAD_BEHAVIOR` en el archivo `.env`:

```env
VITE_EVENT_LOAD_BEHAVIOR=keep_page
```

## Valores disponibles

### `reset_event`
- **Descripción**: Desasocia el id de dispositivo del equipo en Firebase y borra el almacenamiento local
- **Comportamiento**: Fuerza a iniciar la aplicación desde el principio. Si se selecciona cualquier evento, los datos empiezan de cero
- **Uso recomendado**: Para eventos de prueba o cuando se quiere asegurar que cada acceso sea completamente limpio

### `keep_assignation`
- **Descripción**: Crea una copia de los datos de sesión en el almacenamiento local y los borra del estado actual
- **Comportamiento**: 
  - La aplicación comienza desde el principio (selección de eventos)
  - Se guardan los datos de sesión del evento actual en localStorage
  - Al seleccionar un evento, si es uno de los que estaban almacenados, se rescatan los datos de sesión
  - Permite tener múltiples sesiones de eventos almacenadas simultáneamente
- **Uso recomendado**: Para dispositivos que van a ser usados en múltiples eventos o por múltiples equipos

### `keep_event`
- **Descripción**: Se carga el evento actual siempre desde el mapa
- **Comportamiento**: Redirige automáticamente al mapa del evento que estaba cargado
- **Uso recomendado**: Para eventos en curso donde se quiere que los dispositivos siempre muestren el evento activo

### `keep_page` (por defecto)
- **Descripción**: Se carga el evento actual y en la página actual
- **Comportamiento**: Mantiene el comportamiento actual de la aplicación (no hace nada especial)
- **Uso recomendado**: Comportamiento estándar para la mayoría de casos

## Archivos involucrados

- `/src/services/eventLoadBehavior.js` - Servicio principal con la lógica de comportamientos
- `/src/components/EventLoadBehaviorManager.jsx` - Componente que ejecuta la lógica después de la hidratación de Redux
- `/src/pages/eventsPage.jsx` - Maneja la restauración de sesiones guardadas al seleccionar eventos
- `/src/hooks/useEventLoadBehavior.js` - Hook auxiliar (opcional)

## Funcionamiento interno

1. **Al cargar la aplicación**: El `EventLoadBehaviorManager` verifica si hay una sesión activa después de que Redux se hidrate
2. **Según el comportamiento configurado**: Se ejecuta la acción correspondiente
3. **Al seleccionar un evento**: Si el comportamiento es `keep_assignation`, se verifica si hay una sesión guardada para restaurar

## Almacenamiento de sesiones

Las sesiones se guardan en localStorage bajo la clave `savedEventSessions` con la siguiente estructura:

```json
{
  "eventId1": {
    "eventId": "eventId1",
    "selectedTeam": { /* datos del equipo */ },
    "teamPhoto": "url_de_la_foto",
    "token": "token_del_dispositivo",
    "timestamp": 1234567890123
  },
  "eventId2": { /* otra sesión */ }
}
```

Las sesiones tienen una caducidad de 7 días por defecto.

## Debugging

Para ver los logs del sistema, busca en la consola mensajes que comiencen con:
- `🔄 EventLoadBehaviorManager`
- `🔄 Detected active event session`
- `🔄 Restoring saved session`
- `✅ Session saved for event`
