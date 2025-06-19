# Escultura Yincana - Especificación Técnica Completa

> **Aplicación iOS para eventos de gymkhana digitales con geolocalización, actividades multimedia y sistema de equipos en tiempo real**

---

## 📱 Descripción de la Aplicación

**Escultura Yincana** es una aplicación cliente iOS diseñada específicamente para **iPad iOS 13+** que gestiona eventos de tipo gymkhana o yincana digital. La aplicación permite crear y gestionar competiciones colaborativas donde equipos participan en actividades geolocalizadas, acumulan puntos, intercambian objetos virtuales y se comunican en tiempo real.

### Modalidades de Uso

**🎯 Modo Administrador**
- Control total del evento
- Monitorización de equipos en tiempo real  
- Asignación manual de actividades
- Chat con todos los equipos
- Gestión de puntuaciones y suspensión de actividades
- Control de cronómetros centralizados

**👥 Modo Equipo**
- Participación en actividades asignadas
- Navegación GPS a ubicaciones específicas
- Captura de multimedia para completar pruebas
- Chat entre equipos y con organizadores
- Visualización de ranking y progreso
- Sistema de inventario de objetos virtuales

---

## 🏗️ Arquitectura Técnica

### Backend y Comunicación

**API REST Principal**
- **URL Base**: `https://escultura.dev2bit.com/api/`
- **Endpoints principales**:
  - `POST /events` - Lista de eventos disponibles
  - `POST /event` - Datos completos de un evento específico
- **Formato**: JSON con estructura `{"request": {"data": {...}}}`
- **Respuesta**: `{"status": 0, "data": {...}}`

**Firebase Integration**
- **Firestore**: Base de datos principal para eventos, equipos y actividades
- **Firebase Real-time Database**: Chat en tiempo real y estado de conexión
- **Firebase Analytics**: Métricas de uso
- **Firebase Auth**: Autenticación opcional

### Tecnologías de Geolocalización

**Google Maps SDK**
- **API Key**: `AIzaSyADRHJAWAn_-Q4nrGuOUBZcMyn8DTIspVA`
- Visualización de mapas con marcadores de actividades
- Cálculo de distancias y proximidad
- **Distancia máxima por defecto**: 10.300 metros
- **Distancia para puzzles**: 50 metros

**Core Location**
- Tracking GPS continuo de equipos
- Geofencing para activación automática de actividades
- Promedio de puntos GPS configurables

### Multimedia y Juegos

**AVFoundation**
- Configuración automática de cámara
- Captura de fotos y videos para actividades tipo 3
- Gestión de permisos multimedia

**SpriteKit + PuzzleMaker**
- Motor de juegos para puzzles interactivos (actividades tipo 4)
- Generación dinámica de piezas de rompecabezas
- Física de arrastrar y soltar

### Persistencia de Datos

**Local Storage**
- **UserDefaults**: Caché de intentos de actividades, configuraciones
- **File System**: Almacenamiento local de imágenes y multimedia
- **Firestore**: Sincronización en tiempo real con el servidor

---

## 📊 Estructura de Datos

### EventData
```swift
struct EventData: Codable {
  var teamsData: [TeamResumeData]     // Lista de equipos del evento
  var name: String                    // Nombre del evento
  var teams: Int                      // Número total de equipos
  var id: Int                         // ID único del evento
  var lon: Double                     // Longitud GPS del centro del evento
  var lat: Double                     // Latitud GPS del centro del evento
  var activitiesData: [ActivityData]  // Lista completa de actividades
  var suspend: Bool                   // Estado de suspensión del evento
  var logo: String                    // URL del logo del evento
  var eventAt: String                 // Fecha/hora del evento
  var color: String                   // Color temático (formato HEX)
  var active: Int                     // Estado de activación
}
```

### TeamData
```swift
struct TeamData: Codable {
  var id: Int                         // ID único del equipo
  var name: String                    // Nombre del equipo
  var device: String                  // UUID del dispositivo asignado
  var connected: Int                  // Estado de conexión (0/1)
  var points: Int                     // Puntos acumulados totales
  var lat: Double                     // Latitud GPS actual
  var lon: Double                     // Longitud GPS actual
  var activitiesData: [ActivityData]  // Actividades asignadas al equipo
  var inventary: [Int]                // IDs de objetos en inventario
  var inventary_name: [String]        // Nombres de objetos en inventario
  var inventary_image: [String]       // URLs de imágenes de objetos
  var send: Int                       // ID de actividad a enviar (push)
  var sequential: Int                 // Modo secuencial de actividades
}
```

### ActivityData
```swift
struct ActivityData: Codable {
  let id: Int                         // ID único de la actividad
  let name: String                    // Nombre de la actividad
  let type: TypeClass                 // Tipo de actividad (1-7)
  let lat: Double                     // Latitud GPS de la actividad
  let lon: Double                     // Longitud GPS de la actividad
  let distance: Int                   // Distancia máxima para activación
  var points: Int                     // Puntos otorgados al completar
  let time: Int                       // Tiempo límite (segundos)
  let file: String                    // Archivo de configuración
  let typeData: String                // Datos específicos del tipo
  let ok: String                      // Mensaje de éxito
  let ko: String                      // Mensaje de fallo
  var complete: Bool                  // Estado de completado
  var complete_time: Int              // Timestamp de completado
  var del: Bool                       // Eliminación lógica
  var data: String                    // Datos de respuesta del equipo
  var valorate: Int                   // Estado de valoración (0/1)
  
  // Sistema de objetos virtuales
  var object_in: Int                  // ID de objeto requerido
  var object_in_name: String          // Nombre del objeto requerido
  var object_in_image: String         // Imagen del objeto requerido
  var object_out: Int                 // ID de objeto otorgado
  var object_out_name: String         // Nombre del objeto otorgado
  var object_out_image: String        // Imagen del objeto otorgado
}
```

### TypeClass - Tipos de Actividades
```swift
struct TypeClass: Codable {
  var id: Int                         // ID del tipo (1-7)
  var name: String                    // Nombre del tipo
}

// Tipos soportados:
// 1: Quiz/Preguntas y respuestas
// 2: Tracking/Seguimiento de ruta
// 3: Foto/Video multimedia
// 4: Puzzle/Rompecabezas
// 5: Memoria/Juegos de cartas
// 6: Palabras/Crucigramas
// 7: Robot/Fantasmas automáticos
```

### ChatData & MessageData
```swift
struct ChatData: Codable {
  var messages: [MessageData]         // Lista de mensajes del chat
}

struct MessageData: Codable {
  var team: Int                       // ID del equipo emisor (0 = admin)
  var name: String                    // Nombre del emisor
  var message: String                 // Contenido del mensaje
  var timestamp: Int                  // Timestamp del mensaje
}
```

### AdminData
```swift
struct AdminData: Codable {
  var device: String                  // UUID del dispositivo administrador
  var lat: Double                     // Latitud GPS del organizador
  var lon: Double                     // Longitud GPS del organizador
}
```

### FantasmaData
```swift
struct FantasmaData: Codable {
  var lat: Double                     // Latitud del fantasma
  var lon: Double                     // Longitud del fantasma
  var time: Int                       // Tiempo de activación
  var active: Bool                    // Estado de activación
}
```

---

## 🎮 Funcionalidades Completas

### 🔐 Autenticación y Acceso
- **LoginViewController**: Pantalla de inicio con validación de conectividad
- Configuración automática de cámara al inicio
- Visualización de versión de la aplicación
- Conexión con API para obtener lista de eventos

### 📋 Gestión de Eventos
- **EventsViewController**: Lista completa de eventos disponibles desde API
- **EventViewController**: Hub principal con interfaz colapsible
- Información del evento: fecha, descripción, ubicación central
- Control de estado de suspensión del evento
- Tema visual personalizable por evento (colores, logos)

### 👥 Sistema de Equipos
- **TeamsViewController**: Selección de equipo disponible
- **TeamViewController**: Información detallada del equipo
- Asignación automática de dispositivo por UUID
- Sistema de conexión/desconexión en tiempo real
- Tracking de ubicación GPS continuo de cada equipo

### 🗺️ Navegación y Mapas
- **MapViewController**: Mapa central con Google Maps
- Visualización de todas las actividades geolocalizadas
- Marcadores diferenciados por tipo de actividad
- Tracking en tiempo real de equipos (admin)
- Cálculo automático de distancias y proximidad
- Sistema de activación por geofencing

### 🎯 Sistema de Actividades

**Actividades Tipo 1: Quiz/Preguntas**
- **ActivityType1ViewController**: Pantalla principal de preguntas
- **ActivityType1PointsViewController**: Gestión de puntuación
- Preguntas de opción múltiple y respuesta abierta
- Sistema de puntuación configurable
- Validación automática de respuestas

**Actividades Tipo 2: Tracking**
- Seguimiento de ruta específica
- Validación por proximidad GPS
- Registro de recorrido completo

**Actividades Tipo 3: Multimedia**
- **ActivityType3ViewController**: Captura de fotos/videos
- **ActivityType3PointsViewController**: Valoración de multimedia
- Integración con cámara del dispositivo
- Envío y almacenamiento automático
- Galería de fotos completadas por equipo

**Actividades Tipo 4: Puzzles**
- **ActivityType4ViewController**: Rompecabezas interactivos
- Motor SpriteKit con física personalizada
- Generación dinámica de piezas con PuzzleMaker
- Validación de completado automático

**Actividades Tipo 5: Memoria**
- **ActivityType5ViewController**: Juegos de memoria y cartas
- Interface de cartas volteables
- Sistema de coincidencias
- Cronómetro opcional

**Actividades Tipo 6: Palabras**
- **ActivityType6ViewController**: Crucigramas y palabras
- **ActivityType6TableController**: Gestión de palabras
- Validación de palabras ingresadas
- Pistas configurables

**Actividades Tipo 7: Robot/Fantasmas**
- Sistema automatizado de "fantasmas"
- Activación temporal y geolocalizada
- Comportamiento automático sin intervención

### 💬 Sistema de Comunicación

**Chat Multiplataforma**
- **ChatsViewController**: Lista de conversaciones
- **ChatViewController**: Interface de chat individual
- **ChatsListViewController**: Gestión completa de chats

**Tipos de Chat:**
- **Admin ↔ Equipo**: Chat individual organizador-equipo
- **Equipo ↔ Equipo**: Chat privado entre equipos
- **General**: Chat grupal de todo el evento
- **Organizador**: Canal especial para equipos

**Características:**
- Mensajería en tiempo real con Firebase
- Notificaciones push y sonido
- Contador de mensajes no leídos
- Toast notifications para mensajes entrantes

### 📷 Gestión Multimedia
- **PhotoViewController**: Galería de fotos del evento
- **PhotoTeamViewController**: Fotos específicas por equipo
- **PhotoTableViewController**: Vista tabular de fotos
- Captura automática con marcas de agua
- Almacenamiento local y en nube
- Validación automática de actividades multimedia

### 🎒 Sistema de Inventario (Gadgets)
- **GadgetsViewController**: Inventario general
- **GadgetsTeamViewController**: Gadgets por equipo
- **GadgetsTableViewController**: Vista detallada de objetos
- Objetos virtuales coleccionables
- Sistema de intercambio entre actividades
- Visualización con imágenes y descripciones

### 🏆 Ranking y Puntuaciones
- **RankingViewController**: Clasificación general
- **RankingTableViewController**: Vista detallada del ranking
- Actualización en tiempo real de puntuaciones
- Ordenación automática por puntos
- Visualización de posición actual del equipo

### ⚙️ Administración Avanzada

**Control de Actividades**
- **ActivitiesViewController**: Vista general de actividades
- **ActivitiesTableViewController**: Gestión tabular
- **ActivitiesTeamsViewController**: Actividades por equipo
- **ActivitiesValorateViewController**: Valoración de actividades
- **AsignationViewController**: Asignación manual de actividades

**Gestión de Cronómetros**
- **ChronometerAdminViewController**: Control centralizado
- **ActivityTimerViewController**: Cronómetros individuales
- Sincronización automática entre dispositivos
- Control de inicio/pausa/reset

**Interfaces Modales**
- **PopupViewController**: Ventanas modales base
- **PopupSendViewController**: Envío de actividades
- **PopupLockViewController**: Bloqueo de actividades
- **PopupSuspendViewController**: Suspensión temporal
- **PopupGameViewController**: Configuración de juegos

### 🔧 Utilidades y Herramientas

**Navegación**
- **EventNavigationController**: Navegación especializada
- **BackViewController**: Control de navegación hacia atrás
- Sistema de navegación contextual

**Interfaces Especializadas**
- **FantasmaViewController**: Gestión de fantasmas automáticos
- **OrganizerViewController**: Panel de control del organizador
- **GeneralViewController**: Clase base para todas las vistas

---

## 🌐 Comunicación con API

### Estructura de Peticiones

**Headers requeridos:**
```
Content-Type: application/x-www-form-urlencoded
```

**Formato de petición:**
```
POST body: request={"data": {parámetros}}
```

**Formato de respuesta:**
```json
{
  "status": 0,           // 0 = éxito, otros = error
  "data": {             // Datos de respuesta
    ...
  }
}
```

### Endpoints Principales

**GET /events**
- **Descripción**: Obtiene lista de eventos disponibles
- **Respuesta**: Array de EventResume con información básica
- **Datos**: `{"events": [EventResumeData...]}`

**POST /event**
- **Descripción**: Obtiene datos completos de un evento específico
- **Parámetros**: `{"event_id": número}`
- **Respuesta**: EventData completo con equipos y actividades

### Firebase Real-time Database

**Estructura de conexión de equipos:**
```
/team_{id}: {
  "connected": boolean    // Estado de conexión del equipo
}
```

**Funcionalidad onDisconnect:**
- Automáticamente marca equipo como desconectado al cerrar app
- Sincronización en tiempo real del estado de conexión

### Autenticación
- La aplicación actualmente no requiere autenticación de usuario
- Identificación por UUID único del dispositivo
- Control de acceso por asignación de dispositivo a equipo/admin

---

## 📱 Requisitos Técnicos

### Plataforma y Versiones
- **iOS**: 13.0 o superior
- **Dispositivo**: Optimizado para iPad
- **Orientación**: Principalmente landscape (horizontal)
- **Conectividad**: WiFi/4G/5G requerida para sincronización

### Dependencias CocoaPods

```ruby
# Firebase Core
pod 'Firebase/Core'
pod 'Firebase/Analytics'
pod 'Firebase/Database'
pod 'Firebase/Firestore'
pod 'Firebase/Auth'

# Google Services
pod 'GoogleMaps'
pod 'GooglePlaces'

# Facebook SDK (opcional)
pod 'FBSDKLoginKit'
pod 'FBSDKCoreKit'

# Puzzle Engine
pod 'PuzzleMaker'
```

### Permisos Requeridos (Info.plist)

```xml
<!-- Ubicación -->
<key>NSLocationWhenInUseUsageDescription</key>
<string>La app requiere ubicación para actividades geolocalizadas</string>
<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>La app requiere ubicación continua para tracking de equipos</string>

<!-- Cámara y Multimedia -->
<key>NSCameraUsageDescription</key>
<string>La app requiere cámara para actividades multimedia</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>La app requiere acceso a fotos para guardar capturas</string>
<key>NSMicrophoneUsageDescription</key>
<string>La app requiere micrófono para videos</string>
```

### Configuración de Google Services

**GoogleService-Info.plist** requerido con:
- Google Maps API Key
- Firebase Project Configuration
- Analytics Configuration

---

## 🔗 Compatibilidad de Datos

Para asegurar 100% compatibilidad al replicar en otras tecnologías:

### Formato de Timestamps
- **Tipo**: Unix timestamp (segundos desde epoch)
- **Ejemplo**: `1643723400` (1 Feb 2022)

### Coordenadas GPS
- **Formato**: Decimal degrees
- **Precisión**: 6 decimales mínimo
- **Sistema**: WGS84

### Identificadores
- **Equipos**: Enteros únicos por evento
- **Actividades**: Enteros únicos globales
- **Objetos**: Enteros únicos globales
- **Dispositivos**: UUID string format

### Estados Booleanos
- **Complete**: `true`/`false`
- **Connected**: `1`/`0` (entero)
- **Del**: `true`/`false`
- **Suspend**: `true`/`false`

### Comunicación en Tiempo Real
- **Protocolo**: WebSocket vía Firebase Real-time Database
- **Channels**: Estructura jerárquica por evento/equipo/chat
- **Fallback**: Polling HTTP cada 5 segundos si WebSocket falla

---

## 📄 Notas de Implementación

### Gestión de Estado
- Singleton `App.sys()` gestiona estado global
- Listeners automáticos para sincronización en tiempo real
- Cache local para funcionamiento offline limitado

### Optimizaciones
- Lazy loading de imágenes y multimedia
- Geofencing para reducir uso de GPS
- Cache de actividades para modo offline
- Compresión automática de imágenes

### Seguridad
- Validación de proximidad GPS en servidor
- No exposición de API keys en código
- Sanitización de inputs de chat
- Validación de tipos de archivo multimedia

---

*© 2025 - Especificación técnica completa para replicación de Escultura Yincana*