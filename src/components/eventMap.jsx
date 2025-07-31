// src/components/EventMap.jsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";
import { updateTeamData } from "../features/teams/teamsSlice";
import ActivityMarker from "./ActivityMarker";
import markMe from "../assets/mark-me.png";
import { usePopup } from "../hooks/usePopup";
import { useDebugMode } from "../hooks/useDebugMode";
import { useTranslation } from "react-i18next";
import { startActivityWithSuspensionCheck } from "../features/activities/activitiesSlice";

const containerStyle = { width: "100%", height: "100%" };
const SMOOTHING_BUFFER_SIZE = 5;
const ACCURACY_THRESHOLD = 200; // metros - Aumentado para desarrollo/testing
const MAX_JUMP_DISTANCE = 200; // metros - Aumentado para desarrollo/testing
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

// Función para determinar si una actividad es visible
const isActivityVisible = (activity, team, isAdmin) => {
	// Si es admin, mostrar todas las actividades
	if (isAdmin) {
		return !activity.complete && !activity.del;
	}

	// Si no hay equipo seleccionado, no mostrar actividades
	if (!team) {
		return false;
	}

	// La actividad debe estar disponible (no completa ni eliminada)
	if (activity.complete || activity.del) {
		return false;
	}

	// Si el equipo no tiene ruta (route === 0), mostrar todas las actividades según visibilidad
	if (team.route === 0) {
		// Si sequential es 0, mostrar según visible
		if (team.sequential === 0) {
			return team.visible === 1;
		}
		// Si sequential es 1, mostrar solo si visible es 1
		return team.visible === 1;
	}

	// Si el equipo tiene ruta (route === 1)
	if (team.route === 1) {
		// Si sequential es 0, mostrar según visible
		if (team.sequential === 0) {
			return team.visible === 1;
		}
		// Si sequential es 1, mostrar solo la siguiente actividad en orden o todas si visible es 1
		if (team.sequential === 1) {
			// Si visible es 1, mostrar todas las actividades
			if (team.visible === 1) {
				return true;
			}
			// Si visible es 0, mostrar solo la siguiente actividad en la secuencia
			const teamActivities = team.activities_data || [];
			// Encontrar la primera actividad no completada en el orden del array
			const nextActivity = teamActivities.find(act => !act.complete && !act.del);
			return nextActivity && nextActivity.id === activity.id;
		}
	}

	return false;
};

const EventMap = () => {
	
	const { openPopup, closePopup } = usePopup();
	const { isDebugMode } = useDebugMode();
	const { t } = useTranslation();

	// Obtener el nivel de detalle del mapa desde las variables de entorno
	const mapDetailLevel = import.meta.env.VITE_GOOGLE_MAPS_DETAIL_LEVEL || 'basic';

	// Configurar estilos del mapa según el nivel de detalle
	const getMapStyles = () => {
		switch (mapDetailLevel) {
			case 'minimal':
				return [
					// Ocultar casi todos los POIs y elementos secundarios
					{ featureType: "poi", stylers: [{ visibility: "off" }] },
					{ featureType: "transit", stylers: [{ visibility: "off" }] },
					{ featureType: "administrative.land_parcel", stylers: [{ visibility: "off" }] },
					{ featureType: "administrative.neighborhood", stylers: [{ visibility: "off" }] },
					{ featureType: "road.local", elementType: "labels", stylers: [{ visibility: "off" }] },
				];
			case 'detailed':
				return [
					// Mostrar todos los detalles, solo ocultar iconos de POI por defecto
					{ featureType: "poi", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
				];
			case 'all':
				return [
					// Mostrar todos los detalles, incluyendo iconos de POI
					{ featureType: "poi", elementType: "labels.icon", stylers: [{ visibility: "on" }] },
					{ featureType: "poi.business", stylers: [{ visibility: "on" }] },
					{ featureType: "transit.station", stylers: [{ visibility: "on" }] },
				];
			// Si no se especifica o es un valor desconocido, usar configuración básica
			case 'basic':
			default:
				return [
					// Configuración equilibrada - ocultar POIs pero mantener elementos importantes
					{ featureType: "poi", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
					{ featureType: "poi.business", stylers: [{ visibility: "off" }] },
					{ featureType: "transit.station", stylers: [{ visibility: "simplified" }] },
				];
		}
	};

	const { isLoaded } = useJsApiLoader({
		googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
	});

	const dispatch = useDispatch();
	const coordBuffer = useRef([]);
	const lastAvg = useRef(null);
	const notifiedActivities = useRef(new Set());
	const [initialCenter, setInitialCenter] = useState(null);
	const mapRef = useRef(null);

	const event = useSelector((state) => state.event.event);
	const teams = useSelector((state) => state.teams.items);
	const isAdmin = useSelector((state) => state.session.isAdmin);

	// Selector combinado para obtener datos actualizados del selectedTeam
	const selectedTeamData = useSelector((state) => {
		const selectedTeam = state.session.selectedTeam;
		if (!selectedTeam) return null;
		
		// Buscar datos actualizados en teams.items
		return state.teams.items.find(team => team.id === selectedTeam.id) || selectedTeam;
	});

	// Función para mostrar popup de proximidad a actividad
	const showActivityProximityPopup = useCallback((activity) => {
		openPopup({
			titulo: activity.name,
			texto: t('activity_proximity_text', { activityName: activity.name }),
			array_botones: [
				{
					titulo: t('close'),
					callback: () => {
						console.log('🚫 Popup de actividad cerrado:', activity.name);
						closePopup();
					}
				},
				{
					titulo: t('start_activity'),
					callback: () => {
						console.log('🚀 Iniciando actividad:', activity.name, 'ID:', activity.id);
						dispatch(startActivityWithSuspensionCheck(activity));
						closePopup();
					}
				}
			],
			layout: "center",
			overlay: true,
			close_button: true
		});
	}, [openPopup, closePopup, t, dispatch]);

	// Función para verificar proximidad a actividades
	const checkActivityProximity = useCallback((teamPosition) => {
		if (!selectedTeamData || isAdmin) return;

		const visibleActivities = (selectedTeamData.activities_data || [])
			.filter((activity) => isActivityVisible(activity, selectedTeamData, false));

		visibleActivities.forEach((activity) => {
			if (!activity.lat || !activity.lon || !activity.distance) return;

			const distance = getDistance(
				teamPosition,
				{ lat: activity.lat, lng: activity.lon }
			);

			const isWithinRange = distance <= activity.distance;
			const activityKey = `${activity.id}-${selectedTeamData.id}`;
			const hasBeenNotified = notifiedActivities.current.has(activityKey);

			console.log('🎯 Checking activity proximity:', {
				activityName: activity.name,
				activityId: activity.id,
				distance: Math.round(distance),
				requiredDistance: activity.distance,
				isWithinRange,
				hasBeenNotified
			});

			if (isWithinRange && !hasBeenNotified) {
				console.log('✅ Showing proximity popup for activity:', activity.name);
				notifiedActivities.current.add(activityKey);
				showActivityProximityPopup(activity);
			} else if (!isWithinRange && hasBeenNotified) {
				// Si ya no está en rango, permitir nueva notificación cuando vuelva a acercarse
				notifiedActivities.current.delete(activityKey);
			}
		});
	}, [selectedTeamData, isAdmin, showActivityProximityPopup]);

	// Establecer center inicial solo una vez
	useEffect(() => {
		if (event && !initialCenter) {
			setInitialCenter({ lat: event.lat, lng: event.lon });
		}
	}, [event, initialCenter]);

	// Limpiar notificaciones cuando cambie el equipo seleccionado
	useEffect(() => {
		if (selectedTeamData) {
			console.log('🔄 Team changed, clearing activity notifications for team:', selectedTeamData.id);
			notifiedActivities.current.clear();
		}
	}, [selectedTeamData]);

	// Suscripción a geolocalización con filtrado y suavizado ponderado
	useEffect(() => {
		console.log('🔄 Geolocation effect triggered:', {
			hasGeolocation: !!navigator.geolocation,
			selectedTeamData: !!selectedTeamData,
			initialCenter: !!initialCenter,
			teamId: selectedTeamData?.id,
			isDebugMode
		});
		
		// Si está en modo debug, no escuchar GPS
		if (isDebugMode) {
			console.log('🔧 Debug mode active - GPS tracking disabled');
			return;
		}
		
		if (!navigator.geolocation || !selectedTeamData || !initialCenter) return;

		console.log('🌍 Starting geolocation watch for team:', selectedTeamData.id);

		const watchId = navigator.geolocation.watchPosition(
			({ coords }) => {
				const { latitude: lat, longitude: lng, accuracy } = coords;
				console.log('🌍 Geolocation received:', { lat, lng, accuracy });
				
				// Filtrar por precisión
				if (accuracy > ACCURACY_THRESHOLD) {
					console.log('❌ Rejected by accuracy filter:', accuracy, '>', ACCURACY_THRESHOLD);
					return;
				}
				
				// Filtrar saltos grandes
				if (lastAvg.current) {
					const jump = getDistance({ lat, lng }, lastAvg.current);
					console.log('📏 Jump distance:', jump, 'meters');
					if (jump > MAX_JUMP_DISTANCE) {
						console.log('❌ Rejected by jump filter:', jump, '>', MAX_JUMP_DISTANCE);
						return;
					}
				}
				
				console.log('✅ Position accepted, updating team location');
				
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
				
				console.log('📍 Updating team position to:', { avgLat, avgLng });
				
				const newPosition = { lat: avgLat, lng: avgLng };
				
				// Centrar el mapa en la nueva posición del usuario
				if (mapRef.current) {
					mapRef.current.panTo(newPosition);
				}
				
				// Verificar proximidad a actividades
				checkActivityProximity(newPosition);
				
				// Actualizar Firebase
				dispatch(
					updateTeamData({
						eventId: event.id,
						teamId: selectedTeamData.id,
						changes: { lat: avgLat, lon: avgLng },
					})
				);
			},
			(err) => console.error("Geolocation error:", err),
			{ enableHighAccuracy: true, maximumAge: 0, timeout: Infinity }
		);

		return () => {
			console.log('🛑 Clearing geolocation watch');
			navigator.geolocation.clearWatch(watchId);
		};
	}, [event, selectedTeamData, initialCenter, dispatch, checkActivityProximity, isDebugMode]);

	const renderMarkers = () => {
		console.log('🎯 Rendering markers for teams:', teams.length, 'selectedTeam:', selectedTeamData?.id);
		return teams.map((team) => {
			console.log('🎯 Team marker:', team.id, 'lat:', team.lat, 'lon:', team.lon, 'isSelected:', team.id === selectedTeamData?.id);
			return team.lat != null && team.lon != null ? (
				<Marker
					key={team.id}
					position={{ lat: team.lat, lng: team.lon }}
					icon={{
						url:
							team.id === selectedTeamData?.id ? markMe : "/icons/marker-team.png",
						scaledSize: new window.google.maps.Size(ICON_SIZE, ICON_SIZE),
						anchor: new window.google.maps.Point(ICON_SIZE / 2, ICON_SIZE / 2),
						rotation:
							team.id === selectedTeamData?.id ? selectedTeamData.direction || 0 : 0,
					}}
				/>
			) : null;
		});
	};

	// Renderizar actividades
	const renderActivities = () => {
		if (isAdmin) {
			// Si es admin, mostrar todas las actividades del evento
			return (event?.activities_data || [])
				.filter((activity) => isActivityVisible(activity, null, true))
				.map((activity) => (
					<ActivityMarker key={`activity-${activity.id}`} activity={activity} />
				));
		} else if (selectedTeamData) {
			console.log('🎯 Rendering activities for team:', selectedTeamData?.id, selectedTeamData?.activities_data?.length);
			// Si hay equipo seleccionado, mostrar sus actividades
			return (selectedTeamData.activities_data || [])
				.filter((activity) => isActivityVisible(activity, selectedTeamData, false))
				.map((activity) => (
					<ActivityMarker key={`activity-${activity.id}`} activity={activity} />
				));
		}
		
		return [];
	};

	// Función para manejar clicks en el mapa en modo debug
	const handleMapClick = useCallback((mapEvent) => {
		if (!isDebugMode || !selectedTeamData || !event) return;

		const clickedLat = mapEvent.latLng.lat();
		const clickedLng = mapEvent.latLng.lng();
		const newPosition = { lat: clickedLat, lng: clickedLng };

		console.log('🔧 Debug mode: Moving team to clicked position:', newPosition);

		// Centrar el mapa en la nueva posición
		if (mapRef.current) {
			mapRef.current.panTo(newPosition);
		}

		// Actualizar Firebase con la nueva posición
		dispatch(
			updateTeamData({
				eventId: event.id,
				teamId: selectedTeamData.id,
				changes: { lat: clickedLat, lon: clickedLng },
			})
		);

		// Verificar proximidad a actividades en la nueva posición
		checkActivityProximity(newPosition);
	}, [isDebugMode, selectedTeamData, event, dispatch, checkActivityProximity]);

	// Efecto para centrar el mapa en la posición del equipo seleccionado cuando cambie
	useEffect(() => {
		if (mapRef.current && selectedTeamData && selectedTeamData.lat != null && selectedTeamData.lon != null) {
			console.log('🎯 Centering map on selected team position:', { lat: selectedTeamData.lat, lng: selectedTeamData.lon });
			mapRef.current.panTo({ lat: selectedTeamData.lat, lng: selectedTeamData.lon });
		}
	}, [selectedTeamData]);

	if (!isLoaded || !initialCenter) return null;

	const handleLoad = (map) => {
		mapRef.current = map;
		map.panTo(initialCenter);
		map.setZoom(15);
	};

	return (
		<GoogleMap
			id="event-map"
			mapContainerStyle={containerStyle}
			onLoad={handleLoad}
			onClick={handleMapClick}
			options={{
				styles: getMapStyles(),
				disableDefaultUI: true,
				gestureHandling: "greedy",
			}}
		>
			{renderMarkers()}
			{renderActivities()}
		</GoogleMap>
	);
};

export default React.memo(EventMap);


