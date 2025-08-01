// src/components/URLHandler.jsx
import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const URLHandler = () => {
	const location = useLocation();
	const navigate = useNavigate();
	
	useEffect(() => {
		console.log('URLHandler - Current location:', location);
		
		// Parsear parámetros de URL manualmente ya que usamos MemoryRouter
		const searchParams = new URLSearchParams(location.search);
		const action = searchParams.get('action');
		const eventId = searchParams.get('eventId');
		const teamId = searchParams.get('teamId');

		console.log('URLHandler - Parsed params:', { action, eventId, teamId });

		// Si es una URL de viewer, navegar a la página de viewer
		if (action === 'viewer' && eventId && teamId) {
			console.log('URLHandler - Navigating to viewer page');
			navigate(`/viewer/${eventId}/${teamId}`, { replace: true });
		}
	}, [location, navigate]);

	return null;
};

export default URLHandler;
