# TODO: Sistema de Notificaciones Push

## Arquitectura General
Implementar un sistema **100% propio** de notificaciones push que incluya:
- Servidor backend Node.js/Express liviano con almacenamiento en memoria (Map)
- **Integración COMPLEMENTARIA** con el flujo de chat existente (chatsSlice.js)
- Cliente web que gestione suscripciones y recepción de notificaciones
- Envío automático de notificaciones cuando se envían mensajes por chat

**Enfoque simplificado**: **MANTENER Firebase intacto** + agregar notificaciones push propias como capa adicional.

---

## 🚀 BACKEND - Servidor de Notificaciones (LIVIANO)

### 1. Crear estructura del servidor de notificaciones
- [ ] **1.1** Crear directorio `notification-server/` en la raíz del proyecto
- [ ] **1.2** Inicializar `package.json` con dependencias **mínimas**:
  - `express` para el servidor web
  - `web-push` para gestionar notificaciones push
  - `dotenv` para variables de entorno
  - `cors` para peticiones cross-origin
  - Solo esas 4 dependencias (ultra liviano)
- [ ] **1.3** Crear estructura de directorios simplificada:
  ```
  notification-server/
  ├── src/
  │   ├── controllers/
  │   ├── services/
  │   └── utils/
  ├── config/
  ├── package.json
  └── server.js
  ```

### 2. Implementar servidor de notificaciones base
- [ ] **2.1** Crear `notification-server/server.js`:
  - Configurar Express con middleware básico (CORS, express.json())
  - Configurar puerto desde variable de entorno (default 3089)
  - Importar y usar rutas principales
  - Manejo global de errores
  - Inicializar Maps en memoria para almacenamiento

- [ ] **2.2** Crear `notification-server/config/vapid.js`:
  - Generar claves VAPID para web-push
  - Configurar web-push con claves y email de contacto
  - Exportar configuración

### 3. Implementar gestión de suscripciones (ALMACENAMIENTO EN MEMORIA)
- [ ] **3.1** Crear `notification-server/src/services/subscriptionService.js`:
  - **Map en memoria**: `subscriptions = new Map()` (key: userId-eventId, value: subscription data)
  - **Map para eventos**: `eventSubscriptions = new Map()` (key: eventId, value: Set of userIds)
  - **Map para chat activo**: `activeChatUsers = new Map()` (key: userId, value: chatId actual)
  - Función para validar suscripción (endpoint, keys)
  - Función para guardar suscripción en memoria
  - Función para eliminar suscripción
  - Función para obtener suscripciones por usuario/evento
  - Auto-cleanup de suscripciones inactivas (timeout de 24h)
  - Backup opcional a archivo JSON cada hora (para no perder todo al reiniciar)

- [ ] **3.2** Crear `notification-server/src/controllers/subscriptionController.js`:
  - `POST /api/subscribe`: Guardar nueva suscripción en Map
  - `DELETE /api/unsubscribe`: Eliminar suscripción del Map
  - `GET /api/subscription/status`: Verificar estado de suscripción
  - `POST /api/user-active-chat`: Marcar usuario como activo en chat específico
  - Validación de datos de entrada y manejo de errores

### 4. Implementar servicio de envío de notificaciones
- [ ] **4.1** Crear `notification-server/src/services/notificationService.js`:
  - Función para enviar notificación a una suscripción específica
  - Función para enviar notificación a múltiples suscripciones del mismo evento
  - Función para formatear payload de notificación
  - Manejo de errores de envío (410 = suscripción expirada, eliminar del Map)
  - Sistema de reintentos para fallos temporales (3 intentos máximo)
  - **Filtro**: No enviar notificación a usuarios activos en el chat actual

- [ ] **4.2** Crear `notification-server/src/controllers/notificationController.js`:
  - `POST /api/send-chat-message`: **Endpoint principal** para mensajes de chat
  - Recibir: eventId, chatId, senderId, senderType, message, chatName
  - Obtener destinatarios del Map en memoria (todos del evento menos el remitente)
  - Filtrar usuarios activos en ese chat específico
  - Enviar notificaciones push a los destinatarios restantes

### 5. **INTEGRACIÓN COMPLEMENTARIA** con React App (MANTENIENDO FIREBASE)
- [ ] **5.1** **MANTENER** toda la funcionalidad de Firebase existente intacta
- [ ] **5.2** La integración será **ADICIONAL** desde `chatsSlice.js` hacia el servidor de notificaciones
- [ ] **5.3** El servidor solo gestionará las notificaciones push (no reemplaza Firebase)
- [ ] **5.4** Flujo: React envía mensaje → Firebase (como siempre) → **ADEMÁS** React llama API notificaciones → Servidor envía push
- [ ] **5.5** Firebase sigue siendo la única fuente de verdad para mensajes y datos

### 6. Utilidades y configuración
- [ ] **6.1** Crear `notification-server/src/utils/logger.js`:
  - Sistema de logging simple (console con timestamps)
  - Diferentes niveles de log (info, warning, error)

- [ ] **6.2** Crear `notification-server/src/utils/cleanup.js`:
  - Función para limpiar suscripciones expiradas (ejecutar cada hora)
  - Función para guardar backup a JSON (opcional)
  - Función para cargar backup desde JSON al iniciar

### 7. Configuración y variables de entorno
- [ ] **7.1** Crear `notification-server/.env.example`:
  ```env
  PORT=3089
  VAPID_PUBLIC_KEY=
  VAPID_PRIVATE_KEY=
  VAPID_EMAIL=admin@escultura.dev2bit.com
  NODE_ENV=development
  CORS_ORIGIN=http://localhost:5173
  BACKUP_ENABLED=true
  BACKUP_INTERVAL_HOURS=1
  CLEANUP_INTERVAL_HOURS=24
  ```

- [ ] **7.2** Actualizar `.gitignore` para excluir:
  - `notification-server/.env`
  - `notification-server/backup.json`
  - `notification-server/logs/`

---

## 🐳 DOCKER & DEPLOY - Integración con infraestructura

### 8. Crear Dockerfile para servidor de notificaciones
- [ ] **8.1** Crear `deploy/Dockerfile.notifications`:
  - Base image Node.js 18-alpine (imagen liviana)
  - Copiar solo `notification-server/` 
  - Instalar dependencias (solo 4 dependencias)
  - Configurar usuario no-root
  - Exponer puerto 3089
  - Comando de inicio: `node server.js`
  - Configurar el nginx actual para que haga un proxy a este servicio y se usen el mismo cert SSL

### 9. Actualizar Docker Compose
- [ ] **9.1** Modificar `deploy/docker-compose.yml`:
  - Agregar servicio `notification-server`
  - Configurar puerto 3089:3089
  - Compartir red `escultura-network`
  - Variables de entorno desde `.env`
  - **NO depende de Firebase** - solo del signaling-server

- [ ] **9.2** Modificar `deploy/docker-compose.prod.yml`:
  - Agregar servicio `notification-server` para producción
  - Configurar restart policy: `unless-stopped`
  - Variables de entorno de producción

### 10. Actualizar scripts de deploy
- [ ] **10.1** Modificar `deploy/deploy-remote.sh`:
  - Incluir directorio `notification-server/` en la sincronización con rsync
  - Agregar paso de build para el nuevo servicio
  - Verificar que el servicio esté corriendo después del deploy (health check)

### 11. Scripts de gestión
- [ ] **11.1** Crear `notification-server/scripts/generate-vapid.js`:
  - Script standalone para generar claves VAPID nuevas
  - Instrucciones de uso en comentarios
  - Solo usar web-push library

- [ ] **11.2** Crear `notification-server/scripts/test-notification.js`:
  - Script para probar envío de notificaciones de desarrollo
  - Mock de suscripción de prueba
  - Útil para debugging local

- Tener en cuenta que la aplicación React actual se encuentra dentro de src. Crea un nuevo directorio notification-server para el servidor PUSH, pero trabaja sobre ./ y ./src para la aplicación cliente

---

## 📱 FRONTEND - Cliente de notificaciones

### 12. Service Worker para notificaciones
- [ ] **12.1** Extender `public/sw.js` existente:
  - Agregar event listener para `push` events
  - Agregar event listener para `notificationclick` events
  - Función para mostrar notificación con datos recibidos
  - Función para manejar clicks en notificaciones (abrir app/chat específico)

- [ ] **12.2** Configurar opciones de notificación:
  - Iconos personalizados por tipo de notificación
  - Sonidos diferentes para chat/otros
  - Vibration patterns específicos
  - Actions disponibles (responder, marcar como leído)

### 13. Servicio de notificaciones en React
- [ ] **13.1** Crear `src/services/notificationService.js`:
  - Función para verificar soporte de notificaciones
  - Función para solicitar permisos de notificación
  - Función para registrar service worker
  - Función para suscribirse a notificaciones push
  - Función para desuscribirse
  - Función para obtener estado actual de suscripción

- [ ] **13.2** Crear `src/services/pushManager.js`:
  - Wrapper para Push API del navegador
  - Gestión del ciclo de vida de suscripciones
  - Manejo de errores específicos de notificaciones
  - Interfaz simplificada para el resto de la aplicación

### 14. Hook personalizado para notificaciones
- [ ] **14.1** Crear `src/hooks/useNotifications.js`:
  - Hook que encapsula toda la lógica de notificaciones
  - Estados: isSupported, permission, isSubscribed, isLoading
  - Funciones: requestPermission, subscribe, unsubscribe
  - Efectos para inicialización automática
  - Integración con Redux store

### 15. Componentes de interfaz
- [ ] **15.1** Crear `src/components/notifications/NotificationPermissionBanner.jsx`:
  - Banner que aparece cuando no hay permisos
  - Botón para solicitar permisos
  - Explicación clara de por qué se necesitan notificaciones
  - Animación suave y diseño responsive

- [ ] **15.2** Crear `src/components/notifications/NotificationSettings.jsx`:
  - Componente para configurar preferencias de notificación
  - Toggle para activar/desactivar notificaciones
  - Opciones por tipo de notificación (chat, eventos, etc.)
  - Estado visual del service worker

- [ ] **15.3** Crear `src/components/notifications/NotificationTest.jsx`:
  - Componente para testing (solo en desarrollo)
  - Botón para enviar notificación de prueba
  - Selector de tipo de notificación
  - Visualización del estado de suscripción

### 16. Integración con Redux Store
- [ ] **16.1** Crear `src/features/notifications/notificationsSlice.js`:
  - Estado: permission, isSubscribed, subscription, settings
  - Actions: setPermission, setSubscription, updateSettings
  - Thunks: initializeNotifications, subscribeToNotifications, unsubscribeFromNotifications
  - Persistence del estado en localStorage

- [ ] **16.2** Integrar con store principal:
  - Agregar notificationsSlice al store en `src/store.js`
  - Configurar persistence para configuración de usuario

### 17. Configuración e inicialización
- [ ] **17.1** Crear `src/constants/notifications.js`:
  - Constantes para tipos de notificación
  - Configuración de iconos y sonidos
  - URLs del servidor de notificaciones
  - Configuración de VAPID public key

- [ ] **17.2** Modificar `src/main.jsx`:
  - Inicializar notificaciones al cargar la app
  - Registrar service worker si no está registrado
  - Configurar interceptores para manejo de errores

---

## 🔗 INTEGRACIÓN CON CHAT EXISTENTE

### 18. **AÑADIR** notificaciones push al flujo de chat existente
- [ ] **18.1** Modificar `src/features/chats/chatsSlice.js` en el thunk `sendMessage`:
  - **DESPUÉS** de `await sendMessageToFirebase()` (línea ~25) 
  - **SIN MODIFICAR** la lógica existente de Firebase
  - **AGREGAR** llamada HTTP POST al servidor de notificaciones
  - Endpoint: `POST /api/send-chat-message`
  - Payload: `{ eventId, chatId, senderId, senderType, message, chatName, senderName }`
  - **IMPORTANTE**: usar `try/catch` para que si falla no afecte el chat
  - **Firebase sigue siendo la fuente de verdad**, esto es solo para notificaciones

- [ ] **18.2** Crear `src/services/chatNotifications.js`:
  - Función `sendChatNotification(eventId, chatId, message, sender)`
  - Obtener URL del servidor desde variables de entorno
  - Usar fetch() con timeout de 5 segundos
  - Formatear datos para el endpoint de notificaciones
  - Manejo de errores silencioso (solo console.warn si falla)
  - **NO interfiere con Firebase en absoluto**

### 19. Formateo de notificaciones de chat
- [ ] **19.1** En el servidor de notificaciones, definir estructura:
  ```javascript
  // En notificationService.js
  const formatChatNotification = (chatName, senderName, message) => ({
    title: `${chatName}`,
    body: `${senderName}: ${message.substring(0, 80)}${message.length > 80 ? '...' : ''}`,
    icon: "/icons/chat-notification.png",
    badge: "/icons/badge.png", 
    tag: `chat-${chatId}`, // Para reemplazar notificaciones del mismo chat
    data: {
      type: "chat",
      chatId,
      eventId,
      timestamp: Date.now(),
      url: `/event/${eventId}/chat/${chatId}` // URL para abrir al hacer click
    },
    actions: [
      { action: "open", title: "Ver Chat", icon: "/icons/open.png" }
    ],
    requireInteraction: false, // Se cierra automáticamente
    silent: false // Con sonido
  })
  ```

### 20. Gestión de usuarios activos en chat
- [ ] **20.1** Modificar `src/pages/chatRoomPage.jsx`:
  - En `useEffect` cuando se monta el componente (línea ~45)
  - Enviar `POST /api/user-active-chat` con `{ userId, eventId, chatId }`
  - En cleanup del `useEffect`, enviar `POST /api/user-active-chat` con `{ userId, eventId, chatId: null }`
  - Esto evita spam de notificaciones a usuarios que están viendo el chat

- [ ] **20.2** Crear endpoint en servidor de notificaciones:
  - `POST /api/user-active-chat`: actualizar `activeChatUsers.set(userId, chatId)`
  - Si `chatId` es `null`, eliminar del Map: `activeChatUsers.delete(userId)`
  - Usar esto en `notificationService.js` para filtrar destinatarios

### 21. **ELIMINAR** secciones complejas - simplificar
- [ ] **21.1** **NO IMPLEMENTAR** agrupación compleja de notificaciones
- [ ] **21.2** **NO IMPLEMENTAR** persistencia en IndexedDB (innecesario para uso temporal)
- [ ] **21.3** Mantener simple: 1 mensaje = 1 notificación (máximo)

---

## 🔧 CONFIGURACIÓN Y OPTIMIZACIÓN

### 22. Variables de entorno y configuración
- [ ] **22.1** Agregar a `.env` principal del proyecto React:
  ```env
  # Notificaciones Push
  VITE_NOTIFICATIONS_SERVER_URL=http://localhost:3089
  VITE_VAPID_PUBLIC_KEY=
  VITE_ENABLE_NOTIFICATIONS=true
  ```

- [ ] **22.2** Configuración por entorno:
  - Desarrollo: `http://localhost:3089`
  - Producción: `https://escultura.dev2bit.com:3089` (o proxy nginx)

### 23. Manejo de errores y fallbacks
- [ ] **23.1** Crear `src/utils/notificationErrors.js`:
  - Mapeo de códigos de error específicos de Push API
  - Mensajes de error amigables para usuarios
  - Fallback: si no hay soporte de notificaciones, la app funciona normal

- [ ] **23.2** Logging simple:
  - Console.warn para errores de notificación (no bloquear chat)
  - Console.info para suscripciones exitosas

### 24. Performance y optimización
- [ ] **24.1** Optimización del service worker:
  - Solo cargar módulo de notificaciones cuando sea necesario
  - Respuesta rápida a push events (< 100ms)

- [ ] **24.2** Optimización del cliente:
  - Lazy loading del módulo de notificaciones
  - Timeout de 5s para llamadas al servidor de notificaciones

### 25. Compatibilidad simplificada
- [ ] **25.1** Detectar capacidades básicas:
  - `if ('serviceWorker' in navigator && 'PushManager' in window)`
  - Si no hay soporte: mostrar mensaje informativo opcional
  - **La app funciona igual** sin notificaciones

---

## 📋 TAREAS DE INTEGRACIÓN FINAL

### 26. Configuración de producción
- [ ] **26.1** Configurar HTTPS para notificaciones:
  - Las notificaciones push **requieren HTTPS** en producción
  - Usar certificados SSL existentes del proyecto

### 27. Verificación e integración
- [ ] **27.1** Test end-to-end básico:
  - Verificar que todo el código es correcto.
  - No implementar test ni escribir documentación

- [ ] **27.2** Cleanup final:
  - Eliminar console.log de desarrollo
  - Verificar que no hay memory leaks en Maps

### 28. Despliegue
- [ ] **28.1** Deploy inicial:
  - Generar claves VAPID para producción con el script
  - Configurar variables de entorno en `.env`
  - Deploy del servidor de notificaciones junto con el resto

- [ ] **28.2** Verificación post-deploy:
  - Verificar que el servicio de notificaciones responde
  - Test de notificación básica en producción

---

## 📝 NOTAS TÉCNICAS

### **Estructura de datos en memoria (Maps):**
```javascript
// En notification-server/src/services/subscriptionService.js

// Suscripciones: key = "userId-eventId", value = subscription object
const subscriptions = new Map();
// Ejemplo: subscriptions.set("123-456", { endpoint: "...", keys: {...}, userAgent: "..." })

// Usuarios por evento: key = eventId, value = Set of userIds
const eventSubscriptions = new Map(); 
// Ejemplo: eventSubscriptions.set("456", new Set(["123", "124", "125"]))

// Usuarios activos en chat: key = userId, value = chatId actual
const activeChatUsers = new Map();
// Ejemplo: activeChatUsers.set("123", "group") // Usuario 123 está viendo chat "group"
```

### **Flujo de integración con chat existente (SIN TOCAR FIREBASE):**
1. Usuario envía mensaje desde `chatRoomPage.jsx`
2. `chatsSlice.js` → `sendMessage` thunk ejecuta
3. Mensaje se guarda en Firebase (como ya funciona) ✅
4. **NUEVO Y ADICIONAL**: `chatsSlice.js` llama a `src/services/chatNotifications.js`
5. **NUEVO**: Se envía POST a `http://localhost:3089/api/send-chat-message`
6. **NUEVO**: Servidor de notificaciones obtiene suscripciones del Map
7. **NUEVO**: Filtra usuarios activos en ese chat
8. **NUEVO**: Envía notificaciones push a destinatarios
9. **Firebase sigue funcionando exactamente igual** ✅

### Consideraciones de rendimiento:
- **Map access**: O(1) - ultra rápido para buscar suscripciones
- **Memory usage**: ~1KB por suscripción (muy eficiente)
- **Cleanup automático**: suscripciones inactivas se eliminan cada 24h
- **Backup opcional**: salvar a JSON cada hora (para no perder todo al reiniciar)

### Consideraciones de UX:
- **No bloquear chat**: si servidor de notificaciones falla, el chat sigue funcionando
- **Progressive enhancement**: app funciona igual sin notificaciones
- **Smart filtering**: no spam a usuarios viendo el chat actualmente

### Compatibilidad mínima:
- **Chrome 50+, Firefox 44+, Safari 16.4+**
- **Requiere HTTPS en producción** (obligatorio para Push API)
- **Fallback graceful**: sin soporte = sin notificaciones, pero app funciona

### **Dependencias ultra-mínimas del servidor:**
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "web-push": "^3.6.6", 
    "cors": "^2.8.5",
    "dotenv": "^16.3.1"
  }
}
```
**Solo 4 dependencias** = máxima velocidad y mínimo mantenimiento.
