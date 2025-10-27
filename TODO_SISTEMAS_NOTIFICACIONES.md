# TODO: Unificación de Sistemas de Notificaciones

## 🔍 Análisis de la situación actual

### Sistemas identificados:

#### 1. **useNotification** (Notificaciones internas/Gadgets)
- **Archivo**: `src/hooks/useNotification.js`
- **Redux Slice**: `src/features/notification/notificationSlice.js` 
- **Propósito**: Notificaciones visuales dentro de la interfaz (toasts/alerts)
- **Uso principal**: 
  - Gadgets (GadgetDetector.jsx)
  - Selección de equipos (TeamSelector.jsx)
  - Componentes internos de la aplicación
- **Características**:
  - Notificaciones temporales en pantalla
  - Diferentes tipos: success, error, warning, info
  - Posicionamiento configurable (top/center/bottom)
  - Duración configurable
  - Soporte para notificaciones clickables

#### 2. **useNotifications** (Notificaciones Push)
- **Archivo**: `src/hooks/useNotifications.js`
- **Redux Slice**: `src/features/notifications/notificationsSlice.js`
- **Propósito**: Gestión de notificaciones push del navegador
- **Uso principal**:
  - NotificationSettings.jsx
  - NotificationPermissionBanner.jsx
- **Características**:
  - Suscripción a notificaciones push
  - Gestión de permisos del navegador
  - Integración con Service Worker
  - Comunicación con servidor de notificaciones

---

## 🚨 Problemas identificados

### 1. **Confusión de nombres**
- `useNotification` (singular) vs `useNotifications` (plural)
- Nombres similares para propósitos completamente diferentes
- No hay convención clara sobre cuándo usar cada uno

### 2. **Slices Redux duplicados**
- `notification/notificationSlice.js` (singular)
- `notifications/notificationsSlice.js` (plural)
- Estados separados que podrían causar conflictos

---

## 📋 Tareas de unificación

### 🎯 **FASE 1: Clarificación de nomenclatura**

#### 1.1 Renombrar hooks para claridad
- [ ] **1.1.1** Renombrar `useNotification` → `useToast` o `useInAppNotifications`
  - Archivo: `src/hooks/useNotification.js` → `src/hooks/useToast.js`
  - Actualizar todas las importaciones en:
    - `src/components/GadgetDetector.jsx`
    - `src/components/TeamSelector.jsx`
    - `src/components/notification.jsx`

- [ ] **1.1.2** Mantener `useNotifications` para notificaciones push
  - Archivo: `src/hooks/useNotifications.js` (mantener)
  - Es específico para push notifications, nombre correcto

#### 1.2 Renombrar slices Redux
- [ ] **1.2.1** Renombrar slice de toasts
  - `src/features/notification/notificationSlice.js` → `src/features/toast/toastSlice.js`
  - Actualizar store.js
  - Actualizar importaciones

- [ ] **1.2.2** Mantener slice de push notifications
  - `src/features/notifications/notificationsSlice.js` (mantener)

---

## 🎯 Prioridades de implementación

### **ALTA PRIORIDAD**
1. Fase 1 (Nomenclatura) - Evitar más confusión

---
