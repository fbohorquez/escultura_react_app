// src/components/EventMap.jsx
import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";
import { updateTeamData } from "../features/teams/teamsSlice";
import markMe from "../assets/mark-me.png";

const containerStyle = { width: "100%", height: "100%" };
const SMOOTHING_BUFFER_SIZE = 5;
const ACCURACY_THRESHOLD = 15; // metros
const MAX_JUMP_DISTANCE = 30; // metros
const ICON_SIZE = 80;

// Haversine formula para distancia en metros
const getDistance = (p1, p2) => {
	const R = 6371e3;
	const toRad = (deg) => (deg * Math.PI) / 180;
	const φ1 = toRad(p1.lat);
	const φ2 = toRad(p2.lat);
	const Δφ = toRad(p2.lat - p1.lat);
	const Δλ = toRad(p2.lng - p1.lng);
	const a =
		Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
		Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	return R * c;
};

const EventMap = () => {
	const { isLoaded } = useJsApiLoader({
		googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
	});

	const dispatch = useDispatch();
	const coordBuffer = useRef([]);
	const lastAvg = useRef(null);
	const [initialCenter, setInitialCenter] = useState(null);

	const event = useSelector((state) => state.event.event);
	const teams = useSelector((state) => state.teams.items);
	const selectedTeam = useSelector((state) => state.session.selectedTeam);

	// Establecer center inicial solo una vez
	useEffect(() => {
		if (event && !initialCenter) {
			setInitialCenter({ lat: event.lat, lng: event.lon });
		}
	}, [event, initialCenter]);

	// Suscripción a geolocalización con filtrado y suavizado ponderado
	useEffect(() => {
		if (!navigator.geolocation || !selectedTeam || !initialCenter) return;

		const watchId = navigator.geolocation.watchPosition(
			({ coords }) => {
				const { latitude: lat, longitude: lng, accuracy } = coords;
				// Filtrar por precisión
				if (accuracy > ACCURACY_THRESHOLD) return;
				// Filtrar saltos grandes
				if (lastAvg.current) {
					const jump = getDistance({ lat, lng }, lastAvg.current);
					if (jump > MAX_JUMP_DISTANCE) return;
				}
				// Añadir lectura al búfer
				coordBuffer.current.push({ lat, lng, accuracy });
				if (coordBuffer.current.length > SMOOTHING_BUFFER_SIZE) {
					coordBuffer.current.shift();
				}
				// Promedio ponderado por inverso de accuracy
				let sumLat = 0,
					sumLng = 0,
					weight = 0;
				coordBuffer.current.forEach(({ lat: la, lng: ln, accuracy: ac }) => {
					const w = 1 / ac;
					sumLat += la * w;
					sumLng += ln * w;
					weight += w;
				});
				const avgLat = sumLat / weight;
				const avgLng = sumLng / weight;
				lastAvg.current = { lat: avgLat, lng: avgLng };
				// Actualizar Firebase
				dispatch(
					updateTeamData({
						eventId: event.id,
						teamId: selectedTeam.id,
						changes: { lat: avgLat, lon: avgLng },
					})
				);
			},
			(err) => console.error("Geolocation error:", err),
			{ enableHighAccuracy: true, maximumAge: 0, timeout: Infinity }
		);

		return () => navigator.geolocation.clearWatch(watchId);
	}, [event, selectedTeam, initialCenter, dispatch]);

	const renderMarkers = () =>
		teams.map((team) =>
			team.lat != null && team.lon != null ? (
				<Marker
					key={team.id}
					position={{ lat: team.lat, lng: team.lon }}
					icon={{
						url:
							team.id === selectedTeam?.id ? markMe : "/icons/marker-team.png",
						scaledSize: new window.google.maps.Size(ICON_SIZE, ICON_SIZE),
						anchor: new window.google.maps.Point(ICON_SIZE / 2, ICON_SIZE / 2),
						rotation:
							team.id === selectedTeam?.id ? selectedTeam.direction || 0 : 0,
					}}
				/>
			) : null
		);

	if (!isLoaded || !initialCenter) return null;

	const handleLoad = (map) => {
		map.panTo(initialCenter);
		map.setZoom(15);
	};

	return (
		<GoogleMap
			id="event-map"
			mapContainerStyle={containerStyle}
			onLoad={handleLoad}
			options={{
				styles: [
					{
						featureType: "poi",
						elementType: "labels.icon",
						stylers: [{ visibility: "off" }],
					},
				],
				disableDefaultUI: true,
				gestureHandling: "greedy",
			}}
		>
			{renderMarkers()}
		</GoogleMap>
	);
};

export default React.memo(EventMap);

