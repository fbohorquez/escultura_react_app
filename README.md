### Escultura Eventos

# Introducción del proyecto

Partimos de un proyecto ya en funcionamiento. Se trata de un servicio de Yinkanas donde se dan de alta eventos constituidos por una localización, una serie de pruebas y una serie de equipos. 

Cada equipo usa un dispositivo con una aplicación en la que selecciona el evento y el equipo, luego en un mapa parece la localizacion geográfica del equipo y las pruebas en el evento, cuando el equipo se acerca a una prueba esta se activa para su realización. Al finalizar la prueba obtiene los puntos de la misma. 

El servicio se basa en tres sistemas:
- Aplicación Laravel backend para dotar los eventos, pruebas, equipos...
- Servicio Firebase database para sincronización de datos en tiempo real.
- Aplicación iOS en Switch para el juego del evento por los equipos

El proyecto consiste en migrar la aplicación iOS a una aplicación web con React. Manteniendo las mismas funcionalidades. 

Para ello disponemos del código fuente de la aplicación iOS que deberemos traducir a React.

# Pantallas de la aplicación

La aplicación cuenta con las siguientes pantallas:
- Bienvenida. Solo dispone de un mensaje de bienvenida y un botón "Entrar". Al pulsar este botón se navega a la siguiente pantalla.
- Selección de evento. Se realiza una petición al backend para obtener los eventos con fecha de inicio a partir del día de hoy. El usuario puede seleccionar el evento en el que quiere participar y la aplicación se sincronizará con el evento seleccionado. 
- Selección de equipo. El usuario podrá seleccionar uno de estos equipos o un equipo especial llamado Organizador. Dandose así dos roles distintos: Equipo y Organizador. Cuando se selecciona un equipo el dispositivo queda asociado al mismo en el estado del evento, de forma que si ese dispositivo vuelve a entrar en la aplicación toma automaticamente ese equipo.
- Foto de equipo. Si se selecciona un equipo se le solicita al usuario que realice una foto que será asociada al grupo.
- Mapa del evento. Esta es la pantalla principal de la aplicación. En esta pantalla se muestra:
  -- Una cabera colapsable con el logo del evento, el nombre del equipo y la foto del mismo. 
  -- Una barra de herramientas que solo será visible para el rol Organizador.
  -- El espacio restantes está ocupado por el mapa y dibujado sobre este la posición del equipo y las pruebas pendientes. 
  -- Flotando sobre el mapa con el fondo transparente, en la posición baja o footer de la pantalla, se dispone de una barra de acción con un botón para ir a la pantalla de chat, un cronómetro que se activa automáticamente cuando comienza el evento y un botón para ir a la pantalla de bromas.
- Ejecución de prueba. Cuando un equipo se acerca lo sufiente a una prueba esta se activa, le saldrá un popup en el que le preguntará si desea realizar prueba. Si el equipo acepta se muestra la pantalla de ejecución de la prueba. El contenido de esta pantalla depende del tipo de prueba, y normalmente supondrá un minijuego que va desde hacer una foto o video, hasta hacer un puzzle o resolver unas preguntas... 
- Prueba Éxito. Si el equipo tiene éxito al resolver la prueba va a la pantalla de éxito y se le otorgan los puntos que fuera necesario.
- Prueba Fallo. Si el equipo falla al realizar la pruebna va a la pantalla de fallo y se le quitan los puntos que fueran necesarios. 
- Listado de Chats. Pantalla que muestra el listado de chats que se tiene con cada equipo con el Organizador, y una sala común para todos los participantes 
- Chat. Al pulsar un chat en el listado de chats se carga la pantalla donde poder ver y participar en la conversación de esa sala. 
- Listado de Bromas. En primer lugar se selecciona un equipo y luego la broma a enviar. Las bromas son un conjunto de efectos que se le pueden enviar a los demás equipos, que van desde sustos hasta volteos de pantallas. En la práctica se dispone de dos pantallas, una para listar los equipos y otra para una vez seleccionado el equipo se seleccione la broma.
- Acciones de Organizador. Pantallas correspondientes a las acciones que se muestran en el Mapa del evento cuando el Rol es Organizador
-- Listado de Fotos. En primer lugar se selecciona un equipo y luego se carga una pantalla en la que se ven las fotos realizadas por este. En la práctica se dispone de dos pantallas, una para listar los equipos y otra para ver las fotos. Si el usuario pulsa sobre una foto se abrirá la pantalla para puntuar la prueba asociada a la foto.
-- Listado de Pruebas. En primer lugar se selecciona un equipo y luego se carga un listado de las pruebas de este. En la practica, de igual forma, hay dos pantallas el listado de equipos y el listado de pruebas del mismo. Por cada prueba el Organizador puede ver el estado, acceder a la pantalla para puntuar la prueba, enviarsela al equipo para que le salte como si estuviera cerca o borrarla para que no le salga al equipo en el mapa. 
-- Pantalla para puntuar prueba de un equipo. En esta pantalla el Organizador ver la respuesta o desarrollo de la prueba para un equipo, por ejemplo si es una prueba de foto vería la foto subida. Desde esta pantalla tambien puede asignar los puntos que aporta esta prueba.
-- Clasificación. En esta pantalla el Organizador puede ver la clasificación actual de los equipos. También los equipos pueden acceder a ella si pulsan el reloj cronometro.
-- Asignación. Desde esta pantalla el Organizador puede desasignar equipos de dispositivos haciendo posible que si el dispositivo inicia la aplicación de nuevo entre en la selección de evento y equipo.
-- Generación de fantasmas. Si en la pantalla de mapa el Organizador hace click sobre el mismo, le aparecerá un popup preguntando si desea generar un fantasma. Esto le llevará a la pantalla de generación de fantasmas, donde debe indicar la configuración del mismo como el tiempo que permanecerá activo. El fantasma persiguirá a los equipo virtualmente por el mapa y le restará puntos.   



# Tipos de pruebas
- Preguntas y respuestas. Pueden ser tipo test o abiertas.
- Pistas. En esta prueba solo aparece un texto que informa de una pista.
- Foto/Video. Solicita al equipo que haga una foto o video.
- Puzzle. Dada una imagen forma un puzzle deslizante, de unas dimensiones dada, y el equipo tendrá que formarlo.
- Parejas. Juego de buscar las parejas. 
- Palabras relacionadas. Hacer relaciones entre palabras



# Peticiones al backend

## Events. 
Obtiene un JSON con todos los eventos futuros (a partir de la fecha actual).

tiene una clave data con los datos de la repuesta.
{
  "data": {
    "events": [
      {
        "id": 1,
        "name": "Evento 1",
        "logo": "https://...logo.png",
        "event_at": "2023-10-01",
      },
      ....
    ]
  },
  "status": 0,
}

## Event. 

Si el evento no está inicializado como un documento en Firebase, se crea la estructura inicial del evento en Firebase. En cualquier caso se devuelve el id del evento para que la aplicación pueda cargarlo desde Firebase. 

{
  "data": {
    "event": 1,
  },
  "status": 0,
}




## Upload. 

Permite subir un fichero como una foto o video al servidor. Recibe en la URL el nombre del fichero a subir, incluida la ruta relativa donde se almacenará, pero sustituyendo los "/" por "@" para evitar conflictos con la ruta del servidor. Además se enviará el contenido del fichero en el body de la petición con la clave "profile_img". El servidor creará la ruta y almacenará el fichero.

Esta petición no devuelve nada, solo un código de estado HTTP.


# Base de datos en tiempo real. Firebase.

Desde el backend se puede cargar todos los datos del evento a un documento de una colección Firebase. El evento será cargado con una estructura para su ejecución, estableciendose el estado inicial. 

Cuando en la aplicación se selecciona un evento se sincroniza un modelo de datos interno con los cambios en el documento, además cuando se selecciona el equipo se asigna el dispositivo a ese equipo y se usará la información del documento relativa al mismo. 

El documento Firebase tiene una serie de campos raíz y una serie de subcolecciones. 

Los campos raíz son datos realativos al evento:
- id: identificador del evento
- name: Nombre del evento
- teams: Número total de equipos
- pax: Número total de jugadores en el evento
- lat: latitud del punto central del evento
- lon: longitud del punto central del evento
- active: Determina si el evento está activo
- logo: URL donde se aloja el logo del evento
- color: Color HTML principal para modificar la interfaz y darle el look del evento
- event_at: Fecha (sin hora) del evento
- suspend: Booleano que indica si el evento está suspendido.
- team_name_by: Determina si el nombre de los eqipos es por números ("Equipo 1", "Equipo 2"...) o por colores ("Equipo Azul", "Eqipo Rojo"...)
- activities_data: Array con los iniciales datos de las pruebas
- team_data: Array con los datos iniciales de los equipos

Las subcolecciones son: 
- admin: Solo tiene un documento con los siguientes datos:
  -- device: Token del dispositivo asociado al Organizador
  -- lat: longitud actual del Organizador
  -- lon: longitud actual del Organizador

- chats: Contiente un documento por cada sala de chat. Por ejemplo si hay tres equipos con los ids 601, 602 y 603,se creará un total de 7 salas; una sala para el Organizador con cada uno de los equipos (admin_601, admin_602, admin_603), una sala por cada par de equipos (team_601_602, team_601_603, team_602_603) y una sala para el grupo (group). Cada sala tendrá un solo campo "messages" que es un array de objetos con los siguientes campos: 
  -- date: timestamp de la fecha del mensaje
  -- message: Texto del mensaje.
  -- name: Nombre en formato cadena del que escribe el mensaje ("Organizador", "Equipo Azul"...).
  -- team: ID del equipo que escribe el mensaje o 0 si es el Organizador
  -- type: "team" o "adim" determina el tipo de rol que escribió el mensaje

- robot: Subcolección que solo tiene un documento, "fantasmas" este documento tiene un solo campo "data" que es un array de objetos con los datos de cada fantasma que son:
  -- date_end: timestamp del momento en el que finalizará el fantansma
  -- date_ini: timestamp del momento en el que comenzará el fantasma
  -- lat: Latitud del fantasma
  -- lon: Longitud del fantasma
  -- mode: Entero que determina el modo de actuación del fantasma. Persigue a los equipos, se queda en un sitio, se mueve aleatoriamente...
  -- poits: Puntos que restará o dará el fantasma
  -- time: Tiempo en segundos que durará el fantasma

- teams: Subcolección que tiene un documento por cada equipo. Cada documento tiene los siguientes campos:
  -- id: ID del equipo
  -- image: URL donde se aloja la foto del equipo
  -- photo: URL donde se aloja la foto del equipo
  -- name: Nombre del equipo
  -- conected: Booleano que indica si el equipo está conectado
  -- lon: Longitud del equipo
  -- lat: Latitud del equipo
  -- num: Número del equipo
  -- device: Token del dispositivo asociado al equipo
  -- gadget: Broma cuyo efecto se le aplicará al equipo
  -- activities_data: Array con los datos de cada prueba
  -- points: Puntos totales del equipo
  -- route: Booleano que indica debe seguir una ruta o no. 
  -- sequential: Booleano que indica si las pruebas se deben realizar de forma secuencial o no.
  -- visible: Booleano que indica si el equipo es visible o no. ??
  -- activities_data: Array con los datos de cada prueba:
    --- id: ID de la prueba
    --- name: Nombre de la prueba
    --- complete: Booleano que indica si la prueba ha sido realizada o no por el equipo
    --- complete_time: tiempo en el que se ha realizado la prueba
    --- del: Booleano que indica si la prueba ha sido eliminada o no
    --- distance: Distancia a partir de la cual se activa la prueba
    --- file: Imagen que se debe mostrar en la prueba
    --- icon: Icono que se debe mostrar en la prueba
    --- ok: Texto que se muestra si la prueba es correcta
    --- ko: Texto que se muestra si la prueba es incorrecta
    --- points: Puntos que se le otorgan al equipo si realiza la prueba
    --- type: Objeto con los campos 
      ---- id: ID del tipo de prueba
      ---- name: Nombre del tipo de prueba
    --- type_data: Datos necesario para el tipo de prueba es un JSON como cadena. 
    --- uniq: ???
    --- send: ID de la prueba que ha sido enviada al equipo por el Organizador, para que la realice sea cual sea su posición
    --- valorate: Booleano que indica si la prueba ha sido valorada o no
  -- inventary, inventario_image y inventary_name: Son campos que se usan para establecer objetos que ha tomado el equipo al resolver pruebas. Algunas pruebas pueden requerir que el equipo tenga en inventario un objeto para poder realizarla.

Otros aspectos funcionales: 
- Subidas diferidas según la conexión. Si el equipo no tiene conexión a internet, la aplicación almacenará los datos en el dispositivo y cuando haya conexión se enviarán al servidor.

- Multiples avisos de cercania de pruebas. El equipo recibirá un aviso cuando se encuentre a una distancia de la prueba, si el equipo deniega el aviso, se le volverá a avisar, si esta situación repedidamente se le preguntará si desea omitir los avisos de esa prueba.

- Navegación. La aplicación tendrá dos pilas de botón atras: 
-- Una lo que es la configuración inicial del evento y el equipo. Para poder volver atras si se ha equivocado al seleccionar el evento o el equipo.
-- Otra para la navegación por las pantallas de ejecución de pruebas, chats y bromas.

- Restauración de estado y asociación de dispositivo. La aplicación debe recordar el evento y el equipo que se seleccionó la última vez que se usó la aplicación mediante un token de dispositivo. Si el dispositivo no tiene token, se le pedirá al usuario que seleccione el evento y el equipo. Si el dispositivo tiene token, se cargará el estado actual del evento y el equipo asociado al token. Si el evento no está activo o el equipo no está asociado a ese evento, se le pedirá al usuario que seleccione el evento y el equipo.

- Multidioma. La aplicación debe estar disponible en varios idiomas, incluyendo español, inglés y francés. El idioma se seleccionará automáticamente según la configuración del dispositivo.


# Requisitos técnicos de la nueva aplicación
- La aplicación debe ser una SPA (Single Page Application) desarrollada en React con JavaScript. 
- Se usará redux para la gestión del estado de la aplicación.
- Se usará, al igual que en la aplicación iOS, la librería de mapas Google Maps.
- Se usará la librería de Firebase para la sincronización de datos en tiempo real.
- Se usará la librería de Redux para la gestión del estado de la aplicación.
- Para la interfaz gráfica se usarán los recursos ya existentes en la aplicación iOS, y se baseará en el código del storyboard de la aplicación iOS.
- La aplicación debe ser responsive y adaptarse a diferentes tamaños de pantalla.
- La aplicación debe ser compatible con los navegadores más comunes (Chrome, Firefox, Safari, Edge).
- No es necesario que el dispositivo se autentique, ya que la aplicación no tiene acceso a datos sensibles de los usuarios y se usará de forma interna en la empresa.
- La aplicación se alojará en una instancia de EC2 de AWS, en la que ya está el backend
- El equipo de trabajo es una sola persona. 
- No se harán pruebas unitarias ni de integración continua. 
- La aplicación no será escalable inicialmente.

# Estructura de directorios del proyecto actual:
- Main.storyboard: Unico storyboard de la aplicación, disponible en varios idiomas.
- AppDelegate.swift: Clase que gestiona el ciclo de vida de la aplicación.
- SceneDelegate.swift: Clase que gestiona la escena de la aplicación.
- ViewController.swift: Clase que gestiona la vista principal de la aplicación.
- LoginViewController.swift: Clase que gestiona la vista de bienvenida. A pesar del nombre, no es un login.
- GeneralViewController.swift: Clase que gestiona una vista con un subview que se usa para mostrar otras vistas.
- EventsViewController.swift: Clase que gestiona la vista de selección de evento (se carga como subview).
- TeamsViewController.swift: Clase que gestiona la vista de selección de equipo (se carga como subview).
- TeamViewController.swift: Clase que gestiona la vista de foto de equipo.
- EventViewController.swift: Clase que gestiona la vista principal del evento, carga el mapa como un subview.
- MapViewController.swift: Clase que gestiona el mapa del evento (se carga como un subview).
- ActivityRunViewController.swift: Clase que gestiona la ejecución de actividades en el evento, carga la actividad como un subview. Se dispone de un ActivityRunViewController por cada tipo de actividad. También carga el cronometro como un subview.
- ActivityTimeViewController.swift: Clase que gestiona la vista del cronometro en una prueba. 
- ActivityNoTimeViewController.swift: Clase que gestiona la vista de una prueba sin cronometro.
- ActivityOkViewController: Clase que gestiona la vista de éxito de la actividad.
- ActivityKoViewController: Clase que gestiona la vista de fallo de la actividad.
- RankingViewController.swift: Clase que gestiona la vista de clasificación del evento, carga la tabla de clasificación como un subview.
- RankingTableViewController.swift: Clase que gestiona la vista de la tabla de clasificación.
- AsignationViewController.swift: Clase que gestiona la vista de asignación de equipos a dispositivos, carga la tabla de asignación donde se muestra cada equipo como un subview.
- AsignationTableViewController.swift: Clase que gestiona la vista de la tabla de asignación
- ActivitiesTeamsViewController.swift: Clase que gestiona la vista de listado de equipos para ver sus pruebas, carga la tabla de equipos como un subview.
- ActivitiesTeamsTableViewController.swift: Clase que gestiona la vista de la tabla de equipos para ver sus pruebas.
- ActivitiesViewController.swift: Clase que gestiona la vista de listado de pruebas de un equipo, carga la tabla de actividades como un subview.
- ActivitiesTableViewController.swift: Clase que gestiona la vista de la tabla de actividades de un equipo.
- PhotoTeamViewController.swift: Clase que gestiona la vista de selección de equipo para ver sus fotos, carga la tabla de equipos como un subview.
- PhotoTeamTableViewController.swift: Clase que gestiona la vista de la tabla de equipos para ver sus fotos.
- PhotoViewController.swift: Clase que gestiona la vista de selección de foto de un equipo, carga la tabla de fotos como un subview.
- PhotoTableViewController.swift: Clase que gestiona la vista de la tabla de fotos de un equipo.
- CronometerAdminViewController.swift: Clase que gestiona la vista del cronometro para el Organizador
- GadgetsTeamViewController.swift: Clase que gestiona la vista de selección de equipo para enviar una broma, carga la tabla de equipos como un subview.
- GadgetsTeamTableViewController.swift: Clase que gestiona la vista de la tabla de equipos para enviar una broma.
- GadgetsViewController.swift: Clase que gestiona la vista de selección de broma, carga la tabla de bromas como un subview.
- GadgetsTableViewController.swift: Clase que gestiona la vista de la tabla de bromas.
- ActivityAdminPointsViewController.swift: Clase que gestiona la vista de puntuación de una prueba para el Organizador.
- PopupViewController.swift: Clase que gestiona la vista de popup para mostrar mensajes.
- PopupGameViewController.swift: Clase que gestiona la vista de popup para mostrar mensajes para iniciar una prueba.
- PopupSendViewController.swift: Clase que gestiona la vista de popup cuando se recibe una prueba del Organizador.
- PopupLockViewController.swift: Clase que gestiona la vista de popup cuando se necesita unos objetos para realizar una prueba.
- PopupSuspendActivityViewController.swift: Clase que gestiona la vista de popup para suspender un evento.
- BackViewController.swift: Clase que gestiona la vista de botón atrás.

- ActivityType: Directorio que contiene los viewcontrollers de cada tipo de actividad.
  -- ActivityTypeViewController.swift: Clase genérica que gestiona la vista de selección de tipo de actividad. Todos los viewcontrollers de tipo de actividad heredan de esta clase.
  -- ActivityType1ViewController.swift: Clase que gestiona la vista de tipo de actividad 1 preguntas y respuestas tipo test
  -- ActivityType1PointsViewController.swift: Clase que gestiona la vista para la preguntas abiertas
  -- ActivityType2ViewController.swift: Clase que gestiona la vista de tipo de actividad 2 pistas
  -- ActivityType3ViewController.swift: Clase que gestiona la vista de tipo de actividad 3 foto/video para realizar una foto o video
  -- ActivityType3PointsViewController.swift: Clase que gestiona la vista para la foto/video para puntuar la prueba
  -- ActivityType4ViewController.swift: Clase que gestiona la vista de tipo de actividad 4 puzzle
  -- ActivityType5ViewController.swift: Clase que gestiona la vista de tipo de actividad 5 parejas
  -- ActivityType6ViewController.swift: Clase que gestiona la vista de tipo de actividad 6 palabras relacionadas, contiente dos subviews que son las tablas de las palabras y las relaciones
  -- ActivityType6TableViewController.swift: Clase que gestiona la vista de la tabla de palabras

- cells: Directorio que contiene las celdas de las tablas de la aplicación.

- models: Directorio que contiene los modelos de datos de la aplicación. Cada modelo tiene su propia clase.
--- Model.swift: Clase base de todos los modelos de datos. Contiene los métodos para cargar y guardar los datos en Firebase. Los demás modelos heredan de esta clase.
--- Event.swift: Clase que gestiona los datos de un evento. 
--- EventResume.swift: Clase que gestiona los datos de un evento en resumen.
--- Team.swift: Clase que gestiona los datos de un equipo.
--- TeamResume.swift: Clase que gestiona los datos de un equipo en resumen.
--- Activity.swift: Clase que gestiona los datos de una actividad.
--- Icon.swift: Clase que gestiona los iconos de las actividades.
--- Admin.swift: Clase que gestiona los datos del Organizador.
--- Chat.swift: Clase que gestiona los datos de un chat.
--- Message.swift: Clase que gestiona los datos de un mensaje.
--- Fantasmas.swift: Clase que gestiona los datos de un fantasmas.
--- Fantasma.swift: Clase que gestiona los datos de un fantasma.

Además se dispone de algunas clases que extienden la funcionalidad de las clases de UIKit. También se dispone de una serie de clases de elementos UIEvent que extienede a clases UIKit estas clases permiten modificar los elementos de la interfaz gráfica de la aplicación dinámicamente según el color del evento.


# Estructura de directorios del nuevo proyecto
escultura/
├── public/
│   ├── sw.js                         # Service worker para cache de assets
│   └── index.html
├── src/
│   ├── assets/                       # Imágenes, iconos, fuentes
│   ├── components/                   # Componentes UI reusables (botones, modals...)
│   |   ├── backButton.jsx            # Botón de retroceso
│   |   ├── cacheEventAssets.jsx      # Componente para cachear todos los assets del evento y de la aplicación
│   |   ├── routeListner.jsx          # Componente para escuchar cambios en la ruta guardar la ultima ruta visitada
│   |   ├── backgroundLayout.jsx      # Componente de layout con fondo para las pantallas
│   |   ├── subscriptionManager.jsx   # Componente para gestionar la suscripción a Firebase del evento, equipos
│   ├── pages/                        # Contenedores o pantallas (Welcome, Events, Teams...)
│   |   ├── welcomePage.jsx           # Pantalla de bienvenida
│   |   ├── eventsPage.jsx            # Pantalla de selección de evento
│   |   ├── teamsPage.jsx             # Pantalla de selección de equipo
│   |   ├── teamPage.jsx              # Pantalla de foto de equipo
│   ├── features/                     # Dominios (events, teams, chat...)
|   |   ├── teams/                    # Dominio de equipos
|   |   |   |- teamsSlice.js          # Redux slice para equipos
|   |   ├── team/                     # Dominio de un equipo
|   |   |   |- teamSlice.js           # Redux slice para un equipo
|   |   ├── events/                   # Dominio de eventos
|   |   |   |- eventsSlice.js         # Redux slice para eventos
|   |   ├── event/                    # Dominio de un evento
|   |   |   |- eventSlice.js          # Redux slice para un evento
|   |   ├── activities/               # Dominio de actividades
|   |   |   |- activitiesSlice.js     # Redux slice para actividades
|   |   ├── session/                 # Dominio de sesión
|   |   |   |- sessionSlice.js       # Redux slice para sesión
│   ├── services/                     # API calls (backend, Firebase sync)
│   |   ├── api.js                    # Funciones para llamadas a la API del backend
│   |   ├── firebase.js               # Funciones para sincronización con Firebase
│   |   ├── assetsCache.js            # Funciones para cachear los assets del evento y de la aplicación
│   |   ├── uploadQueue.js           # Funciones para gestionar la subida de ficheros al servidor
│   ├── hooks/                        # Custom React hooks
│   ├── i18n/                         # Configuración de i18next y archivos de traducción
│   |  ├── en.json                      # Traducciones en inglés
│   |  ├── es.json                      # Traducciones en español
│   ├── styles/                       # Estilos de la aplicación (CSS, variables, resets)
│   |   ├── global.css                # Estilos globales   
│   |   ├── medias.css                # Media queries
│   |   └── reset.css                 # Reset de estilos
│   ├── App.jsx                       # Componente raíz y configuración de Router
│   ├── main.jsx                      # Punto de entrada, render de React
│   └── store.js                      # Configuración del store de Redux
├── .env                              # Claves y variables de entorno (no subir a repo)
├── .gitignore
├── package.json
├── vite.config.js
└── README.md

# Dependencias del proyecto
"@react-google-maps/api": "^2.20.6",
"@reduxjs/toolkit": "^2.7.0",
"firebase": "^11.6.1",
"i18next": "^25.0.2",
"prop-types": "^15.8.1",
"react": "^19.0.0",
"react-dom": "^19.0.0",
"react-i18next": "^15.5.1",
"react-redux": "^9.2.0",
"react-router-dom": "^7.5.3"

# Directivas para el LLM 

- Nombre de variable, funciones y clases en inglés, con camelCase.
- Los nombres de las variables y funciones deben ser descriptivos y claros.
- No usar abreviaturas en los nombres de las variables y funciones.
- No usar comentarios en el código, ya que el código debe ser autoexplicativo.
- Dispones de todo el codigo de la aplicación actual, solicitame cualquier fichero que necesites.
- Analiza paso por paso todo los aspectos de la aplicación y su funcionamiento.
- Si no entiendes algo, pregunta.
- Si no tienes suficiente información para realizar una tarea, pregunta.
- Siempre debes darme los estilos por separado, y reutilizar clases de estilos.
- Considera que solo se ha realizado los ficheros descritos en la estructura de directorios del nuevo proyecto. Cualquier fichero que no esté en la estructura de directorios no existe y habrá que crearlo. 
- Si necesitas modificar algun fichero existente, debes indicarme qué fichero es para yo facilitarte el código.

# Ficheros ya desarrollados de contexto para ser consistente el desarrollo

import React from "react";
import { Routes, Route } from "react-router-dom";

import RouteListener from "./components/routeListener";
import SubscriptionManager from "./components/subscriptionManager";
import CacheEventAssets from "./components/cacheEventAssets";

import WelcomePage from "./pages/welcomePage";
import EventsPage from "./pages/eventsPage";
import TeamsPage from "./pages/teamsPage";
import TeamPage from "./pages/teamPage";

import './styles/global.css';
import './styles/fonts.css';
import './styles/medias.css';
import './styles/reset.css';

function App() {
	return (
		<>
			<RouteListener />
			<SubscriptionManager />
			<CacheEventAssets />
			<Routes>
				<Route path="/" element={<WelcomePage />} />
				<Route path="/events" element={<EventsPage />} />
				<Route path="/teams/:eventId" element={<TeamsPage />} />
				<Route path="/team/:teamId" element={<TeamPage />} />
			</Routes>
		</>
	);
}

export default App;

// src/store.js

import { configureStore, combineReducers } from "@reduxjs/toolkit";
import {
	persistStore,
	persistReducer,
	FLUSH,
	REHYDRATE,
	PAUSE,
	PERSIST,
	PURGE,
	REGISTER,
} from "redux-persist";
import storage from "redux-persist/lib/storage";
import eventsReducer from "./features/events/eventsSlice";
import eventReducer from "./features/event/eventSlice";
import teamsReducer from "./features/teams/teamsSlice";
import activitiesReducer from "./features/activities/activitiesSlice";
import adminReducer from "./features/admin/adminSlice";
import sessionReducer from "./features/session/sessionSlice";

import { firebaseSyncMiddleware } from "./services/firebase";

const rootReducer = combineReducers({
  events: eventsReducer,
  event:  eventReducer,
  admin:  adminReducer,
  teams:  teamsReducer,
  activities:  activitiesReducer,
  session: sessionReducer
});

const persistConfig = {
  key: 'root',
  storage,
  whitelist: [
		'event', 
		'teams', 
		'team', 
		'admin',
		'session',
	]
};
const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = configureStore({
  reducer: persistedReducer,
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware({
			serializableCheck: {
				ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
			},
		}).prepend(firebaseSyncMiddleware),
});

export const persistor = persistStore(store);
export default store;




import { initializeApp } from "firebase/app";
import {
	getFirestore,
	doc,
	getDoc,
	updateDoc,
	onSnapshot,
	collection,
} from "firebase/firestore";

import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit";
import {
	setEvent, // de eventSlice
} from "../features/event/eventSlice";

import {
	setAdmin, // de adminSlice
} from "../features/admin/adminSlice";

import {
	updateTeamData, // thunk de teamsSlice
} from "../features/teams/teamsSlice";

// Configuración de Firebase desde variables de entorno
const firebaseConfig = {
	apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
	authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
	projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
	storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
	messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
	appId: import.meta.env.VITE_FIREBASE_APP_ID,
	// Si usas otras variables opcionales puedes añadirlas aquí
};

// Inicializa Firebase y Firestore
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

/**
 * Obtiene una única vez el documento de Firestore
 * @param {string|number} eventId
 * @returns {Object|null} Datos del evento o null si no existe
 */
export const fetchInitialEvent = async (eventId) => {
	const id = "event_" + eventId.toString();
	const docRef = doc(db, "events", id);
	const snapshot = await getDoc(docRef);
	return snapshot.exists() ? snapshot.data() : null;
};

/**
 * Suscribe a actualizaciones del documento de Firestore
 * @param {string|number} eventId
 * @param {(data: object) => void} onEventUpdate
 * @returns {Function} Función para cancelar la suscripción
 */
export const subscribeToEvent = (eventId, onEventUpdate) => {
	const id = eventId.toString();
	const docRef = doc(db, "events", `event_${id}`);
	// onSnapshot devuelve la función de desuscripción
	const unsubscribe = onSnapshot(docRef, (snapshot) => {
		if (snapshot.exists()) {
			onEventUpdate(snapshot.data());
		}
	});
	return unsubscribe;
};

export const fetchInitialTeams = async (eventId, teamsInit) => {
  const eventDocRef = doc(db, "events", `event_${eventId}`);
  const teamsColRef = collection(eventDocRef, "teams");

  let teams = [];
  for (const team of teamsInit) {
    const teamDocRef = doc(teamsColRef, `team_${team.id}`);
    const snapshot = await getDoc(teamDocRef);
    if (snapshot.exists()) {
      teams.push({ id: team.id, ...snapshot.data() });
    }
  }
  return teams;
};


export const subscribeTeam = (eventId, teamId, onTeamsUpdate) => {
	const eventDocRef = doc(db, "events", `event_${eventId}`);
	const teamsColRef = collection(eventDocRef, "teams");

	const teamDocRef = doc(teamsColRef, `team_${teamId}`);

	// onSnapshot devuelve la función unsubscribe
	const unsubscribe = onSnapshot(
		teamDocRef,
		(snapshot) => {
			if (snapshot.exists()) {
				onTeamsUpdate({ id: snapshot.id, ...snapshot.data() });
			} else {
				console.log("No hay datos de equipo");
			}
		},
		(error) => {
			console.error("Error escuchando teams:", error);
		}
	);

	return unsubscribe;
};

export const subscribeAdmin = (eventId, onAdminUpdate) => {
  const eventDocRef = doc(db, "events", `event_${eventId}`);
  const adminColRef = collection(eventDocRef, "admin");
  const adminDocRef = doc(adminColRef, "admin");

  const unsubscribe = onSnapshot(
		adminDocRef,
		(snapshot) => {
			if (snapshot.exists()) {
				const adminData = {
					id: adminDocRef.id,
					...snapshot.data(),
				};
				onAdminUpdate(adminData);
			} else {
				console.log("No hay datos de admin");
			}
		},
		(error) => {
			console.error("Error escuchando admin:", error);
		}
	);

  return unsubscribe;
};

/**
 * Cancela una suscripción devuelta por subscribeToEvent
 * @param {Function} unsubscribeFn
 */
export const unsubscribe = (unsubscribeFn) => {
	if (typeof unsubscribeFn === "function") {
		unsubscribeFn();
	}
};

export const updateEvent = async (eventId, partial) => {
	const ref = doc(db, "events", `event_${eventId}`);
	await updateDoc(ref, partial);
};

export const updateAdmin = async (eventId, partial) => {
	const ref = doc(db, "events", `event_${eventId}`, "admin", "admin");
	await updateDoc(ref, partial);
};

export const updateTeam = async (eventId, teamId, partial) => {
	const ref = doc(db, "events", `event_${eventId}`, "teams", `team_${teamId}`);
	await updateDoc(ref, partial);
};





const listener = createListenerMiddleware();

// Sincronizar event
listener.startListening({
	predicate: (action, currentState, prevState) => action.type === setEvent.type, // sólo cuando cambie event completo
	effect: async (action, listenerApi) => {
		const eventId = listenerApi.getState().event.id;
		await updateEvent(eventId, action.payload);
	},
});

// Sincronizar admin
listener.startListening({
	actionCreator: setAdmin,
	effect: async (action, listenerApi) => {
		const eventId = listenerApi.getState().event.id;
		await updateAdmin(eventId, action.payload);
	},
});

// Sincronizar equipos (optimista)
listener.startListening({
	actionCreator: updateTeamData.fulfilled,
	effect: async (action, listenerApi) => {
		const eventId = listenerApi.getState().event.id;
		const { teamId, changes } = action.payload;
		await updateTeam(eventId, teamId, changes);
	},
});

const firebaseSyncMiddleware = listener.middleware;
export { firebaseSyncMiddleware };







// src/pages/teamPage.jsx
import React, { useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import BackgroundLayout from "../components/backgroundLayout";
import BackButton from "../components/backButton";

import iconPhoto from "../assets/icono_equipo_foto.png";
import iconPlay from "../assets/Icon_cohete.png";
import eventDefaultLogo from "../assets/img_log_event.png";

import {
	setSelectedTeam,
	setTeamPhoto,
	setToken,
	setIsAdmin,
	generateTokenUniqueForDevice
} from "../features/session/sessionSlice";

import {updateTeamData} from "../features/teams/teamsSlice";

import { enqueueUpload } from "../services/uploadQueue";

const TeamPage = () => {
	const { t } = useTranslation();
	const { teamId } = useParams();
	const dispatch = useDispatch();
	const navigate = useNavigate();

  const event = useSelector((state) => state.event.event);
	const team = useSelector((state) =>
    state.teams.items.find((team) => Number(team.id) === Number(teamId))
  );
	const photo = useSelector((state) => state.session.teamPhoto);
	const token = useSelector((state) => state.session.token);

	const fileInputRef = useRef();

  const handleBack = () => {
		navigate(`/teams/${event.id}`, { replace: true });
	};

	const handlePhotoClick = () => {
		fileInputRef.current.click();
	};

	const onPhotoChange = (e) => {
		const file = e.target.files[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = () => {
				dispatch(setTeamPhoto(reader.result));
			};
			reader.readAsDataURL(file);
		}
	};

	const handlePlay = async () => {
		if (!photo) return;
		try {
			
			let event_path = "event_" + String(event.id);
			let team_path = "team_" + String(team.id);
			let file_name = "photo.jpeg"
			let img_path = event_path + "@" + team_path + "@" + file_name

			const uploadUrl = `/${img_path}/upload`;

			await enqueueUpload({
				file: photo,
				url: uploadUrl,
				metadata: {},
			});
			dispatch(setSelectedTeam(team));
			dispatch(setIsAdmin(false));
			let generatedToken = token;
			if (!generatedToken) {
				generatedToken = generateTokenUniqueForDevice();
				dispatch(setToken(generatedToken));
			}
			
			dispatch(
				updateTeamData({
					eventId: event.id,
					teamId: team.id,
					changes: {
						device: generatedToken,
						photo: img_path,
					},
				})
			);

		} catch (err) {
			console.error(err);
		}
	};

	if (!team) return <p>{t("teams.notFound")}</p>;

	return (
		<BackgroundLayout>
			<BackButton onClick={handleBack} />
			<div className="team-detail">
				{(photo && <img src={photo} alt="team" className="team-preview" onClick={handlePhotoClick} />) || (
					<img
						src={iconPhoto}
						alt="icono equipo"
						className="team-detail-icon"
						onClick={handlePhotoClick}
					/>
				)}
				<input
					type="file"
					accept="image/*"
					style={{ display: "none" }}
					ref={fileInputRef}
					capture="environment"
					onChange={onPhotoChange}
				/>
				<h2 className="team-title">{team.name}</h2>
        {
          event && event.logo && (
            <img
              src={event.logo}
              alt="logo evento"
              className="team-event-logo"
            />
          ) ||
          (
            <img 
              src={eventDefaultLogo}
              alt="logo evento"
              className="team-event-logo"
            />
          )
        }
				<button onClick={handlePlay} className="play-button">
          <img
            src={iconPlay}
            alt="icono play"
            className="team-detail-icon-play"
          />
					{t("play")}
				</button>
			</div>
		</BackgroundLayout>
	);
};
















export default TeamPage;


import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { initEvent } from "../../services/api";
import { initTeams } from "../teams/teamsSlice";
import { initActivities } from "../activities/activitiesSlice";

import {
	fetchInitialEvent,
} from "../../services/firebase";


export const initEventRoot = createAsyncThunk(
	"event/init",
	async ({ eventId }, { dispatch, rejectWithValue }) => {
		try {
			const firebaseId = await initEvent(eventId);
			dispatch(setEventId(firebaseId));

			const initialData = await fetchInitialEvent(firebaseId);
			if (initialData) {
				dispatch(setEvent(initialData));
				dispatch(initActivities(firebaseId, initialData.activities_data));
				dispatch(initTeams(firebaseId, initialData.teams_data));
			}

			return firebaseId;
		} catch (err) {
			return rejectWithValue(err.message);
		}
	}
);

const slice = createSlice({
	name: "event",
	initialState: {
		id: null,
		event: null,
		status: "idle",
		error: null,
	},
	reducers: {
		setEventId(state, { payload }) {
			state.id = payload;
		},
		setEvent(state, { payload }) {
			state.event = payload;
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(initEventRoot.pending, (state) => {
				state.status = "loading";
				state.error = null;
			})
			.addCase(initEventRoot.fulfilled, (state) => {
				state.status = "succeeded";
			})
			.addCase(initEventRoot.rejected, (state, { payload }) => {
				state.status = "failed";
				state.error = payload;
			});
	},
});

export const { setEventId, setEvent } = slice.actions;
export default slice.reducer;







// src/components/subscriptionManager.jsx
import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";

import {
	subscribeToEvent,
	subscribeTeam,
	subscribeAdmin,
} from "../services/firebase";
import { setEvent } from "../features/event/eventSlice";
import { setTeams } from "../features/teams/teamsSlice";
import { setAdmin } from "../features/admin/adminSlice";
import { clearSession } from "../features/session/sessionSlice";

export default function SubscriptionManager() {
	const dispatch = useDispatch();
	const eventId = useSelector((s) => s.event.id);
	const teams = useSelector((s) => s.teams.items);
  const refresh = useSelector((s) => s.session.refresh);
	const sessionToken = useSelector((s) => s.session.token);
	const selectedTeam = useSelector((s) => s.session.selectedTeam);
	

  

	useEffect(() => {
		if (!eventId) return;

		const unsubEvent = subscribeToEvent(eventId, (data) => {
			dispatch(setEvent(data));
		});

		const unsubAdmin = subscribeAdmin(eventId, (adminData) => {
			dispatch(setAdmin(adminData));
		});

		const unsubTeams = [];
		teams.forEach((team) => {
			const unsubTeam = subscribeTeam(eventId, team.id, (teamData) => {
				const currentItems = teams;
				const teamExists = currentItems.some((item) => item.id === teamData.id);
				if (!teamExists) {
					dispatch(setTeams([...currentItems, teamData]));
				} else {
					const updatedItems = currentItems.map((item) =>
						item.id === teamData.id ? teamData : item
					);
					dispatch(setTeams(updatedItems));
					if (
						teamData && selectedTeam &&
						teamData.id === selectedTeam.id &&
						teamData.device !== sessionToken &&
						sessionToken !== ""
					) {
						dispatch(clearSession());
						localStorage.removeItem("lastRoute");
						localStorage.removeItem("persist:root");
						window.location.reload();
					}
				}
			});
			unsubTeams.push(unsubTeam);
		});

		return () => {
			unsubEvent();
			unsubAdmin();
			unsubTeams.forEach((unsub) => unsub());
		};
	}, [eventId, dispatch, refresh, selectedTeam]);

	return null;
}























# Ficheros del proyecto antiguo de contexto para generar el siguiente paso

Storyboard

<scene sceneID="JfH-aM-DY0">
            <objects>
                <viewController restorationIdentifier="EventViewController" storyboardIdentifier="EventViewController" id="opz-mD-wLa" customClass="EventViewController" customModule="Escultura_Yincana" customModuleProvider="target" sceneMemberID="viewController">
                    <view key="view" contentMode="scaleToFill" id="7Vw-n1-CcV">
                        <rect key="frame" x="0.0" y="0.0" width="768" height="1024"/>
                        <autoresizingMask key="autoresizingMask" widthSizable="YES" heightSizable="YES"/>
                        <subviews>
                            <containerView opaque="NO" contentMode="scaleToFill" translatesAutoresizingMaskIntoConstraints="NO" id="WIM-vr-YfN">
                                <rect key="frame" x="0.0" y="70" width="768" height="954"/>
                                <connections>
                                    <segue destination="9wl-wM-Bbl" kind="embed" id="hCz-3L-1aH"/>
                                </connections>
                            </containerView>
                            <view opaque="NO" contentMode="scaleToFill" translatesAutoresizingMaskIntoConstraints="NO" id="N1e-Oq-3yd">
                                <rect key="frame" x="0.0" y="70" width="768" height="170"/>
                                <subviews>
                                    <imageView hidden="YES" clipsSubviews="YES" userInteractionEnabled="NO" contentMode="scaleAspectFit" image="escultura_brand.png" translatesAutoresizingMaskIntoConstraints="NO" id="tmV-QD-lkm">
                                        <rect key="frame" x="364" y="32" width="40" height="40"/>
                                        <constraints>
                                            <constraint firstAttribute="width" constant="40" id="8eL-o9-eEf"/>
                                            <constraint firstAttribute="height" constant="40" id="Rkg-va-fte"/>
                                        </constraints>
                                    </imageView>
                                    <label opaque="NO" userInteractionEnabled="NO" contentMode="left" horizontalHuggingPriority="251" verticalHuggingPriority="251" text="Evento" textAlignment="center" lineBreakMode="tailTruncation" baselineAdjustment="alignBaselines" adjustsFontSizeToFit="NO" translatesAutoresizingMaskIntoConstraints="NO" id="Ms7-Cd-l4t">
                                        <rect key="frame" x="163" y="74" width="442" height="39"/>
                                        <constraints>
                                            <constraint firstAttribute="width" constant="442" id="NrO-Zo-JXn"/>
                                            <constraint firstAttribute="height" constant="39" id="O4d-uy-atZ"/>
                                        </constraints>
                                        <fontDescription key="fontDescription" name="Optima-Bold" family="Optima" pointSize="32"/>
                                        <color key="textColor" white="0.33333333329999998" alpha="1" colorSpace="custom" customColorSpace="genericGamma22GrayColorSpace"/>
                                        <nil key="highlightedColor"/>
                                    </label>
                                    <label opaque="NO" userInteractionEnabled="NO" contentMode="left" horizontalHuggingPriority="251" verticalHuggingPriority="251" text="Equipo" textAlignment="center" lineBreakMode="tailTruncation" baselineAdjustment="alignBaselines" adjustsFontSizeToFit="NO" translatesAutoresizingMaskIntoConstraints="NO" id="LSt-Ut-WKa">
                                        <rect key="frame" x="148" y="121" width="472" height="28"/>
                                        <constraints>
                                            <constraint firstAttribute="width" constant="472" id="6yh-ja-fUI"/>
                                            <constraint firstAttribute="height" constant="28" id="Dle-KT-bX6"/>
                                        </constraints>
                                        <fontDescription key="fontDescription" name="Optima-Bold" family="Optima" pointSize="23"/>
                                        <color key="textColor" white="0.33333333329999998" alpha="1" colorSpace="custom" customColorSpace="genericGamma22GrayColorSpace"/>
                                        <nil key="highlightedColor"/>
                                    </label>
                                    <imageView clipsSubviews="YES" userInteractionEnabled="NO" contentMode="scaleAspectFit" horizontalHuggingPriority="251" verticalHuggingPriority="251" image="img_log_event.png" translatesAutoresizingMaskIntoConstraints="NO" id="0Vk-ln-B5c" userLabel="img_bussiness">
                                        <rect key="frame" x="23" y="23" width="120" height="120"/>
                                        <constraints>
                                            <constraint firstAttribute="height" constant="120" id="dpR-VI-qNN"/>
                                            <constraint firstAttribute="width" constant="120" id="hEm-yh-Fg4"/>
                                        </constraints>
                                    </imageView>
                                    <imageView clipsSubviews="YES" userInteractionEnabled="NO" contentMode="scaleAspectFit" horizontalHuggingPriority="251" verticalHuggingPriority="251" image="Icono_Organizacion.png" translatesAutoresizingMaskIntoConstraints="NO" id="jEN-Or-v8B" userLabel="img_team">
                                        <rect key="frame" x="625" y="23" width="120" height="120"/>
                                        <constraints>
                                            <constraint firstAttribute="height" constant="120" id="rai-pP-Vjc"/>
                                            <constraint firstAttribute="width" constant="120" id="vh6-Ta-HJz"/>
                                        </constraints>
                                    </imageView>
                                    <imageView hidden="YES" clipsSubviews="YES" userInteractionEnabled="NO" alpha="0.0" contentMode="scaleAspectFit" image="escultura_brand.png" translatesAutoresizingMaskIntoConstraints="NO" id="0An-Hk-k6Z">
                                        <rect key="frame" x="20" y="4" width="30" height="30"/>
                                        <constraints>
                                            <constraint firstAttribute="width" constant="30" id="RdR-fn-Kxf"/>
                                            <constraint firstAttribute="height" constant="30" id="slR-nl-jEY"/>
                                        </constraints>
                                    </imageView>
                                    <label opaque="NO" userInteractionEnabled="NO" alpha="0.0" contentMode="left" horizontalHuggingPriority="251" verticalHuggingPriority="251" text="Evento" lineBreakMode="tailTruncation" baselineAdjustment="alignBaselines" adjustsFontSizeToFit="NO" translatesAutoresizingMaskIntoConstraints="NO" id="jVW-0m-8PL">
                                        <rect key="frame" x="58" y="5" width="540" height="30"/>
                                        <constraints>
                                            <constraint firstAttribute="width" constant="540" id="66J-XM-IqX"/>
                                            <constraint firstAttribute="height" constant="30" id="JCx-5A-aJa"/>
                                        </constraints>
                                        <fontDescription key="fontDescription" name="Optima-Bold" family="Optima" pointSize="19"/>
                                        <color key="textColor" white="0.33333333329999998" alpha="1" colorSpace="custom" customColorSpace="genericGamma22GrayColorSpace"/>
                                        <nil key="highlightedColor"/>
                                    </label>
                                    <label opaque="NO" userInteractionEnabled="NO" alpha="0.0" contentMode="left" horizontalHuggingPriority="251" verticalHuggingPriority="251" text="Equipo" textAlignment="right" lineBreakMode="tailTruncation" baselineAdjustment="alignBaselines" adjustsFontSizeToFit="NO" translatesAutoresizingMaskIntoConstraints="NO" id="Qol-m8-bCt">
                                        <rect key="frame" x="468" y="5" width="280" height="28"/>
                                        <constraints>
                                            <constraint firstAttribute="width" constant="280" id="sbT-eW-OWu"/>
                                            <constraint firstAttribute="height" constant="28" id="yVL-Pq-H6X"/>
                                        </constraints>
                                        <fontDescription key="fontDescription" name="Optima-Bold" family="Optima" pointSize="19"/>
                                        <color key="textColor" white="0.33333333329999998" alpha="1" colorSpace="custom" customColorSpace="genericGamma22GrayColorSpace"/>
                                        <nil key="highlightedColor"/>
                                    </label>
                                    <view contentMode="scaleToFill" translatesAutoresizingMaskIntoConstraints="NO" id="TgI-EV-h1b" customClass="UIEventView" customModule="Escultura_Yincana" customModuleProvider="target">
                                        <rect key="frame" x="0.0" y="168" width="768" height="2"/>
                                        <color key="backgroundColor" red="0.75294117650000003" green="0.0" blue="0.1215686275" alpha="1" colorSpace="calibratedRGB"/>
                                        <constraints>
                                            <constraint firstAttribute="height" constant="2" id="LjR-fs-2oA"/>
                                        </constraints>
                                    </view>
                                </subviews>
                                <color key="backgroundColor" white="1" alpha="1" colorSpace="custom" customColorSpace="genericGamma22GrayColorSpace"/>
                                <gestureRecognizers/>
                                <constraints>
                                    <constraint firstItem="0Vk-ln-B5c" firstAttribute="leading" secondItem="N1e-Oq-3yd" secondAttribute="leading" constant="23" id="12t-D1-auD"/>
                                    <constraint firstAttribute="trailing" secondItem="TgI-EV-h1b" secondAttribute="trailing" id="1x0-in-Fqm"/>
                                    <constraint firstItem="tmV-QD-lkm" firstAttribute="centerX" secondItem="N1e-Oq-3yd" secondAttribute="centerX" id="9Wl-wg-m3S"/>
                                    <constraint firstItem="jVW-0m-8PL" firstAttribute="top" secondItem="N1e-Oq-3yd" secondAttribute="top" constant="5" id="Bfn-vi-LIL"/>
                                    <constraint firstItem="0An-Hk-k6Z" firstAttribute="top" secondItem="N1e-Oq-3yd" secondAttribute="top" constant="4" id="Dyb-KY-FR8"/>
                                    <constraint firstItem="Ms7-Cd-l4t" firstAttribute="centerX" secondItem="N1e-Oq-3yd" secondAttribute="centerX" id="GsJ-ub-pb8"/>
                                    <constraint firstAttribute="height" constant="170" identifier="height" id="H1D-TO-xCL"/>
                                    <constraint firstAttribute="trailing" secondItem="jEN-Or-v8B" secondAttribute="trailing" constant="23" id="KOH-f2-jQL"/>
                                    <constraint firstItem="LSt-Ut-WKa" firstAttribute="centerX" secondItem="N1e-Oq-3yd" secondAttribute="centerX" id="S01-aT-efh"/>
                                    <constraint firstAttribute="bottom" secondItem="TgI-EV-h1b" secondAttribute="bottom" id="T3e-uX-ukr"/>
                                    <constraint firstItem="Ms7-Cd-l4t" firstAttribute="top" secondItem="tmV-QD-lkm" secondAttribute="bottom" constant="2" id="Txe-Ym-HQH"/>
                                    <constraint firstItem="jVW-0m-8PL" firstAttribute="leading" secondItem="0An-Hk-k6Z" secondAttribute="trailing" constant="8" id="Xze-im-Ez6"/>
                                    <constraint firstItem="Qol-m8-bCt" firstAttribute="top" secondItem="N1e-Oq-3yd" secondAttribute="top" constant="5" id="aew-SQ-RWR"/>
                                    <constraint firstAttribute="trailing" secondItem="Qol-m8-bCt" secondAttribute="trailing" constant="20" id="ebR-V7-JhQ"/>
                                    <constraint firstAttribute="bottom" secondItem="0Vk-ln-B5c" secondAttribute="bottom" constant="27" id="frv-8q-WjL"/>
                                    <constraint firstItem="0An-Hk-k6Z" firstAttribute="leading" secondItem="N1e-Oq-3yd" secondAttribute="leading" constant="20" id="h0i-Xf-4Tr"/>
                                    <constraint firstItem="LSt-Ut-WKa" firstAttribute="top" secondItem="Ms7-Cd-l4t" secondAttribute="bottom" constant="8" id="iGl-do-PH1"/>
                                    <constraint firstAttribute="bottom" secondItem="jEN-Or-v8B" secondAttribute="bottom" constant="27" id="oSf-5J-L5o"/>
                                    <constraint firstAttribute="bottom" secondItem="LSt-Ut-WKa" secondAttribute="bottom" constant="21" id="pUb-J2-iWX"/>
                                    <constraint firstItem="TgI-EV-h1b" firstAttribute="leading" secondItem="N1e-Oq-3yd" secondAttribute="leading" id="vIO-cQ-7Pe"/>
                                </constraints>
                                <connections>
                                    <outletCollection property="gestureRecognizers" destination="tu4-xU-pen" appends="YES" id="iLc-om-hNA"/>
                                </connections>
                            </view>
                            <view contentMode="scaleToFill" translatesAutoresizingMaskIntoConstraints="NO" id="usM-5i-HCG" userLabel="footer">
                                <rect key="frame" x="0.0" y="824" width="768" height="200"/>
                                <subviews>
                                    <button opaque="NO" contentMode="scaleToFill" contentHorizontalAlignment="center" contentVerticalAlignment="center" buttonType="system" lineBreakMode="middleTruncation" translatesAutoresizingMaskIntoConstraints="NO" id="CQN-FN-l45" customClass="UIDecagone" customModule="Escultura_Yincana" customModuleProvider="target">
                                        <rect key="frame" x="314" y="13" width="140" height="140"/>
                                        <constraints>
                                            <constraint firstAttribute="height" constant="140" id="hvp-zG-reN"/>
                                            <constraint firstAttribute="width" constant="140" id="oAT-uR-fcq"/>
                                        </constraints>
                                        <userDefinedRuntimeAttributes>
                                            <userDefinedRuntimeAttribute type="color" keyPath="color">
                                                <color key="value" red="0.75294117650000003" green="0.0" blue="0.1215686275" alpha="1" colorSpace="calibratedRGB"/>
                                            </userDefinedRuntimeAttribute>
                                            <userDefinedRuntimeAttribute type="color" keyPath="colorStroke">
                                                <color key="value" red="0.75294117650000003" green="0.0" blue="0.1215686275" alpha="1" colorSpace="calibratedRGB"/>
                                            </userDefinedRuntimeAttribute>
                                            <userDefinedRuntimeAttribute type="color" keyPath="colorFill">
                                                <color key="value" systemColor="secondarySystemGroupedBackgroundColor"/>
                                            </userDefinedRuntimeAttribute>
                                            <userDefinedRuntimeAttribute type="color" keyPath="borderColorV">
                                                <color key="value" red="0.75294117650000003" green="0.0" blue="0.1215686275" alpha="1" colorSpace="calibratedRGB"/>
                                            </userDefinedRuntimeAttribute>
                                            <userDefinedRuntimeAttribute type="number" keyPath="lineWidth">
                                                <integer key="value" value="2"/>
                                            </userDefinedRuntimeAttribute>
                                            <userDefinedRuntimeAttribute type="number" keyPath="distance">
                                                <real key="value" value="1.3"/>
                                            </userDefinedRuntimeAttribute>
                                        </userDefinedRuntimeAttributes>
                                        <connections>
                                            <action selector="openMain:" destination="opz-mD-wLa" eventType="touchUpInside" id="RvV-qN-TPI"/>
                                        </connections>
                                    </button>
                                    <button opaque="NO" contentMode="scaleToFill" contentHorizontalAlignment="center" contentVerticalAlignment="center" lineBreakMode="middleTruncation" translatesAutoresizingMaskIntoConstraints="NO" id="8sj-hX-PtL" customClass="UIEventButtonContainer" customModule="Escultura_Yincana" customModuleProvider="target">
                                        <rect key="frame" x="142" y="33" width="100" height="100"/>
                                        <color key="backgroundColor" white="1" alpha="1" colorSpace="custom" customColorSpace="genericGamma22GrayColorSpace"/>
                                        <constraints>
                                            <constraint firstAttribute="height" constant="100" id="Sr6-Sb-6Q3"/>
                                            <constraint firstAttribute="width" constant="100" id="v30-D6-NIe"/>
                                        </constraints>
                                        <state key="normal" title="Button" image="icon_chat.png"/>
                                        <userDefinedRuntimeAttributes>
                                            <userDefinedRuntimeAttribute type="number" keyPath="cornerRadiusV">
                                                <real key="value" value="30"/>
                                            </userDefinedRuntimeAttribute>
                                            <userDefinedRuntimeAttribute type="color" keyPath="borderColorV">
                                                <color key="value" red="0.75294117650000003" green="0.0" blue="0.1215686275" alpha="1" colorSpace="calibratedRGB"/>
                                            </userDefinedRuntimeAttribute>
                                            <userDefinedRuntimeAttribute type="number" keyPath="borderWidthV">
                                                <real key="value" value="1.5"/>
                                            </userDefinedRuntimeAttribute>
                                        </userDefinedRuntimeAttributes>
                                        <connections>
                                            <action selector="openChat:" destination="opz-mD-wLa" eventType="touchDown" id="376-At-XeQ"/>
                                        </connections>
                                    </button>
                                    <button opaque="NO" contentMode="scaleToFill" contentHorizontalAlignment="center" contentVerticalAlignment="center" lineBreakMode="middleTruncation" translatesAutoresizingMaskIntoConstraints="NO" id="Y5U-qI-5aN" customClass="UIEventButtonContainer" customModule="Escultura_Yincana" customModuleProvider="target">
                                        <rect key="frame" x="526" y="33" width="100" height="100"/>
                                        <color key="backgroundColor" white="1" alpha="1" colorSpace="custom" customColorSpace="genericGamma22GrayColorSpace"/>
                                        <constraints>
                                            <constraint firstAttribute="height" constant="100" id="Af2-Ev-y6Y"/>
                                            <constraint firstAttribute="width" constant="100" id="euO-7l-mTY"/>
                                        </constraints>
                                        <inset key="titleEdgeInsets" minX="-9" minY="60" maxX="5" maxY="0.0"/>
                                        <state key="normal" image="icon_gadgets.png"/>
                                        <userDefinedRuntimeAttributes>
                                            <userDefinedRuntimeAttribute type="number" keyPath="cornerRadiusV">
                                                <real key="value" value="30"/>
                                            </userDefinedRuntimeAttribute>
                                            <userDefinedRuntimeAttribute type="color" keyPath="borderColorV">
                                                <color key="value" red="0.75294117650000003" green="0.0" blue="0.1215686275" alpha="1" colorSpace="calibratedRGB"/>
                                            </userDefinedRuntimeAttribute>
                                            <userDefinedRuntimeAttribute type="number" keyPath="borderWidthV">
                                                <real key="value" value="1.5"/>
                                            </userDefinedRuntimeAttribute>
                                        </userDefinedRuntimeAttributes>
                                        <connections>
                                            <action selector="gadgets:" destination="opz-mD-wLa" eventType="touchDown" id="OOC-6Y-CmJ"/>
                                        </connections>
                                    </button>
                                    <containerView opaque="NO" multipleTouchEnabled="YES" contentMode="scaleToFill" translatesAutoresizingMaskIntoConstraints="NO" id="y9r-0t-kel" userLabel="Cronometro Container View">
                                        <rect key="frame" x="340" y="68" width="88" height="30"/>
                                        <color key="backgroundColor" white="0.0" alpha="0.0" colorSpace="custom" customColorSpace="genericGamma22GrayColorSpace"/>
                                        <constraints>
                                            <constraint firstAttribute="height" constant="30" id="EER-KT-Lxq"/>
                                            <constraint firstAttribute="width" constant="88" id="s0r-hA-ioo"/>
                                        </constraints>
                                        <connections>
                                            <segue destination="jYj-cQ-nv7" kind="embed" id="MUE-q5-lGm"/>
                                        </connections>
                                    </containerView>
                                    <view hidden="YES" contentMode="scaleToFill" translatesAutoresizingMaskIntoConstraints="NO" id="iet-Q8-WUx">
                                        <rect key="frame" x="648" y="120" width="120" height="80"/>
                                        <subviews>
                                            <label opaque="NO" userInteractionEnabled="NO" contentMode="left" horizontalHuggingPriority="251" verticalHuggingPriority="251" text="56.5342432432324" textAlignment="natural" lineBreakMode="tailTruncation" baselineAdjustment="alignBaselines" adjustsFontSizeToFit="NO" translatesAutoresizingMaskIntoConstraints="NO" id="XfM-V3-1qP">
                                                <rect key="frame" x="8" y="8" width="112" height="21"/>
                                                <constraints>
                                                    <constraint firstAttribute="height" constant="21" id="P9d-LK-dw9"/>
                                                </constraints>
                                                <fontDescription key="fontDescription" type="system" pointSize="14"/>
                                                <nil key="textColor"/>
                                                <nil key="highlightedColor"/>
                                            </label>
                                            <label opaque="NO" userInteractionEnabled="NO" contentMode="left" horizontalHuggingPriority="251" verticalHuggingPriority="251" text="56.5342432432324" textAlignment="natural" lineBreakMode="tailTruncation" baselineAdjustment="alignBaselines" adjustsFontSizeToFit="NO" translatesAutoresizingMaskIntoConstraints="NO" id="1bv-9L-3Ey">
                                                <rect key="frame" x="8" y="37" width="112" height="21"/>
                                                <constraints>
                                                    <constraint firstAttribute="height" constant="21" id="nNz-lD-5tM"/>
                                                </constraints>
                                                <fontDescription key="fontDescription" type="system" pointSize="14"/>
                                                <nil key="textColor"/>
                                                <nil key="highlightedColor"/>
                                            </label>
                                        </subviews>
                                        <color key="backgroundColor" systemColor="systemBackgroundColor"/>
                                        <constraints>
                                            <constraint firstAttribute="height" constant="80" id="GWD-pQ-E8q"/>
                                            <constraint firstAttribute="bottom" secondItem="1bv-9L-3Ey" secondAttribute="bottom" constant="22" id="I8E-sa-4f6"/>
                                            <constraint firstItem="XfM-V3-1qP" firstAttribute="top" secondItem="iet-Q8-WUx" secondAttribute="top" constant="8" id="NYl-g1-HvF"/>
                                            <constraint firstItem="XfM-V3-1qP" firstAttribute="leading" secondItem="iet-Q8-WUx" secondAttribute="leading" constant="8" id="P0a-PX-I8n"/>
                                            <constraint firstAttribute="trailing" secondItem="1bv-9L-3Ey" secondAttribute="trailing" id="YLp-HF-6Rh"/>
                                            <constraint firstAttribute="trailing" secondItem="XfM-V3-1qP" secondAttribute="trailing" id="ecq-gR-D1P"/>
                                            <constraint firstItem="1bv-9L-3Ey" firstAttribute="leading" secondItem="iet-Q8-WUx" secondAttribute="leading" constant="8" id="l5e-yc-cGp"/>
                                            <constraint firstAttribute="width" constant="120" id="oFW-1f-gVC"/>
                                        </constraints>
                                    </view>
                                    <label hidden="YES" opaque="NO" userInteractionEnabled="NO" contentMode="left" horizontalHuggingPriority="251" verticalHuggingPriority="251" text="99" textAlignment="center" lineBreakMode="tailTruncation" baselineAdjustment="alignBaselines" adjustsFontSizeToFit="NO" translatesAutoresizingMaskIntoConstraints="NO" id="evR-Ps-MqB">
                                        <rect key="frame" x="223" y="105" width="30" height="30"/>
                                        <color key="backgroundColor" red="0.75294117650000003" green="0.0" blue="0.1215686275" alpha="1" colorSpace="calibratedRGB"/>
                                        <constraints>
                                            <constraint firstAttribute="height" constant="30" id="9Ja-LN-QgM"/>
                                            <constraint firstAttribute="width" constant="30" id="vVA-FQ-dRR"/>
                                        </constraints>
                                        <fontDescription key="fontDescription" type="system" pointSize="17"/>
                                        <color key="textColor" white="1" alpha="1" colorSpace="custom" customColorSpace="genericGamma22GrayColorSpace"/>
                                        <nil key="highlightedColor"/>
                                        <userDefinedRuntimeAttributes>
                                            <userDefinedRuntimeAttribute type="number" keyPath="cornerRadiusV">
                                                <real key="value" value="15"/>
                                            </userDefinedRuntimeAttribute>
                                            <userDefinedRuntimeAttribute type="color" keyPath="borderColorV">
                                                <color key="value" red="0.75294117650000003" green="0.0" blue="0.1215686275" alpha="1" colorSpace="calibratedRGB"/>
                                            </userDefinedRuntimeAttribute>
                                            <userDefinedRuntimeAttribute type="number" keyPath="borderWidthV">
                                                <real key="value" value="1"/>
                                            </userDefinedRuntimeAttribute>
                                        </userDefinedRuntimeAttributes>
                                    </label>
                                </subviews>
                                <color key="backgroundColor" white="0.0" alpha="0.0" colorSpace="custom" customColorSpace="genericGamma22GrayColorSpace"/>
                                <constraints>
                                    <constraint firstItem="Y5U-qI-5aN" firstAttribute="centerX" secondItem="usM-5i-HCG" secondAttribute="centerX" multiplier="1.5" id="1bG-sm-XKc"/>
                                    <constraint firstItem="evR-Ps-MqB" firstAttribute="centerX" secondItem="usM-5i-HCG" secondAttribute="centerX" multiplier="0.62" id="2MA-1O-212"/>
                                    <constraint firstAttribute="bottom" secondItem="iet-Q8-WUx" secondAttribute="bottom" id="5bR-H6-UHH"/>
                                    <constraint firstItem="CQN-FN-l45" firstAttribute="top" secondItem="usM-5i-HCG" secondAttribute="top" constant="13" id="Jtf-a4-A9R"/>
                                    <constraint firstItem="8sj-hX-PtL" firstAttribute="top" secondItem="usM-5i-HCG" secondAttribute="top" constant="33" id="OaM-oC-v0u"/>
                                    <constraint firstAttribute="height" constant="200" id="PKb-UN-633"/>
                                    <constraint firstItem="evR-Ps-MqB" firstAttribute="top" secondItem="usM-5i-HCG" secondAttribute="top" constant="105" id="ZhS-Ha-NS2"/>
                                    <constraint firstItem="Y5U-qI-5aN" firstAttribute="top" secondItem="usM-5i-HCG" secondAttribute="top" constant="33" id="ahp-Qp-Cju"/>
                                    <constraint firstAttribute="trailing" secondItem="iet-Q8-WUx" secondAttribute="trailing" id="ock-dF-Zp2"/>
                                    <constraint firstItem="CQN-FN-l45" firstAttribute="centerX" secondItem="usM-5i-HCG" secondAttribute="centerX" id="q4f-ut-IuF"/>
                                    <constraint firstAttribute="bottom" secondItem="y9r-0t-kel" secondAttribute="bottom" constant="102" id="xge-Bh-tkF"/>
                                    <constraint firstItem="8sj-hX-PtL" firstAttribute="centerX" secondItem="usM-5i-HCG" secondAttribute="centerX" multiplier="0.5" id="yPy-2D-kkA"/>
                                    <constraint firstItem="y9r-0t-kel" firstAttribute="centerX" secondItem="usM-5i-HCG" secondAttribute="centerX" id="z7D-z6-cIR"/>
                                </constraints>
                            </view>
                            <view hidden="YES" contentMode="scaleToFill" translatesAutoresizingMaskIntoConstraints="NO" id="BJl-Ep-Vd4" userLabel="menu_organizer">
                                <rect key="frame" x="0.0" y="240" width="768" height="100"/>
                                <subviews>
                                    <button opaque="NO" contentMode="scaleToFill" contentHorizontalAlignment="center" contentVerticalAlignment="center" lineBreakMode="middleTruncation" translatesAutoresizingMaskIntoConstraints="NO" id="sCT-Uq-GgL" customClass="UIEventButtonContainer" customModule="Escultura_Yincana" customModuleProvider="target">
                                        <rect key="frame" x="56" y="10" width="80" height="80"/>
                                        <color key="backgroundColor" white="1" alpha="1" colorSpace="custom" customColorSpace="genericGamma22GrayColorSpace"/>
                                        <constraints>
                                            <constraint firstAttribute="height" constant="80" id="7dp-UG-Lw4"/>
                                            <constraint firstAttribute="width" constant="80" id="AuV-UB-O6h"/>
                                        </constraints>
                                        <state key="normal" title="Button" image="icom_foto.png"/>
                                        <userDefinedRuntimeAttributes>
                                            <userDefinedRuntimeAttribute type="number" keyPath="borderWidthV">
                                                <real key="value" value="1"/>
                                            </userDefinedRuntimeAttribute>
                                            <userDefinedRuntimeAttribute type="color" keyPath="borderColorV">
                                                <color key="value" red="0.75294117650000003" green="0.0" blue="0.1215686275" alpha="1" colorSpace="calibratedRGB"/>
                                            </userDefinedRuntimeAttribute>
                                            <userDefinedRuntimeAttribute type="number" keyPath="cornerRadiusV">
                                                <real key="value" value="30"/>
                                            </userDefinedRuntimeAttribute>
                                        </userDefinedRuntimeAttributes>
                                        <connections>
                                            <action selector="openPhotos:" destination="opz-mD-wLa" eventType="touchDown" id="nXs-1R-NNj"/>
                                        </connections>
                                    </button>
                                    <button opaque="NO" contentMode="scaleToFill" contentHorizontalAlignment="center" contentVerticalAlignment="center" lineBreakMode="middleTruncation" translatesAutoresizingMaskIntoConstraints="NO" id="lpA-xm-Iwm" customClass="UIEventButtonContainer" customModule="Escultura_Yincana" customModuleProvider="target">
                                        <rect key="frame" x="171" y="10" width="80" height="80"/>
                                        <color key="backgroundColor" white="1" alpha="1" colorSpace="custom" customColorSpace="genericGamma22GrayColorSpace"/>
                                        <constraints>
                                            <constraint firstAttribute="width" constant="80" id="LUX-0L-XXd"/>
                                            <constraint firstAttribute="height" constant="80" id="r03-Sy-lLV"/>
                                        </constraints>
                                        <state key="normal" title="Button" image="icon_clasificacion.png"/>
                                        <userDefinedRuntimeAttributes>
                                            <userDefinedRuntimeAttribute type="number" keyPath="borderWidthV">
                                                <real key="value" value="1"/>
                                            </userDefinedRuntimeAttribute>
                                            <userDefinedRuntimeAttribute type="color" keyPath="borderColorV">
                                                <color key="value" red="0.75294117650000003" green="0.0" blue="0.1215686275" alpha="1" colorSpace="calibratedRGB"/>
                                            </userDefinedRuntimeAttribute>
                                            <userDefinedRuntimeAttribute type="number" keyPath="cornerRadiusV">
                                                <real key="value" value="30"/>
                                            </userDefinedRuntimeAttribute>
                                        </userDefinedRuntimeAttributes>
                                        <connections>
                                            <action selector="openRanking:" destination="opz-mD-wLa" eventType="touchDown" id="Kr8-nS-ebR"/>
                                        </connections>
                                    </button>
                                    <button opaque="NO" contentMode="scaleToFill" contentHorizontalAlignment="center" contentVerticalAlignment="center" lineBreakMode="middleTruncation" translatesAutoresizingMaskIntoConstraints="NO" id="a1H-UK-IK9" customClass="UIEventButtonContainer" customModule="Escultura_Yincana" customModuleProvider="target">
                                        <rect key="frame" x="401.5" y="10" width="80" height="80"/>
                                        <color key="backgroundColor" white="1" alpha="1" colorSpace="custom" customColorSpace="genericGamma22GrayColorSpace"/>
                                        <constraints>
                                            <constraint firstAttribute="width" constant="80" id="9eq-15-Tpl"/>
                                            <constraint firstAttribute="height" constant="80" id="Z53-N8-bgB"/>
                                        </constraints>
                                        <state key="normal" title="Button" image="icon_prueba.png"/>
                                        <userDefinedRuntimeAttributes>
                                            <userDefinedRuntimeAttribute type="number" keyPath="borderWidthV">
                                                <real key="value" value="1"/>
                                            </userDefinedRuntimeAttribute>
                                            <userDefinedRuntimeAttribute type="color" keyPath="borderColorV">
                                                <color key="value" red="0.75294117650000003" green="0.0" blue="0.1215686275" alpha="1" colorSpace="calibratedRGB"/>
                                            </userDefinedRuntimeAttribute>
                                            <userDefinedRuntimeAttribute type="number" keyPath="cornerRadiusV">
                                                <real key="value" value="30"/>
                                            </userDefinedRuntimeAttribute>
                                        </userDefinedRuntimeAttributes>
                                        <connections>
                                            <action selector="openActivities:" destination="opz-mD-wLa" eventType="touchDown" id="aj6-PF-2kH"/>
                                        </connections>
                                    </button>
                                    <button opaque="NO" contentMode="scaleToFill" contentHorizontalAlignment="center" contentVerticalAlignment="center" lineBreakMode="middleTruncation" translatesAutoresizingMaskIntoConstraints="NO" id="niE-Pb-ubI" customClass="UIEventButtonContainer" customModule="Escultura_Yincana" customModuleProvider="target">
                                        <rect key="frame" x="517" y="10" width="80" height="80"/>
                                        <color key="backgroundColor" white="1" alpha="1" colorSpace="custom" customColorSpace="genericGamma22GrayColorSpace"/>
                                        <constraints>
                                            <constraint firstAttribute="width" constant="80" id="SUY-Q1-FYS"/>
                                            <constraint firstAttribute="height" constant="80" id="kFP-xp-JTn"/>
                                        </constraints>
                                        <state key="normal" title="Button" image="icon_asignar.png"/>
                                        <userDefinedRuntimeAttributes>
                                            <userDefinedRuntimeAttribute type="number" keyPath="borderWidthV">
                                                <real key="value" value="1"/>
                                            </userDefinedRuntimeAttribute>
                                            <userDefinedRuntimeAttribute type="color" keyPath="borderColorV">
                                                <color key="value" red="0.75294117650000003" green="0.0" blue="0.1215686275" alpha="1" colorSpace="calibratedRGB"/>
                                            </userDefinedRuntimeAttribute>
                                            <userDefinedRuntimeAttribute type="number" keyPath="cornerRadiusV">
                                                <real key="value" value="30"/>
                                            </userDefinedRuntimeAttribute>
                                        </userDefinedRuntimeAttributes>
                                        <connections>
                                            <action selector="openAsignation:" destination="opz-mD-wLa" eventType="touchDown" id="ig1-vh-A4K"/>
                                        </connections>
                                    </button>
                                    <button opaque="NO" contentMode="scaleToFill" contentHorizontalAlignment="center" contentVerticalAlignment="center" lineBreakMode="middleTruncation" translatesAutoresizingMaskIntoConstraints="NO" id="Lbs-W3-1or" customClass="UIEventButtonContainer" customModule="Escultura_Yincana" customModuleProvider="target">
                                        <rect key="frame" x="632" y="10" width="80" height="80"/>
                                        <color key="backgroundColor" white="1" alpha="1" colorSpace="custom" customColorSpace="genericGamma22GrayColorSpace"/>
                                        <constraints>
                                            <constraint firstAttribute="height" constant="80" id="VcW-ZX-1Ig"/>
                                            <constraint firstAttribute="width" constant="80" id="hqF-YC-DaO"/>
                                        </constraints>
                                        <state key="normal" title="Button" image="icon_suspender.png"/>
                                        <userDefinedRuntimeAttributes>
                                            <userDefinedRuntimeAttribute type="number" keyPath="borderWidthV">
                                                <real key="value" value="1"/>
                                            </userDefinedRuntimeAttribute>
                                            <userDefinedRuntimeAttribute type="color" keyPath="borderColorV">
                                                <color key="value" red="0.75294117650000003" green="0.0" blue="0.1215686275" alpha="1" colorSpace="calibratedRGB"/>
                                            </userDefinedRuntimeAttribute>
                                            <userDefinedRuntimeAttribute type="number" keyPath="cornerRadiusV">
                                                <real key="value" value="30"/>
                                            </userDefinedRuntimeAttribute>
                                        </userDefinedRuntimeAttributes>
                                        <connections>
                                            <action selector="suspend_event:" destination="opz-mD-wLa" eventType="touchDown" id="fH6-TE-zA0"/>
                                        </connections>
                                    </button>
                                    <view contentMode="scaleToFill" translatesAutoresizingMaskIntoConstraints="NO" id="Gnl-Pz-5Qf" customClass="UIEventView" customModule="Escultura_Yincana" customModuleProvider="target">
                                        <rect key="frame" x="0.0" y="100" width="768" height="2"/>
                                        <color key="backgroundColor" red="0.75294117650000003" green="0.0" blue="0.1215686275" alpha="1" colorSpace="calibratedRGB"/>
                                        <constraints>
                                            <constraint firstAttribute="height" constant="2" id="HCN-SM-M6f"/>
                                        </constraints>
                                    </view>
                                    <button opaque="NO" contentMode="scaleToFill" contentHorizontalAlignment="center" contentVerticalAlignment="center" lineBreakMode="middleTruncation" translatesAutoresizingMaskIntoConstraints="NO" id="udJ-tA-adV" customClass="UIEventButtonContainer" customModule="Escultura_Yincana" customModuleProvider="target">
                                        <rect key="frame" x="286.5" y="10" width="80" height="80"/>
                                        <color key="backgroundColor" white="1" alpha="1" colorSpace="custom" customColorSpace="genericGamma22GrayColorSpace"/>
                                        <constraints>
                                            <constraint firstAttribute="height" constant="80" id="7x2-Zt-oET"/>
                                            <constraint firstAttribute="width" constant="80" id="EBB-wF-Sg9"/>
                                        </constraints>
                                        <state key="normal" title="Button" image="Puntuar.png"/>
                                        <userDefinedRuntimeAttributes>
                                            <userDefinedRuntimeAttribute type="number" keyPath="borderWidthV">
                                                <real key="value" value="1"/>
                                            </userDefinedRuntimeAttribute>
                                            <userDefinedRuntimeAttribute type="color" keyPath="borderColorV">
                                                <color key="value" red="0.75294117650000003" green="0.0" blue="0.1215686275" alpha="1" colorSpace="calibratedRGB"/>
                                            </userDefinedRuntimeAttribute>
                                            <userDefinedRuntimeAttribute type="number" keyPath="cornerRadiusV">
                                                <real key="value" value="30"/>
                                            </userDefinedRuntimeAttribute>
                                        </userDefinedRuntimeAttributes>
                                        <connections>
                                            <action selector="valorateActivities:" destination="opz-mD-wLa" eventType="touchDown" id="zbi-zI-eQo"/>
                                        </connections>
                                    </button>
                                </subviews>
                                <color key="backgroundColor" white="1" alpha="1" colorSpace="custom" customColorSpace="genericGamma22GrayColorSpace"/>
                                <gestureRecognizers/>
                                <constraints>
                                    <constraint firstAttribute="height" constant="100" id="8jR-F7-eFf"/>
                                    <constraint firstItem="sCT-Uq-GgL" firstAttribute="centerX" secondItem="BJl-Ep-Vd4" secondAttribute="centerX" multiplier="0.25" id="CBr-yD-kSs"/>
                                    <constraint firstItem="Lbs-W3-1or" firstAttribute="centerX" secondItem="BJl-Ep-Vd4" secondAttribute="centerX" multiplier="1.75" id="EVt-p0-6Nm"/>
                                    <constraint firstItem="Lbs-W3-1or" firstAttribute="top" secondItem="BJl-Ep-Vd4" secondAttribute="top" constant="10" id="Itr-mH-vRU"/>
                                    <constraint firstItem="udJ-tA-adV" firstAttribute="top" secondItem="BJl-Ep-Vd4" secondAttribute="top" constant="10" id="LEG-ww-MNc"/>
                                    <constraint firstItem="niE-Pb-ubI" firstAttribute="top" secondItem="BJl-Ep-Vd4" secondAttribute="top" constant="10" id="YQj-Rt-1mv"/>
                                    <constraint firstAttribute="trailing" secondItem="Gnl-Pz-5Qf" secondAttribute="trailing" id="d80-BY-q4l"/>
                                    <constraint firstItem="Gnl-Pz-5Qf" firstAttribute="leading" secondItem="BJl-Ep-Vd4" secondAttribute="leading" id="dot-nl-M3w"/>
                                    <constraint firstItem="niE-Pb-ubI" firstAttribute="centerX" secondItem="BJl-Ep-Vd4" secondAttribute="centerX" multiplier="1.45" id="fi2-SJ-6dV"/>
                                    <constraint firstItem="sCT-Uq-GgL" firstAttribute="top" secondItem="BJl-Ep-Vd4" secondAttribute="top" constant="10" id="icp-bA-PfO"/>
                                    <constraint firstItem="lpA-xm-Iwm" firstAttribute="top" secondItem="BJl-Ep-Vd4" secondAttribute="top" constant="10" id="jyn-jq-BEk"/>
                                    <constraint firstItem="a1H-UK-IK9" firstAttribute="centerX" secondItem="BJl-Ep-Vd4" secondAttribute="centerX" multiplier="1.15" id="qm1-xA-rYB"/>
                                    <constraint firstItem="udJ-tA-adV" firstAttribute="centerX" secondItem="BJl-Ep-Vd4" secondAttribute="centerX" multiplier="0.85" id="t22-p8-rmK"/>
                                    <constraint firstItem="a1H-UK-IK9" firstAttribute="top" secondItem="BJl-Ep-Vd4" secondAttribute="top" constant="10" id="tzd-Pb-0b2"/>
                                    <constraint firstAttribute="bottom" secondItem="Gnl-Pz-5Qf" secondAttribute="bottom" constant="-2" id="yWF-7W-JGl"/>
                                    <constraint firstItem="lpA-xm-Iwm" firstAttribute="centerX" secondItem="BJl-Ep-Vd4" secondAttribute="centerX" multiplier="0.55" id="z06-Xd-giQ"/>
                                </constraints>
                                <connections>
                                    <outletCollection property="gestureRecognizers" destination="7Sc-0a-Oda" appends="YES" id="IAd-pl-gLr"/>
                                </connections>
                            </view>
                            <label opaque="NO" userInteractionEnabled="NO" contentMode="left" horizontalHuggingPriority="251" verticalHuggingPriority="251" text="Posición" textAlignment="natural" lineBreakMode="tailTruncation" baselineAdjustment="alignBaselines" adjustsFontSizeToFit="NO" translatesAutoresizingMaskIntoConstraints="NO" id="YP5-aW-Vsq">
                                <rect key="frame" x="353" y="931" width="62" height="21"/>
                                <constraints>
                                    <constraint firstAttribute="height" constant="21" id="8Bq-PQ-HBS"/>
                                    <constraint firstAttribute="width" constant="62" id="XCe-vW-JQU"/>
                                </constraints>
                                <fontDescription key="fontDescription" name="Optima-Regular" family="Optima" pointSize="17"/>
                                <color key="textColor" white="0.33333333329999998" alpha="1" colorSpace="custom" customColorSpace="genericGamma22GrayColorSpace"/>
                                <nil key="highlightedColor"/>
                            </label>
                            <label opaque="NO" multipleTouchEnabled="YES" contentMode="left" horizontalHuggingPriority="251" verticalHuggingPriority="251" text="1" textAlignment="center" lineBreakMode="tailTruncation" baselineAdjustment="alignBaselines" adjustsFontSizeToFit="NO" translatesAutoresizingMaskIntoConstraints="NO" id="RcE-XQ-iIY">
                                <rect key="frame" x="346" y="857" width="76" height="66"/>
                                <constraints>
                                    <constraint firstAttribute="width" constant="76" id="2mP-hG-U5O"/>
                                    <constraint firstAttribute="height" constant="66" id="4Gv-zH-ghe"/>
                                </constraints>
                                <fontDescription key="fontDescription" name="Optima-Bold" family="Optima" pointSize="55"/>
                                <color key="textColor" white="0.33333333333333331" alpha="1" colorSpace="custom" customColorSpace="genericGamma22GrayColorSpace"/>
                                <nil key="highlightedColor"/>
                            </label>
                        </subviews>
                        <viewLayoutGuide key="safeArea" id="nbW-NX-KfY"/>
                        <color key="backgroundColor" systemColor="systemBackgroundColor"/>
                        <constraints>
                            <constraint firstItem="YP5-aW-Vsq" firstAttribute="top" secondItem="RcE-XQ-iIY" secondAttribute="bottom" constant="8" symbolic="YES" id="3Pf-rH-yZd"/>
                            <constraint firstItem="BJl-Ep-Vd4" firstAttribute="top" secondItem="N1e-Oq-3yd" secondAttribute="bottom" id="4Tn-OB-n5m"/>
                            <constraint firstItem="N1e-Oq-3yd" firstAttribute="leading" secondItem="nbW-NX-KfY" secondAttribute="leading" id="Kbf-xq-xXq"/>
                            <constraint firstItem="WIM-vr-YfN" firstAttribute="trailing" secondItem="nbW-NX-KfY" secondAttribute="trailing" id="Mfa-gL-hvF"/>
                            <constraint firstItem="usM-5i-HCG" firstAttribute="leading" secondItem="nbW-NX-KfY" secondAttribute="leading" id="V9Q-zs-3nn"/>
                            <constraint firstItem="WIM-vr-YfN" firstAttribute="bottom" secondItem="nbW-NX-KfY" secondAttribute="bottom" id="VIY-Ta-WQx"/>
                            <constraint firstItem="BJl-Ep-Vd4" firstAttribute="leading" secondItem="nbW-NX-KfY" secondAttribute="leading" id="XY1-Ly-lUU"/>
                            <constraint firstItem="usM-5i-HCG" firstAttribute="bottom" secondItem="nbW-NX-KfY" secondAttribute="bottom" id="bN8-VC-muU"/>
                            <constraint firstItem="WIM-vr-YfN" firstAttribute="leading" secondItem="nbW-NX-KfY" secondAttribute="leading" id="eDX-56-5xp"/>
                            <constraint firstItem="N1e-Oq-3yd" firstAttribute="trailing" secondItem="nbW-NX-KfY" secondAttribute="trailing" id="ge1-T8-l7u"/>
                            <constraint firstItem="YP5-aW-Vsq" firstAttribute="centerX" secondItem="7Vw-n1-CcV" secondAttribute="centerX" id="hYR-Ky-AZ5"/>
                            <constraint firstItem="RcE-XQ-iIY" firstAttribute="centerX" secondItem="7Vw-n1-CcV" secondAttribute="centerX" id="ib2-2m-2a2"/>
                            <constraint firstItem="BJl-Ep-Vd4" firstAttribute="trailing" secondItem="nbW-NX-KfY" secondAttribute="trailing" id="pne-bX-6EV"/>
                            <constraint firstItem="nbW-NX-KfY" firstAttribute="bottom" secondItem="YP5-aW-Vsq" secondAttribute="bottom" constant="72" id="sLE-VF-D7j"/>
                            <constraint firstItem="N1e-Oq-3yd" firstAttribute="top" secondItem="nbW-NX-KfY" secondAttribute="top" id="tKX-94-rhN"/>
                            <constraint firstItem="usM-5i-HCG" firstAttribute="trailing" secondItem="nbW-NX-KfY" secondAttribute="trailing" id="yqq-Oi-OZd"/>
                            <constraint firstItem="WIM-vr-YfN" firstAttribute="top" secondItem="nbW-NX-KfY" secondAttribute="top" id="zfS-gq-FW5"/>
                        </constraints>
                    </view>
                    <navigationItem key="navigationItem" id="Ubu-lr-fGH"/>
                    <connections>
                        <outlet property="admin_bar" destination="BJl-Ep-Vd4" id="OZr-Fw-hYY"/>
                        <outlet property="brand" destination="tmV-QD-lkm" id="ggQ-vT-IIJ"/>
                        <outlet property="brand_mini" destination="0An-Hk-k6Z" id="Yhf-lN-dnM"/>
                        <outlet property="chat_msg_new" destination="evR-Ps-MqB" id="Eja-L7-emU"/>
                        <outlet property="chronometer" destination="y9r-0t-kel" id="wIa-WC-e8G"/>
                        <outlet property="event_logo" destination="0Vk-ln-B5c" id="cBF-tj-jxF"/>
                        <outlet property="event_title" destination="Ms7-Cd-l4t" id="WWS-WA-7Xk"/>
                        <outlet property="event_title_mini" destination="jVW-0m-8PL" id="oJt-HH-jrR"/>
                        <outlet property="header" destination="N1e-Oq-3yd" id="MGG-vK-3TD"/>
                        <outlet property="header_height" destination="H1D-TO-xCL" id="6CN-L1-8GL"/>
                        <outlet property="header_line" destination="TgI-EV-h1b" id="NFE-b5-F2X"/>
                        <outlet property="lat_label" destination="XfM-V3-1qP" id="ZAS-96-OjD"/>
                        <outlet property="lon_label" destination="1bv-9L-3Ey" id="zBm-yU-zXz"/>
                        <outlet property="position_label" destination="RcE-XQ-iIY" id="823-df-Mqb"/>
                        <outlet property="position_text_label" destination="YP5-aW-Vsq" id="NHU-eP-jpV"/>
                        <outlet property="team_image" destination="jEN-Or-v8B" id="M15-C8-bVU"/>
                        <outlet property="team_name" destination="LSt-Ut-WKa" id="4qi-LE-w8v"/>
                        <outlet property="team_name_mini" destination="Qol-m8-bCt" id="9C6-aw-Ulh"/>
                    </connections>
                </viewController>
                <placeholder placeholderIdentifier="IBFirstResponder" id="O2g-CK-nBr" userLabel="First Responder" customClass="UIResponder" sceneMemberID="firstResponder"/>
                <panGestureRecognizer minimumNumberOfTouches="1" id="tu4-xU-pen">
                    <connections>
                        <action selector="handlePanWithRecognizer:" destination="opz-mD-wLa" id="sER-uD-OUi"/>
                    </connections>
                </panGestureRecognizer>
                <panGestureRecognizer minimumNumberOfTouches="1" id="7Sc-0a-Oda">
                    <connections>
                        <action selector="handlePanWithRecognizer:" destination="opz-mD-wLa" id="d0a-fm-lUY"/>
                    </connections>
                </panGestureRecognizer>
            </objects>
            <point key="canvasLocation" x="3878.90625" y="51.5625"/>
        </scene>


<scene sceneID="OXV-v6-sSB">
            <objects>
                <viewController id="9wl-wM-Bbl" customClass="MapViewController" customModule="Escultura_Yincana" customModuleProvider="target" sceneMemberID="viewController">
                    <view key="view" contentMode="scaleToFill" id="PkA-h3-ReM">
                        <rect key="frame" x="0.0" y="0.0" width="768" height="954"/>
                        <autoresizingMask key="autoresizingMask" widthSizable="YES" heightSizable="YES"/>
                        <viewLayoutGuide key="safeArea" id="TDW-iJ-N2V"/>
                        <color key="backgroundColor" systemColor="systemBackgroundColor"/>
                    </view>
                </viewController>
                <placeholder placeholderIdentifier="IBFirstResponder" id="r9b-Oj-gMn" userLabel="First Responder" customClass="UIResponder" sceneMemberID="firstResponder"/>
            </objects>
            <point key="canvasLocation" x="3878.90625" y="759.9609375"/>
        </scene>


//
//  EventViewController.swift
//  Escultura Yincana
//
//  Created by dev2bit on 02/02/2020.
//  Copyright © 2020 Pixel&Bits. All rights reserved.
//

import Foundation
import UIKit
import Darwin

class EventViewController:GeneralViewController {
    
    var is_header_collapse = false

    @IBOutlet weak var lat_label: UILabel!
    @IBOutlet weak var lon_label: UILabel!
    @IBOutlet weak var chat_msg_new: UILabel!
    
    @IBOutlet weak var chronometer: UIView!
    @IBOutlet weak var position_text_label: UILabel!
    @IBOutlet weak var position_label: UILabel!
    @IBOutlet weak var header_line: UIView!
    @IBOutlet weak var header_height: NSLayoutConstraint!
    @IBOutlet weak var brand: UIImageView!
    @IBOutlet weak var brand_mini: UIImageView!
    @IBOutlet weak var header: UIView!
    @IBOutlet weak var admin_bar: UIView!
    @IBOutlet weak var team_name: UILabel!
    
    @IBOutlet weak var team_name_mini: UILabel!
    @IBOutlet weak var event_title: UILabel!
    
    @IBOutlet weak var event_title_mini: UILabel!
    @IBOutlet weak var event_logo: UIImageView!
    @IBOutlet weak var team_image: UIImageView!
    
    @IBAction func handlePan(recognizer:UIPanGestureRecognizer) {
        guard let panRecognizer = recognizer as? UIPanGestureRecognizer else {
            return
        }

        let velocity = recognizer.velocity(in: recognizer.view)
        print (velocity.x, velocity.y)
        
        if (velocity.y < 0) {
            collapseHeader ()
        }else {
            uncollapseHeader()
        }
        
        UIView.animate(withDuration: 0.7, delay: 0, usingSpringWithDamping: 1, initialSpringVelocity: 1, options: .curveEaseIn, animations: {
            if (velocity.y < 0) {
                self.team_name_mini.alpha = 1.0
                self.brand_mini.alpha = 1.0
                self.event_title_mini.alpha = 1.0
            }else {
                self.team_name_mini.alpha = 0.0
                self.brand_mini.alpha = 0.0
                self.event_title_mini.alpha = 0.0
            }
            self.view.layoutIfNeeded()
        }, completion: nil)
    }
    
    func collapseHeader () {
        self.header_height.constant = 40
        self.team_name.alpha = 0
        self.team_image.alpha = 0
        self.event_logo.alpha = 0
        self.event_title.alpha = 0
        self.brand.alpha = 0
        self.is_header_collapse = true
    }
    
    func uncollapseHeader () {
        self.header_height.constant = 170
        self.team_name.alpha = 1
        self.team_image.alpha = 1
        self.event_logo.alpha = 1
        self.event_title.alpha = 1
        self.brand.alpha = 1
        self.is_header_collapse = false
    }
    
    
    override func viewDidLoad() {
        super.viewDidLoad()
        self.updateUI()
        App.sys().runCache()
        if (App.sys().meTeam()) {
            App.sys().team?.addListener(f: {
                (model) in
                if (model.model?.device == "") {
                    exit(0)
                }
                
            })
        }
        self.position_label.text = App.sys().getPosition()
        MapViewController.eventCtrl = self
        App.sys().initChats()
        App.sys().initFantasmas()
    }
    
    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        App.sys().setCurrentActivity(nil)
        if (App.sys().iSuspendEvent()) {
            PopupSuspendViewController.open(viewctr:self)
        }
        updateMsgChatsNum()
    }
    
    func updateUI () {
        team_name.text = App.sys().team?.model?.name ?? "Organizador".localized()
        team_name_mini.text = App.sys().team?.model?.name ?? "Organizador".localized()
        event_title.text = App.sys().event?.model?.name
        event_title_mini.text = App.sys().event?.model?.name
        if var logo:String = App.sys().event?.model?.logo  {
            downloadImage(
               from:URL(string:logo)!,
               image:event_logo
           )
        }
        if (App.sys().meTeam()) {
            let key = "team_ " + String ((App.sys().team?.model?.id) ?? 0)
            if let imgData = UserDefaults.standard.object(forKey: key) as? NSData{
                let image = UIImage(data: imgData as Data)
                self.team_image.image = image
                self.team_image.contentMode = .scaleAspectFit
            }else {
                if let image:String = App.sys().team?.model?.image as? String  {
                    if (image != "") {
                        downloadImage(
                            from:URL(string:image)!,
                            image:team_image
                        )
                    }
                }
            }
            App.sys().team?.addListener(f: {
                team in
                if (team.model?.gadget != 0) {
                    let gadget = Gadget.getGadgets()[team.model!.gadget - 1]
                    gadget.run(team as! Team, context:getPresentedViewController()!)
                }
            })
            if (App.sys().getEvent() != nil) {
                App.sys().getEvent()!.addListener(f: {
                    event in
                    if (event.model!.suspend) {
                        PopupSuspendViewController.open(viewctr:self)
                        if (App.sys().inActivity()) {
                            App.sys().setCurrentActivity(nil)
                            goRoot(context: self)
                        }
                    }else {
                        PopupSuspendViewController.closeAll()
                    }
                })
            }
            for team in App.sys().getTeams(){
                team.addListener(f: {
                    (model) in
                    let me = App.sys().team
                    var pos = 1
                    if (me != nil) {
                        for team in App.sys().getTeams(){
                            if (team.model?.id == me!.model?.id ){
                                break
                            }
                            pos += 1
                        }
                        self.position_label.text = App.sys().getPosition()
                    }
                })
            }
        }
        if (App.sys().meAdmin()){
            self.admin_bar.isHidden = false
            self.header_line.isHidden = true
            self.position_label.isHidden = true
            self.position_text_label.isHidden = true
            self.chronometer.isHidden = false
        }else {
            self.admin_bar.isHidden = true
            self.header_line.isHidden = false
            self.position_label.isHidden = false
            self.position_text_label.isHidden = false
            self.chronometer.isHidden = true
        }
        updateMsgChatsNum()
    }
    
    func updateMsgChatsNum () {
        if (App.sys().total_msg_new > 0) {
            self.chat_msg_new.isHidden = false
            self.chat_msg_new.text = String(App.sys().total_msg_new)
        }else {
            self.chat_msg_new.isHidden = true
        }
    }

    @IBAction func gadgets(_ sender: Any) {
        go(context:self, to:"GadgetsTeamViewController")
    }
    @IBAction func openMain(_ sender: Any) {
        if (App.sys().meTeam()) {
            self.openRanking(sender)
        }else {
            PopupViewController.open(
                viewctr:self,
                title: "Reiniciar cronómetro".localized(),
                text: "Esta acción reiniciará el cronómetro. ¿Deseas continuar?".localized(),
                btnRight: "Sí".localized(),
                btnRightFun: {
                    ChronometerAdminViewController.start()
                }
            )
        }
    }
    @IBAction func openRanking(_ sender: Any) {
        go(context: self, to: "RankingViewController")
    }
    @IBAction func openAsignation(_ sender: Any) {
        go(context: self, to: "AsignationViewController")
    }
    @IBAction func openActivities(_ sender: Any) {
        go(context: self, to: "ActivitiesTeamsViewController")
    }
    @IBAction func openPhotos(_ sender: Any) {
        go(context: self, to: "PhotoTeamViewController")
    }
    
    @IBAction func openChat(_ sender: Any) {
        go(context: self, to: "ChatsViewController")
    }
    @IBAction func suspend_event(_ sender: Any) {
        if (!App.sys().iSuspendEvent()) {
            PopupViewController.open(
                viewctr:self,
                title: "Suspender evento".localized(),
                text: String(
                    format:"El evento \"%@\" quedará suspendido y los equipos no podrán realizar ninguna prueba. ¿Deseas continuar?".localized(),
                    (App.sys().getEvent()?.model!.name)!
                ),
//                text: "El evento \"" + (App.sys().getEvent()?.model!.name)! + "\" quedará suspendido y los equipos no podrán realizar ninguna prueba. ¿Deseas continuar?",
                btnRight: "Sí".localized(),
                btnRightFun: {
                    App.sys().suspendEvent()
                }
            )
        }else {
            PopupViewController.open(
                viewctr:self,
                title: "Reactivar evento".localized(),
                text: String(
                    format:"El evento \"%@\" será reactivado y los equipos podrán realizar pruebas. ¿Deseas continuar?".localized(),
                    (App.sys().getEvent()?.model!.name)!
                ),
//                text: "El evento \"" + (App.sys().getEvent()?.model!.name)! + "\" será reactivado y los equipos podrán realizar pruebas. ¿Deseas continuar?",
                btnRight: "Sí".localized(),
                btnRightFun: {
                    App.sys().unsuspendEvent()
                }
            )
        }
    }
    @IBAction func valorateActivities(_ sender: Any) {
        go(context: self, to: "ActivitiesValorateViewController")
    }
}

//
//  MapViewController.swift
//  Escultura Yincana
//
//  Created by Jose Trillo on 31/01/2020.
//  Copyright © 2020 Pixel&Bits. All rights reserved.
//

import Foundation
import UIKit
import CoreGraphics

import GoogleMaps
import CoreLocation

struct Point {
    var lon:Double
    var lat:Double
}

class MapViewController:GeneralViewController, CLLocationManagerDelegate, GMSMapViewDelegate {
    let locationManager = CLLocationManager()
    var me:GMSMarker = GMSMarker()
    var meTime:NSInteger = 0
    static var eventCtrl:EventViewController? = nil
    var mePoints:[Point] = []
    var admin:GMSMarker = GMSMarker()
    var teams:[Int?:GMSMarker?] = [:]
    var activities:[Int?:GMSMarker?] = [:]
    var event:Point = Point(
        lon: App.sys().getEvent()?.model?.lon as! Double,
        lat: App.sys().getEvent()?.model?.lat as! Double
    )
    var map:GMSMapView? = nil
    
    var semaphore = false
    
    var fantasmasTimer: Timer?
    var fantasmas:[Int?:GMSMarker?] = [:]
    
    override func viewDidLoad() {
        super.viewDidLoad()
        self.initMap()
        self.initLocation()
        App.sys().mapCtr = self
    }
    
    func initMap () {
        let camera = GMSCameraPosition.camera(
            withLatitude: event.lat as! Double,
            longitude: event.lon as! Double,
            zoom: 15.0
        )
        
        self.map = GMSMapView.map(withFrame: CGRect.zero, camera: camera)
        self.map?.settings.zoomGestures = true
        self.map?.settings.compassButton = true
        do {
          if let styleURL = Bundle.main.url(forResource: "style", withExtension: "json") {
            self.map?.mapStyle = try GMSMapStyle(contentsOfFileURL: styleURL)
          } else {
            NSLog("Unable to find style.json")
          }
        } catch {
          NSLog("One or more of the map styles failed to load. \(error)")
        }
        self.view = self.map
        
        self.me.position = CLLocationCoordinate2D(latitude: 0, longitude: 0)
        self.me.map = self.map
        self.me.icon = UIImage(named: "mark-me")
        self.map?.delegate = self
        self.initTeamsMap ()
        self.initAcivities()
        fantasmasTimer = Timer.scheduledTimer(timeInterval: 2, target: self, selector: #selector(fantasmasRun), userInfo: nil, repeats: true)

        
    }
    
    func mapView(_ mapView: GMSMapView, didLongPressAt coordinate: CLLocationCoordinate2D) {
        self.mapView(mapView, didTapAt:coordinate)
    }
    
    
    func mapView(_ mapView: GMSMapView, didTapAt coordinate: CLLocationCoordinate2D) {
        if(App.sys().meAdmin()){
            App.sys().fantasma_new_lat = coordinate.latitude
            App.sys().fantasma_new_lon = coordinate.longitude
            PopupViewController.open(
                viewctr:self,
                title: "Nuevo fantasma".localized(),
                text: "¿Deseas colocar un fantasma en la posición indicada?".localized(),
                btnRight: "Sí".localized(),
                btnRightFun: {
                    go(context:self, to:"FantasmaViewController")
                }
            )
        }
      print("You tapped at \(coordinate.latitude), \(coordinate.longitude)")
    }
    
    func initTeamsMap ()
    {
        var i = 0
        for team in App.sys().getTeams() {
            print ("Console team icon: " + String(team.model!.id))
            if (
                (
                    App.sys().team == nil ||
                    App.sys().team?.model?.id != team.model?.id
                )
            ) {
                self.teams[team.model?.id] = GMSMarker()
                self.teams[team.model?.id]?!.position = CLLocationCoordinate2D(
                    latitude: team.model?.lat as! Double,
                    longitude: team.model?.lon as! Double
                )
//                self.teams[team.model?.id]?!.map = self.map
                if (team.model?.device == ""){
                    self.teams[team.model?.id]?!.map = nil
                }else{
                    self.teams[team.model?.id]?!.map = self.map
                }
                self.teams[team.model?.id]?!.icon = UIImage(
                    named: "Equipo_" + String(
                        i % NSInteger(
                            Env.get("gps-max-teams-color")!
                        )!
                    )
                )
                // Movimiento demás equipos
                team.addListener(f: {
                    (model) in
                    if (
                        model.model?.device == "" ||
                        model.model?.connected == nil ||
                        model.model?.connected == 0
                    ){
                        self.teams[model.model?.id]?!.map = nil
                    }else{
                        self.teams[model.model?.id]?!.map = self.map
                    }
                    self.teams[model.model?.id]?!.position = CLLocationCoordinate2D(
                        latitude: model.model?.lat as! Double,
                        longitude: model.model?.lon as! Double
                    )
                })
            }
            //Eliminar prueba realizada
            team.addListener(f: {
                (model) in
                if (App.sys().team != nil){
                    if (model.model?.id == App.sys().team?.model?.id) {
                        for activity in model.model!.activitiesData {
                            if (
                                (!self.isActivityVisible(activity)) &&
                                self.activities[activity.id]?!.map != nil
                            ){
                                self.activities[activity.id]?!.map = nil
                                if (App.sys().inActivity() && activity.del) {
                                    if (App.sys().getCurrentActivity()!.id == activity.id){
                                        self.semaphore = true
                                        PopupViewController.closeAll()
                                        goRoot(context: self)
                                        DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) {
                                            App.sys().setCurrentActivity(nil)
                                            
                                            self.semaphore = false
                                        }
                                    }
                                }
                            }
                            else if (
                                (self.isActivityVisible(activity)) &&
                                self.activities[activity.id]?!.map == nil
                            ){
                                self.activities[activity.id]?!.map = self.map
                            }
                        }
                    }
                }
            })
            i = i + 1
        }
    }
    
    func initAcivities () {
        if (App.sys().meTeam()) {
            if (App.sys().team != nil) {
                self.initActivitiesTeam(App.sys().team!)
            }
        }else if(App.sys().meAdmin()){
            let activities = (App.sys().getEvent()?.model?.activitiesData as! [ActivityData])
            for activity in activities {
                self.initActivity(activity)
            }
        }
    }
    
    func initActivitiesTeam (_ team:Team) {
        let activities = (team.model?.activitiesData as! [ActivityData])
        for activity in activities {
            self.initActivity(activity)
        }
        //MARK: Listener team control activities
    }
    
    func initActivity (_ activity:ActivityData){
        self.activities[activity.id] = GMSMarker()
        self.activities[activity.id]?!.position = CLLocationCoordinate2D(
            latitude: activity.lat as! Double,
            longitude: activity.lon as! Double
        )
        if (self.isActivityVisible(activity)) {
            self.activities[activity.id]?!.map = self.map
        }else {
            self.activities[activity.id]?!.map = nil
        }
        self.activities[activity.id]?!.icon = imageWithImage(
            image: UIImage(
                named: Activity.getIcon(
                    type: activity.type.id,
                    id: activity.id
                )
            )!,
            scaledToSize: CGSize(width: 36, height: 48)
        )
//        let circle = GMSCircle(position: CLLocationCoordinate2D(
//            latitude: activity.lat as! Double,
//            longitude: activity.lon as! Double
//        ), radius: CLLocationDistance(activity.distance))
//        circle.fillColor = UIColor(red: 0, green: 0.89, blue: 0, alpha: 0.5)
//        circle.map = self.map
    }
    
    func isActivityVisible (_ activity:ActivityData, check_visible:Bool = true) -> Bool {
        return (
            !activity.complete &&
            !activity.del &&
            (
                App.sys().meAdmin() ||
                (
                    App.sys().meTeam() &&
                    (
                        App.sys().team?.model?.route == 0 ||
                        (
                            App.sys().team?.model?.route == 1 &&
                            (
                                (
                                    (
                                        App.sys().team?.model?.sequential == 0 &&
                                        (
                                            !check_visible ||
                                            App.sys().team?.model?.visible == 1
                                        )
                                    ) ||
                                    (
                                        App.sys().team?.model?.sequential == 1 &&
                                        (
                                            activity.id == App.sys().nextIdRoute() ||
                                            (
                                                check_visible && App.sys().team?.model?.visible == 1
                                            )
                                        )
                                       
                                    )
                                )
                            )
                        )
                    )
                )
            )
        )
    }
    
    func initLocation () {
        isAuthorizedtoGetUserLocation()
        if (CLLocationManager.locationServicesEnabled())
        {
            
            locationManager.delegate = self
            locationManager.distanceFilter = kCLDistanceFilterNone
            locationManager.desiredAccuracy = kCLLocationAccuracyBest
            locationManager.pausesLocationUpdatesAutomatically = false
            locationManager.requestAlwaysAuthorization()
            locationManager.startUpdatingLocation()
        }
    }
    
    func isAuthorizedtoGetUserLocation() {

        if CLLocationManager.authorizationStatus() != .authorizedWhenInUse     {
            locationManager.requestWhenInUseAuthorization()
        }
    }


    //this method will be called each time when a user change his location access preference.
    func locationManager(_ manager: CLLocationManager, didChangeAuthorization status: CLAuthorizationStatus) {
        if status == .authorizedWhenInUse {
            print("User allowed us to access location")
            //do whatever init activities here.
        }
    }

    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        print("Did location updates is called")
        
        let location = locations.last! as CLLocation
        print(location.horizontalAccuracy)
        self.addMePoint(
            Point(
                lon: location.coordinate.longitude,
                lat: location.coordinate.latitude
            )
        )
        let point = self.calculatePointAverrage()
        let lon = point.lon
        let lat = point.lat
        if (
            self.me.position.longitude != lon ||
            self.me.position.latitude != lat
        ){
            self.updateMePosition(lon: lon, lat:lat)
            self.checkActivity (lon: lon, lat:lat)
        }
    }

    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        print("Did location updates is called but failed getting location \(error)")
    }
    
    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
    }
    
    func updateMePosition (lon:Double, lat:Double) {
        
        if (App.sys().team != nil)  {
            let angle = atan2(1, 0)
                - atan2(
                    lat - (App.sys().team?.model!.lat)!,
                    lat - (App.sys().team?.model!.lat)!
                )
            
            me.rotation = CLLocationDegrees(angle * 180 / Double.pi)
        }
        else if (App.sys().isAdmin) {
            let angle = atan2(1, 0)
                - atan2(
                    lat - (App.sys().admin?.model!.lat)!,
                    lat - (App.sys().admin?.model!.lat)!
                )
            
            me.rotation = CLLocationDegrees(angle * 180 / Double.pi)
        }
        me.groundAnchor = CGPoint(x: 0.5, y: 0.5)
        me.position = CLLocationCoordinate2D(latitude: lat, longitude: lon)
        
        if (App.sys().team != nil) {
            App.sys().team?.model?.lat = lat
            App.sys().team?.model?.lon = lon
            App.sys().team?.save(complete: nil, except: ["send", "activities_data"])
        }else if (App.sys().isAdmin) {
            App.sys().admin?.model?.lat = lat
            App.sys().admin?.model?.lon = lon
            App.sys().admin?.save()
        }
    }
    
    func checkActivity (lon:Double, lat:Double) {
        DispatchQueue.main.async{
            MapViewController.eventCtrl?.lon_label.text
            MapViewController.eventCtrl?.lon_label.text  = String(format: "%f", lon)
            MapViewController.eventCtrl?.lat_label.text  = String(format: "%f", lat)
        }
//        let current_act = App.sys().getCurrentActivity()
        if (App.sys().meTeam()  && !self.semaphore ) {
            if (App.sys().team != nil) {
                let team = App.sys().team!
                let activities = (team.model?.activitiesData as! [ActivityData])
                let location = CLLocation(
                    latitude: lat,
                    longitude: lon
                )
                
                var select:ActivityData? = nil
                var min_distance = 0
                var complete = true
                for activity in activities {
                    if (activity.complete == false && activity.del == false){
                        complete = false
                    }
                    let diff = CLLocation(
                        latitude: activity.lat,
                        longitude: activity.lon
                    ).distance(
                        from: location
                    )
                    var distance:Int = 0
                    if (activity.distance != 0 && Env.get("device-type") != "simulator"){
                        distance = activity.distance
                    }else {
                        distance = Int(
                            Env.get("activity-max-distance-default")!
                        ) ?? 0
                    }
                    print (" -- " + activity.name + ": " + String (Int(abs(diff))))
                    if (
                        Int(abs(diff)) < distance
                        && !App.sys().inActivity()
                        && self.isActivityVisible(activity, check_visible:false)
                    ) {
                        if (
                            select == nil ||
                            Int(abs(diff)) < min_distance
                        ){
                            select = activity
                            min_distance = Int(abs(diff))
                        }
                    }
                }
                if(complete) {
                    PopupViewController.open(
                        viewctr:self,
                        title: "Felicidades".localized(),
                        text: "Se han completado todas las pruebas".localized()
                    )
                }
                var isSend = false;
                if (App.sys().hasSend()){
                    select = App.sys().getSend()
                    isSend = true
                }
                if (select != nil && !App.sys().iSuspendEvent()) {
                    print (" -- SEL: " + select!.name + ": " + String(min_distance))
                    App.sys().setCurrentActivity(select)
                    if (
                        select?.object_in == 0 ||
                        App.sys().hasObject(select!.object_in) ||
                        isSend
                    ){
                        let gettry = App.sys().getActivityTry(id: select?.id ?? 0) ?? -1
                    
                        if (gettry > 2) {
                            PopupViewController.open(
                                viewctr:self.parent!,
                                title: "Prueba repetida varias veces".localized(),
                                text: String(
                                    format:"Hemos detectado que has iniciado la prueba \"%@\" repetidamente. ¿Quieres continuar con la siguiente prueba?".localized(),
                                    (select?.name ?? "")
                                ),
//                                text: "Hemos detectado que has iniciado la prueba \"" + (select?.name ?? "") + "\" repetidamente. ¿Quieres continuar con la siguiente prueba?",
                                btnRight:"Sí".localized(),
                                btnRightFun: {
                                    App.sys().completeCurrentActivity(true)
                                    App.sys().setCurrentActivity(nil)
                                },
                                btnLeft:"No".localized(),
                                btnLeftFun: {
                                    App.sys().resetActivityTry(id: select?.id ?? 0)
                                },
                                btnCloseFun: {
                                    App.sys().resetActivityTry(id: select?.id ?? 0)
                                }
                            )
                        }else {
                        if (!isSend){
                            PopupGameViewController.open(
                                viewctr:self.parent!,
                                title: select!.name,
                                text: "Estás cerca de una prueba ¿Deseas comenzarla?".localized(),
                                btnRightFun: {
                                    App.sys().setCurrentActivity(select)
                                    go(context:self, to:"ActivityRunViewController")
                                },
                                btnCloseFun: {
                                    App.sys().setCurrentActivity(nil)
                                }
                            )
                        }
                        else {
                            PopupSendViewController.open(
                                viewctr:getPresentedViewController()!,
                                title: select!.name,
                                text: "Te han enviado una prueba ¿Deseas comenzarla?".localized(),
                                btnRightFun: {
                                    if (App.sys().hasSend()){
                                        App.sys().delSend()
                                    }
                                    App.sys().setCurrentActivity(select)
                                    go(context:self, to:"ActivityRunViewController")
                                },
                                btnCloseFun: {
                                    App.sys().delSend()
                                    App.sys().setCurrentActivity(nil)
                                }
                            )
                        }
                    }
                    }else {
                        PopupLockViewController.open(
                            viewctr:self.parent!,
                            title: select!.object_in_name,
                            text: String(
                                format:"Estás cerca de la prueba \"%@\". Pero necesitas un objeto para acceder.".localized(),
                                select!.name
                            ),
//                            text: "Estás cerca de la prueba " + select!.name + ". Pero necesitas un objeto para acceder.",
                            btnCloseFun: {
                                App.sys().setCurrentActivity(nil)
                            }
                        )
                    }
                }
            }
        }
        
    }
    
    func mapView(mapView: GMSMapView!, didLongPressAtCoordinate coordinate: CLLocationCoordinate2D) {
        let marker = GMSMarker(position: coordinate)
        marker.title = "Found You!"
        marker.map = mapView
    }
        
    func addMePoint (_ p:Point) {
        self.mePoints.append(p)
        if (self.mePoints.count > NSInteger(Env.get("gps-points-averrage") ?? "10") ?? 10) {
            self.mePoints.removeFirst()
        }
    }
    
    func calculatePointAverrage () -> Point {
        var lat:Double = 0
        var lon:Double = 0
        for point in self.mePoints {
            lat += point.lat
            lon += point.lon
        }
        return Point (
            lon: lon / Double(self.mePoints.count),
            lat: lat / Double(self.mePoints.count)
        )
    }
    
    
    @objc func fantasmasRun () {
        let img_fantasmas_index = ["3", "4", "5"]
        if (App.sys().fantasmas != nil) {
            var fantasmas:[FantasmaData] = App.sys().fantasmas?.model?.data ?? []
            let fantasmas_index = img_fantasmas_index[fantasmas.count % 3]
            
            for (var i, var fantasma) in  fantasmas.enumerated() {
                if (Int(NSDate().timeIntervalSince1970) < fantasma.date_end) {
                    var index = self.fantasmas.index(forKey: fantasma.date_ini)
                    if (index == nil){
                        self.fantasmas[fantasma.date_ini] = GMSMarker()
                        self.fantasmas[fantasma.date_ini]?!.map = self.map
                        self.fantasmas[fantasma.date_ini]?!.icon = self.imageWithImage(image: UIImage(named: "fantasmas-" + fantasmas_index)!, scaledToSize: CGSize(width: 40, height: 40))
                    }else{
                        if (true || App.sys().isAdmin) {
                            if (fantasma.mode == 0) {
                                var min:Double = 9999999
                                var lat_dst:Double = 0
                                var lon_dst:Double = 0
                                for team in App.sys().getTeams() {
                                    if (team.model?.lat != 0 && team.model?.lon != 0) {
                                        var diff_lat = abs(fantasma.lat - (team.model?.lat)!)
                                        var diff_lon = abs(fantasma.lon - (team.model?.lon)!)
                                        var diff:Double = diff_lat + diff_lon
//                                        if (diff_lat < diff_lon){
//                                            diff = diff_lat
//                                        }else {
//                                            diff = diff_lon
//                                        }
                                        if (diff < min) {
                                            min = diff
                                            lat_dst = team.model?.lat ?? 0
                                            lon_dst = team.model?.lon ?? 0
                                        }
                                    }
                                    
                                }
                                if (lat_dst != 0 && lon_dst != 0) {
                                    if (lat_dst < fantasma.lat) {
                                        fantasma.lat = fantasma.lat - 0.0001
                                    }else{
                                        fantasma.lat = fantasma.lat + 0.0001
                                    }
                                    if (lon_dst < fantasma.lon) {
                                        fantasma.lon = fantasma.lon - 0.0001
                                    }else{
                                        fantasma.lon = fantasma.lon + 0.0001
                                    }
                                    App.sys().fantasmas?.model?.data[i] = fantasma
                                    //App.sys().fantasmas?.save()
                                }
                            }
                        }
                        
                    }
                    self.fantasmas[fantasma.date_ini]?!.position = CLLocationCoordinate2D(
                        latitude: fantasma.lat as! Double,
                        longitude: fantasma.lon as! Double
                    )
                    if (!App.sys().isAdmin){
                        if (abs(fantasma.lat - (App.sys().team?.model?.lat)!) < 0.0001 && abs(fantasma.lon - (App.sys().team?.model?.lon)!) < 0.0001) {
                            fantasma.date_end = fantasma.date_ini
                            DispatchQueue.global(qos: .userInitiated).async {
                                App.sys().fantasmas?.model?.data[i] = fantasma
                                App.sys().fantasmas?.save()
                                if (App.sys().team?.model!.points != nil) {
                                    let points = App.sys().team?.model!.points ?? 0
                                    App.sys().team?.model?.points = points - fantasma.poits
                                    App.sys().team?.save()
                                }
                            }
                           
                            if (fantasma.poits > 0){
                                getPresentedViewController()?.showToast(
                                    message: String(
                                        format:"Te ha pillado el fantasma. Pierdes %@ puntos".localized(), String(fantasma.poits)
                                    ),
                                    font: UIFont.systemFont(ofSize: 18)
                                )
//                                getPresentedViewController()?.showToast(message: "Te ha pillado el fantasma. Pierdes " + String(fantasma.poits) + " puntos", font: UIFont.systemFont(ofSize: 18))
                            }else {
                                getPresentedViewController()?.showToast(
                                    message: String(
                                        format:"Has cogido el fantasma. Ganas %@ puntos".localized(),
                                        String(fantasma.poits)
                                    ),
                                    font: UIFont.systemFont(ofSize: 18)
                                )
//                                getPresentedViewController()?.showToast(message: "Has cogido el fantasma. Ganas " + String(fantasma.poits) + " puntos", font: UIFont.systemFont(ofSize: 18))
                            }
                        }
                    }
                }
                else {
                    var index = self.fantasmas.index(forKey: fantasma.date_ini)
                    if (index != nil) {
                        self.fantasmas[fantasma.date_ini]?!.map = nil
                    }
                }
            }
            
        }
    }
    
    func imageWithImage(image:UIImage, scaledToSize newSize:CGSize) -> UIImage{
            UIGraphicsBeginImageContextWithOptions(newSize, false, 0.0);
            //image.draw(in: CGRectMake(0, 0, newSize.width, newSize.height))
            image.draw(in: CGRect(origin: CGPoint(x: 0,y :0), size: CGSize(width: newSize.width, height: newSize.height))  )
            let newImage:UIImage = UIGraphicsGetImageFromCurrentImageContext()!
            UIGraphicsEndImageContext()
            return newImage
        }
}

---------

Como podrás deducir, el siguiente paso es la pantalla del evento.
