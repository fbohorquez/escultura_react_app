// src/components/ActivityMarker.jsx
import React from "react";
import { Marker } from "@react-google-maps/api";
import { useActivityIcon } from "../hooks/useActivityIcon";

const ActivityMarker = ({ activity }) => {
	const iconConfig = useActivityIcon(activity.icon?.icon || "");

	// Si el icono aún no está procesado, no renderizar el marker
	if (!iconConfig) {
		return null;
	}

	return (
		<Marker
			key={`activity-${activity.id}`}
			position={{ lat: activity.lat, lng: activity.lon }}
			icon={iconConfig}
			title={activity.name}
		/>
	);
};

export default ActivityMarker;
