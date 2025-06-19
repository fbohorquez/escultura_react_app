import React, { useState } from "react";
import { useSelector } from "react-redux";
import EventHeader from "../components/eventHeader";
import EventMap from "../components/eventMap";
import DebugPanel from "../components/DebugPanel";

const EventPage = () => {
	const event = useSelector((state) => state.event.event);
	const selectedTeam = useSelector((state) => state.session.selectedTeam);
	const teamPhoto = useSelector((state) => state.session.teamPhoto);
	const [collapsed, setCollapsed] = useState(false);

	const handleCollapse = () => setCollapsed((prev) => !prev);

	return (
		<div className="event-page">
			<EventHeader
				eventName={event.name}
				teamName={selectedTeam.name}
				teamPhoto={teamPhoto}
				logo={event.logo}
				onCollapse={handleCollapse}
				collapsed={collapsed}
			/>
			<div className="map-container">
				<EventMap />
			</div>
			<DebugPanel />
			{/* Aquí va la barra de acciones (chat, cronómetro, bromas) */}
		</div>
	);
};

export default EventPage;



