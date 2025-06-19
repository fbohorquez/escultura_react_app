# Escultura Eventos - Estado Actual del Proyecto

## 1. Descripción General del Proyecto

### Propósito
Escultura es una aplicación web React que permite gestionar y participar en eventos interactivos tipo yinkana/gymkhana. Los equipos utilizan dispositivos móviles para:
- Seleccionar eventos y equipos
- Capturar fotos de equipo
- Navegar por mapas interactivos durante el evento
- Participar en actividades georreferenciadas en tiempo real

### Arquitectura del Sistema
**Tipo de aplicación**: Single Page Application (SPA)  
**Patrón arquitectónico**: Redux + Firebase + Google Maps API  
**Renderizado**: Client-side rendering con Vite  
**Estado global**: Redux Toolkit con persistencia  
**Sincronización**: Firebase Firestore en tiempo real  
**Navegación**: React Router con Memory Router  

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
└── index.html                # Template HTML principal
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
└── cacheEventAssets.jsx      # Pre-carga y cache de assets del evento
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
└── admin/
    └── adminSlice.js         # Estado: configuración y datos de administrador
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
└── hooks/                    # Directorio para hooks personalizados (vacío)
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

### ✅ Características Técnicas Avanzadas

#### 3.12 Internacionalización
**Archivos**: `src/i18n/index.js`, `src/i18n/es.json`, `src/i18n/en.json`  
**Funcionalidad**: Soporte multiidioma
- React i18next configurado con español e inglés
- Traducciones completas para toda la interfaz
- Detección automática de idioma del navegador
- Cambio dinámico de idioma

#### 3.13 Navegación Persistente
**Archivos**: `src/App.jsx`, `src/components/routeListener.jsx`  
**Funcionalidad**: Navegación inteligente
- React Router con MemoryRouter para aplicaciones móviles
- Persistencia de última ruta en localStorage
- Restauración automática de navegación al recargar
- 5 rutas principales implementadas

#### 3.14 Sistema de Componentes
**Funcionalidad**: Arquitectura de componentes reutilizables
- `BackgroundLayout`: Layout base con título y subtítulo
- `BackButton`: Navegación hacia atrás consistente  
- `EventHeader`: Header colapsable para maximizar mapa
- `EventMap`: Integración Google Maps con marcadores
- `SubscriptionManager`: Gestión automática de suscripciones Firebase
- `CacheEventAssets`: Pre-carga inteligente de recursos

### ✅ Preparación para Funcionalidades Futuras

#### 3.15 Estructura Preparada para
- **Google Maps Integration**: Componente EventMap listo para mostrar equipos y pruebas
- **Real-time Chat**: Assets de chat y estructura de comunicación
- **Actividades Interactivas**: Sistema de iconos por tipo de prueba
- **Modo Administrador**: Estructura de permisos y assets específicos
- **Sistema de Puntuación**: Iconos de éxito/fallo y estados de equipo
- **PWA Capabilities**: Manifiesto y Service Worker configurados

---

## Estado de Desarrollo Actual

### ✅ Completamente Implementado
- Flujo de onboarding completo (5 pantallas)
- Gestión de estado global con Redux
- Integración Firebase en tiempo real
- Sistema de persistencia y cache
- Internacionalización completa
- Navegación entre pantallas
- Captura y subida de fotos
- Identificación única de dispositivos

### 🚧 En Preparación
- Lógica específica del mapa interactivo
- Pruebas/actividades durante el evento
- Sistema de chat en tiempo real
- Funcionalidades de administrador
- Sistema de puntuación
- Notificaciones y efectos visuales

### 📋 Base Técnica Sólida
La aplicación cuenta con una arquitectura robusta preparada para ser expandida con las funcionalidades específicas del gameplay, manteniendo:
- Escalabilidad mediante Redux modular
- Rendimiento con cache inteligente
- Confiabilidad con cola de uploads resiliente
- Experiencia offline con Service Workers
- Sincronización tiempo real con Firebase