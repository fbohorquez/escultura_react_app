# Sistema de Cola de Gadgets

## Descripción
Se ha implementado un sistema de cola para la ejecución secuencial de gadgets. Esto resuelve el problema donde múltiples gadgets enviados al mismo equipo se ejecutaban simultáneamente.

## Funcionamiento

### 1. Parámetro de Configuración
- **`VITE_GADGET_SLEEP`**: Define el tiempo en segundos entre la ejecución de gadgets en cola (por defecto: 3 segundos)

### 2. Lógica de Cola
- Cuando se recibe un gadget, se añade a una cola de ejecución
- Solo se procesa un gadget a la vez
- Cada gadget se ejecuta completamente antes de pasar al siguiente
- Entre cada gadget se espera el tiempo configurado en `VITE_GADGET_SLEEP`
- La cola se procesa automáticamente cuando se añaden nuevos gadgets

### 3. Estados
- **`gadgetQueue`**: Array que contiene los gadgets pendientes de ejecución
- **`isProcessingQueue`**: Boolean que indica si se está procesando la cola

### 4. Funciones Principales
- **`addGadgetToQueue(gadgetId)`**: Añade un gadget a la cola
- **`processGadgetQueue()`**: Procesa todos los gadgets en cola secuencialmente
- **`executeSingleGadget(gadgetId)`**: Ejecuta un gadget individual y espera a que termine
- **`executeRotateScreen()`**: Devuelve una promesa que se resuelve cuando termina la rotación
- **`executeSusto()`**: Devuelve una promesa que se resuelve cuando termina el efecto de susto

### 5. Sistema de Promesas
Cada tipo de gadget ahora devuelve una promesa que se resuelve cuando la ejecución ha terminado completamente:
- **Rotate Screen**: Se resuelve después de 16 segundos (15s de rotación + 1s de transición)
- **Susto**: Se resuelve después de 3 segundos cuando se elimina el overlay
- **Gadgets sin implementación**: Se resuelve después de 1 segundo

## Ejemplo de Uso

Si se envían 3 gadgets seguidos al mismo equipo:
1. Gadget 1 (susto) se ejecuta durante 3 segundos
2. Al terminar, espera 3 segundos (VITE_GADGET_SLEEP)
3. Gadget 2 (rotate_screen) se ejecuta durante 16 segundos
4. Al terminar, espera 3 segundos
5. Gadget 3 se ejecuta hasta completarse
6. Cola queda vacía

## Logs del Sistema
El sistema genera logs detallados:
- `🎯 Adding gadget to queue: {gadgetId}`
- `🎯 Starting gadget queue processing...`
- `🎯 Executing gadget {i}/{total}: {gadgetId}`
- `✅ Gadget {gadgetId} execution completed`
- `✅ Gadget {gadgetId} marked as completed in Firebase`
- `⏰ Waiting {time}ms before next gadget...`
- `✅ Gadget queue processing completed`

## Compatibilidad
- Mantiene toda la funcionalidad existente
- Respeta las configuraciones de restricciones (`VITE_GADGET_PREVENT_ACTIVITY`, etc.)
- Compatible con el sistema de notificaciones actual
- Cada gadget espera realmente a que termine su ejecución antes de continuar
