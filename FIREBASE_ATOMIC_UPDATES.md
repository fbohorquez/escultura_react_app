# Actualizaciones Atómicas a Firebase

## 🎯 Problema Resuelto

Anteriormente, cuando se actualizaba una actividad de un equipo, se enviaba **todo el array `activities_data`** completo a Firebase. Esto causaba problemas de desincronización (desync) cuando:

1. Dos dispositivos modificaban actividades diferentes del mismo equipo simultáneamente
2. El último en escribir sobrescribía los cambios del primero
3. Se perdían datos de actividades completadas por otros dispositivos

### Ejemplo del Problema

```javascript
// ❌ ANTES: Enviaba todo el array
const updatedActivitiesData = team.activities_data.map(activityItem => {
  if (activityItem.id === activityId) {
    return { ...activityItem, complete: true };
  }
  return activityItem;
});

await updateTeam(eventId, teamId, {
  activities_data: updatedActivitiesData  // ⚠️ Sobrescribe todo
});
```

**Escenario de desync:**
- Dispositivo A: Completa actividad 1 → Escribe todo el array
- Dispositivo B: Completa actividad 2 → Escribe todo el array
- Resultado: Se pierde la completitud de actividad 1 o 2 (el último escritor gana)

## ✅ Solución Implementada

### Nueva Función: `updateTeamActivity()`

Implementada en `src/services/firebase.js`, usa **Firestore Transactions** para actualizar atómicamente una actividad específica:

```javascript
/**
 * Actualiza una actividad específica dentro del array activities_data de forma atómica.
 * @param {string|number} eventId 
 * @param {string|number} teamId 
 * @param {string|number} activityId 
 * @param {object} activityUpdates - Campos a actualizar en la actividad
 * @param {object} options - Opciones adicionales
 * @param {number} options.pointsToAdd - Puntos a SUMAR al total actual
 * @param {string[]} options.fieldsToDelete - Campos a ELIMINAR de la actividad
 * @returns {Promise<void>}
 */
export const updateTeamActivity = async (
  eventId, 
  teamId, 
  activityId, 
  activityUpdates, 
  options = {}
)
```

### Características

1. **Transacción Atómica**: Lee → Modifica → Escribe en una transacción
2. **Solo Actualiza Campos Específicos**: No sobrescribe actividades no modificadas
3. **Suma de Puntos**: Calcula puntos de forma atómica (evita race conditions)
4. **Eliminación de Campos**: Permite borrar campos (ej: `del`)

### Ejemplo de Uso

```javascript
// ✅ AHORA: Solo actualiza la actividad específica
await updateTeamActivity(eventId, teamId, activityId, 
  {
    complete: true,
    complete_time: Math.floor(Date.now() / 1000),
    valorate: 1,
    awarded_points: 10
  },
  {
    pointsToAdd: 10  // Suma 10 puntos al total actual
  }
);
```

## 📂 Archivos Actualizados

### 1. `src/services/firebase.js`
- ✅ Agregado import de `runTransaction`
- ✅ Nueva función `updateTeamActivity()` con transacciones

### 2. `src/services/activityCompletionQueue.js`
- ✅ `syncActivityCompletion()`: Usa `updateTeamActivity()` en lugar de `updateTeam()`
- ✅ Eliminado lectura innecesaria del store (la transacción lee el estado actual)

### 3. `src/components/ActivityValorate.jsx`
- ✅ `handleValorate()`: Usa `updateTeamActivity()` para valorar actividades
- ✅ Suma de puntos atómica (diferencia entre puntos nuevos y anteriores)

### 4. `src/features/activities/activitiesSlice.js`
- ✅ `completeActivity` thunk: Usa `updateTeamActivity()` para completar actividades
- ✅ Eliminado dispatch de `updateTeamData` con array completo

### 5. `src/pages/teamActivityDetailPage.jsx`
- ✅ `handleDeleteActivity()`: Usa `updateTeamActivity()` con `del: true`
- ✅ `handleRestoreActivity()`: Usa `updateTeamActivity()` con `fieldsToDelete: ['del']`

### 6. `src/services/uniqueActivityService.js`
- ⚠️ **NO MODIFICADO**: Ya usa transacciones de Firestore (más complejo, requiere refactor mayor)

## 🔒 Prevención de Race Conditions

### Antes (Race Condition)
```
T0: Device A lee activities_data = [{id:1, complete:false}, {id:2, complete:false}]
T1: Device B lee activities_data = [{id:1, complete:false}, {id:2, complete:false}]
T2: Device A escribe activities_data = [{id:1, complete:true}, {id:2, complete:false}]
T3: Device B escribe activities_data = [{id:1, complete:false}, {id:2, complete:true}]
RESULTADO: Activity 1 perdió su estado completado ❌
```

### Ahora (Transacción Atómica)
```
T0: Device A inicia transacción para activity 1
T1: Device B inicia transacción para activity 2
T2: Device A lee → modifica activity 1 → escribe
T3: Device B lee → modifica activity 2 → escribe
RESULTADO: Ambas actividades completadas correctamente ✅
```

## 📊 Beneficios

1. **Eliminación de Desync**: Las actualizaciones concurrentes ya no se sobrescriben
2. **Mejor Performance**: Solo se transfiere la actividad modificada, no todo el array
3. **Atomicidad de Puntos**: Los puntos se suman de forma atómica sin race conditions
4. **Código Más Limpio**: No necesita leer del store antes de escribir
5. **Consistencia Garantizada**: Firestore garantiza que las transacciones se ejecutan en orden

## 🔄 Flujo de Actualización

```
┌─────────────────┐
│ Usuario completa│
│   actividad     │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│ updateTeamActivity()    │
│ (Transacción Firestore) │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ 1. READ (transaction)   │
│    Leer team document   │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ 2. MODIFY               │
│    - Actualizar activity│
│    - Sumar puntos       │
│    - Eliminar campos    │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ 3. WRITE (transaction)  │
│    Escribir cambios     │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ Firebase onSnapshot     │
│ notifica cambios        │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ Redux actualiza estado  │
│ con protección de       │
│ actividades completadas │
└─────────────────────────┘
```

## ⚠️ Consideraciones

1. **uniqueActivityService.js**: Aún usa el enfoque de enviar todo el array, pero está dentro de una transacción más compleja. Requiere refactor futuro.

2. **Transacciones tienen límite**: Firestore permite máximo 500 documentos por transacción. No es problema para nuestro caso (1 documento).

3. **Retry automático**: Firestore reintenta transacciones automáticamente si hay conflictos de escritura.

## 🧪 Testing

Para probar la mejora:

1. Abrir la app en dos dispositivos del mismo equipo
2. Completar actividades diferentes simultáneamente
3. Verificar que ambas aparecen como completadas (antes, una se perdía)
4. Verificar que los puntos se suman correctamente (no se sobrescriben)

## 📝 Logs

La función incluye logs detallados:

```
🔄 Firebase updateTeamActivity (atomic) called: {eventId, teamId, activityId, ...}
   📊 Points: 100 + 10 = 110
✅ Firebase updateTeamActivity transaction completed
```

O en caso de error:
```
❌ Firebase updateTeamActivity transaction failed: [error]
```
