// src/hooks/useDeviceAssignmentWatcher.js
import { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { clearSession } from '../features/session/sessionSlice';

/**
 * Hook que detecta cuando el device del equipo seleccionado se vacía
 * y redirige a la página de error correspondiente
 */
export const useDeviceAssignmentWatcher = () => {
	const dispatch = useDispatch();
	const navigate = useNavigate();
	
	const selectedTeam = useSelector((state) => state.session.selectedTeam);
	const sessionToken = useSelector((state) => state.session.token);
	const teams = useSelector((state) => state.teams.items);
	const isAdmin = useSelector((state) => state.session.isAdmin);
	
	// Referencia para el device anterior
	const previousDeviceRef = useRef(null);
	
	useEffect(() => {
		// No hacer nada si es admin
		if (isAdmin) return;
		
		// No hacer nada si no hay equipo seleccionado o token de sesión
		if (!selectedTeam || !sessionToken) return;
		
		// Buscar el equipo actual en la lista de equipos
		const currentTeamData = teams.find(team => team.id === selectedTeam.id);
		if (!currentTeamData) return;
		
		const currentDevice = currentTeamData.device;
		const previousDevice = previousDeviceRef.current;
		
		console.log('🔍 Device Assignment Watcher:', {
			teamId: selectedTeam.id,
			teamName: selectedTeam.name,
			currentDevice,
			previousDevice,
			sessionToken,
			isFirstCheck: previousDevice === null
		});
		
		// Si es la primera vez, solo guardar el valor actual
		if (previousDevice === null) {
			previousDeviceRef.current = currentDevice;
			return;
		}
		
		// Detectar si el device cambió a vacío o a otro token diferente
		if (previousDevice !== "" && (currentDevice === "" || currentDevice !== sessionToken)) {
			console.log('🚨 Device assignment lost!', {
				reason: currentDevice === "" ? "Device cleared" : "Device taken by another",
				teamId: selectedTeam.id,
				teamName: selectedTeam.name,
				oldDevice: previousDevice,
				newDevice: currentDevice,
				sessionToken
			});
			
			// Limpiar toda la sesión
			dispatch(clearSession());
			
			// Limpiar localStorage
			localStorage.removeItem("lastRoute");
			localStorage.removeItem("persist:root");
      localStorage.removeItem("validatedEventId");
      localStorage.removeItem("validatedTeamId");
			localStorage.removeItem("goToMap");
			// Redirigir a la página de error
			navigate("/device-not-assigned", { replace: true });
		}
		
		// Actualizar la referencia
		previousDeviceRef.current = currentDevice;
		
	}, [selectedTeam, sessionToken, teams, isAdmin, dispatch, navigate]);
};

