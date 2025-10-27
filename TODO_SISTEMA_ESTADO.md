# TODO: Sistema de Información de Estado - Escultura Eventos

## 📋 VISIÓN GENERAL

El Sistema de Información de Estado es una página especializada que permite al usuario ver información completa sobre el estado de la aplicación, sus conexiones, operaciones y funcionalidades principales. Está diseñado para diagnosticar problemas, verificar el funcionamiento correcto de todos los sistemas y realizar pruebas específicas.

---

## 🎯 FASE 1: INFRAESTRUCTURA BASE

### 1.1 Crear página y navegación
- [ ] **1.1.1** Crear componente `SystemStatusPage.jsx` en `/src/pages/`
- [ ] **1.1.2** Añadir ruta `/system-status` en `App.jsx`
- [ ] **1.1.3** Añadir botón en la página del evento para todos los tipos de usuario
- [ ] **1.1.4** Crear layout responsivo con secciones organizadas por categorías

### 1.2 Crear servicios de diagnóstico base
- [ ] **1.2.1** Crear `systemDiagnostics.js` en `/src/services/`
- [ ] **1.2.2** Implementar funciones básicas de detección del entorno:
  - Información del navegador (userAgent, versiones)
  - Información del dispositivo (móvil/desktop, características)
  - Información de la pantalla (resolución, orientación)
  - Información de la red (tipo de conexión, velocidad estimada)

### 1.3 Estructura de datos centralizada
- [ ] **1.3.1** Crear slice Redux `systemStatusSlice.js` para centralizar estado
- [ ] **1.3.2** Definir estructura de datos para todas las métricas:
  ```js
  {
    versions: { app: string, browser: string },
    session: { deviceId: string, eventId: string, teamId: string },
    connections: { internet: status, firebase: status, backend: status, pushServer: status },
    operations: { firebase: metrics, localStorage: metrics, pushServer: metrics, backend: metrics },
    receptionTests: { activity: status, gadget: status, chat: status, push: status },
    screenLockTests: { keepalive: status, geolocation: status, reception: status },
    offlineTests: { cache: status, uploadQueue: status },
    permissions: { camera: status, sensors: status, notifications: status },
    coherenceTests: { geolocation: status, internalState: status }
  }
  ```

---

## 🎯 FASE 2: INFORMACIÓN BÁSICA

### 2.1 Sección Versiones
- [ ] **2.1.1** Añadir variable `VITE_APP_VERSION` al `.env`
- [ ] **2.1.2** Mostrar versión de la APP desde variable de entorno
- [ ] **2.1.3** Detectar y mostrar versión del navegador (Chrome, Firefox, Safari, etc.)
- [ ] **2.1.4** Mostrar información adicional: OS, dispositivo, resolución de pantalla

### 2.2 Sección Sesión
- [ ] **2.2.1** Obtener ID del dispositivo desde `localStorage` o generar uno único
- [ ] **2.2.2** Mostrar ID del evento actual desde Redux store
- [ ] **2.2.3** Mostrar ID del equipo seleccionado desde Redux store
- [ ] **2.2.4** Añadir información de sesión: tiempo activo, modo admin/equipo

### 2.3 Componentes UI básicos
- [ ] **2.3.1** Crear componente `StatusCard` para mostrar métricas individuales
- [ ] **2.3.2** Crear indicadores de estado (🟢 OK, 🟡 Warning, 🔴 Error, ⚪ Unknown)
- [ ] **2.3.3** Implementar diseño responsivo con grid/flexbox
- [ ] **2.3.4** Añadir botón de refresh para actualizar toda la información

---

## 🎯 FASE 3: ESTADOS DE CONEXIÓN

### 3.1 Conexión a Internet
- [ ] **3.1.1** Usar `navigator.onLine` para estado básico
- [ ] **3.1.2** Implementar test de conectividad real (ping a servidor conocido)
- [ ] **3.1.3** Medir latencia y velocidad de conexión estimada
- [ ] **3.1.4** Detectar tipo de conexión (WiFi, 4G, etc.) con Network Information API

### 3.2 Conexión a Firebase
- [ ] **3.2.1** Usar funciones existentes de `firebase-diagnostics.js`
- [ ] **3.2.2** Extender diagnósticos existentes:
  - Estado de la conexión en tiempo real
  - Número de listeners activos
  - Última actividad exitosa
  - Errores recientes
- [ ] **3.2.3** Probar operaciones de lectura y escritura básicas

### 3.3 Conexión al Backend
- [ ] **3.3.1** Crear función de test para verificar conectividad con `VITE_API_BASE_URL`
- [ ] **3.3.2** Probar endpoint de health check del backend
- [ ] **3.3.3** Medir tiempo de respuesta de la API
- [ ] **3.3.4** Verificar autenticación y permisos

### 3.4 Conexión al Servidor de Push
- [ ] **3.4.1** Verificar conectividad con `VITE_NOTIFICATIONS_SERVER_URL`
- [ ] **3.4.2** Comprobar estado de suscripción push activa
- [ ] **3.4.3** Verificar claves VAPID y configuración
- [ ] **3.4.4** Test de envío/recepción de notificación de prueba

---

## 🎯 FASE 4: OPERACIONES DE ESCRITURA Y LECTURA

### 4.1 Operaciones en Firebase
- [ ] **4.1.1** Integrar con servicios existentes de Firebase:
  - Usar funciones de `firebase.js` para obtener métricas
  - Contar operaciones exitosas vs fallidas
  - Medir tiempos de respuesta promedio
- [ ] **4.1.2** Métricas específicas:
  - Lecturas de documentos (eventos, equipos, actividades)
  - Escrituras de posición y estado de equipos
  - Suscripciones en tiempo real activas
  - Operaciones de chat

### 4.2 Operaciones en localStorage
- [ ] **4.2.1** Verificar funcionamiento de localStorage:
  - Capacidad disponible vs utilizada
  - Prueba de escritura/lectura
  - Persistencia de Redux (redux-persist)
- [ ] **4.2.2** Métricas de uso:
  - Tamaño de datos almacenados por categoría
  - Antigüedad de datos en caché
  - Estado de la hidratación de Redux

### 4.3 Operaciones en servidor push
- [ ] **4.3.1** Integrar con `notificationService.js` existente:
  - Estado de registro del service worker
  - Estado de suscripción push
  - Última notificación recibida
- [ ] **4.3.2** Operaciones de test:
  - Envío de notificación de prueba
  - Verificación de recepción
  - Estado del servidor de notificaciones

### 4.4 Operaciones en el backend
- [ ] **4.4.1** Integrar con `uploadQueue.js` existente:
  - Estado de la cola de subidas
  - Número de archivos pendientes
  - Última subida exitosa
- [ ] **4.4.2** Test de operaciones:
  - Subida de archivo de prueba
  - Descarga de archivo existente
  - Llamadas a la API REST

---

## 🎯 FASE 5: PRUEBAS DE SISTEMAS DE RECEPCIÓN

### 5.1 Recibir una actividad
- [ ] **5.1.1** Simular actualización de actividad desde Firebase
- [ ] **5.1.2** Verificar que se recibe correctamente en Redux store
- [ ] **5.1.3** Comprobar actualización de UI y notificaciones
- [ ] **5.1.4** Test de proximidad automática (si está en modo debug)

### 5.2 Recibir un gadget
- [ ] **5.2.1** Usar funciones existentes de `firebase.js` para envío de gadget
- [ ] **5.2.2** Simular recepción de gadget desde otro equipo
- [ ] **5.2.3** Verificar animaciones y efectos visuales
- [ ] **5.2.4** Comprobar estado de cooldown y restricciones

### 5.3 Recibir un mensaje de chat
- [ ] **5.3.1** Simular envío de mensaje de chat
- [ ] **5.3.2** Verificar recepción en tiempo real
- [ ] **5.3.3** Comprobar notificaciones push (si están activadas)
- [ ] **5.3.4** Test de diferentes tipos de salas (grupo, admin, equipo)

### 5.4 Recibir un push
- [ ] **5.4.1** Integrar con sistema de notificaciones existente
- [ ] **5.4.2** Enviar notificación push de prueba
- [ ] **5.4.3** Verificar recepción y procesamiento
- [ ] **5.4.4** Test con aplicación en segundo plano

---

## 🎯 FASE 6: PRUEBAS DE BLOQUEO DE PANTALLA

### 6.1 Envío de keepalive
- [ ] **6.1.1** Integrar con `KeepaliveService` existente
- [ ] **6.1.2** Mostrar estado actual del servicio de keepalive
- [ ] **6.1.3** Métricas de heartbeat:
  - Último envío exitoso
  - Frecuencia actual
  - Errores de conectividad
- [ ] **6.1.4** Test con pantalla bloqueada simulada

### 6.2 Envío de geolocalización
- [ ] **6.2.1** Usar componente `EventMap` existente para métricas GPS
- [ ] **6.2.2** Mostrar estado de permisos de geolocalización
- [ ] **6.2.3** Métricas de GPS:
  - Última posición obtenida
  - Precisión actual
  - Frecuencia de updates
- [ ] **6.2.4** Test de funcionamiento con pantalla bloqueada

### 6.3 Sistemas de recepción con bloqueo de pantalla
- [ ] **6.3.1** Test de recepción de Firebase con pantalla bloqueada
- [ ] **6.3.2** Test de notificaciones push en background
- [ ] **6.3.3** Verificar funcionamiento del service worker
- [ ] **6.3.4** Comprobar wake locks y mantenimiento de conexiones

---

## 🎯 FASE 7: PRUEBAS SIN CONEXIÓN

### 7.1 Carga de cache
- [ ] **7.1.1** Integrar con `assetCache.js` existente
- [ ] **7.1.2** Mostrar estado del cache del service worker:
  - Recursos cacheados
  - Tamaño del cache
  - Última actualización
- [ ] **7.1.3** Test de funcionamiento offline:
  - Cargar página sin conexión
  - Verificar disponibilidad de assets
  - Test de funcionalidad básica

### 7.2 Cola de envíos
- [ ] **7.2.1** Integrar con `uploadQueue.js` existente
- [ ] **7.2.2** Mostrar estado de la cola IndexedDB:
  - Número de elementos pendientes
  - Tamaño total de archivos
  - Último procesamiento exitoso
- [ ] **7.2.3** Test de funcionamiento offline:
  - Encolar archivo sin conexión
  - Verificar persistencia en IndexedDB
  - Test de reintento automático al reconectar

---

## 🎯 FASE 8: PRUEBAS DE PERMISOS Y DISPONIBILIDAD

### 8.1 Permisos de cámara
- [ ] **8.1.1** Verificar estado de permisos de cámara
- [ ] **8.1.2** Test de acceso a MediaDevices
- [ ] **8.1.3** Detectar cámaras disponibles (frontal/trasera)
- [ ] **8.1.4** Test de captura de foto básica

### 8.2 Permisos de acelerómetro y brújula
- [ ] **8.2.1** Integrar con funciones de orientación de `EventMap`
- [ ] **8.2.2** Verificar permisos de DeviceOrientationEvent
- [ ] **8.2.3** Test de lectura de acelerómetro
- [ ] **8.2.4** Test de brújula y orientación del dispositivo

### 8.3 Permisos de recepción de notificaciones
- [ ] **8.3.1** Integrar con `notificationService.js` existente
- [ ] **8.3.2** Verificar estado de permisos de notificaciones
- [ ] **8.3.3** Test de registro de service worker
- [ ] **8.3.4** Test de suscripción push

---

## 🎯 FASE 9: PRUEBAS DE COHERENCIA

### 9.1 Lectura de la geoposición coherente
- [ ] **9.1.1** Integrar con sistema GPS de `EventMap`
- [ ] **9.1.2** Verificar coherencia de datos de posición:
  - Comparar GPS vs posición almacenada
  - Verificar precisión reportada vs real
  - Detectar saltos o inconsistencias
- [ ] **9.1.3** Test de filtros de Kalman
- [ ] **9.1.4** Validación de dirección (compass vs GPS vs movimiento)

### 9.2 Comprobación de estado interno
- [ ] **9.2.1** Verificar coherencia del store Redux:
  - Comparar estado local vs Firebase
  - Detectar inconsistencias de datos
  - Verificar sincronización de equipos
- [ ] **9.2.2** Test de integridad de datos:
  - Validar estructura de eventos
  - Verificar relaciones entre entidades
  - Comprobar timestamps y secuencias
- [ ] **9.2.3** Diagnóstico de memoria y rendimiento:
  - Uso de memoria del navegador
  - Número de listeners activos
  - Performance de renderizado

---

## 🎯 FASE 10: INTERFAZ Y EXPERIENCIA DE USUARIO

### 10.1 Diseño y layout
- [ ] **10.1.1** Crear diseño responsivo con CSS Grid/Flexbox
- [ ] **10.1.2** Implementar tema consistente con la aplicación
- [ ] **10.1.3** Añadir iconos y indicadores visuales claros
- [ ] **10.1.4** Optimizar para móviles y tablets

### 10.2 Interactividad y controles
- [ ] **10.2.1** Botones de test individuales para cada sistema
- [ ] **10.2.2** Botón de "Test Completo" que ejecuta todas las pruebas
- [ ] **10.2.3** Controles para forzar refresco de métricas


### 10.3 Notificaciones y feedback
- [ ] **10.3.1** Alertas automáticas para problemas críticos
- [ ] **10.3.2** Confirmaciones visuales para tests exitosos

---

## 🎯 FASE 11: OPTIMIZACIÓN Y RENDIMIENTO

### 11.1 Rendimiento de la página
- [ ] **11.1.1** Lazy loading de componentes pesados
- [ ] **11.1.2** Memoización de cálculos costosos
- [ ] **11.1.3** Debounce de actualizaciones frecuentes
- [ ] **11.1.4** Optimización de renders innecesarios

### 11.2 Gestión de recursos
- [ ] **11.2.1** Limpiar listeners y timers al salir de la página
- [ ] **11.2.2** Gestión eficiente de memoria para tests
- [ ] **11.2.3** Cache inteligente de resultados de diagnósticos
- [ ] **11.2.4** Compresión de datos de métricas

---

## 🛠️ CONSIDERACIONES TÉCNICAS

### Integración con sistemas existentes
- **Firebase**: Usar funciones existentes de `firebase.js` y `firebase-diagnostics.js`
- **Notificaciones**: Integrar con `notificationService.js` y servidor de push
- **Geolocalización**: Reutilizar lógica de `EventMap.jsx` y hooks de proximidad
- **Upload**: Usar `uploadQueue.js` para tests de subida
- **Cache**: Integrar con `assetCache.js` y service worker

### Estructura de archivos
```
src/
├── pages/
│   └── SystemStatusPage.jsx
├── components/
│   ├── systemStatus/
│   │   ├── StatusCard.jsx
│   │   ├── ConnectionTests.jsx
│   │   ├── OperationTests.jsx
│   │   ├── PermissionTests.jsx
│   │   └── CoherenceTests.jsx
├── services/
│   ├── systemDiagnostics.js
│   └── statusTestSuite.js
└── features/
    └── systemStatus/
        └── systemStatusSlice.js
```

### Variables de entorno necesarias
```env
# Nueva variable para versión de la app
VITE_APP_VERSION=1.0.0

# Variables existentes utilizadas
VITE_API_BASE_URL
VITE_NOTIFICATIONS_SERVER_URL
VITE_VAPID_PUBLIC_KEY
VITE_FIREBASE_*
VITE_GOOGLE_MAPS_API_KEY
```

---

## 📋 CRITERIOS DE ÉXITO

### Funcionalidad básica
- ✅ Todas las métricas se muestran correctamente
- ✅ Los tests individuales funcionan sin errores
- ✅ La página es accesible solo para administradores
- ✅ El rendimiento no afecta al resto de la aplicación

### Diagnósticos efectivos
- ✅ Detecta problemas reales de conectividad
- ✅ Identifica inconsistencias en los datos
- ✅ Verifica el funcionamiento de todos los sistemas críticos
- ✅ Proporciona información útil para debugging

### Experiencia de usuario
- ✅ Interfaz clara y fácil de entender
- ✅ Feedback inmediato en tests y operaciones
- ✅ Funcionamiento responsive en todos los dispositivos
- ✅ Integración seamless con el resto de la aplicación

---

## 🚀 NOTAS DE IMPLEMENTACIÓN

### Prioridades de desarrollo
1. **Fase 1-2**: Infraestructura y información básica (crítico)
2. **Fase 3-4**: Estados de conexión y operaciones (alto)
3. **Fase 5-6**: Pruebas de recepción y bloqueo (medio)
4. **Fase 7-9**: Pruebas offline y coherencia (medio)
5. **Fase 10-11**: UX y optimización (bajo)

### Dependencias críticas
- Mantener compatibilidad con sistemas existentes
- No interferir con operaciones normales de la aplicación
- Usar APIs existentes sin duplicar funcionalidad
- Asegurar que los tests no generen side effects

### Consideraciones de seguridad
- Solo accesible para usuarios administradores
- No exponer información sensible en logs
- Validar permisos antes de ejecutar tests
- No permitir modificación de datos reales durante tests
