// src/pages/teamViewerPage.jsx
import React from 'react';
import { useParams } from 'react-router-dom';
import TeamViewer from '../components/TeamViewer';

const TeamViewerPage = () => {
	const { eventId, teamId } = useParams();
	
	console.log('TeamViewerPage - Params:', { eventId, teamId });

	if (!eventId || !teamId) {
		return (
			<div className="error-container">
				<h2>Error: Parámetros faltantes</h2>
				<p>No se encontraron los parámetros necesarios para mostrar el viewer.</p>
			</div>
		);
	}

	return <TeamViewer eventId={eventId} teamId={teamId} />;
};

export default TeamViewerPage;
