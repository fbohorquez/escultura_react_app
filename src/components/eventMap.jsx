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

// Importar assets de equipos (Equipo_0.png a Equipo_29.png)
const teamAssets = {};
for (let i = 0; i <= 29; i++) {
	try {
		teamAssets[i] = new URL(`../assets/Equipo_${i}.png`, import.meta.url).href;
	} catch {
		console.warn(`Asset Equipo_${i}.png not found`);
	}
}

const containerStyle = { width: "100%", height: "100%" };
const SMOOTHING_BUFFER_SIZE = 50; // Aumentar para mejor suavizado
const ACCURACY_THRESHOLD = 150; // Reducir para mejor precisión (de 200 a 50)
const MAX_JUMP_DISTANCE = 200; // Reducir para mejor filtrado (de 200 a 100)
const ICON_SIZE = 80;
const UPDATE_THROTTLE_MS = 500; // Throttle para actualizaciones de Firebase (500ms)

// Cache de imágenes precargadas
const imageCache = new Map();

// Función para precargar una imagen
const preloadImage = (url) => {
	return new Promise((resolve, reject) => {
		if (imageCache.has(url)) {
			resolve(imageCache.get(url));
			return;
		}

		const img = new Image();
		img.crossOrigin = 'anonymous';
		
		img.onload = () => {
			imageCache.set(url, img);
			resolve(img);
		};
		
		img.onerror = () => {
			reject(new Error(`Failed to load image: ${url}`));
		};
		
		img.src = url;
	});
};

// Función para crear iconos rotados usando Canvas (más compatible con Google Maps)
const createRotatedIconSync = (imageUrl, rotation = 0, size = 80) => {
	// Si no hay rotación, devolver la URL original
	if (rotation === 0) {
		return imageUrl;
	}

	console.log("🔄 Attempting to create rotated icon:", { imageUrl, rotation, size });

	// Verificar si la imagen está en caché
	let cachedImage = imageCache.get(imageUrl);
	
	// Si no está en caché, intentar cargarla de forma síncrona
	if (!cachedImage) {
		try {
			const img = new Image();
			img.src = imageUrl;
			
			// Si la imagen ya está cargada (cache del navegador)
			if (img.complete && img.naturalWidth > 0) {
				imageCache.set(imageUrl, img);
				cachedImage = img;
				console.log("📸 Image loaded from browser cache:", imageUrl);
			} else {
				console.warn("⚠️ Image not immediately available, using original:", imageUrl);
				return imageUrl;
			}
		} catch (error) {
			console.warn("⚠️ Error loading image, using original:", error);
			return imageUrl;
		}
	}

	try {
		// Crear un canvas temporal
		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d');
		canvas.width = size;
		canvas.height = size;

		// Limpiar el canvas con fondo transparente
		ctx.clearRect(0, 0, size, size);
		
		// Guardar el estado del contexto
		ctx.save();
		
		// Mover al centro del canvas
		ctx.translate(size / 2, size / 2);
		
		// Rotar
		ctx.rotate((rotation * Math.PI) / 180);
		
		// Dibujar la imagen centrada
		ctx.drawImage(cachedImage, -size / 2, -size / 2, size, size);
		
		// Restaurar el estado del contexto
		ctx.restore();
		
		// Convertir a data URL PNG
		const result = canvas.toDataURL('image/png');
		console.log("✅ Generated rotated PNG icon for rotation", rotation + "°");
		return result;
	} catch (error) {
		console.warn('Error creating rotated icon:', error);
		return imageUrl; // Fallback a imagen original
	}
};

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

// Función para calcular la dirección (bearing) entre dos puntos en grados
const getBearing = (p1, p2) => {
	const toRad = (deg) => (deg * Math.PI) / 180;
	const toDeg = (rad) => (rad * 180) / Math.PI;
	
	const φ1 = toRad(p1.lat);
	const φ2 = toRad(p2.lat);
	const Δλ = toRad(p2.lng - p1.lng);
	
	const y = Math.sin(Δλ) * Math.cos(φ2);
	const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
	
	const bearing = toDeg(Math.atan2(y, x));
	return (bearing + 360) % 360; // Normalizar a 0-360 grados
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

	const [markersCreated, setMarkersCreated] = useState(false); // Control para crear marcadores solo una vez

	// Obtener el nivel de detalle del mapa desde las variables de entorno
	const mapDetailLevel = import.meta.env.VITE_GOOGLE_MAPS_DETAIL_LEVEL || 'basic';

	// Obtener configuración de zoom desde las variables de entorno
	const getZoomLimits = () => {
		const minZoom = parseInt(import.meta.env.VITE_GOOGLE_MAPS_MIN_ZOOM) || 1;
		const maxZoom = parseInt(import.meta.env.VITE_GOOGLE_MAPS_MAX_ZOOM) || 21;
		
		// Validar que los valores estén en el rango permitido por Google Maps (1-21)
		return {
			minZoom: Math.max(1, Math.min(21, minZoom)),
			maxZoom: Math.max(1, Math.min(21, maxZoom))
		};
	};

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
	const previousPosition = useRef(null); // Para calcular la dirección
	const notifiedActivities = useRef(new Set());
	const [initialCenter, setInitialCenter] = useState(null);
	const mapRef = useRef(null);
	const lastUpdateTime = useRef(0);
	const updateTimeoutRef = useRef(null);
	const teamMarkersRef = useRef(new Map()); // Referencias a los marcadores de equipos
	const initialTeamsRef = useRef(null); // Datos iniciales de equipos para evitar re-renders

	const event = useSelector((state) => state.event.event);
	const teams = useSelector((state) => state.teams.items);
	const isAdmin = useSelector((state) => state.session.isAdmin);

	// Separar selectedTeam (estable) de selectedTeamData (cambia constantemente)
	const selectedTeam = useSelector((state) => state.session.selectedTeam);
	
	// Función estable para obtener datos del equipo seleccionado sin causar re-renders
	const getSelectedTeamData = useCallback(() => {
		if (!selectedTeam) return null;
		return teams.find(team => team.id === selectedTeam.id) || selectedTeam;
	}, [selectedTeam, teams]);

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

	// Función para throttle de actualizaciones de Firebase solamente
	const throttledFirebaseUpdate = useCallback((newPosition, teamData, direction = null) => {
		
		const now = Date.now();
		
		// Cancelar timeout anterior si existe
		if (updateTimeoutRef.current) {
			clearTimeout(updateTimeoutRef.current);
		}
		
		// Preparar cambios para Firebase
		const changes = { lat: newPosition.lat, lon: newPosition.lng };
		if (direction !== null) {
			changes.direction = direction;
		}
		
		// Si ha pasado suficiente tiempo desde la última actualización, actualizar inmediatamente
		if (now - lastUpdateTime.current >= UPDATE_THROTTLE_MS) {
			lastUpdateTime.current = now;
			
			// Actualizar Firebase
			dispatch(
				updateTeamData({
					eventId: event.id,
					teamId: teamData.id,
					changes: changes,
				})
			);
		} 
		// else {
			
		// 	// Programar actualización para cuando termine el throttle
		// 	const timeRemaining = UPDATE_THROTTLE_MS - (now - lastUpdateTime.current);
		// 	clearTimeout(updateTimeoutRef.current);
		// 	updateTimeoutRef.current = setTimeout(() => {
		// 		lastUpdateTime.current = Date.now();
		// 		return;
		// 		dispatch(
		// 			updateTeamData({
		// 				eventId: event.id,
		// 				teamId: teamData.id,
		// 				changes: changes,
		// 			})
		// 		);
		// 	}, timeRemaining);
		// }
	}, [event?.id, dispatch]); // Remover dependencias que cambien constantemente

	// Función para actualizar directamente la posición del marcador del equipo seleccionado
	const updateSelectedTeamMarkerPosition = useCallback((newPosition, direction = null) => {
		// Verificar que Google Maps esté disponible
		if (!window.google?.maps) {
			console.log('⏳ Google Maps not available, skipping marker position update');
			return;
		}

		// Buscar el marcador del equipo seleccionado en el mapa y actualizar su posición directamente
		const markers = teamMarkersRef.current;
		if (selectedTeam && markers.has(selectedTeam.id)) {
			const marker = markers.get(selectedTeam.id);
			if (marker && marker.setPosition) {
				// Actualizar posición directamente
				marker.setPosition(newPosition);
				
				// Si hay dirección, actualizar el icono con rotación
				if (direction !== null && marker.setIcon) {
					const currentIcon = marker.getIcon();
					if (currentIcon) {
						// Usar SVG rotado para una rotación precisa
						const baseUrl = currentIcon.url || currentIcon;
						const size = currentIcon.scaledSize?.width || ICON_SIZE;
						const rotatedIconUrl = createRotatedIconSync(baseUrl, direction, size);
						
						console.log('🔄 Updating marker rotation:', { 
							teamId: selectedTeam.id, 
							direction, 
							baseUrl: baseUrl.substring(0, 50) + '...', 
							rotatedUrl: rotatedIconUrl.substring(0, 50) + '...' 
						});
						
						const rotatedIcon = {
							url: rotatedIconUrl,
							scaledSize: currentIcon.scaledSize,
							anchor: currentIcon.anchor
						};
						
						marker.setIcon(rotatedIcon);
					}
				}
			}
		}
	}, [selectedTeam]); // Solo depender del objeto selectedTeam

	// Función para actualizar cualquier marcador de equipo por cambios de Firebase
	const updateTeamMarkerFromFirebase = useCallback((teamId, newData) => {
		const markers = teamMarkersRef.current;
		if (markers.has(teamId)) {
			const marker = markers.get(teamId);
			if (marker && marker.setPosition && newData.lat != null && newData.lon != null) {
				const newPosition = { lat: newData.lat, lng: newData.lon };
				marker.setPosition(newPosition);
				
				// Solo actualizar rotación si es el equipo seleccionado en este dispositivo
				const isSelectedTeam = selectedTeam && teamId === selectedTeam.id;
				if (isSelectedTeam && newData.direction != null && marker.setIcon) {
					const currentIcon = marker.getIcon();
					if (currentIcon) {
						// Usar SVG rotado para una rotación precisa
						const baseUrl = currentIcon.url || currentIcon;
						const size = currentIcon.scaledSize?.width || ICON_SIZE; // Tamaño del equipo seleccionado
						const rotatedIconUrl = createRotatedIconSync(baseUrl, newData.direction, size);
						
						const rotatedIcon = {
							url: rotatedIconUrl,
							scaledSize: currentIcon.scaledSize,
							anchor: currentIcon.anchor
						};
						
						marker.setIcon(rotatedIcon);
					}
				}
				
			}
		}
	}, [selectedTeam]); // Depender de selectedTeam para controlar la rotación

	// Función para verificar proximidad a actividades
	const checkActivityProximity = useCallback((teamPosition) => {
		const currentTeamData = getSelectedTeamData();
		if (!currentTeamData || isAdmin) return;

		const visibleActivities = (currentTeamData.activities_data || [])
			.filter((activity) => isActivityVisible(activity, currentTeamData, false));

		visibleActivities.forEach((activity) => {
			if (!activity.lat || !activity.lon || !activity.distance) return;

			const distance = getDistance(
				teamPosition,
				{ lat: activity.lat, lng: activity.lon }
			);

			const isWithinRange = distance <= activity.distance;
			const activityKey = `${activity.id}-${currentTeamData.id}`;
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
	}, [getSelectedTeamData, isAdmin, showActivityProximityPopup]);

	// Establecer center inicial solo una vez
	useEffect(() => {
		if (event && !initialCenter) {
			setInitialCenter({ lat: event.lat, lng: event.lon });
		}
	}, [event, initialCenter]);

	// Precargar imágenes de marcadores
	useEffect(() => {
		const imagesToPreload = [markMe];
		
		// Agregar assets de equipos
		Object.values(teamAssets).forEach(url => {
			if (url) imagesToPreload.push(url);
		});

		// Precargar todas las imágenes
		const preloadPromises = imagesToPreload.map(url => 
			preloadImage(url).catch(err => console.warn('Failed to preload image:', url, err))
		);

		Promise.allSettled(preloadPromises).then(() => {
			console.log('📸 Image preloading completed');
		});
	}, []); // Solo una vez al inicializar

	// Efecto para actualizar marcadores cuando cambien los datos de equipos SIN re-renderizar
	useEffect(() => {
		if (!teams || teams.length === 0) return;

		if (!initialTeamsRef.current) {
			initialTeamsRef.current = [...teams];
			return;
		}

		// Actualizar solo los marcadores que han cambiado
		teams.forEach(team => {
			const previousTeam = initialTeamsRef.current.find(t => t.id === team.id);
			if (previousTeam) {
				const positionChanged = previousTeam.lat !== team.lat || previousTeam.lon !== team.lon;
				const directionChanged = previousTeam.direction !== team.direction;
				
				if (positionChanged || directionChanged) {
					console.log('🔄 Firebase update detected for team:', team.id, {positionChanged, directionChanged});
					updateTeamMarkerFromFirebase(team.id, team);
				}
			}
		});

		initialTeamsRef.current = [...teams];
	}, [teams, updateTeamMarkerFromFirebase]);

	// Limpiar notificaciones cuando cambie el equipo seleccionado
	useEffect(() => {
		if (selectedTeam) {
			console.log('🔄 Team changed, clearing activity notifications for team:', selectedTeam.id);
			notifiedActivities.current.clear();
			// También limpiar la posición anterior para el cálculo de dirección
			previousPosition.current = null;
		}
	}, [selectedTeam]); // Solo el objeto selectedTeam

	// Suscripción a geolocalización con filtrado y suavizado ponderado
	useEffect(() => {
		const currentTeamData = getSelectedTeamData();
		
		console.log('🔄 Geolocation effect triggered:', {
			hasGeolocation: !!navigator.geolocation,
			currentTeamData: !!currentTeamData,
			initialCenter: !!initialCenter,
			teamId: currentTeamData?.id,
			isDebugMode
		});
		
		// Si está en modo debug, no escuchar GPS
		// if (isDebugMode) {
		// 	console.log('🔧 Debug mode active - GPS tracking disabled');
		// 	return;
		// }
		
		if (!navigator.geolocation) {
			console.error('❌ Geolocation is not supported by this browser');
			return;
		}
		
		if (!currentTeamData) {
			console.log('❌ No selected team data');
			return;
		}
		
		if (!initialCenter) {
			console.log('❌ No initial center');
			return;
		}

		console.log('🌍 Starting geolocation watch for team:', currentTeamData.id);

		// Verificar permisos de geolocalización
		if (navigator.permissions) {
			navigator.permissions.query({ name: 'geolocation' }).then((permission) => {
				console.log('📍 Geolocation permission status:', permission.state);
				if (permission.state === 'denied') {
					console.error('❌ Geolocation permission denied');
					return;
				}
			}).catch((err) => {
				console.warn('⚠️ Could not check geolocation permissions:', err);
			});
		}

		const watchId = navigator.geolocation.watchPosition(
			({ coords }) => {
				console.log('🌍 ✅ Geolocation callback executed!');
				
				const { latitude: lat, longitude: lng, accuracy, heading, speed } = coords;
				console.log('🌍 Geolocation received:', { 
					lat, 
					lng, 
					accuracy,
					heading: heading !== null ? `${heading.toFixed(1)}°` : 'null',
					speed: speed !== null ? `${speed.toFixed(1)} m/s` : 'null'
				});
				
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
				
				// Obtener dirección desde la Geolocation API
				let direction = null;
				if (heading !== null && heading !== undefined) {
					// Usar el heading proporcionado por la API (más preciso)
					direction = heading;
					console.log('🧭 Using GPS heading:', direction.toFixed(1), 'degrees');
				} else if (previousPosition.current) {
					// Fallback: calcular dirección usando posiciones anteriores
					const distance = getDistance(previousPosition.current, newPosition);
					// Solo calcular dirección si ha habido un movimiento significativo
					if (distance > 1) {
						direction = getBearing(previousPosition.current, newPosition);
						console.log('🧭 Calculated heading (fallback):', direction.toFixed(1), 'degrees, distance:', distance.toFixed(1), 'm');
					}
				}
				
				// Actualizar la posición anterior para la próxima iteración (para fallback)
				previousPosition.current = newPosition;
				
				// PRIMERO: Actualizar directamente la posición del marcador SIN re-renderizar
				updateSelectedTeamMarkerPosition(newPosition, direction);
				
				// Centrar el mapa en la nueva posición del usuario
				// if (mapRef.current) {
				// 	mapRef.current.panTo(newPosition);
				// }
				
				// Verificar proximidad a actividades
				checkActivityProximity(newPosition);
				// SEGUNDO: Actualizar Firebase con throttling (esto puede causar re-render pero ya hemos actualizado el marcador)
				throttledFirebaseUpdate(newPosition, currentTeamData, direction);
			},
			(err) => {
				console.error("❌ Geolocation error:", err);
				console.error("Error code:", err.code);
				console.error("Error message:", err.message);
				
				// Mostrar mensajes específicos según el tipo de error
				switch(err.code) {
					case 1:
						console.error("❌ Permission denied by user");
						break;
					case 2:
						console.error("❌ Position unavailable");
						break;
					case 3:
						console.error("❌ Timeout");
						break;
					default:
						console.error("❌ Unknown error");
						break;
				}
			},
			{ 
				enableHighAccuracy: true, 
				maximumAge: 1000, // Cambiar de 0 a 1000ms para permitir caché reciente
				timeout: 0 // Cambiar de Infinity a 15 segundos para mejor respuesta
			}
		);

		console.log('🌍 Geolocation watch ID assigned:', watchId);

		// Probar una posición única para verificar que funciona
		console.log('🧪 Testing getCurrentPosition...');
		navigator.geolocation.getCurrentPosition(
			(position) => {
				console.log('🧪 ✅ getCurrentPosition SUCCESS:', {
					lat: position.coords.latitude,
					lng: position.coords.longitude,
					accuracy: position.coords.accuracy
				});
			},
			(err) => {
				console.error('🧪 ❌ getCurrentPosition ERROR:', err);
			},
			{
				enableHighAccuracy: true,
				timeout: 10000,
				maximumAge: 0
			}
		);

		return () => {
			console.log('🛑 Clearing geolocation watch ID:', watchId);
			navigator.geolocation.clearWatch(watchId);
		};
	}, [selectedTeam?.id, initialCenter, checkActivityProximity, throttledFirebaseUpdate, updateSelectedTeamMarkerPosition, getSelectedTeamData, isDebugMode]); // Dependencias estables

	// Marcadores renderizados solo cuando sea necesario (evitar re-renders por cambios de posición)
	const teamMarkers = React.useMemo(() => {
		// Verificar que Google Maps esté cargado y tengamos datos iniciales
		if (!isLoaded || !window.google?.maps || !teams || teams.length === 0) {
			console.log('⏳ Google Maps not loaded yet or no teams, skipping marker creation');
			return [];
		}

		// Solo crear marcadores una vez o cuando cambie la estructura de equipos (no posiciones)
		if (!markersCreated) {
			console.log('🎯 Creating initial markers for teams (RENDER ONCE):', teams.length);
			setMarkersCreated(true);
		} else {
			console.log('🎯 Using cached markers - positions updated via direct API calls');
		}
		
		// Si es admin, mostrar información de posición de todos los equipos
		if (isAdmin) {
			console.log('👑 Admin view - Team positions:');
			teams.forEach(team => {
				if (team.lat != null && team.lon != null) {
					console.log(`📍 Team ${team.id} (${team.name || 'Sin nombre'}): lat: ${team.lat.toFixed(6)}, lng: ${team.lon.toFixed(6)}, direction: ${team.direction || 0}°, device: ${team.device || 'No device'}`);
				} else {
					console.log(`❌ Team ${team.id} (${team.name || 'Sin nombre'}): No position data, device: ${team.device || 'No device'}`);
				}
			});
		}
		
		return teams
			.filter(team => {
				// Filtrar equipos que no tienen device asociado
				if (!team.device || team.device === "") {
					console.log(`🚫 Team ${team.id} (${team.name || 'Sin nombre'}): No device assigned, not showing on map`);
					return false;
				}
				return true;
			})
			.map((team, index) => {
				console.log('🎯 Team marker:', team.id, 'lat:', team.lat, 'lon:', team.lon, 'isSelected:', team.id === selectedTeam?.id, 'device:', team.device);
				
				if (team.lat == null || team.lon == null) return null;
				
				// Determinar qué icono usar
				let iconUrl;
				let scale = 1;
				let anchor = new window.google.maps.Point(ICON_SIZE / 2, ICON_SIZE / 2);
				
				// Verificar si es el equipo seleccionado usando solo el ID para evitar dependencias
				const isSelectedTeam = selectedTeam && team.id === selectedTeam.id;
				
				if (isSelectedTeam) {
					// Equipo seleccionado - usar mark-me.png y aplicar rotación solo al equipo seleccionado
					const baseIconUrl = markMe;
					const teamDirection = team.direction || 0;
					iconUrl = createRotatedIconSync(baseIconUrl, teamDirection, ICON_SIZE);
					scale = new window.google.maps.Size(ICON_SIZE, ICON_SIZE);
				} else {
					// Verificar si se debe mostrar otros equipos según el tipo de usuario
					const adminCanViewTeams = isAdmin && import.meta.env.VITE_ADMIN_VIEW_TEAMS_POSITION === 'true';
					const teamsCanViewOthers = !isAdmin && import.meta.env.VITE_TEAMS_VIEW_OTHER_TEAMS === 'true';
					
					if (!adminCanViewTeams && !teamsCanViewOthers) {
						return null; // No mostrar otros equipos
					}
					
					// Otros equipos - usar asset de equipo correspondiente sin rotación
					const teamAssetIndex = index % 30; // Ciclar entre 0-29
					const baseIconUrl = teamAssets[teamAssetIndex] || "/icons/marker-team.png";
					// No aplicar rotación a otros equipos, solo al equipo seleccionado
					iconUrl = baseIconUrl;
					scale = new window.google.maps.Size(20, 20);
					anchor = new window.google.maps.Point(10, 10); // Ajustar ancla para iconos más pequeños
				}
				
				return (
					<Marker
						key={team.id}
						position={{ lat: team.lat, lng: team.lon }}
						icon={{
							url: iconUrl,
							scaledSize: scale,
							anchor: anchor,
						}}
						onLoad={(marker) => {
							// Guardar referencia del marcador para actualizaciones directas
							teamMarkersRef.current.set(team.id, marker);
						}}
					/>
				);
			});
	}, [isLoaded, isAdmin, selectedTeam, teams, markersCreated]); // Usar selectedTeam en lugar de selectedTeamData

	// Renderizar actividades
	const renderActivities = () => {
		if (isAdmin) {
			// Si es admin, mostrar todas las actividades del evento
			return (event?.activities_data || [])
				.filter((activity) => isActivityVisible(activity, null, true))
				.map((activity) => (
					<ActivityMarker key={`activity-${activity.id}`} activity={activity} />
				));
		} else {
			const currentTeamData = getSelectedTeamData();
			if (currentTeamData) {
				console.log('🎯 Rendering activities for team:', currentTeamData?.id, currentTeamData?.activities_data?.length);
				// Si hay equipo seleccionado, mostrar sus actividades
				return (currentTeamData.activities_data || [])
					.filter((activity) => isActivityVisible(activity, currentTeamData, false))
					.map((activity) => (
						<ActivityMarker key={`activity-${activity.id}`} activity={activity} />
					));
			}
		}
		
		return [];
	};

	// Función para manejar clicks en el mapa en modo debug
	const handleMapClick = useCallback((mapEvent) => {
		const currentTeamData = getSelectedTeamData();
		if (!isDebugMode || !currentTeamData || !event) return;

		const clickedLat = mapEvent.latLng.lat();
		const clickedLng = mapEvent.latLng.lng();
		const newPosition = { lat: clickedLat, lng: clickedLng };

		console.log('🔧 Debug mode: Moving team to clicked position:', newPosition);

		// En modo debug, calcular dirección manualmente ya que no tenemos GPS heading
		let direction = null;
		if (previousPosition.current) {
			const distance = getDistance(previousPosition.current, newPosition);
			if (distance > 2) {
				direction = getBearing(previousPosition.current, newPosition);
				console.log('🧭 Debug calculated direction:', direction.toFixed(1), 'degrees');
			}
		}
		
		// Actualizar la posición anterior
		previousPosition.current = newPosition;

		// Centrar el mapa en la nueva posición
		if (mapRef.current) {
			mapRef.current.panTo(newPosition);
		}

		// Actualizar Firebase con la nueva posición y dirección
		const changes = { lat: clickedLat, lon: clickedLng };
		if (direction !== null) {
			changes.direction = direction;
		}
		
		dispatch(
			updateTeamData({
				eventId: event.id,
				teamId: currentTeamData.id,
				changes: changes,
			})
		);

		// Verificar proximidad a actividades en la nueva posición
		checkActivityProximity(newPosition);
	}, [isDebugMode, event, dispatch, checkActivityProximity, getSelectedTeamData]);

	// Efecto para centrar el mapa en la posición del equipo seleccionado cuando cambie
	// useEffect(() => {
	// 	if (mapRef.current && selectedTeamData && selectedTeamData.lat != null && selectedTeamData.lon != null) {
	// 		console.log('🎯 Centering map on selected team position:', { lat: selectedTeamData.lat, lng: selectedTeamData.lon });
	// 		mapRef.current.panTo({ lat: selectedTeamData.lat, lng: selectedTeamData.lon });
	// 	}
	// }, [selectedTeamData]);

	// Limpiar timeouts al desmontar el componente
	// useEffect(() => {
	// 	return () => {
	// 		if (updateTimeoutRef.current) {
	// 			clearTimeout(updateTimeoutRef.current);
	// 		}
	// 	};
	// }, []);

	if (!isLoaded || !initialCenter) return null;

	const handleLoad = (map) => {
		mapRef.current = map;
		map.panTo(initialCenter);
		
		// Calcular zoom inicial respetando los límites configurados
		const { minZoom, maxZoom } = getZoomLimits();
		const defaultZoom = 15;
		const initialZoom = Math.max(minZoom, Math.min(maxZoom, defaultZoom));
		
		map.setZoom(initialZoom);
	};

	return (
		<div style={{ position: 'relative', width: '100%', height: '100%' }}>
			<GoogleMap
				id="event-map"
				mapContainerStyle={containerStyle}
				onLoad={handleLoad}
				onClick={handleMapClick}
				options={{
					styles: getMapStyles(),
					disableDefaultUI: true,
					gestureHandling: "greedy",
					clickableIcons: false, // Deshabilitar clicks en POIs de Google Maps
					...getZoomLimits(), // Añadir límites de zoom
				}}
			>
				{teamMarkers}
				{renderActivities()}
			</GoogleMap>
		</div>
	);
};

export default React.memo(EventMap);










