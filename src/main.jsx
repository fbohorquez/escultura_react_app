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
import { validateEventToken, getEventParamFromURL, clearEventParamFromURL } from "./utils/eventToken";
import { overrideNative } from "./utils/overrideNative";

// Inicializar los overrides nativos
overrideNative();


// Función para determinar la ruta inicial
const getInitialRoute = async () => {
	const urlParams = new URLSearchParams(window.location.search);
	const action = urlParams.get('action');
	const eventParam = getEventParamFromURL();
	
	// Si hay un parámetro event, validar y procesar
	if (eventParam) {
		const tokenValidation = validateEventToken(eventParam);
		
		if (tokenValidation && tokenValidation.isValid) {
			console.log('Valid event token detected, eventId:', tokenValidation.eventId);
			
			// Verificar si se debe limpiar la sesión
			const clearSession = import.meta.env.VITE_EVENT_ACCESS_CLEAR_SESSION === 'true';
			
			if (clearSession) {
				// Limpiar localStorage y sessionStorage
				await localStorage.clear();
				await sessionStorage.clear();
				
				// Marcar que venimos de un acceso directo con token
				sessionStorage.setItem('directEventAccess', 'true');
				sessionStorage.setItem('eventIdFromToken', tokenValidation.eventId);
				
				console.log('Session cleared due to VITE_EVENT_ACCESS_CLEAR_SESSION=true - forcing fresh start');
				
				// Recargar la página para reiniciar completamente el MemoryRouter y Redux
				// Esto asegura que no quede ningún estado residual
				window.location.href = window.location.pathname + `?direct_event=${tokenValidation.eventId}`;
				return "/"; // Esta línea no se ejecutará debido al reload
			}
			
			// Almacenar el eventId para que la aplicación lo procese automáticamente
			sessionStorage.setItem('autoSelectEventId', tokenValidation.eventId);
			
			// Limpiar el parámetro de la URL
			clearEventParamFromURL();
			return `/teams/${tokenValidation.eventId}`;
		} else {
			console.warn('Invalid event token provided:', eventParam);
			clearEventParamFromURL();
		}
	}
	
	// Manejar el acceso directo después del reload
	const directEventId = urlParams.get('direct_event');
	if (directEventId) {
		console.log('Handling direct event access after reload:', directEventId);
		
		// Limpiar el parámetro de la URL
		const newUrl = window.location.pathname;
		window.history.replaceState({}, '', newUrl);
		
		// Almacenar para auto-inicialización
		sessionStorage.setItem('autoSelectEventId', directEventId);
		
		return `/teams/${directEventId}`;
	}
	
	// Si es una URL de viewer, usar la ruta raíz con parámetros
	if (action === 'viewer') {
		return `/${window.location.search}`;
	}
	
	// Comportamiento normal
	return localStorage.getItem("lastRoute") || "/";
};

getInitialRoute().then(initialRoute => {
	initUploadQueue();
	initAssetCaching();

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









