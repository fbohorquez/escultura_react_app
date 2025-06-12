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
	
const lastRoute = localStorage.getItem("lastRoute") || "/";

initUploadQueue();
initAssetCaching();

ReactDOM.createRoot(document.getElementById("root")).render(
	<React.StrictMode>
		<Provider store={store}>
			<PersistGate loading={null} persistor={persistor}>
				<Router initialEntries={[lastRoute]} >
					<App />
				</Router>
			</PersistGate>
		</Provider>
	</React.StrictMode>
);







