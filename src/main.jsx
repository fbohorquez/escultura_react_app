// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { MemoryRouter as Router } from "react-router-dom";
import { Provider } from "react-redux";
import store, { persistor } from "./store";
import "./i18n";
import { PersistGate } from "redux-persist/integration/react";
import { initUploadQueue } from "./services/uploadQueue";
import { initAssetCaching } from "./services/assetCache";
import { initNotificationSystem, promptNotificationPermission } from "./services/notificationInit";
import { validateEventToken, getEventParamFromURL, clearEventParamFromURL, validateTeamToken, getTeamParamFromURL, clearTeamParamFromURL } from "./utils/eventToken";
import { overrideNative } from "./utils/overrideNative";
import { startConnectionMonitor } from "./services/firebase";
import { initializeDynamicConfig } from "./utils/configInitializer.js";
import "./services/firebase-diagnostics"; // Inicializar herramientas de diagnóstico
import "./services/test-firebase-monitoring"; // Inicializar tests de monitoreo (solo en desarrollo)

// Inicializar los overrides nativos
overrideNative();


// Función para determinar la ruta inicial
const getInitialRoute = async () => {
	const urlParams = new URLSearchParams(window.location.search);
	const action = urlParams.get("action");
	const eventParam = getEventParamFromURL();
	const teamParam = getTeamParamFromURL();

	// Si la ruta actual es /init, no procesar los parámetros, solo mantenerlos
	if (window.location.pathname === '/init') {
		console.log("Init route detected, preserving URL parameters without processing");
		return `/init${window.location.search}`;
	}

	// Verificar si se requieren tokens obligatorios
	const requireTokens = import.meta.env.VITE_REQUIRE_EVENT_TEAM_TOKENS === "true";

	// Verificar si ya hay datos de acceso válidos guardados en localStorage
	const savedEventId = localStorage.getItem("validatedEventId");
	const savedTeamId = localStorage.getItem("validatedTeamId");

	// Si se requieren tokens pero ya hay datos guardados, usar esos datos
	if (requireTokens && savedEventId && savedTeamId && !eventParam && !teamParam) {
		console.log("Using saved valid credentials from localStorage");
		sessionStorage.setItem("autoSelectEventId", savedEventId);
		sessionStorage.setItem("autoSelectTeamId", savedTeamId);
		return `/teams/${savedEventId}`;
	}

	//http://localhost:5173/?event=139e00da03b685a0dd18fb6a08af0923de0&team=8193b5dca501ee1e6d8cd7b905f4e1bf723
	// Si hay un parámetro event, validar y procesar
	if (eventParam) {
		const tokenValidation = validateEventToken(eventParam);

		if (tokenValidation && tokenValidation.isValid) {
			console.log(
				"Valid event token detected, eventId:",
				tokenValidation.eventId
			);

			// Si también hay un parámetro team, validar el token del equipo
			if (teamParam) {
				const teamTokenValidation = validateTeamToken(teamParam);
				if (teamTokenValidation && teamTokenValidation.isValid) {
					console.log(
						"Valid team token detected, teamId:",
						teamTokenValidation.teamId
					);
					// Almacenar el teamId para auto-selección
					sessionStorage.setItem(
						"autoSelectTeamId",
						teamTokenValidation.teamId
					);
					
					// Guardar datos válidos en localStorage para futuras visitas
					localStorage.setItem("validatedEventId", tokenValidation.eventId);
					localStorage.setItem("validatedTeamId", teamTokenValidation.teamId);
					console.log("Valid credentials saved to localStorage");
				} else {
					console.warn("Invalid team token provided:", teamParam);
					// Limpiar el parámetro inválido de la URL
					clearTeamParamFromURL();
					
					// Si se requieren tokens y el team token es inválido, mostrar 404
					if (requireTokens) {
						return "/404";
					}
				}
			} else if (requireTokens) {
				// Si se requieren tokens y no hay parámetro team, mostrar 404
				console.warn("Team token required but not provided");
				return "/404";
			} else {
				// Solo hay event token válido, guardar solo el evento
				localStorage.setItem("validatedEventId", tokenValidation.eventId);
				console.log("Valid event credential saved to localStorage");
			}

			// Verificar si se debe limpiar la sesión
			const clearSession =
				import.meta.env.VITE_EVENT_ACCESS_CLEAR_SESSION === "true";

			if (clearSession) {
				// Limpiar localStorage y sessionStorage
				await localStorage.clear();
				await sessionStorage.clear();

				// Marcar que venimos de un acceso directo con token
				sessionStorage.setItem("directEventAccess", "true");
				sessionStorage.setItem("eventIdFromToken", tokenValidation.eventId);

				// Re-establecer teamId y credentials si estaba presente y era válido
				if (teamParam) {
					const teamTokenValidation = validateTeamToken(teamParam);
					if (teamTokenValidation && teamTokenValidation.isValid) {
						sessionStorage.setItem(
							"autoSelectTeamId",
							teamTokenValidation.teamId
						);
						// Re-guardar las credenciales válidas después de la limpieza
						localStorage.setItem("validatedEventId", tokenValidation.eventId);
						localStorage.setItem("validatedTeamId", teamTokenValidation.teamId);
					}
				} else {
					// Solo event token, re-guardar solo el evento
					localStorage.setItem("validatedEventId", tokenValidation.eventId);
				}

				// Recargar la página para reiniciar completamente el MemoryRouter y Redux
				// Esto asegura que no quede ningún estado residual
				const redirectUrl =
					teamParam && validateTeamToken(teamParam)?.isValid
						? window.location.pathname +
						  `?direct_event=${tokenValidation.eventId}&direct_team=${teamParam}`
						: window.location.pathname +
						  `?direct_event=${tokenValidation.eventId}`;
				window.location.href = redirectUrl;
				return "/"; // Esta línea no se ejecutará debido al reload
			}

			// Almacenar el eventId para que la aplicación lo procese automáticamente
			sessionStorage.setItem("autoSelectEventId", tokenValidation.eventId);

			// Limpiar los parámetros de la URL
			clearEventParamFromURL();
			if (teamParam) {
				clearTeamParamFromURL();
			}
			return `/teams/${tokenValidation.eventId}`;
		} else {
			console.warn("Invalid event token provided:", eventParam);
			clearEventParamFromURL();
			
			// Si se requieren tokens y el event token es inválido, mostrar 404
			if (requireTokens) {
				return "/404";
			}
		}
	} else if (requireTokens) {
		// Si se requieren tokens y no hay parámetro event, mostrar 404
		console.warn("Event and team tokens required but not provided");
		return "/404";
	}

	// Manejar el acceso directo después del reload
	const directEventId = urlParams.get("direct_event");
	const directTeamParam = urlParams.get("direct_team");
	if (directEventId) {
		console.log("Handling direct event access after reload:", directEventId);

		// Si también hay un team directo, validar el token y almacenarlo
		if (directTeamParam) {
			const teamTokenValidation = validateTeamToken(directTeamParam);
			if (teamTokenValidation && teamTokenValidation.isValid) {
				console.log(
					"Handling direct team access after reload:",
					teamTokenValidation.teamId
				);
				sessionStorage.setItem("autoSelectTeamId", teamTokenValidation.teamId);
				
				// Guardar credenciales válidas en localStorage
				localStorage.setItem("validatedEventId", directEventId);
				localStorage.setItem("validatedTeamId", teamTokenValidation.teamId);
				console.log("Valid credentials saved to localStorage after reload");
			} else {
				console.warn("Invalid direct team token:", directTeamParam);
			}
		} else {
			// Solo event directo, guardar solo el evento
			localStorage.setItem("validatedEventId", directEventId);
			console.log("Valid event credential saved to localStorage after reload");
		}

		// Limpiar los parámetros de la URL
		const newUrl = window.location.pathname;
		window.history.replaceState({}, "", newUrl);

		// Almacenar para auto-inicialización
		sessionStorage.setItem("autoSelectEventId", directEventId);

		return `/teams/${directEventId}`;
	}

	// Si es una URL de viewer, usar la ruta raíz con parámetros
	if (action === "viewer") {
		return `/${window.location.search}`;
	}

	// Comportamiento normal
	return localStorage.getItem("lastRoute") || "/";
};

getInitialRoute().then(initialRoute => {
	// Inicializar configuración dinámica desde URL
	initializeDynamicConfig();
	
	initUploadQueue();
	initAssetCaching();
	
	// Inicializar sistema de notificaciones push
	initNotificationSystem();
	
	// Solicitar permisos de notificación después de que cargue la app
	setTimeout(() => {
		promptNotificationPermission();
	}, 2000); // Esperar 2 segundos para que el usuario vea la interfaz
	
	// Inicializar monitor de conexiones Firebase
	startConnectionMonitor();

	ReactDOM.createRoot(document.getElementById("root")).render(
		<Provider store={store}>
			<PersistGate loading={null} persistor={persistor}>
				<Router initialEntries={[initialRoute]} >
					<App />
				</Router>
			</PersistGate>
		</Provider>
	);
});












