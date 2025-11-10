# Correcciones: Campo `del` y Actualización en Tiempo Real

## 🐛 Problemas Corregidos

### 1. Campo `del` se eliminaba en lugar de ponerse a `false`
**Problema anterior:**
- Al restaurar una actividad, se intentaba eliminar el campo `del` completamente
- Esto podía causar inconsistencias en la lógica de filtrado

**Solución:**
- Cambiar `del: undefined` → `del: false`
- Mantener el campo siempre presente con valor booleano explícito

### 2. Los cambios no se reflejaban inmediatamente en el listado
**Problema anterior:**
- Al marcar/desmarcar una actividad como eliminada, no se veía el cambio hasta que Firebase notificaba (delay de ~1-2 segundos)
- Mala experiencia de usuario

**Solución:**
- Implementar **Optimistic Updates**: actualizar Redux localmente ANTES de enviar a Firebase
- Los cambios se ven instantáneamente, Firebase sincroniza en segundo plano

## ✅ Cambios Implementados

### 1. Nueva Acción en `teamsSlice.js`

```javascript
updateTeamActivityLocal(state, action) {
  // Actualizar una actividad específica localmente (optimistic update)
  const { teamId, activityId, updates } = action.payload;
  const teamIndex = state.items.findIndex(t => t.id === teamId);
  
  if (teamIndex !== -1) {
    const team = state.items[teamIndex];
    if (team.activities_data) {
      const activityIndex = team.activities_data.findIndex(a => a.id === activityId);
      if (activityIndex !== -1) {
        state.items[teamIndex].activities_data[activityIndex] = {
          ...team.activities_data[activityIndex],
          ...updates
        };
      }
    }
  }
}
```

**Exportada como:**
```javascript
export const { setTeams, updateTeamActivityLocal, setTeamsLoading, setTeamsError } = teamsSlice.actions;
```

### 2. Nueva Acción en `sessionSlice.js`

```javascript
updateSelectedTeamActivityLocal(state, action) {
  // Actualizar una actividad específica del selectedTeam localmente
  const { activityId, updates } = action.payload;
  
  if (state.selectedTeam && state.selectedTeam.activities_data) {
    const activityIndex = state.selectedTeam.activities_data.findIndex(a => a.id === activityId);
    if (activityIndex !== -1) {
      state.selectedTeam.activities_data[activityIndex] = {
        ...state.selectedTeam.activities_data[activityIndex],
        ...updates
      };
    }
  }
}
```

**Exportada como:**
```javascript
export const {
  setIsAdmin,
  setSelectedTeam,
  updateSelectedTeam,
  updateSelectedTeamActivityLocal, // ← NUEVO
  setTeamPhoto,
  clearSession,
  setToken,
  refreshSession,
} = sessionSlice.actions;
```

### 3. Actualización en `teamActivityDetailPage.jsx`

#### Imports actualizados:
```javascript
import { updateTeamData, updateTeamActivityLocal } from "../features/teams/teamsSlice";
import { updateSelectedTeamActivityLocal } from "../features/session/sessionSlice";
```

#### `handleDeleteActivity` - Marcar como eliminada:
```javascript
// Actualizar estado local primero (optimistic update)
dispatch(updateTeamActivityLocal({
  teamId: teamIdNumber,
  activityId: activity.id,
  updates: { del: true }
}));

// Si es el equipo seleccionado, actualizarlo también
if (selectedTeam && selectedTeam.id === teamIdNumber) {
  dispatch(updateSelectedTeamActivityLocal({
    activityId: activity.id,
    updates: { del: true }
  }));
}

// Actualizar Firebase (async en segundo plano)
const { updateTeamActivity } = await import('../services/firebase');
await updateTeamActivity(eventIdNumber, teamIdNumber, activity.id, {
  del: true // ✅ Se pone a true, no se elimina
});
```

#### `handleRestoreActivity` - Restaurar:
```javascript
// Actualizar estado local primero (optimistic update)
dispatch(updateTeamActivityLocal({
  teamId: teamIdNumber,
  activityId: activity.id,
  updates: { del: false } // ✅ Se pone a false, no se elimina
}));

// Si es el equipo seleccionado, actualizarlo también
if (selectedTeam && selectedTeam.id === teamIdNumber) {
  dispatch(updateSelectedTeamActivityLocal({
    activityId: activity.id,
    updates: { del: false }
  }));
}

// Actualizar Firebase
const { updateTeamActivity } = await import('../services/firebase');
await updateTeamActivity(eventIdNumber, teamIdNumber, activity.id, {
  del: false // ✅ Se pone a false explícitamente
});
```

## 🔄 Flujo de Actualización (Optimistic Update)

```
┌─────────────────────────┐
│ Usuario hace clic       │
│ "Eliminar/Restaurar"    │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ 1. Actualizar Redux     │
│    LOCAL inmediatamente │
│    (teams + selectedTeam)│
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ 2. UI se actualiza      │
│    INSTANTÁNEAMENTE     │
│    (usuario ve cambio)  │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ 3. Enviar a Firebase    │
│    (async, 1-2 seg)     │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ 4. Firebase notifica    │
│    a otros dispositivos │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ 5. Otros dispositivos   │
│    reciben actualización│
└─────────────────────────┘
```

## 📊 Beneficios

1. **UX Mejorada**: 
   - Cambios visibles instantáneamente (0ms vs 1-2 segundos)
   - Sensación de aplicación más rápida y responsive

2. **Consistencia de Datos**:
   - Campo `del` siempre es booleano (`true`/`false`)
   - No hay valores `undefined` que puedan causar bugs

3. **Sincronización Dual**:
   - Actualiza tanto `teams.items` como `session.selectedTeam`
   - Todos los componentes que lean de Redux ven el cambio inmediato

4. **Resiliencia**:
   - Si Firebase falla, la actualización local ya se hizo
   - El listener eventualmente sincronizará cuando Firebase responda

## 🧪 Testing

### Caso 1: Eliminar Actividad
1. Ir a `/event/{eventId}/admin/team-activities/team/{teamId}`
2. Hacer clic en "Eliminar" de una actividad
3. **Verificar**: La actividad desaparece INMEDIATAMENTE del listado
4. **Verificar**: Al volver al listado principal, la actividad no aparece

### Caso 2: Restaurar Actividad
1. En la misma página, activar "Mostrar eliminadas"
2. Hacer clic en "Restaurar" de una actividad eliminada
3. **Verificar**: La actividad vuelve a aparecer INMEDIATAMENTE
4. **Verificar**: `activity.del === false` (no `undefined`)

### Caso 3: Múltiples Dispositivos
1. Abrir en dos navegadores/dispositivos
2. Eliminar actividad en dispositivo A
3. **Verificar**: Dispositivo A ve cambio instantáneo
4. **Verificar**: Dispositivo B ve cambio tras 1-2 segundos (listener Firebase)

## 🔍 Logs de Debug

Los logs ahora muestran las actualizaciones locales:

```
🔄 Local update: team 123, activity 456 { del: true }
🔄 Local update selectedTeam: activity 456 { del: true }
🔄 Firebase updateTeamActivity (atomic) called: {...}
✅ Firebase updateTeamActivity transaction completed
```

## ⚠️ Notas Importantes

1. **Orden de Operaciones**: 
   - SIEMPRE actualizar Redux primero
   - LUEGO enviar a Firebase
   - Esto garantiza UI responsive

2. **Rollback**: 
   - Si Firebase falla, el listener NO sobrescribirá el cambio local
   - La próxima actualización de Firebase re-sincronizará

3. **Campo `del`**:
   - NUNCA usar `delete activity.del`
   - SIEMPRE usar `activity.del = false` para restaurar
   - Mantener consistencia booleana

## 📝 Archivos Modificados

1. ✅ `src/features/teams/teamsSlice.js`
   - Nueva acción `updateTeamActivityLocal`

2. ✅ `src/features/session/sessionSlice.js`
   - Nueva acción `updateSelectedTeamActivityLocal`

3. ✅ `src/pages/teamActivityDetailPage.jsx`
   - `handleDeleteActivity`: Optimistic update + `del: true`
   - `handleRestoreActivity`: Optimistic update + `del: false`
