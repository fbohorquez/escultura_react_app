// src/components/routeListener.jsx
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Componente que escucha cambios de ruta y los guarda en localStorage
 */
export default function RouteListener() {
	const location = useLocation();

	useEffect(() => {
		localStorage.setItem("lastRoute", location.pathname);
	}, [location]);

	return null;
}



