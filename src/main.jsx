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

// Función para determinar la ruta inicial
const getInitialRoute = () => {
	const urlParams = new URLSearchParams(window.location.search);
	const action = urlParams.get('action');
	
	// Si es una URL de viewer, usar la ruta raíz con parámetros
	if (action === 'viewer') {
		return `/${window.location.search}`;
	}
	
	// Comportamiento normal
	return localStorage.getItem("lastRoute") || "/";
};

const initialRoute = getInitialRoute();

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







