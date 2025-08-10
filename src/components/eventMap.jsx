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
import KalmanFilter from "kalmanjs";
import "../styles/followButton.css";

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
const ACCURACY_THRESHOLD = 300; // Filtro de precisión GPS
const MAX_JUMP_DISTANCE = 200; // Filtro de saltos grandes
const ICON_SIZE = 80;
const UPDATE_THROTTLE_MS = 500; // Throttle para actualizaciones de Firebase (500ms)

// Configuración del filtro de Kalman
const KALMAN_R = 0.01; // Ruido de medición (más bajo = confía más en GPS)
const KALMAN_Q = 0.1;  // Ruido del proceso (más bajo = cambios más suaves)

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

// Función para normalizar la orientación del dispositivo según la plataforma
const normalizeCompassHeading = (alpha) => {
	if (alpha === null || alpha === undefined) return null;
	
	// En dispositivos móviles, alpha representa la rotación del dispositivo alrededor del eje Z
	// 0° = Norte, 90° = Este, 180° = Sur, 270° = Oeste
	let heading = alpha;
	
	// Detectar si estamos en iOS
	const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
	
	if (isIOS) {
		// En iOS, alpha va de 0 a 360, donde:
		// 0° = Norte magnético en la parte superior del dispositivo
		// El valor ya está correctamente orientado para iOS
		heading = alpha;
	} else {
		// En Android, alpha también va de 0 a 360 en la misma dirección
		// Pero puede necesitar ajuste dependiendo del fabricante
		heading = alpha;
	}
	
	// Normalizar a 0-360 grados
	return (heading + 360) % 360;
};

// Función para calcular la diferencia angular mínima entre dos ángulos
const getAngleDifference = (angle1, angle2) => {
	let diff = Math.abs(angle1 - angle2);
	if (diff > 180) {
		diff = 360 - diff;
	}
	return diff;
};

// Función para promediar ángulos (considera la naturaleza circular de los ángulos)
const averageAngles = (angles) => {
	if (angles.length === 0) return 0;
	
	let x = 0, y = 0;
	angles.forEach(angle => {
		const rad = (angle * Math.PI) / 180;
		x += Math.cos(rad);
		y += Math.sin(rad);
	});
	
	const avgRad = Math.atan2(y / angles.length, x / angles.length);
	let avgDeg = (avgRad * 180) / Math.PI;
	
	return (avgDeg + 360) % 360;
};

// Función para solicitar permisos de orientación en iOS 13+
const requestOrientationPermission = async () => {
	if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
		try {
			const permission = await DeviceOrientationEvent.requestPermission();
			console.log('🧭 Device orientation permission:', permission);
			return permission === 'granted';
		} catch (error) {
			console.error('❌ Error requesting device orientation permission:', error);
			return false;
		}
	}
	// En dispositivos que no requieren permisos, asumir que está disponible
	return true;
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
	const [isFollowMode, setIsFollowMode] = useState(false); // Estado para el modo seguimiento
	const [orientationPermissionRequested, setOrientationPermissionRequested] = useState(false); // Control de permisos
	const [useCompass, setUseCompass] = useState(true); // Control para usar o no la brújula

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
	const kalmanLat = useRef(null); // Filtro de Kalman para latitud
	const kalmanLng = useRef(null); // Filtro de Kalman para longitud
	const lastFiltered = useRef(null); // Última posición filtrada
	const previousPosition = useRef(null); // Para calcular la dirección
	const notifiedActivities = useRef(new Set());
	const [initialCenter, setInitialCenter] = useState(null);
	const mapRef = useRef(null);
	const lastUpdateTime = useRef(0);
	const updateTimeoutRef = useRef(null);
	const teamMarkersRef = useRef(new Map()); // Referencias a los marcadores de equipos
	const initialTeamsRef = useRef(null); // Datos iniciales de equipos para evitar re-renders
	const deviceOrientationRef = useRef(null); // Última orientación del dispositivo
	const compassHeadingRef = useRef(null); // Dirección del dispositivo
	const lastCompassUpdate = useRef(0); // Timestamp de la última actualización de brújula
	const compassKalmanFilter = useRef(null); // Filtro de Kalman para la brújula

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

	// Función para solicitar permisos de orientación manualmente
	const handleOrientationPermission = useCallback(async () => {
		if (orientationPermissionRequested) return;
		
		console.log('🧭 Manually requesting device orientation permission...');
		const hasPermission = await requestOrientationPermission();
		setOrientationPermissionRequested(true);
		
		if (hasPermission) {
			console.log('✅ Device orientation permission granted manually');
			// La inicialización se realizará automáticamente en el próximo efecto
		} else {
			console.log('❌ Device orientation permission denied manually');
		}
	}, [orientationPermissionRequested]);
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

	// Inicializar orientación del dispositivo para obtener la dirección del teléfono
	useEffect(() => {
		let orientationHandler = null;
		let hasOrientationSupport = false;
		const compassReadings = []; // Buffer para promediar lecturas
		const COMPASS_BUFFER_SIZE = 5; // Número de lecturas para promediar
		const COMPASS_UPDATE_INTERVAL = 250; // Actualizar cada 250ms
		const COMPASS_CHANGE_THRESHOLD = 5; // Solo actualizar si cambia más de 5 grados

		const initializeDeviceOrientation = async () => {
			console.log('🧭 Initializing device orientation...');
			
			// Verificar soporte del navegador
			if (typeof DeviceOrientationEvent === 'undefined') {
				console.log('❌ DeviceOrientationEvent not supported');
				return;
			}

			// Solicitar permisos en iOS 13+
			const hasPermission = await requestOrientationPermission();
			if (!hasPermission) {
				console.log('❌ Device orientation permission denied');
				setOrientationPermissionRequested(false); // Permitir re-intentar manualmente
				return;
			}
			
			setOrientationPermissionRequested(true);

			// Inicializar filtro de Kalman para la brújula
			compassKalmanFilter.current = new KalmanFilter({ R: 0.1, Q: 0.01 });

			// Configurar el manejador de eventos con throttling
			orientationHandler = (event) => {
				const { alpha } = event;
				
				// Verificar que tenemos datos válidos
				if (alpha === null || alpha === undefined) return;
				
				if (!hasOrientationSupport) {
					console.log('✅ Device orientation is working');
					hasOrientationSupport = true;
				}
				
				// Throttling: solo procesar cada cierto intervalo
				const now = Date.now();
				if (now - lastCompassUpdate.current < COMPASS_UPDATE_INTERVAL) {
					return;
				}
				
				// Normalizar la orientación según la plataforma
				const rawHeading = normalizeCompassHeading(alpha);
				if (rawHeading === null) return;
				
				// Aplicar filtro de Kalman
				const filteredHeading = compassKalmanFilter.current.filter(rawHeading);
				
				// Agregar al buffer de lecturas
				compassReadings.push(filteredHeading);
				if (compassReadings.length > COMPASS_BUFFER_SIZE) {
					compassReadings.shift(); // Mantener solo las últimas N lecturas
				}
				
				// Calcular promedio de las últimas lecturas
				const averagedHeading = averageAngles(compassReadings);
				
				// Solo actualizar si hay un cambio significativo
				const currentHeading = compassHeadingRef.current;
				if (currentHeading === null || getAngleDifference(currentHeading, averagedHeading) > COMPASS_CHANGE_THRESHOLD) {
					compassHeadingRef.current = averagedHeading;
					deviceOrientationRef.current = { alpha, heading: averagedHeading };
					lastCompassUpdate.current = now;
					
					console.log('🧭 Device heading updated:', {
						rawAlpha: alpha?.toFixed(1),
						normalized: rawHeading.toFixed(1),
						filtered: filteredHeading.toFixed(1),
						averaged: averagedHeading.toFixed(1),
						change: currentHeading ? getAngleDifference(currentHeading, averagedHeading).toFixed(1) : 'first'
					});
				}
			};

			// Agregar el listener
			window.addEventListener('deviceorientation', orientationHandler, true);
			console.log('🧭 Device orientation listener added with throttling');
		};

		// Inicializar solo si hay un equipo seleccionado, no estamos en modo debug, y está habilitada la brújula
		if (selectedTeam && !isDebugMode && useCompass) {
			initializeDeviceOrientation();
		}

		// Cleanup
		return () => {
			if (orientationHandler) {
				window.removeEventListener('deviceorientation', orientationHandler, true);
				console.log('🧭 Device orientation listener removed');
			}
			// Limpiar el filtro de Kalman
			compassKalmanFilter.current = null;
		};
	}, [selectedTeam, isDebugMode, useCompass]); // Re-inicializar si cambia el equipo, modo debug o uso de brújula

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
					
					// Si está en modo seguimiento y es el equipo seleccionado, centrar el mapa
					if (isFollowMode && selectedTeam && team.id === selectedTeam.id && positionChanged && mapRef.current) {
						mapRef.current.panTo({ lat: team.lat, lng: team.lon });
					}
				}
			}
		});

		initialTeamsRef.current = [...teams];
	}, [teams, updateTeamMarkerFromFirebase, isFollowMode, selectedTeam]);

	// Limpiar notificaciones cuando cambie el equipo seleccionado
	useEffect(() => {
		if (selectedTeam) {
			console.log('🔄 Team changed, clearing activity notifications and resetting Kalman filters for team:', selectedTeam.id);
			notifiedActivities.current.clear();
			// También limpiar la posición anterior para el cálculo de dirección
			previousPosition.current = null;
			// Reiniciar filtros de Kalman para el nuevo equipo
			kalmanLat.current = null;
			kalmanLng.current = null;
			lastFiltered.current = null;
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
				if (lastFiltered.current) {
					const jump = getDistance({ lat, lng }, lastFiltered.current);
					console.log('📏 Jump distance:', jump, 'meters');
					if (jump > MAX_JUMP_DISTANCE) {
						console.log('❌ Rejected by jump filter:', jump, '>', MAX_JUMP_DISTANCE);
						return;
					}
				}
				
				console.log('✅ Position accepted, applying Kalman filter');
				
				// Inicializar filtros de Kalman si es la primera vez
				if (!kalmanLat.current || !kalmanLng.current) {
					console.log('🔧 Initializing Kalman filters with first GPS reading');
					kalmanLat.current = new KalmanFilter({ R: KALMAN_R, Q: KALMAN_Q });
					kalmanLng.current = new KalmanFilter({ R: KALMAN_R, Q: KALMAN_Q });
					
					// Primer filtrado con la posición inicial
					const filteredLat = kalmanLat.current.filter(lat);
					const filteredLng = kalmanLng.current.filter(lng);
					
					lastFiltered.current = { lat: filteredLat, lng: filteredLng };
					console.log('📍 First Kalman filtered position:', { lat: filteredLat, lng: filteredLng });
				} else {
					// Aplicar filtros de Kalman a las nuevas coordenadas
					const filteredLat = kalmanLat.current.filter(lat);
					const filteredLng = kalmanLng.current.filter(lng);
					
					lastFiltered.current = { lat: filteredLat, lng: filteredLng };
					console.log('📍 Kalman filtered position:', { 
						original: { lat, lng }, 
						filtered: { lat: filteredLat, lng: filteredLng },
						accuracy 
					});
				}
				
				console.log('📍 Updating team position to:', lastFiltered.current);
				
				const newPosition = { lat: lastFiltered.current.lat, lng: lastFiltered.current.lng };
				
				// Obtener dirección - priorizar orientación del dispositivo sobre GPS heading
				let direction = null;
				let directionSource = 'none';
				
				// 1. Prioridad: Orientación del dispositivo (acelerómetro/brújula) - solo si está habilitada y estable
				const currentCompassHeading = compassHeadingRef.current;
				if (useCompass && currentCompassHeading !== null) {
					// Verificar que la lectura de la brújula sea reciente (menos de 1 segundo)
					const compassAge = Date.now() - lastCompassUpdate.current;
					if (compassAge < 1000) {
						direction = currentCompassHeading;
						directionSource = 'compass';
						console.log('🧭 Using device compass heading:', direction.toFixed(1), 'degrees (age:', compassAge, 'ms)');
					} else {
						console.log('🧭 Compass data too old (', compassAge, 'ms), falling back');
					}
				} else if (!useCompass) {
					console.log('🧭 Compass disabled by user, skipping');
				}
				
				// 2. Fallback: Heading del GPS si está disponible
				if (direction === null && heading !== null && heading !== undefined) {
					direction = heading;
					directionSource = 'gps';
					console.log('🧭 Using GPS heading:', direction.toFixed(1), 'degrees');
				}
				
				// 3. Último recurso: Calcular dirección usando movimiento
				if (direction === null && previousPosition.current) {
					const distance = getDistance(previousPosition.current, newPosition);
					// Solo calcular dirección si ha habido un movimiento significativo
					if (distance > 2) {
						direction = getBearing(previousPosition.current, newPosition);
						directionSource = 'movement';
						console.log('🧭 Calculated heading from movement:', direction.toFixed(1), 'degrees, distance:', distance.toFixed(1), 'm');
					}
				}
				
				console.log('🧭 Direction selected:', {
					source: directionSource,
					value: direction ? direction.toFixed(1) + '°' : 'null',
					compassAvailable: currentCompassHeading !== null,
					gpsHeadingAvailable: heading !== null && heading !== undefined,
					movementDistance: previousPosition.current ? getDistance(previousPosition.current, newPosition).toFixed(1) + 'm' : 'no previous position'
				});
				
				// Actualizar la posición anterior para la próxima iteración (para fallback)
				previousPosition.current = newPosition;
				
				// PRIMERO: Actualizar directamente la posición del marcador SIN re-renderizar
				updateSelectedTeamMarkerPosition(newPosition, direction);
				
				// Si está activo el modo seguimiento, centrar el mapa en la nueva posición
				if (isFollowMode && mapRef.current) {
					mapRef.current.panTo(newPosition);
				}
				
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
				maximumAge: 0, // Cambiar de 0 a 1000ms para permitir caché reciente
				timeout: 10000 // Cambiar de Infinity a 15 segundos para mejor respuesta
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
	}, [selectedTeam?.id, initialCenter, checkActivityProximity, throttledFirebaseUpdate, updateSelectedTeamMarkerPosition, getSelectedTeamData, isDebugMode, isFollowMode, useCompass]); // Dependencias estables

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

		// En modo debug, priorizar orientación del dispositivo si está disponible
		let direction = null;
		
		// 1. Prioridad: Orientación del dispositivo
		if (compassHeadingRef.current !== null) {
			direction = compassHeadingRef.current;
			console.log('🧭 Debug using device compass heading:', direction.toFixed(1), 'degrees');
		}
		// 2. Fallback: Calcular dirección manualmente desde el movimiento
		else if (previousPosition.current) {
			const distance = getDistance(previousPosition.current, newPosition);
			if (distance > 2) {
				direction = getBearing(previousPosition.current, newPosition);
				console.log('🧭 Debug calculated direction from movement:', direction.toFixed(1), 'degrees');
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

	// Función para manejar cuando el usuario desplaza el mapa manualmente
	const handleMapDragEnd = useCallback(() => {
		if (isFollowMode) {
			console.log('🗺️ User dragged map, disabling follow mode');
			setIsFollowMode(false);
		}
	}, [isFollowMode]);

	// Función para alternar el uso de la brújula
	const toggleCompass = useCallback(() => {
		const newUseCompass = !useCompass;
		setUseCompass(newUseCompass);
		
		if (!newUseCompass) {
			// Si se desactiva la brújula, limpiar los valores
			compassHeadingRef.current = null;
			deviceOrientationRef.current = null;
			console.log('🧭 Compass disabled by user');
		} else {
			console.log('🧭 Compass enabled by user');
		}
	}, [useCompass]);

	// Función para alternar el modo seguimiento
	const toggleFollowMode = useCallback(() => {
		const newFollowMode = !isFollowMode;
		setIsFollowMode(newFollowMode);
		
		if (newFollowMode && mapRef.current) {
			// Si se activa el modo seguimiento, centrar inmediatamente
			if (isAdmin && event) {
				// Para admin, centrar en el evento
				mapRef.current.panTo({ lat: event.lat, lng: event.lon });
			} else {
				const currentTeamData = getSelectedTeamData();
				if (currentTeamData && currentTeamData.lat != null && currentTeamData.lon != null) {
					// Para equipo, centrar en la posición del equipo
					mapRef.current.panTo({ lat: currentTeamData.lat, lng: currentTeamData.lon });
				}
			}
		}
		
		console.log('🎯 Follow mode:', newFollowMode ? 'ENABLED' : 'DISABLED');
	}, [isFollowMode, isAdmin, event, getSelectedTeamData]);

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
				onDragEnd={handleMapDragEnd}
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
			
			{/* Botón de seguimiento */}
			<button
				onClick={toggleFollowMode}
				className={`follow-button ${isFollowMode ? 'active' : ''}`}
				title={isFollowMode ? 'Desactivar seguimiento' : 'Activar seguimiento'}
			>
				<svg 
					width="30" 
					height="30" 
					viewBox="0 0 422.932 422.932"
				>
					<path d="M301.793,297.745c-12.594-6.73-27.314-11.873-43.309-15.277v-34.559c2.06,1.344,4.516,2.132,7.156,2.132 c7.236,0,13.098-5.868,13.098-13.1v-10.622c0.89-1.908,1.383-4.036,1.383-6.279v-96.897c0-7.137-5.038-13.285-12.031-14.684 l-26.83-5.368c-1.357-1.551-3.025-2.799-4.883-3.676c2.111-2.36,3.9-4.744,5.264-6.717c3.279-4.761,6.012-9.887,7.904-14.833 c0.935-2.086,1.723-4.182,2.371-6.238c2.541-2.133,4.039-5.321,4.039-8.664v-8.19c0-2.354-0.734-4.649-2.094-6.557V36.684 C253.86,16.455,237.403,0,217.175,0h-11.892C185.058,0,168.6,16.455,168.6,36.684v11.533c-1.355,1.907-2.097,4.204-2.097,6.556v8.19 c0,3.343,1.496,6.525,4.042,8.663c0.647,2.052,1.438,4.152,2.372,6.242c1.891,4.943,4.623,10.07,7.908,14.827 c1.363,1.98,3.153,4.366,5.273,6.733c-1.852,0.878-3.508,2.125-4.862,3.668l-26.428,5.354c-6.979,1.414-11.997,7.548-11.997,14.675 v96.915c0,2.243,0.495,4.372,1.378,6.279v10.622c0,7.231,5.863,13.1,13.1,13.1c2.638,0,5.097-0.788,7.149-2.132v34.561 c-15.991,3.404-30.709,8.547-43.299,15.275c-25.584,13.672-39.674,32.335-39.674,52.547c0,20.212,14.09,38.875,39.674,52.549 c24.24,12.955,56.317,20.091,90.326,20.091c34.01,0,66.086-7.136,90.327-20.091c25.584-13.674,39.673-32.337,39.673-52.549 C341.466,330.08,327.377,311.417,301.793,297.745z M216.981,120.51c-0.068-0.66,0.145-1.318,0.59-1.815 c0.244-0.273,0.549-0.478,0.889-0.614v-5.86c0-1.138,0.818-2.115,1.939-2.316c1.859-0.329,3.779-1.011,5.704-2.029 c0.733-0.382,1.608-0.36,2.312,0.063c0.71,0.428,1.139,1.19,1.139,2.018v14.049c0,0.51-0.164,1.007-0.473,1.413l-6.596,8.758 c-0.453,0.598-1.152,0.94-1.877,0.94c-0.211,0-0.426-0.031-0.637-0.087c-0.93-0.259-1.607-1.063-1.705-2.025L216.981,120.51z M182.552,65.912l-0.131-0.974l-2.28-1.482c-0.669-0.435-1.071-1.173-1.071-1.973v-3.867c0-1.3,1.054-2.353,2.352-2.353h0.957 v-4.194c0-0.893,0.506-1.705,1.303-2.104c3.238-1.612,9.662-4.328,16.314-4.328c5.304,0,9.704,1.768,13.077,5.249 c4.197,4.344,9.044,6.544,14.387,6.544c3.035,0,6.159-0.715,9.305-2.125c0.727-0.326,1.568-0.263,2.24,0.171 c0.314,0.203,0.564,0.472,0.752,0.787h1.281c1.299,0,2.355,1.053,2.355,2.353v3.868c0,0.799-0.406,1.537-1.072,1.972l-2.279,1.482 l-0.131,0.974c-0.744,5.618-3.9,12.9-8.439,19.482c-5.749,8.34-11.133,12.073-13.928,12.073h-12.631 c-2.791,0-8.181-3.734-13.931-12.073C186.447,78.813,183.291,71.532,182.552,65.912z M204.888,118.695 c0.446,0.496,0.662,1.154,0.593,1.815l-1.289,12.502c-0.1,0.958-0.775,1.762-1.708,2.02c-0.209,0.061-0.419,0.087-0.63,0.087 c-0.728,0-1.429-0.336-1.875-0.934l-6.61-8.767c-0.307-0.407-0.474-0.905-0.474-1.417l0.007-14.047 c0.002-0.825,0.434-1.588,1.141-2.018c0.704-0.425,1.582-0.446,2.313-0.063c1.921,1.02,3.844,1.702,5.708,2.031 c1.119,0.201,1.937,1.179,1.937,2.316v5.86C204.338,118.218,204.642,118.422,204.888,118.695z M211.466,392.714 c-55.367,0-102.143-23.412-102.143-51.124c0-19.29,22.667-36.494,55.115-45.171v51.816c0,12.988,10.53,23.515,23.518,23.515 c12.981,0,23.509-10.526,23.509-23.515c0,12.988,10.523,23.515,23.515,23.515c12.982,0,23.504-10.526,23.504-23.515v-51.819 c32.454,8.677,55.125,25.882,55.125,45.174C313.608,369.302,266.833,392.714,211.466,392.714z" />
				</svg>
			</button>
			
			{/* Botón para activar brújula (solo mostrar si es necesario) */}
			{selectedTeam && !orientationPermissionRequested && useCompass && (
				<button
					onClick={handleOrientationPermission}
					className="compass-button"
					title="Activar brújula del dispositivo"
					style={{
						position: 'absolute',
						top: '80px',
						right: '20px',
						width: '50px',
						height: '50px',
						borderRadius: '50%',
						backgroundColor: '#fff',
						border: '2px solid #ddd',
						boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
						cursor: 'pointer',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						fontSize: '20px',
						zIndex: 1000,
					}}
				>
					🧭
				</button>
			)}
			
			{/* Botón para alternar uso de brújula */}
			{selectedTeam && (
				<button
					onClick={toggleCompass}
					className={`compass-toggle-button ${useCompass ? 'active' : ''}`}
					title={useCompass ? 'Desactivar brújula' : 'Activar brújula'}
					style={{
						position: 'absolute',
						top: '140px',
						right: '20px',
						width: '50px',
						height: '50px',
						borderRadius: '8px',
						backgroundColor: useCompass ? 'rgba(76, 175, 80, 0.9)' : 'rgba(255, 255, 255, 0.9)',
						border: `2px solid ${useCompass ? '#4CAF50' : '#ddd'}`,
						boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
						cursor: 'pointer',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						fontSize: '16px',
						zIndex: 1000,
						color: useCompass ? '#fff' : '#666',
						transition: 'all 0.3s ease',
					}}
				>
					{useCompass ? '🧭' : '🚫'}
				</button>
			)}
		</div>
	);
};

export default React.memo(EventMap);










