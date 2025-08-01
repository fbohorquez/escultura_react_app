// src/components/ActivityMarker.jsx
import React from "react";
import { Marker } from "@react-google-maps/api";
import { useDispatch } from "react-redux";
import { useActivityIcon } from "../hooks/useActivityIcon";
import { startActivityWithSuspensionCheck } from "../features/activities/activitiesSlice";

const ActivityMarker = ({ activity }) => {
	const dispatch = useDispatch();
	const iconConfig = useActivityIcon(activity.icon?.icon || "", activity.type?.id || 3);

	// Si el icono aún no está procesado, no renderizar el marker
	if (!iconConfig) {
		return null;
	}

	const handleActivityClick = () => {
		// Iniciar la actividad
		dispatch(startActivityWithSuspensionCheck(activity));
	};

	return (
		<Marker
			key={`activity-${activity.id}`}
			position={{ lat: activity.lat, lng: activity.lon }}
			icon={iconConfig}
			title={activity.name}
			onClick={handleActivityClick}
		/>
	);
};

export default ActivityMarker;
