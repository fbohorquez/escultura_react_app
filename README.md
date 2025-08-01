# Escultura Eventos - Estado Actual del Proyecto

## 1. Descripción General del Proyecto

### Propósito
Escultura es una aplicación web React que permite gestionar y participar en eventos interactivos tipo yinkana/gymkhana. Los equipos utilizan dispositivos móviles para:
- Seleccionar eventos y equipos
- Capturar fotos de equipo
- Navegar por mapas interactivos durante el evento
- Participar en actividades georreferenciadas en tiempo real
- **🆕 Compartir pantalla del equipo en tiempo real mediante WebRTC**

### Arquitectura del Sistema
**Tipo de aplicación**: Single Page Application (SPA)  
**Patrón arquitectónico**: Redux + Firebase + Google Maps API + WebRTC  
**Renderizado**: Client-side rendering con Vite  
**Estado global**: Redux Toolkit con persistencia  
**Sincronización**: Firebase Firestore en tiempo real  
**Navegación**: React Router con Memory Router  
**Streaming**: WebRTC para compartir pantalla en tiempo real  

### Tecnologías Implementadas

#### Frontend Core
- **React 19.0.0** - Framework principal de interfaz
- **Vite 6.3.1** - Build tool y servidor de desarrollo
- **React Router DOM 7.5.3** - Enrutamiento con MemoryRouter
- **Redux Toolkit 2.7.0** - Gestión de estado global
- **React Redux 9.2.0** - Integración React-Redux
- **Redux Persist 6.0.0** - Persistencia de estado

#### Servicios Externos
- **Firebase 11.6.1** - Base de datos en tiempo real y autenticación
- **Google Maps API** (via @react-google-maps/api 2.20.6) - Mapas interactivos
- **React i18next 15.5.1** - Internacionalización (ES/EN)
- **🆕 WebRTC** - Protocolo para streaming de video/audio en tiempo real
- **🆕 WebSocket** - Servidor de señalización para coordinar conexiones WebRTC

#### Desarrollo y Calidad
- **ESLint 9.22.0** - Linting con configuración moderna
- **TypeScript types** - Tipado para React y React DOM
- **PropTypes 15.8.1** - Validación de props en runtime

---

## 2. Arquitectura Completa del Sistema de Ficheros

### 📁 Configuración del Proyecto
```
├── package.json              # Dependencias y scripts del proyecto
├── package-lock.json         # Lockfile de dependencias
├── vite.config.js            # Configuración de Vite build tool
├── eslint.config.js          # Configuración de linting
├── index.html                # Template HTML principal
├── 🆕 servidor-signaling.js  # Servidor WebRTC para compartir equipos
├── 🆕 start-signaling-server.sh # Script para iniciar servidor WebRTC
└── 🆕 signaling-package.json.example # Package.json para servidor WebRTC
```

### 📁 Assets Públicos (/public)
```
public/
├── site.webmanifest          # Manifiesto de PWA
├── sw.js                     # Service Worker para cache offline
├── fonts/                    # Tipografías Optima (4 variantes)
│   ├── OPTIMA.TTF
│   ├── OPTIMA_B.TTF
│   ├── Optima Medium.ttf
│   └── Optima_Italic.ttf
└── icons/                    # Iconos de aplicación PWA
    ├── favicon.ico
    ├── favicon.svg
    ├── apple-touch-icon.png
    ├── favicon-96x96.png
    ├── web-app-manifest-192x192.png
    └── web-app-manifest-512x512.png
```

### 📁 Assets de Aplicación (/src/assets)
```
src/assets/
├── assets.js                 # Índice de assets exportados
├── escultura_brand.png       # Logo principal de la marca
├── react.svg                 # Logo de React (template)
│
├── 1x/ & 2x/                 # Assets en resoluciones estándar y Retina
├── AppIcons/                 # Iconos para stores (iOS/Android)
│   ├── appstore.png
│   └── playstore.png
│
├── Iconos de Estado/         # Indicadores visuales
│   ├── GOOD.png, BAD.png     # Estados de éxito/fallo
│   ├── green.png, red.png    # Indicadores de color
│
├── Iconos de Funcionalidad/  # UI específica de características
│   ├── icon_admin.png        # Modo administrador
│   ├── icon_chat.png         # Sistema de chat
│   ├── icon_asignar.png      # Asignación de equipos
│   ├── icon_suspender.png    # Suspender participantes
│   ├── icon_resultados.png   # Pantalla de resultados
│   ├── icon_date.png         # Indicador de fecha
│   ├── Boton Cámara.png      # Captura de fotos
│
├── Iconos de Actividades/    # Tipos de pruebas del evento
│   ├── icon_puzzle.png       # Pruebas tipo puzzle
│   ├── icon_memory.png       # Pruebas de memoria
│   ├── icon_foto.png         # Pruebas fotográficas
│   ├── icon_crusades.png     # Pruebas de cruzadas
│   ├── icon_robot.png        # Pruebas automáticas
│   ├── icon_track.png        # Pruebas de seguimiento
│   ├── icon_query.png        # Pruebas de preguntas
│
├── Elementos de Juego/       # Assets específicos del gameplay
│   ├── map1.png              # Fondos de mapa
│   ├── mark-me.png           # Marcador de posición
│   ├── card.png              # Elementos de carta
│   ├── Reverso carta.png     # Reverso de cartas
│   ├── form_point.png        # Puntos de formulario
│
└── UI Diversos/              # Elementos de interfaz variados
    ├── img_launchscreen.png  # Pantalla de carga
    ├── img_chat.png          # Interfaz de chat
    ├── close.png             # Botón de cerrar
    ├── glass-background-png-7.png # Efectos de vidrio
```

### 📁 Componentes (/src/components)
```
src/components/
├── backButton.jsx            # Botón de navegación hacia atrás
├── backgroundLayout.jsx      # Layout base con fondo y estructura
├── eventHeader.jsx           # Header colapsable con info del evento
├── eventMap.jsx              # Componente del mapa interactivo con Google Maps
├── routeListener.jsx         # Listener para persistencia de rutas de navegación
├── subscriptionManager.jsx   # Gestor de suscripciones Firebase en tiempo real
├── cacheEventAssets.jsx      # Pre-carga y cache de assets del evento
├── popup.jsx                 # Sistema de popups modales con cola de gestión
├── notification.jsx          # Componente individual de notificación
├── notificationContainer.jsx # Contenedor principal del sistema de notificaciones
```

### 📁 Gestión de Estado (/src/features)
```
src/features/
├── events/
│   └── eventsSlice.js        # Estado: lista de eventos disponibles
├── event/
│   └── eventSlice.js         # Estado: evento actual e inicialización completa
├── teams/
│   └── teamsSlice.js         # Estado: equipos del evento y actualizaciones
├── session/
│   └── sessionSlice.js       # Estado: sesión usuario (admin/equipo, foto, token)
├── activities/
│   └── activitiesSlice.js    # Estado: actividades/pruebas disponibles
├── admin/
│   └── adminSlice.js         # Estado: configuración y datos de administrador
├── popup/
│   └── popupSlice.js         # Estado: gestión de popups y cola de visualización
└── notification/
    └── notificationSlice.js  # Estado: gestión de notificaciones múltiples
```

### 📁 Páginas (/src/pages)
```
src/pages/
├── welcomePage.jsx           # Pantalla inicial con carga de eventos
├── eventsPage.jsx            # Lista y selección de eventos disponibles
├── teamsPage.jsx             # Selección de equipos y modo administrador
├── teamPage.jsx              # Configuración equipo y captura de foto
└── eventPage.jsx             # Pantalla principal durante el evento (mapa)
```

### 📁 Servicios (/src/services)
```
src/services/
├── api.js                    # Cliente HTTP para API REST externa (Laravel backend)
├── firebase.js               # Servicio Firebase con middleware Redux y tiempo real
├── assetCache.js             # Sistema cache inteligente con Service Worker
└── uploadQueue.js            # Cola resiliente de subida con soporte offline
```

### 📁 Configuración de Aplicación (/src)
```
src/
├── main.jsx                  # Punto de entrada con Provider y Router
├── App.jsx                   # Componente raíz con definición de rutas
├── store.js                  # Configuración Redux con persistencia y middleware
└── hooks/                    # Hooks personalizados
    ├── usePopup.js           # Hook para gestión simplificada de popups
    └── useNotification.js    # Hook para gestión simplificada de notificaciones
```

### 📁 Internacionalización (/src/i18n)
```
src/i18n/
├── index.js                  # Configuración i18next
├── es.json                   # Traducciones en español (idioma principal)
└── en.json                   # Traducciones en inglés
```

### 📁 Estilos (/src/styles)
```
src/styles/
├── global.css                # Estilos globales y variables CSS
├── fonts.css                 # Carga de tipografías Optima
├── reset.css                 # Reset/normalización CSS
└── medias.css                # Media queries y responsive design
```

---

## 3. Funcionalidades Implementadas

### ✅ Flujo Principal de Usuario

#### 3.1 Página de Bienvenida
**Archivo**: `src/pages/welcomePage.jsx`  
**Funcionalidad**: Punto de entrada de la aplicación
- Carga inicial de eventos desde API Laravel
- Logo de marca y mensajes de bienvenida internacionalizados
- Estado de carga durante fetch de eventos
- Navegación automática a lista de eventos

#### 3.2 Selección de Eventos
**Archivo**: `src/pages/eventsPage.jsx`  
**Funcionalidad**: Lista y selección de eventos disponibles
- Listado de eventos obtenidos desde API externa
- Cards con logo, nombre y fecha de cada evento
- Inicialización completa del contexto del evento seleccionado
- Navegación hacia selección de equipos

#### 3.3 Selección de Equipos
**Archivo**: `src/pages/teamsPage.jsx`  
**Funcionalidad**: Elección de equipo o modo administrador
- Grid de equipos disponibles del evento
- Filtrado de equipos ya ocupados por otros dispositivos
- Opción especial de "Administrador" para gestión del evento
- Navegación hacia configuración del equipo seleccionado

#### 3.4 Configuración de Equipo
**Archivo**: `src/pages/teamPage.jsx`  
**Funcionalidad**: Setup individual del equipo
- Captura de foto del equipo usando cámara del dispositivo
- Preview de foto capturada antes de confirmar
- Generación de token único del dispositivo para identificación
- Vinculación dispositivo-equipo en Firebase
- Navegación hacia pantalla principal del evento

#### 3.5 Pantalla Principal del Evento
**Archivo**: `src/pages/eventPage.jsx`  
**Funcionalidad**: Interface durante el evento activo
- Header colapsable con información del evento y equipo
- Mapa interactivo ocupando pantalla completa
- Preparado para mostrar posición del equipo y pruebas del evento
- Base para funcionalidades durante el gameplay

### ✅ Sistema de Gestión de Estado

#### 3.6 Redux Store Configurado
**Archivo**: `src/store.js`  
**Funcionalidad**: Estado global centralizado
- 6 slices implementados con Redux Toolkit
- Persistencia automática usando redux-persist
- Middleware personalizado para sincronización Firebase
- Gestión de acciones serializables

#### 3.7 Slices de Estado Implementados

**Events Slice** (`src/features/events/eventsSlice.js`)
- Lista de eventos disponibles desde API
- Estados de carga y manejo de errores
- Thunk asíncrono para fetch de eventos

**Event Slice** (`src/features/event/eventSlice.js`)
- Información del evento actual seleccionado
- Coordinación de inicialización de equipos y actividades
- Thunk complejo para setup completo del evento

**Teams Slice** (`src/features/teams/teamsSlice.js`)
- Lista de equipos del evento
- Actualizaciones en tiempo real desde Firebase
- Thunk para modificación de datos de equipos

**Session Slice** (`src/features/session/sessionSlice.js`)
- Estado de sesión: administrador vs equipo normal
- Equipo seleccionado y foto capturada
- Token único del dispositivo
- Gestión de estados de autenticación/autorización

**Activities Slice** (`src/features/activities/activitiesSlice.js`)
- Actividades/pruebas disponibles en el evento
- Estados de carga para actividades

**Admin Slice** (`src/features/admin/adminSlice.js`)
- Configuración específica del administrador
- Estados relacionados con gestión del evento

### ✅ Servicios e Integraciones

#### 3.8 Integración Firebase
**Archivo**: `src/services/firebase.js`  
**Funcionalidad**: Persistencia y tiempo real
- Conexión con Firestore usando SDK v9 modular
- Suscripciones en tiempo real para events, teams y admin
- Middleware Redux para sincronización automática
- Funciones CRUD para eventos, equipos y configuración admin

#### 3.9 API REST Client
**Archivo**: `src/services/api.js`  
**Funcionalidad**: Comunicación con backend Laravel
- Cliente HTTP básico usando fetch nativo
- Endpoints implementados: `/events` y `/event`
- Validación de configuración de entorno
- Manejo básico de errores de red

#### 3.10 Sistema de Cache Offline
**Archivo**: `src/services/assetCache.js`  
**Funcionalidad**: Optimización de rendimiento
- Extracción automática de URLs desde JSON
- Prefetch inteligente de assets multimedia
- Integración con Service Worker (`/public/sw.js`)
- Cache de recursos para funcionalidad offline

#### 3.11 Cola de Subida Resiliente
**Archivo**: `src/services/uploadQueue.js`  
**Funcionalidad**: Manejo de uploads offline
- Cola persistente usando IndexedDB
- Soporte para archivos Blob y Data URLs
- Reintento automático al recuperar conectividad
- Procesamiento automático de archivos pendientes

#### 3.12 Sistema de Popups Modales
**Archivos**: `src/components/popup.jsx`, `src/features/popup/popupSlice.js`, `src/hooks/usePopup.js`  
**Funcionalidad**: Sistema de diálogos modales con gestión de cola
- **Gestión de Cola**: Solo un popup visible a la vez, cola automática para múltiples popups
- **Configuración Flexible**: Título, texto, CSS personalizado, array de botones
- **Posicionamiento**: Layout configurable (top, center, bottom)
- **Interacción**: Overlay clicable, botón de cerrar opcional
- **Hook Personalizado**: `usePopup()` para fácil integración en componentes
- **Estado Redux**: Persistencia y sincronización de estado global

**Ejemplo de Uso**:
```javascript
const { openPopup, closePopup } = usePopup();

openPopup({
  titulo: "Confirmar Acción",
  texto: "¿Está seguro de continuar?",
  array_botones: [
    { titulo: "Cancelar", callback: () => console.log("Cancelado") },
    { titulo: "Confirmar", callback: () => console.log("Confirmado") }
  ],
  layout: "center",
  overlay: true,
  close_button: true
});
```

#### 3.13 Sistema de Notificaciones
**Archivos**: `src/components/notification.jsx`, `src/components/notificationContainer.jsx`, `src/features/notification/notificationSlice.js`, `src/hooks/useNotification.js`  
**Funcionalidad**: Sistema de notificaciones emergentes no bloqueantes
- **Múltiples Notificaciones**: Gestión simultánea de múltiples notificaciones en lista
- **Auto-cierre**: Desaparición automática configurable por duración
- **Tipos de Notificación**: Info, Success, Warning, Error con iconos y colores distintivos
- **Posicionamiento Inteligente**: Layout configurable (top, center, bottom) con apilado direccional
- **Interacción Avanzada**: Pausa del temporizador al hacer hover, cierre manual opcional
- **Notificaciones Clickables**: Capacidad de ejecutar acciones al hacer clic en la notificación
- **Animaciones Suaves**: Transiciones de entrada, salida y efectos visuales
- **Hook Personalizado**: `useNotification()` con funciones de conveniencia por tipo
- **Barra de Progreso**: Indicador visual del tiempo restante
- **Responsive**: Adaptación automática para dispositivos móviles

**Características Técnicas**:
- Orden de apilado según posición: top/center añaden al final, bottom añaden al inicio
- Sistema de pausado inteligente que recalcula tiempo restante
- Z-index superior (2000) para aparecer sobre popups y otros elementos
- Gestión de estado independiente que permite notificaciones simultáneas
- Integración perfecta con sistema de chat para notificaciones de mensajes
- Callbacks clickables para navegación o acciones específicas

**Ejemplo de Uso**:
```javascript
const { showNotification, showSuccess, showClickableNotification } = useNotification();

// Notificación básica
showNotification({
  title: "Nuevo mensaje",
  message: "Tienes un mensaje del Equipo Alpha",
  type: "info",
  duration: 5000,
  position: "top"
});

// Notificación clickeable para navegación
showClickableNotification(
  "Chat: Equipo Beta",
  "¿Habéis encontrado la pista? Haz clic para responder",
  (notification) => {
    // Navegar al chat o ejecutar acción
    console.log("Abriendo chat:", notification.title);
  },
  { type: "info", duration: 8000 }
);

// Funciones de conveniencia
showSuccess("¡Éxito!", "Operación completada correctamente");
showError("Error", "No se pudo conectar al servidor");
```
````