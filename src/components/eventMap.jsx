// src/components/EventMap.jsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { GoogleMap, useJsApiLoader, Marker, OverlayView, Polygon, InfoWindow } from "@react-google-maps/api";

import { updateTeamData } from "../features/teams/teamsSlice";
import { selectSelectedTeamData } from "../features/teams/teamsSelectors";
import ActivityMarker from "./ActivityMarker";
import markMe from "../assets/mark-me.png";
import pointMark from "../assets/point_mark.png";
import { KEEPALIVE_TIMEOUT } from "../utils/keepaliveUtils";
import { usePopup } from "../hooks/usePopup";
import { useDebugMode } from "../hooks/useDebugMode";
import { useActivityProximity } from "../hooks/useActivityProximity";
import { useTranslation } from "react-i18next";
import { startActivityWithSuspensionCheck } from "../features/activities/activitiesSlice";
import { getPermissionsSnapshot, requestGeolocationAccess, requestMotionAccess } from "../services/systemDiagnostics";
import KalmanFilter from "kalmanjs";
import "../styles/followButton.css";
import OtherTeamMarker from "./OtherTeamMarker";

const ZONES = [
	// {
	// 	id: "zone1",
	// 	name: "ZONE 1",
	// 	color: "#0e73b7",
	// 	path: [
	// 		{ lat: 37.3856442, lng: -5.9860822 },
	// 		{ lat: 37.3859298, lng: -5.9867903 },
	// 		{ lat: 37.3868121, lng: -5.98789 },
	// 		{ lat: 37.3864277, lng: -5.9884854 },
	// 		{ lat: 37.3862998, lng: -5.9887241 },
	// 		{ lat: 37.386059, lng: -5.9893437 },
	// 		{ lat: 37.3858054, lng: -5.9901269 },
	// 		{ lat: 37.3856358, lng: -5.9907302 },
	// 		{ lat: 37.3854312, lng: -5.9909019 },
	// 		{ lat: 37.3840076, lng: -5.9902183 },
	// 		{ lat: 37.3830541, lng: -5.9917462 },
	// 		{ lat: 37.3830093, lng: -5.9929907 },
	// 		{ lat: 37.380991, lng: -5.993672 },
	// 		{ lat: 37.3808035, lng: -5.9927064 },
	// 		{ lat: 37.3800703, lng: -5.9926098 },
	// 		{ lat: 37.3794138, lng: -5.989992 },
	// 		{ lat: 37.3797719, lng: -5.9892303 },
	// 		{ lat: 37.3856442, lng: -5.9860822 },
	// 	],
	// },
	// {
	// 	id: "zone2",
	// 	name: "ZONE 2",
	// 	color: "#e32728",
	// 	path: [
	// 		{ lat: 37.3813565, lng: -5.9951932 },
	// 		{ lat: 37.3830058, lng: -5.9963775 },
	// 		{ lat: 37.3833, lng: -5.9954709 },
	// 		{ lat: 37.3847321, lng: -5.9962434 },
	// 		{ lat: 37.3858915, lng: -5.9970695 },
	// 		{ lat: 37.3861046, lng: -5.9967101 },
	// 		{ lat: 37.3862325, lng: -5.9966618 },
	// 		{ lat: 37.3866673, lng: -5.9982175 },
	// 		{ lat: 37.3866502, lng: -6.0001755 },
	// 		{ lat: 37.3865607, lng: -6.0003955 },
	// 		{ lat: 37.3873705, lng: -6.0014415 },
	// 		{ lat: 37.3866737, lng: -6.0021121 },
	// 		{ lat: 37.3851234, lng: -6.0034487 },
	// 		{ lat: 37.3849433, lng: -6.0030934 },
	// 		{ lat: 37.3846705, lng: -6.0019776 },
	// 		{ lat: 37.3845895, lng: -6.0018703 },
	// 		{ lat: 37.3837072, lng: -6.0009047 },
	// 		{ lat: 37.3829186, lng: -6.0000678 },
	// 		{ lat: 37.3822597, lng: -5.9994465 },
	// 		{ lat: 37.3821074, lng: -5.9992896 },
	// 		{ lat: 37.3816954, lng: -5.9987901 },
	// 		{ lat: 37.3816251, lng: -5.9989135 },
	// 		{ lat: 37.3811349, lng: -5.9986077 },
	// 		{ lat: 37.3806276, lng: -5.9983529 },
	// 		{ lat: 37.3809771, lng: -5.9976957 },
	// 		{ lat: 37.3808237, lng: -5.9975911 },
	// 		{ lat: 37.3802738, lng: -5.9976984 },
	// 		{ lat: 37.3801587, lng: -5.9975241 },
	// 		{ lat: 37.3813565, lng: -5.9951932 },
	// 	],
	// },
	// {
	// 	id: "zone3",
	// 	name: "ZONE 3",
	// 	color: "#06a868",
	// 	path: [
	// 		{ lat: 37.3829957, lng: -5.9963368 },
	// 		{ lat: 37.3809369, lng: -5.9948187 },
	// 		{ lat: 37.3798116, lng: -5.9941696 },
	// 		{ lat: 37.3825482, lng: -5.9931933 },
	// 		{ lat: 37.3830639, lng: -5.9930162 },
	// 		{ lat: 37.3831023, lng: -5.991761 },
	// 		{ lat: 37.3840358, lng: -5.9902536 },
	// 		{ lat: 37.3854275, lng: -5.9909254 },
	// 		{ lat: 37.3856342, lng: -5.9907484 },
	// 		{ lat: 37.3857014, lng: -5.9905872 },
	// 		{ lat: 37.3861156, lng: -5.990832 },
	// 		{ lat: 37.3860964, lng: -5.9909715 },
	// 		{ lat: 37.3863351, lng: -5.9910252 },
	// 		{ lat: 37.38635, lng: -5.991119 },
	// 		{ lat: 37.386691, lng: -5.9911405 },
	// 		{ lat: 37.3869361, lng: -5.991449 },
	// 		{ lat: 37.3875243, lng: -5.9913658 },
	// 		{ lat: 37.3875307, lng: -5.9916421 },
	// 		{ lat: 37.3876202, lng: -5.9921329 },
	// 		{ lat: 37.3874774, lng: -5.9924333 },
	// 		{ lat: 37.3871492, lng: -5.992892 },
	// 		{ lat: 37.3869958, lng: -5.9930449 },
	// 		{ lat: 37.3867448, lng: -5.9930781 },
	// 		{ lat: 37.386651, lng: -5.9940758 },
	// 		{ lat: 37.3862759, lng: -5.9959641 },
	// 		{ lat: 37.3861885, lng: -5.9961921 },
	// 		{ lat: 37.3862844, lng: -5.996455 },
	// 		{ lat: 37.3862525, lng: -5.9966427 },
	// 		{ lat: 37.3861075, lng: -5.9966803 },
	// 		{ lat: 37.3858816, lng: -5.9970397 },
	// 		{ lat: 37.3847457, lng: -5.9962243 },
	// 		{ lat: 37.3832858, lng: -5.9954438 },
	// 		{ lat: 37.3829957, lng: -5.9963368 },
	// 	],
	// },
	// {
	// 	id: "zone4",
	// 	name: "ZONE 4",
	// 	color: "#f7e928",
	// 	path: [
	// 		{ lat: 37.3867583, lng: -5.9931059 },
	// 		{ lat: 37.3870055, lng: -5.9930629 },
	// 		{ lat: 37.387193, lng: -5.9928806 },
	// 		{ lat: 37.387941, lng: -5.992733 },
	// 		{ lat: 37.3884397, lng: -5.9927733 },
	// 		{ lat: 37.3886017, lng: -5.9927411 },
	// 		{ lat: 37.3889043, lng: -5.9926016 },
	// 		{ lat: 37.3894371, lng: -5.9925453 },
	// 		{ lat: 37.3897844, lng: -5.9922958 },
	// 		{ lat: 37.3904813, lng: -5.9923978 },
	// 		{ lat: 37.3908947, lng: -5.9923951 },
	// 		{ lat: 37.3910439, lng: -5.9923575 },
	// 		{ lat: 37.3911078, lng: -5.9922422 },
	// 		{ lat: 37.3912698, lng: -5.9921483 },
	// 		{ lat: 37.3923012, lng: -5.9919632 },
	// 		{ lat: 37.3923119, lng: -5.9922529 },
	// 		{ lat: 37.3928009, lng: -5.9921939 },
	// 		{ lat: 37.3928308, lng: -5.9929986 },
	// 		{ lat: 37.393649, lng: -5.9929771 },
	// 		{ lat: 37.3936069, lng: -5.9937365 },
	// 		{ lat: 37.3937252, lng: -5.9938639 },
	// 		{ lat: 37.3935196, lng: -5.9947356 },
	// 		{ lat: 37.3939001, lng: -5.9953209 },
	// 		{ lat: 37.393785, lng: -5.9953263 },
	// 		{ lat: 37.3934014, lng: -5.9956589 },
	// 		{ lat: 37.3926961, lng: -5.9956133 },
	// 		{ lat: 37.3927067, lng: -5.9954121 },
	// 		{ lat: 37.392564, lng: -5.9954068 },
	// 		{ lat: 37.3915557, lng: -5.9975288 },
	// 		{ lat: 37.3914279, lng: -5.9974161 },
	// 		{ lat: 37.3914002, lng: -5.9974564 },
	// 		{ lat: 37.3911104, lng: -5.9972042 },
	// 		{ lat: 37.3907246, lng: -5.9969655 },
	// 		{ lat: 37.390731, lng: -5.9969092 },
	// 		{ lat: 37.3895504, lng: -5.9964586 },
	// 		{ lat: 37.3879009, lng: -5.9962708 },
	// 		{ lat: 37.3878711, lng: -5.995906 },
	// 		{ lat: 37.3876836, lng: -5.9956003 },
	// 		{ lat: 37.3873895, lng: -5.9954662 },
	// 		{ lat: 37.3870314, lng: -5.9949995 },
	// 		{ lat: 37.386716, lng: -5.99486 },
	// 		{ lat: 37.3866691, lng: -5.9947795 },
	// 		{ lat: 37.3865327, lng: -5.9947098 },
	// 		{ lat: 37.3866649, lng: -5.9941251 },
	// 		{ lat: 37.3867583, lng: -5.9931059 },
	// 	],
	// },
];

// Importar assets de equipos (Equipo_0.png a Equipo_29.png)
const teamAssets = {};
for (let i = 0; i <= 29; i++) {
	try {
		teamAssets[i] = new URL(`../assets/Equipo_${i}.png`, import.meta.url).href;
	} catch {
		// No-op: algunos assets pueden no existir en el bundle
	}
}

const containerStyle = { width: "100%", height: "100%" };
const ACCURACY_THRESHOLD = 300; // Filtro de precisión GPS
const MAX_JUMP_DISTANCE = 200; // Filtro de saltos grandes (mantenido como fallback)
const CENTROID_MOVEMENT_FACTOR = 0.8; // Factor k para filtro de centroide (k≈0.7–1.0)
const ICON_SIZE = 80;
const UPDATE_THROTTLE_MS = 500; // Throttle para actualizaciones de Firebase (500ms)
const MAP_VIEW_PERSIST_THROTTLE_MS = 400;
const MIN_FORCED_UPDATE_INTERVAL_MS = 500; // Reintento para evitar quedar congelados por el filtro de centroide
const TEAM_MARKERS_UPDATE_THROTTLE_MS = 30000; // Throttle para actualizar marcadores de otros equipos (30 segundos)
const MAP_ROTATION_DEG = Number(import.meta.env.VITE_MAP_ROTATION_DEG ?? 0);


// Configuración del filtro de Kalman
const KALMAN_R = 0.01; // Ruido de medición (más bajo = confía más en GPS)
const KALMAN_Q = 0.1;  // Ruido del proceso (más bajo = cambios más suaves)

// Cache de imágenes precargadas
const imageCache = new Map();
const rotatedIconCache = new Map();

const MAP_VIEW_STORAGE_PREFIX = 'mapView:event_';
const CENTER_BUTTON_LONG_PRESS_MS = 600;

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
	const normalizedRotation = norm360(rotation || 0);
	const roundedRotation = normalizedRotation === 0 ? 0 : (Math.round(normalizedRotation / 5) * 5) % 360;

	if (roundedRotation === 0) {
		return imageUrl;
	}

	const cacheKey = `${imageUrl}|${roundedRotation}|${size}`;
	const cachedIcon = rotatedIconCache.get(cacheKey);
	if (cachedIcon) {
		return cachedIcon;
	}

	let cachedImage = imageCache.get(imageUrl);
	if (!cachedImage) {
		const img = new Image();
		img.src = imageUrl;
		if (img.complete && img.naturalWidth > 0) {
			imageCache.set(imageUrl, img);
			cachedImage = img;
		} else {
			return imageUrl;
		}
	}

	try {
		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d');
		canvas.width = size;
		canvas.height = size;

		ctx.clearRect(0, 0, size, size);
		ctx.save();
		ctx.translate(size / 2, size / 2);
		ctx.rotate((roundedRotation * Math.PI) / 180);
		ctx.drawImage(cachedImage, -size / 2, -size / 2, size, size);
		ctx.restore();

		const result = canvas.toDataURL('image/png');
		rotatedIconCache.set(cacheKey, result);
		return result;
	} catch {
		return imageUrl;
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

// Utilidades de orientación/ángulos
const getScreenAngle = () => {
	// Soporta iOS (window.orientation) y el API moderno
	if (typeof screen?.orientation?.angle === 'number') return screen.orientation.angle;
	if (typeof window.orientation === 'number') {
		// iOS: 0, 90, -90, 180
		const o = window.orientation;
		return (o === -90 ? 270 : (o ?? 0)) % 360;
	}
	return 0;
};

// Normaliza un ángulo a [0,360)
const norm360 = (deg) => ((deg % 360) + 360) % 360;

// Diferencia mínima entre ángulos (0..180)
const angleDelta = (a, b) => {
	let d = Math.abs(a - b) % 360;
	return d > 180 ? 360 - d : d;
};

// Promedio exponencial sobre el círculo
function makeAngleEMA(alpha = 0.25, start = null) {
	let vx = null, vy = null; // componentes en el círculo unitario
	if (start != null) {
		const r = start * Math.PI / 180;
		vx = Math.cos(r); vy = Math.sin(r);
	}
	return (deg) => {
		const r = deg * Math.PI / 180;
		const x = Math.cos(r), y = Math.sin(r);
		if (vx == null || vy == null) { vx = x; vy = y; }
		else {
			vx = (1 - alpha) * vx + alpha * x;
			vy = (1 - alpha) * vy + alpha * y;
			const m = Math.hypot(vx, vy);
			if (m > 1e-6) { vx /= m; vy /= m; }
		}
		const out = Math.atan2(vy, vx) * 180 / Math.PI;
		return norm360(out);
	};
}

// Convierte (alpha,beta,gamma) → heading (0..360, CW desde Norte) en "portrait-primary"
const compassHeadingFromEuler = (alpha, beta, gamma) => {
	const rad = Math.PI / 180;
	const _x = beta  * rad;  // inclinación adelante/atrás
	const _y = gamma * rad;  // inclinación izquierda/derecha
	const _z = alpha * rad;  // giro alrededor del Z (perpendicular a pantalla)

	const _cX = Math.cos(_x), cY = Math.cos(_y), cZ = Math.cos(_z);
	const sX = Math.sin(_x), sY = Math.sin(_y), sZ = Math.sin(_z);
	
	// Vector proyectado hacia el norte en el plano horizontal (según spec)
	const Vx = -cZ * sY - sZ * sX * cY;
	const Vy = -sZ * sY + cZ * sX * cY;

	let heading = Math.atan2(Vx, Vy); // azimut
	if (heading < 0) heading += 2 * Math.PI;
	return heading * 180 / Math.PI; // grados CW desde norte
};

// Normaliza heading a coordenadas de mapa (N=0, E=90...)
// Android: calcular con alpha+beta+gamma y ajustar sumando el ángulo de pantalla
const normalizeCompassHeadingFromEvent = (evt) => {
	// iOS primero
	if (typeof evt.webkitCompassHeading === 'number' && !Number.isNaN(evt.webkitCompassHeading)) {
		if (typeof evt.webkitCompassAccuracy === 'number' && evt.webkitCompassAccuracy < 0) return null;
		// webkitCompassHeading ya es norte-cw en coordenadas del mundo
		return norm360(evt.webkitCompassHeading);
	}

	const { alpha, beta, gamma, absolute } = evt || {};
	const screenAngle = getScreenAngle();

	// Android moderno: si es absoluto, alpha suele ser yaw respecto al norte
	if (absolute === true && typeof alpha === 'number' && !Number.isNaN(alpha)) {
		// Invertir para obtener giro horario desde norte
		return norm360(360 - alpha + screenAngle);
	}

	// Fallback: usar la conversión desde Euler
	if (typeof alpha !== 'number' || typeof beta !== 'number' || typeof gamma !== 'number') return null;
	const h = compassHeadingFromEuler(alpha, beta, gamma);
	return norm360(h + screenAngle);
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

	// Si la actividad tiene without_route=true, NO mostrarla en el mapa
	// (solo será accesible mediante envío del organizador)
	if (activity.without_route === true) {
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
	else {
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

const EventMap = ({ isActive = true }) => {
	
	const { openPopup, closePopup } = usePopup();
	const { isDebugMode } = useDebugMode();
	const { t } = useTranslation();
	const {
		checkActivityProximity,
		markAsAutoActivated,
		isAutoActivated,
		clearProximityState,
		PRECISION_REQUIRED,
		TIME_REQUIRED
	} = useActivityProximity();

	const [markersCreated, setMarkersCreated] = useState(false); // Control para crear marcadores solo una vez
	const [isFollowMode, setIsFollowMode] = useState(false); // Estado para el modo seguimiento
	const [useCompass, setUseCompass] = useState(true); // Control para usar o no la brújula
	const [permissionOverlayVisible, setPermissionOverlayVisible] = useState(false);
	const [permissionChecking, setPermissionChecking] = useState(true);
	const [permissionRequesting, setPermissionRequesting] = useState(false);
	const [permissionError, setPermissionError] = useState(null);
	const [permissionInfo, setPermissionInfo] = useState({
		geolocation: { status: 'unknown', supported: true, canRequest: true },
		motion: { status: 'unknown', supported: true, canRequest: false }
	});
	const [openActivityId, setOpenActivityId] = useState(null);
	const [meetingPointBubbleOpen, setMeetingPointBubbleOpen] = useState(false);
	const [scriptLoaderKey, setScriptLoaderKey] = useState(0);
	const hasRetriedLoaderRef = useRef(false);

	const formatPermissionStatus = (status) => {
		switch (status) {
			case 'granted':
			case 'granted_soft':
				return t('permissions.status_granted', 'Concedido');
			case 'prompt':
			case 'default':
			case 'unknown':
				return t('permissions.status_pending', 'Pendiente');
			case 'denied':
				return t('permissions.status_denied', 'Denegado');
			case 'unsupported':
				return t('permissions.status_unsupported', 'No soportado');
			case 'error':
				return t('permissions.status_error', 'Error');
			default:
				return status || t('permissions.status_unknown', 'Desconocido');
		}
	};

	const geolocationPermissionGranted = !permissionInfo.geolocation.supported || ['granted', 'granted_soft'].includes(permissionInfo.geolocation.status);
	const motionPermissionGranted = !permissionInfo.motion.supported || ['granted', 'granted_soft'].includes(permissionInfo.motion.status);

	const refreshPermissions = useCallback(async () => {
		try {
			const snapshot = await getPermissionsSnapshot();
			const geoPerm = snapshot.geolocation?.permission ?? 'unknown';
			const motionPerm = snapshot.motion?.permission ?? 'unknown';
			const geoSupported = snapshot.geolocation?.supported !== false;
			const motionSupported = snapshot.motion?.supported !== false;
			const geoCanRequest = snapshot.geolocation?.canRequest ?? geoSupported;
			const motionCanRequest = snapshot.motion?.canRequest ?? motionSupported;
			setPermissionInfo({
				geolocation: { status: geoPerm, supported: geoSupported, canRequest: geoCanRequest },
				motion: { status: motionPerm, supported: motionSupported, canRequest: motionCanRequest }
			});
			const needsGeo = geoSupported && geoPerm !== 'granted';
			const needsMotion = motionSupported && motionPerm !== 'granted';
			setPermissionOverlayVisible(needsGeo || needsMotion);
			return { needsGeo, needsMotion };
		} catch (error) {
			if (isDebugMode) {
				console.warn('⚠️ No se pudo actualizar el estado de permisos:', error);
			}
			setPermissionOverlayVisible(true);
			return { needsGeo: true, needsMotion: true };
		} finally {
			setPermissionChecking(false);
		}
	}, [isDebugMode]);

	useEffect(() => {
		refreshPermissions();
	}, [refreshPermissions]);

	useEffect(() => {
		const handleVisibility = () => {
			if (document.visibilityState === 'visible') {
				refreshPermissions();
			}
		};
		document.addEventListener('visibilitychange', handleVisibility);
		return () => document.removeEventListener('visibilitychange', handleVisibility);
	}, [refreshPermissions]);

	const handleRequestPermissions = useCallback(async () => {
		if (permissionRequesting) return;
		setPermissionRequesting(true);
		setPermissionError(null);
		try {
			let motionResult = { ok: true };
			let geoResult = { ok: true };

			if (permissionInfo.motion.supported && permissionInfo.motion.status !== 'granted') {
				motionResult = await requestMotionAccess();
				if (!motionResult.ok) {
					const lowerMotionError = (motionResult.error || '').toLowerCase();
					let message;
					if (motionResult.state === 'denied') {
						message = t('permissions.motion_denied', 'Los sensores de movimiento están bloqueados. Ve a Ajustes > Safari > Movimiento y Orientación para habilitarlos.');
					} else if (lowerMotionError.includes('gesture')) {
						message = t('permissions.motion_gesture_required', 'Para iOS es necesario tocar el botón "Conceder permisos" y mantener la página activa para autorizar los sensores de movimiento.');
					} else {
						message = motionResult.error || t('permissions.motion_error', 'No se pudieron activar los sensores de movimiento.');
					}
					throw new Error(message);
				}
			}
			if (permissionInfo.geolocation.supported && permissionInfo.geolocation.status !== 'granted') {
				geoResult = await requestGeolocationAccess();
				if (!geoResult.ok) {
					const lower = (geoResult.error || '').toLowerCase();
					const message = lower.includes('denied')
						? t('permissions.geo_denied', 'La geolocalización está denegada. Abre Ajustes y habilita el acceso a tu ubicación para Escultura.')
						: (geoResult.error || t('permissions.geo_error', 'No se pudo activar la geolocalización.'));
					throw new Error(message);
				}
			}
			const { needsGeo, needsMotion } = await refreshPermissions();
			if (!needsGeo && !needsMotion) {
				setPermissionOverlayVisible(false);
			}
		} catch (error) {
			if (isDebugMode) {
				console.error('❌ Error solicitando permisos:', error);
			}
			setPermissionError(error.message || t('permissions.generic_error', 'No se pudieron actualizar los permisos. Revisa los ajustes del dispositivo.'));
		} finally {
			setPermissionRequesting(false);
		}
	}, [isDebugMode, permissionInfo, permissionRequesting, refreshPermissions, t]);

	const handleSkipPermissions = useCallback(() => {
		setPermissionOverlayVisible(false);
		setPermissionError(null);
	}, []);

	// Obtener el nivel de detalle del mapa desde las variables de entorno
	const mapDetailLevel = import.meta.env.VITE_GOOGLE_MAPS_DETAIL_LEVEL || 'basic';

	const zoomLimits = React.useMemo(() => {
		const minZoom = parseInt(import.meta.env.VITE_GOOGLE_MAPS_MIN_ZOOM) || 1;
		const maxZoom = parseInt(import.meta.env.VITE_GOOGLE_MAPS_MAX_ZOOM) || 21;

		return {
			minZoom: Math.max(1, Math.min(21, minZoom)),
			maxZoom: Math.max(1, Math.min(21, maxZoom)),
		};
	}, []);

	const mapStyles = React.useMemo(() => {
		switch (mapDetailLevel) {
			case 'minimal':
				return [
					{ featureType: "poi", stylers: [{ visibility: "off" }] },
					{ featureType: "transit", stylers: [{ visibility: "off" }] },
					{ featureType: "administrative.land_parcel", stylers: [{ visibility: "off" }] },
					{ featureType: "administrative.neighborhood", stylers: [{ visibility: "off" }] },
					{ featureType: "road.local", elementType: "labels", stylers: [{ visibility: "off" }] },
				];
			case 'detailed':
				return [
					{ featureType: "poi", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
				];
			case 'all':
				return [
					{ featureType: "poi", elementType: "labels.icon", stylers: [{ visibility: "on" }] },
					{ featureType: "poi.business", stylers: [{ visibility: "on" }] },
					{ featureType: "transit.station", stylers: [{ visibility: "on" }] },
				];
			case 'basic':
			default:
				return [
					{ featureType: "poi", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
					{ featureType: "poi.business", stylers: [{ visibility: "off" }] },
					{ featureType: "transit.station", stylers: [{ visibility: "simplified" }] },
				];
		}
	}, [mapDetailLevel]);

	const mapOptions = React.useMemo(
		() => ({
			styles: mapStyles,
			disableDefaultUI: true,
			gestureHandling: "greedy",
			clickableIcons: false,
			...zoomLimits,

			// IMPORTANTE para habilitar rotación “real”
			mapId: import.meta.env.VITE_GOOGLE_MAP_ID, // mapa vectorial
			tilt: 0, // sin perspectiva
			heading: MAP_ROTATION_DEG, // ángulo deseado

			// Opcional: evita que el usuario cambie el heading con gestos
			rotateControl: false,
		}),
		[mapStyles, zoomLimits]
	);

	const { isLoaded, loadError } = useJsApiLoader({
		id: `event-map-script-${scriptLoaderKey}`,
		googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
		libraries: ["geometry"],
	});

	// Centro rápido (bbox); suficiente para zonas urbanas
	const polygonCenter = (path) => {
		let minLat =  90, maxLat = -90, minLng =  180, maxLng = -180;
		path.forEach(({lat, lng}) => {
			minLat = Math.min(minLat, lat); maxLat = Math.max(maxLat, lat);
			minLng = Math.min(minLng, lng); maxLng = Math.max(maxLng, lng);
		});
		return { lat: (minLat + maxLat)/2, lng: (minLng + maxLng)/2 };
	};

	const mapsReady = isLoaded || Boolean(window.google?.maps?.Map);

	useEffect(() => {
		if (!loadError) {
			hasRetriedLoaderRef.current = false;
			return;
		}

		if (typeof navigator !== 'undefined' && navigator.onLine && !hasRetriedLoaderRef.current) {
			hasRetriedLoaderRef.current = true;
			setScriptLoaderKey((prev) => prev + 1);
		}
	}, [loadError]);

	useEffect(() => {
		const handleOnline = () => {
			hasRetriedLoaderRef.current = false;
			if (!window.google?.maps) {
				setScriptLoaderKey((prev) => prev + 1);
			}
		};

		window.addEventListener('online', handleOnline);

		return () => {
			window.removeEventListener('online', handleOnline);
		};
	}, []);

	const dispatch = useDispatch();
	const kalmanLat = useRef(null); // Filtro de Kalman para latitud
	const kalmanLng = useRef(null); // Filtro de Kalman para longitud
	const lastFiltered = useRef(null); // Última posición filtrada
	const lastAccuracy = useRef(null); // Última precisión GPS
	const lastAcceptedUpdateTs = useRef(0); // Timestamp del último update aplicado
	const previousPosition = useRef(null); // Para calcular la dirección
	const adminKalmanLat = useRef(null); // Filtro de Kalman para latitud del admin
	const adminKalmanLng = useRef(null); // Filtro de Kalman para longitud del admin
	const adminLastFiltered = useRef(null); // Última posición filtrada del admin
	const adminLastAccuracy = useRef(null); // Precisión más reciente del admin
	const adminLastAcceptedUpdateTs = useRef(0); // Timestamp del último update aplicado del admin
	const adminPreviousPosition = useRef(null); // Posición previa del admin
	const [initialCenter, setInitialCenter] = useState(null);
	const [initialZoom, setInitialZoom] = useState(null);
	const [keepaliveTick, setKeepaliveTick] = useState(Date.now());
	const mapRef = useRef(null);
	const getMapHeading = useCallback(() => {
		const map = mapRef.current;
		if (map?.getHeading) {
			const h = map.getHeading();
			return typeof h === 'number' ? norm360(h) : 0;
		}
		// Fallback a lo guardado o a env
		const stored = Number(localStorage.getItem('mapHeading'));
		if (Number.isFinite(stored)) return norm360(stored);
		return norm360(MAP_ROTATION_DEG);
	}, []);

	const toViewHeading = useCallback((worldHeading) => {
		return norm360((worldHeading ?? 0) - getMapHeading());
	}, [getMapHeading]);

	const previousEventIdRef = useRef(null);
	const lastUpdateTime = useRef(0);
	const updateTimeoutRef = useRef(null);
	const teamMarkersRef = useRef(new Map()); // Referencias a los marcadores de equipos
	const initialTeamsRef = useRef(null); // Datos iniciales de equipos para evitar re-renders
	const lastTeamMarkersUpdateTime = useRef({}); // Timestamp de última actualización por equipo
	const deviceOrientationRef = useRef(null); // Última orientación del dispositivo
	const compassHeadingRef = useRef(null); // Dirección del dispositivo
	const lastCompassUpdate = useRef(0); // Timestamp de la última actualización de brújula
	const mapViewPersistMetaRef = useRef({ timeoutId: null, lastRun: 0 });
	const adminMarkerRef = useRef(null);
	const adminLocationRef = useRef(null);
	const adminDirectionRef = useRef(null);
	const [adminLocation, setAdminLocation] = useState(null);
	const centerButtonLongPressTimeoutRef = useRef(null);
	const centerButtonLongPressTriggeredRef = useRef(false);
	const lastVisibleCenterRef = useRef(null);
	const lastVisibleZoomRef = useRef(null);

	const eventId = useSelector((state) => state.event.id);
	const event = useSelector((state) => state.event.event);
	const teams = useSelector((state) => state.teams.items);
	const isAdmin = useSelector((state) => state.session.isAdmin);
	const adminPositionViewEnabled = ((import.meta.env.VITE_ADMIN_POSITION_VIEW ?? 'true') + '').toLowerCase() === 'true';
	const keepaliveLastHeartbeat = useSelector((state) => state.keepalive.lastHeartbeat);
	const keepaliveConnectionStatus = useSelector((state) => state.keepalive.connectionStatus);

	// Separar selectedTeam (estable) de selectedTeamData (cambia constantemente)
	const selectedTeam = useSelector((state) => state.session.selectedTeam);
	const selectedTeamData = useSelector(selectSelectedTeamData);
	const hasSelectedTeamData = Boolean(selectedTeamData?.id);

	const selectedTeamDataRef = useRef(selectedTeamData);
	const isDebugModeRef = useRef(isDebugMode);
	const isFollowModeRef = useRef(isFollowMode);
	const useCompassRef = useRef(useCompass);
	const activityProximityCacheRef = useRef(new Map());
	const checkActivityProximityNewRef = useRef(null);
	const throttledFirebaseUpdateRef = useRef(null);
	const updateSelectedTeamMarkerPositionRef = useRef(null);
	
	useEffect(() => {
		if (!selectedTeam || isAdmin) {
			return;
		}

		setKeepaliveTick(Date.now());

		const interval = setInterval(() => {
			setKeepaliveTick(Date.now());
		}, 90000);

		return () => clearInterval(interval);
	}, [selectedTeam, isAdmin]);

	const ownTeamStatus = React.useMemo(() => {
		if (!selectedTeam || isAdmin) {
			return null;
		}

		if (keepaliveConnectionStatus === 'sleep') {
			return 'sleep';
		}

		const heartbeatFresh = keepaliveLastHeartbeat != null
			? (keepaliveTick - keepaliveLastHeartbeat) < KEEPALIVE_TIMEOUT
			: false;

		if (keepaliveConnectionStatus === 'disconnected' || keepaliveConnectionStatus === 'error') {
			return 'offline';
		}

		if (!keepaliveLastHeartbeat) {
			return keepaliveConnectionStatus === 'connecting'
				? 'connecting'
				: 'offline';
		}

		if (heartbeatFresh) {
			return 'online';
		}

		if (keepaliveConnectionStatus === 'connecting') {
			return 'connecting';
		}

		return 'offline';
	}, [selectedTeam, isAdmin, keepaliveConnectionStatus, keepaliveLastHeartbeat, keepaliveTick]);

	const loadStoredMapView = useCallback(() => {
		if (typeof window === 'undefined' || !eventId) {
			return null;
		}

		try {
			const raw = localStorage.getItem(`${MAP_VIEW_STORAGE_PREFIX}${eventId}`);
			if (!raw) {
				return null;
			}

			const data = JSON.parse(raw);
			if (!data) {
				return null;
			}

			const centerData = data.center || data;
			if (
				centerData &&
				typeof centerData.lat === 'number' &&
				typeof centerData.lng === 'number'
			) {
				return {
					center: { lat: centerData.lat, lng: centerData.lng },
					zoom: typeof data.zoom === 'number' ? data.zoom : null,
				};
			}
		} catch (error) {
			if (isDebugMode) {
				console.warn('No se pudo restaurar la vista del mapa:', error);
			}
		}

		return null;
	}, [eventId, isDebugMode]);

	const persistMapView = useCallback(() => {
		if (typeof window === 'undefined' || !eventId || !mapRef.current) {
			return;
		}

		const map = mapRef.current;
		const center = typeof map.getCenter === 'function' ? map.getCenter() : null;
		if (!center) {
			return;
		}

		const latValue = typeof center.lat === 'function' ? center.lat() : center.lat;
		const lngValue = typeof center.lng === 'function' ? center.lng() : center.lng;

		if (typeof latValue !== 'number' || typeof lngValue !== 'number' || Number.isNaN(latValue) || Number.isNaN(lngValue)) {
			return;
		}

		const zoomValue = typeof map.getZoom === 'function' ? map.getZoom() : null;
		const payload = {
			center: { lat: latValue, lng: lngValue },
		};

		if (typeof zoomValue === 'number' && !Number.isNaN(zoomValue)) {
			payload.zoom = zoomValue;
		}

		try {
			localStorage.setItem(`${MAP_VIEW_STORAGE_PREFIX}${eventId}`, JSON.stringify(payload));
			const meta = mapViewPersistMetaRef.current;
			meta.lastRun = Date.now();
			meta.timeoutId = null;
		} catch (error) {
			if (isDebugMode) {
				console.warn('No se pudo guardar la vista del mapa:', error);
			}
		}
	}, [eventId, isDebugMode]);

	// Función para mostrar popup de proximidad automática a actividad
	const skipActivityPopup = import.meta.env.VITE_POPUP_ACTIVITY_SKIP === 'true';
	const showActivityAutoProximityPopup = useCallback((activity) => {
		if (skipActivityPopup) {
			dispatch(startActivityWithSuspensionCheck(activity));
			return;
		}

		openPopup({
			titulo: t('activity_auto_proximity_title', 'Actividad Disponible'),
			texto: t('activity_auto_proximity_text', 'Actividad "{{activityName}}". ¿Quieres iniciarla ahora?', { activityName: activity.name }),
			array_botones: [
				{
					titulo: t('close', 'Cerrar'),
					callback: () => {
						closePopup();
					}
				},
				{
					titulo: t('start_activity', 'Iniciar Actividad'),
					callback: () => {
						dispatch(startActivityWithSuspensionCheck(activity));
						closePopup();
					}
				}
			],
			layout: "center",
			overlay: true,
			close_button: true
		});
	}, [skipActivityPopup, openPopup, closePopup, t, dispatch]);

	// Función para determinar si un equipo debe mostrarse en el mapa (OPTIMIZACIÓN)
	const shouldShowTeam = useCallback((team) => {
		// Filtrar equipos sin dispositivo asignado
		if (!team.device || team.device === "") return false;
		
		// Siempre mostrar el equipo propio
		if (selectedTeam && team.id === selectedTeam.id) return true;
		
		// Para otros equipos, verificar permisos según el rol
		const adminCanViewTeams = isAdmin && import.meta.env.VITE_ADMIN_VIEW_TEAMS_POSITION === 'true';
		const teamsCanViewOthers = !isAdmin && import.meta.env.VITE_TEAMS_VIEW_OTHER_TEAMS === 'true';
		
		return adminCanViewTeams || teamsCanViewOthers;
	}, [isAdmin, selectedTeam]);

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
			if (isDebugModeRef.current) {
				console.log('⏳ Google Maps not available, skipping marker position update');
			}
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
					const size = ICON_SIZE;
					const rotatedIconUrl = createRotatedIconSync(markMe, toViewHeading(direction), size);
					marker.setIcon({
						url: rotatedIconUrl,
						scaledSize: new window.google.maps.Size(size, size),
						anchor: new window.google.maps.Point(size/2, size/2),
					});
				}
			}
		}
	}, [selectedTeam]); // Solo depender del objeto selectedTeam

	// Función para actualizar solo la rotación del marcador (sin cambiar posición)
	const updateSelectedTeamMarkerRotation = useCallback((direction) => {
		// NOTA: Con el nuevo sistema de EMA circular y throttling temporal (66ms),
		// ya no necesitamos filtrar por diferencia mínima de grados aquí.
		// El filtrado ahora se hace en el origen (sensor events) con angleDelta()
		
		// Verificar que Google Maps esté disponible
		if (!window.google?.maps) {
			return;
		}

		// Buscar el marcador del equipo seleccionado en el mapa y actualizar solo su rotación
		const markers = teamMarkersRef.current;
		if (selectedTeam && markers.has(selectedTeam.id)) {
			const marker = markers.get(selectedTeam.id);
			if (marker && marker.setIcon) {
				// SIEMPRE usar el icono base (markMe) para evitar acumulación de rotaciones
				const size = ICON_SIZE;
				const rotatedIconUrl = createRotatedIconSync(markMe, toViewHeading(direction), size);
				marker.setIcon({
					url: rotatedIconUrl,
					scaledSize: new window.google.maps.Size(size, size),
					anchor: new window.google.maps.Point(size/2, size/2),
				});
			}
		}
	}, [selectedTeam]); // Solo depender del objeto selectedTeam

	const updateAdminMarkerPosition = useCallback((newPosition, direction = null) => {
		if (!window.google?.maps) {
			return;
		}

		const marker = adminMarkerRef.current;
		if (!marker) {
			return;
		}

		if (marker.setPosition) {
			marker.setPosition(newPosition);
		}

		const directionToUse = typeof direction === 'number'
			? direction
			: (typeof adminDirectionRef.current === 'number' ? adminDirectionRef.current : 0);

		if (marker.setIcon) {
			const size = ICON_SIZE;
			const rotatedIconUrl = createRotatedIconSync(markMe, toViewHeading(directionToUse), size);
			marker.setIcon({
				url: rotatedIconUrl,
				scaledSize: new window.google.maps.Size(size, size),
				anchor: new window.google.maps.Point(size / 2, size / 2),
			});
		}
	}, []);

	const updateAdminMarkerRotation = useCallback((direction) => {
		const currentLocation = adminLocationRef.current;
		if (!currentLocation) {
			return;
		}
		updateAdminMarkerPosition(currentLocation.position, direction);
	}, [updateAdminMarkerPosition]);

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
					const size = currentIcon?.scaledSize?.width || ICON_SIZE;
					const scaledSize = currentIcon?.scaledSize || new window.google.maps.Size(size, size);
					const anchor = currentIcon?.anchor || new window.google.maps.Point(size / 2, size / 2);
					const rotatedIconUrl = createRotatedIconSync(markMe, toViewHeading(newData.direction), size);

					marker.setIcon({
						url: rotatedIconUrl,
						scaledSize,
						anchor
					});
				}
				
			}
		}
	}, [selectedTeam]); // Depender de selectedTeam para controlar la rotación

	const computeActivityProximityInfo = useCallback((activity, teamPosition, accuracy) => {
		const distance = getDistance(teamPosition, { lat: activity.lat, lng: activity.lon });
		const distanceText = distance < 1000
			? `${Math.round(distance)} ${t('activity_info.meters', 'metros')}`
			: `${(distance / 1000).toFixed(1)} ${t('activity_info.kilometers', 'kilómetros')}`;
		const distanceMessage = t('activity_info.team_distance', 'Distancia: {{distance}}', {
			distance: distanceText
		});
		const proximityStatus = checkActivityProximity(activity, teamPosition, accuracy);
		const canStartByClick = proximityStatus.canClickActivate && !activity.complete;
		const statusMessages = [];

		if (!proximityStatus.isWithinRange) {
			statusMessages.push(t('activity_info.too_far', 'Debes acercarte más para realizar esta actividad'));
		}

		if (proximityStatus.isWithinRange && !proximityStatus.hasPrecision) {
			statusMessages.push(t('activity_info.poor_precision', 'Precisión GPS insuficiente'));
		}

		if (activity.complete) {
			statusMessages.push(t('activity_info.already_completed', 'Actividad ya completada'));
		}

		return {
			distance,
			distanceText,
			distanceMessage,
			proximityStatus,
			canStartByClick,
			statusMessages,
		};
	}, [checkActivityProximity, t]);

	// Nueva función para verificar proximidad con el sistema mejorado
	const checkActivityProximityNew = useCallback((teamPosition, accuracy) => {
		const currentTeamData = selectedTeamData;
		if (!currentTeamData || isAdmin) {
			activityProximityCacheRef.current = new Map();
			return;
		}

		const visibleActivities = (currentTeamData.activities_data || [])
			.filter((activity) => isActivityVisible(activity, currentTeamData, false));

		const proximityResults = new Map();

		visibleActivities.forEach((activity) => {
			if (!activity.lat || !activity.lon || !activity.distance || activity.complete) {
				return;
			}

			const info = computeActivityProximityInfo(activity, teamPosition, accuracy);
			proximityResults.set(activity.id, info);

			// Si puede activarse automáticamente y no ha sido activada ya
			if (info.proximityStatus.canAutoActivate && !isAutoActivated(activity.id)) {
				if (isDebugModeRef.current) {
					console.log('✅ Auto-activating activity:', activity.name);
				}
				markAsAutoActivated(activity.id);
				showActivityAutoProximityPopup(activity);
			}
		});

		activityProximityCacheRef.current = proximityResults;
	}, [selectedTeamData, isAdmin, computeActivityProximityInfo, isAutoActivated, markAsAutoActivated, showActivityAutoProximityPopup]);

	useEffect(() => {
			selectedTeamDataRef.current = selectedTeamData;
			if (!selectedTeamData) {
				activityProximityCacheRef.current = new Map();
			}
		}, [selectedTeamData]);

		useEffect(() => {
			isDebugModeRef.current = isDebugMode;
		}, [isDebugMode]);

		useEffect(() => {
			isFollowModeRef.current = isFollowMode;
		}, [isFollowMode]);

		useEffect(() => {
			useCompassRef.current = useCompass;
		}, [useCompass]);

		useEffect(() => {
			checkActivityProximityNewRef.current = checkActivityProximityNew;
		}, [checkActivityProximityNew]);

		useEffect(() => {
			throttledFirebaseUpdateRef.current = throttledFirebaseUpdate;
		}, [throttledFirebaseUpdate]);

		useEffect(() => {
			updateSelectedTeamMarkerPositionRef.current = updateSelectedTeamMarkerPosition;
		}, [updateSelectedTeamMarkerPosition]);

		useEffect(() => {
			if (isAdmin && adminPositionViewEnabled) {
				return;
			}

			adminMarkerRef.current = null;
			adminLocationRef.current = null;
			adminDirectionRef.current = null;
			adminKalmanLat.current = null;
			adminKalmanLng.current = null;
			adminLastFiltered.current = null;
			adminLastAccuracy.current = null;
			adminLastAcceptedUpdateTs.current = 0;
                        adminPreviousPosition.current = null;
                        setAdminLocation(null);
                }, [isAdmin, adminPositionViewEnabled]);


        // Limpiar estado de proximidad cuando cambie el equipo seleccionado
        useEffect(() => {
                clearProximityState();
                setOpenActivityId(null);
        }, [selectedTeam?.id, clearProximityState]);

        /**
         * Determina el centro inicial del mapa según si el equipo tiene ruta
         * @param {Object} event - Datos del evento
         * @param {Object} selectedTeamData - Datos del equipo seleccionado
         * @param {boolean} isAdmin - Si el usuario es administrador
         * @returns {Object|null} Coordenadas {lat, lng} o null
         */
        const calculateInitialMapCenter = useCallback((event, selectedTeamData, isAdmin) => {
                // Validar que tenemos evento
                if (!event || typeof event.lat !== 'number' || typeof event.lon !== 'number') {
                        if (isDebugMode) {
                                console.log('🗺️ calculateInitialMapCenter: No hay datos válidos de evento');
                        }
                        return null;
                }
                
                // Si es admin, usar centro del evento
                if (isAdmin) {
                        if (isDebugMode) {
                                console.log('🗺️ calculateInitialMapCenter: Usuario admin, usando centro del evento');
                        }
                        return { lat: event.lat, lng: event.lon };
                }
                
                // Si no hay equipo seleccionado o el equipo no tiene ruta, usar centro del evento
                if (!selectedTeamData || selectedTeamData.route === 0) {
                        if (isDebugMode) {
                                console.log('🗺️ calculateInitialMapCenter: Sin ruta asignada, usando centro del evento', {
                                        hasTeamData: !!selectedTeamData,
                                        route: selectedTeamData?.route
                                });
                        }
                        return { lat: event.lat, lng: event.lon };
                }
                
                // El equipo tiene ruta, buscar la primera actividad válida
                const activities = selectedTeamData.activities_data || [];
                const firstActivity = activities.find(activity => 
                        !activity.complete && 
                        !activity.del && 
                        typeof activity.lat === 'number' && 
                        typeof activity.lon === 'number'
                );
                
                // Si encontramos una actividad válida, usar sus coordenadas
                if (firstActivity) {
                        if (isDebugMode) {
                                console.log('🗺️ calculateInitialMapCenter: Equipo con ruta, centrando en primera actividad', {
                                        activityId: firstActivity.id,
                                        activityName: firstActivity.name,
                                        lat: firstActivity.lat,
                                        lng: firstActivity.lon
                                });
                        }
                        return { lat: firstActivity.lat, lng: firstActivity.lon };
                }
                
                // Fallback al centro del evento
                if (isDebugMode) {
                        console.log('🗺️ calculateInitialMapCenter: No se encontró actividad válida, usando centro del evento');
                }
                return { lat: event.lat, lng: event.lon };
        }, [isDebugMode]);

        // Establecer center inicial solo una vez
        useEffect(() => {
                if (!eventId) {
                        return;
                }		const sameEvent = previousEventIdRef.current === eventId;
		if (sameEvent && initialCenter) {
			return;
		}

                const storedView = loadStoredMapView();
                if (storedView?.center) {
                        if (isDebugMode) {
                                console.log('🗺️ Usando vista guardada del mapa:', storedView.center);
                        }
                        setInitialCenter(storedView.center);
                        setInitialZoom(typeof storedView.zoom === 'number' ? storedView.zoom : null);
                } else {
                        // Calcular centro según si el equipo tiene ruta o no
                        const calculatedCenter = calculateInitialMapCenter(event, selectedTeamData, isAdmin);
                        if (calculatedCenter) {
                                setInitialCenter(calculatedCenter);
                                setInitialZoom(null);
                        }
                }

                previousEventIdRef.current = eventId;
        }, [eventId, event, initialCenter, loadStoredMapView, selectedTeamData, isAdmin, calculateInitialMapCenter, isDebugMode]);	// Inicializar orientación del dispositivo para obtener la dirección del teléfono
	useEffect(() => {
		const shouldTrackCompass = !isDebugMode
			&& useCompass
			&& !permissionChecking
			&& !permissionOverlayVisible
			&& (
				(!isAdmin && Boolean(selectedTeam))
				|| (isAdmin && adminPositionViewEnabled)
			);

		if (!shouldTrackCompass) {
			return;
		}

		if (!motionPermissionGranted && typeof window.DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
			return;
		}

		let remove = () => {};
		let ema = makeAngleEMA(0.2);
		let last = null;
		const THRESH = 2.5;
		const MIN_INTERVAL = 66;
		let lastTs = 0;
		let preferAbs = false;
		let lastAbsTs = 0;
		const uaIsAndroid = /Android/i.test(navigator.userAgent || '');

		const onOrientation = (evt) => {
			const now = Date.now();
			if (now - lastTs < MIN_INTERVAL) return;

			// En Android, si no es absoluto, ignorar para evitar drift con el tilt
			if (uaIsAndroid && evt && evt.absolute !== true) {
				return;
			}

			// Si tenemos una lectura absoluta reciente, ignorar las relativas para no mezclar marcos
			if (evt && evt.absolute === true) {
				preferAbs = true;
				lastAbsTs = now;
			} else if (preferAbs && (now - lastAbsTs) < 2000) {
				return;
			}

			const beta = typeof evt.beta === 'number' ? Math.abs(evt.beta) : null;
			const gamma = typeof evt.gamma === 'number' ? Math.abs(evt.gamma) : null;
			if (beta != null && gamma != null) {
				// Filtro más estricto para que al inclinar en vertical no cambie la dirección
				if (beta > 30 || gamma > 30) return;
			}

			const hdg = normalizeCompassHeadingFromEvent(evt);
			if (hdg == null) return;

			const smooth = ema(hdg);
			if (last == null || angleDelta(smooth, last) > THRESH) {
				last = smooth;
				compassHeadingRef.current = smooth;
				lastCompassUpdate.current = now;
				if (!isAdmin && selectedTeam) {
					updateSelectedTeamMarkerRotation(smooth);
				}
				if (isAdmin && adminPositionViewEnabled) {
					adminDirectionRef.current = smooth;
					if (adminLocationRef.current) {
						adminLocationRef.current = { ...adminLocationRef.current, direction: smooth };
					}
					updateAdminMarkerRotation(smooth);
					setAdminLocation((prev) => {
						if (!prev) return prev;
						const prevDirection = typeof prev.direction === 'number' ? prev.direction : null;
						if (prevDirection != null && angleDelta(prevDirection, smooth) < 2) {
							return prev;
						}
						return { ...prev, direction: smooth };
					});
				}
			}
		};

		const add = (type, handler, opts) => window.addEventListener(type, handler, opts);
		const rm  = (type, handler, opts) => window.removeEventListener(type, handler, opts);

		const start = async () => {
			let handlerAbs, handlerRel;
			if ('ondeviceorientationabsolute' in window) {
				handlerAbs = (e) => onOrientation(e);
				add('deviceorientationabsolute', handlerAbs, true);
				remove = () => {
					rm('deviceorientationabsolute', handlerAbs, true);
				};
			} else {
				handlerRel = (e) => onOrientation(e);
				add('deviceorientation', handlerRel, true);
				remove = () => rm('deviceorientation', handlerRel, true);
			}
		};

		start();
		return () => remove();
	}, [selectedTeam, isAdmin, isDebugMode, useCompass, adminPositionViewEnabled, updateSelectedTeamMarkerRotation, updateAdminMarkerRotation, permissionChecking, permissionOverlayVisible, motionPermissionGranted]);

	// Precargar imágenes de marcadores
	useEffect(() => {
		const imagesToPreload = [markMe];
		
		// Agregar assets de equipos
		Object.values(teamAssets).forEach(url => {
			if (url) imagesToPreload.push(url);
		});

		// Precargar todas las imágenes
		const preloadPromises = imagesToPreload.map(url => 
			preloadImage(url).catch(err => {
				if (isDebugMode) {
					console.warn('Failed to preload image:', url, err);
				}
			})
		);

		Promise.allSettled(preloadPromises).then(() => {
			if (isDebugMode) {
				console.log('📸 Image preloading completed');
			}
		});
		}, [isDebugMode]); // Solo una vez al inicializar

	// Efecto para actualizar marcadores cuando cambien los datos de equipos SIN re-renderizar
	useEffect(() => {
		if (!teams || teams.length === 0) return;

		if (!initialTeamsRef.current) {
			initialTeamsRef.current = [...teams];
			return;
		}

		// OPTIMIZACIÓN: Filtrar equipos ANTES de procesarlos
		const teamsToProcess = teams.filter(shouldShowTeam);
		const now = Date.now();

		// Actualizar solo los marcadores de equipos visibles que han cambiado
		teamsToProcess.forEach(team => {
			const previousTeam = initialTeamsRef.current.find(t => t.id === team.id);
			if (previousTeam) {
				const positionChanged = previousTeam.lat !== team.lat || previousTeam.lon !== team.lon;
				const directionChanged = previousTeam.direction !== team.direction;
				
				if (positionChanged || directionChanged) {
					// ✅ OPTIMIZACIÓN: Throttle de 30 segundos para otros equipos (excepto el propio)
					const isOwnTeam = selectedTeam && team.id === selectedTeam.id;
					const lastUpdateTime = lastTeamMarkersUpdateTime.current[team.id] || 0;
					const timeSinceLastUpdate = now - lastUpdateTime;
					
					// Siempre actualizar el equipo propio inmediatamente
					// Para otros equipos, aplicar throttle de 30 segundos
					if (isOwnTeam || timeSinceLastUpdate >= TEAM_MARKERS_UPDATE_THROTTLE_MS) {
						if (isDebugMode) {
							console.log('🔄 Firebase update detected for team:', team.id, { 
								positionChanged, 
								directionChanged,
								isOwnTeam,
								throttled: !isOwnTeam && timeSinceLastUpdate < TEAM_MARKERS_UPDATE_THROTTLE_MS
							});
						}
						updateTeamMarkerFromFirebase(team.id, team);
						lastTeamMarkersUpdateTime.current[team.id] = now;
						
						// Si está en modo seguimiento y es el equipo seleccionado, centrar el mapa
						if (isFollowMode && isOwnTeam && positionChanged && mapRef.current) {
							mapRef.current.panTo({ lat: team.lat, lng: team.lon });
						}
					}
				}
			}
		});

		initialTeamsRef.current = [...teams];
	}, [isDebugMode, teams, updateTeamMarkerFromFirebase, isFollowMode, selectedTeam, shouldShowTeam]);

	// Limpiar notificaciones cuando cambie el equipo seleccionado
	useEffect(() => {
		if (selectedTeam) {
			if (isDebugMode) {
				console.log('🔄 Team changed, clearing activity notifications and resetting Kalman filters for team:', selectedTeam.id);
			}
			// También limpiar la posición anterior para el cálculo de dirección
			previousPosition.current = null;
			// Reiniciar filtros de Kalman para el nuevo equipo
			kalmanLat.current = null;
			kalmanLng.current = null;
			lastFiltered.current = null;
			lastAccuracy.current = null; // Limpiar precisión anterior
			lastAcceptedUpdateTs.current = 0;
			activityProximityCacheRef.current = new Map();
		}
	}, [isDebugMode, selectedTeam]); // Solo el objeto selectedTeam

	// Suscripción a geolocalización con ventana de muestreo para mejor precisión
	useEffect(() => {
		if (permissionChecking) {
			return;
		}
		if (permissionOverlayVisible) {
			return;
		}
		if (!geolocationPermissionGranted) {
			return;
		}

		const currentTeamData = selectedTeamDataRef.current;

		// Si está en modo debug, no escuchar GPS
		if (isDebugModeRef.current) {
			return;
		}

		if (!navigator.geolocation) {
			if (isDebugModeRef.current) {
				console.error('❌ Geolocation is not supported by this browser');
			}
			return;
		}

		if (!hasSelectedTeamData || !currentTeamData) {
			return;
		}

		if (!initialCenter) {
			return;
		}

		// Verificar permisos de geolocalización
		if (navigator.permissions) {
			navigator.permissions.query({ name: 'geolocation' }).then((permission) => {
				if (permission.state === 'denied' && isDebugModeRef.current) {
					console.error('❌ Geolocation permission denied');
				}
			}).catch((err) => {
				if (isDebugModeRef.current) {
					console.warn('⚠️ Could not check geolocation permissions:', err);
				}
			});
		}

		// Variables para la ventana de muestreo
		let positionSamples = [];
		let samplingWindow = null;
		const SAMPLING_WINDOW_MS = 4000; // Ventana de 4 segundos
		const MIN_SAMPLES = 2; // Mínimo de muestras para procesar
		
		const processBestSample = () => {
			if (positionSamples.length === 0) {
				return;
			}
			
			// Ordenar por precisión (menor accuracy = mejor)
			positionSamples.sort((a, b) => a.accuracy - b.accuracy);
			
			// Intentar encontrar una muestra dentro del umbral de precisión
			let bestSample = positionSamples.find(sample => sample.accuracy <= ACCURACY_THRESHOLD);
			
			// Si no hay ninguna dentro del umbral, usar la mejor disponible
			if (!bestSample) {
				bestSample = positionSamples[0]; // La primera es la mejor después del sort
			}
			
			// Filtro de centroide basado en precisión relativa para evitar "bailes"
			if (lastFiltered.current && lastAccuracy.current !== null) {
				const centroidDistance = getDistance(
					{ lat: bestSample.lat, lng: bestSample.lng }, 
					lastFiltered.current
				);
				
				// Calcular el umbral dinámico basado en las precisiones
				const maxAccuracy = Math.max(lastAccuracy.current, bestSample.accuracy);
				const centroidThreshold = CENTROID_MOVEMENT_FACTOR * maxAccuracy;
				const now = Date.now();
				const lastUpdateTs = lastAcceptedUpdateTs.current || 0;
				const timeSinceLastUpdate = now - lastUpdateTs;
				
				if (centroidDistance <= centroidThreshold && timeSinceLastUpdate < MIN_FORCED_UPDATE_INTERVAL_MS) {
					// Limpiar muestras y esperar nuevas
					positionSamples = [];
					return;
				}
			}
			
			// Filtro de saltos grandes como fallback para casos extremos
			if (lastFiltered.current) {
				const jump = getDistance(
					{ lat: bestSample.lat, lng: bestSample.lng }, 
					lastFiltered.current
				);
				if (jump > MAX_JUMP_DISTANCE) {
					// Limpiar muestras y esperar nuevas
					positionSamples = [];
					return;
				}
			}
			
			// Aplicar el procesamiento como antes
			const { lat, lng, heading } = bestSample;
			const now = Date.now();
			
			// Inicializar filtros de Kalman si es la primera vez
			if (!kalmanLat.current || !kalmanLng.current) {
				kalmanLat.current = new KalmanFilter({ R: KALMAN_R, Q: KALMAN_Q });
				kalmanLng.current = new KalmanFilter({ R: KALMAN_R, Q: KALMAN_Q });
				
				// Primer filtrado con la posición inicial
				const filteredLat = kalmanLat.current.filter(lat);
				const filteredLng = kalmanLng.current.filter(lng);
				
				lastFiltered.current = { lat: filteredLat, lng: filteredLng };
				lastAccuracy.current = bestSample.accuracy; // Almacenar precisión inicial
			} else {
				// Aplicar filtros de Kalman a las nuevas coordenadas
				const filteredLat = kalmanLat.current.filter(lat);
				const filteredLng = kalmanLng.current.filter(lng);
				
				lastFiltered.current = { lat: filteredLat, lng: filteredLng };
				lastAccuracy.current = bestSample.accuracy; // Actualizar precisión
			}
			
		const newPosition = { lat: lastFiltered.current.lat, lng: lastFiltered.current.lng };
		
		lastAcceptedUpdateTs.current = now;
		
		// Obtener dirección - SOLO usar acelerómetro si está disponible
		let direction = null;
		
		// 1. PRIORIDAD ÚNICA: Orientación del dispositivo (acelerómetro/brújula)
		const currentCompassHeading = compassHeadingRef.current;
		const useCompassValue = useCompassRef.current;
		if (useCompassValue && currentCompassHeading !== null) {
			// Verificar que la lectura de la brújula sea reciente (menos de 1 segundo)
			const compassAge = now - lastCompassUpdate.current;
			if (compassAge < 1000) {
				direction = currentCompassHeading;
				// Si tenemos acelerómetro activo, NO usar otros métodos
			}
		}
		
		// Solo si NO tenemos acelerómetro disponible, usar fallbacks
		if (direction === null) {
			// 2. Fallback: Heading del GPS si está disponible
			if (heading !== null && heading !== undefined && !isNaN(heading)) {
				direction = heading;
			}
			// 3. Último recurso: Calcular dirección usando movimiento
			else if (previousPosition.current) {
				const distance = getDistance(previousPosition.current, newPosition);
				// Solo calcular dirección si ha habido un movimiento significativo
				if (distance > 2) {
					direction = getBearing(previousPosition.current, newPosition);
				}
			}
		}
		
		// Actualizar la posición anterior para la próxima iteración (solo para fallback de movimiento)
		previousPosition.current = newPosition;			// PRIMERO: Actualizar directamente la posición del marcador SIN re-renderizar
			const updateMarkerFn = updateSelectedTeamMarkerPositionRef.current;
			if (updateMarkerFn) {
				updateMarkerFn(newPosition, direction);
			}
			
			// Si está activo el modo seguimiento, centrar el mapa en la nueva posición
			if (isFollowModeRef.current && mapRef.current) {
				mapRef.current.panTo(newPosition);
			}
			
			// Verificar proximidad a actividades
			const proximityFn = checkActivityProximityNewRef.current;
			if (proximityFn) {
				proximityFn(newPosition, bestSample.accuracy);
			}
			// SEGUNDO: Actualizar Firebase con throttling (esto puede causar re-render pero ya hemos actualizado el marcador)
			const throttledUpdateFn = throttledFirebaseUpdateRef.current;
			if (throttledUpdateFn) {
				const latestTeamData = selectedTeamDataRef.current || currentTeamData;
				if (latestTeamData) {
					throttledUpdateFn(newPosition, latestTeamData, direction);
				}
			}
			
			// Limpiar muestras para el siguiente ciclo
			positionSamples = [];
		};

		const watchId = navigator.geolocation.watchPosition(
			({ coords }) => {
				const { latitude: lat, longitude: lng, accuracy, heading, speed } = coords;
			
				// Agregar muestra al buffer independientemente de la precisión
				positionSamples.push({
					lat,
					lng,
					accuracy,
					heading,
					speed,
					timestamp: Date.now()
				});
				
				// Si es la primera muestra, iniciar la ventana de muestreo
				if (positionSamples.length === 1) {
					samplingWindow = setTimeout(() => {
						processBestSample();
						samplingWindow = null;
					}, SAMPLING_WINDOW_MS);
				}
				
				// Si hemos alcanzado el umbral de precisión deseado y tenemos suficientes muestras,
				// procesar inmediatamente en lugar de esperar
				if (accuracy <= ACCURACY_THRESHOLD && positionSamples.length >= MIN_SAMPLES) {
					if (samplingWindow) {
						clearTimeout(samplingWindow);
						samplingWindow = null;
					}
					processBestSample();
				}
			},
			(err) => {
				if (isDebugModeRef.current) {
					console.error("❌ Geolocation error:", err);
					console.error("Error code:", err.code);
					console.error("Error message:", err.message);
				
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
				}
			},
			{ 
				enableHighAccuracy: true, 
				maximumAge: 0, // No usar caché
				timeout: 15000 // Timeout de 15 segundos
			}
		);

		if (isDebugModeRef.current) {
			console.log('🌍 Geolocation watch ID assigned:', watchId);
		}

		// Probar una posición única para verificar que funciona
		if (isDebugModeRef.current) {
			console.log('🧪 Testing getCurrentPosition...');
		}
		navigator.geolocation.getCurrentPosition(
			(position) => {
				if (isDebugModeRef.current) {
					console.log('🧪 ✅ getCurrentPosition SUCCESS:', {
						lat: position.coords.latitude,
						lng: position.coords.longitude,
						accuracy: position.coords.accuracy
					});
				}
			},
			(err) => {
				if (isDebugModeRef.current) {
					console.error('🧪 ❌ getCurrentPosition ERROR:', err);
				}
			},
			{
				enableHighAccuracy: true,
				timeout: 10000,
				maximumAge: 0
			}
		);

		return () => {
			if (isDebugModeRef.current) {
				console.log('🛑 Clearing geolocation watch ID:', watchId);
			}
			navigator.geolocation.clearWatch(watchId);
			
			// Limpiar timeout de ventana de muestreo si existe
			if (samplingWindow) {
				clearTimeout(samplingWindow);
				if (isDebugModeRef.current) {
					console.log('🛑 Clearing sampling window timeout');
				}
			}
		};
	}, [selectedTeam?.id, hasSelectedTeamData, initialCenter, isDebugMode, permissionChecking, permissionOverlayVisible, geolocationPermissionGranted]); // Dependencias reducidas para mantener un único watch

	useEffect(() => {
		if (!isAdmin || !adminPositionViewEnabled) {
			return;
		}
		if (permissionChecking || permissionOverlayVisible) {
			return;
		}
		if (!geolocationPermissionGranted) {
			return;
		}
		if (!navigator.geolocation) {
			if (isDebugModeRef.current) {
				console.error('❌ Geolocation is not supported by this browser (admin)');
			}
			return;
		}
		if (!initialCenter) {
			return;
		}

		const SAMPLING_WINDOW_MS = 4000;
		const MIN_SAMPLES = 2;
		let positionSamples = [];
		let samplingWindow = null;

		const processBestSample = () => {
			if (positionSamples.length === 0) {
				return;
			}

			positionSamples.sort((a, b) => a.accuracy - b.accuracy);
			let bestSample = positionSamples.find(sample => sample.accuracy <= ACCURACY_THRESHOLD) || positionSamples[0];

			if (adminLastFiltered.current && adminLastAccuracy.current !== null) {
				const centroidDistance = getDistance(
					{ lat: bestSample.lat, lng: bestSample.lng },
					adminLastFiltered.current
				);
				const maxAccuracy = Math.max(adminLastAccuracy.current, bestSample.accuracy);
				const centroidThreshold = CENTROID_MOVEMENT_FACTOR * maxAccuracy;
				const now = Date.now();
				const lastUpdateTs = adminLastAcceptedUpdateTs.current || 0;
				const timeSinceLastUpdate = now - lastUpdateTs;
				if (centroidDistance <= centroidThreshold && timeSinceLastUpdate < MIN_FORCED_UPDATE_INTERVAL_MS) {
					positionSamples = [];
					return;
				}
			}

			if (adminLastFiltered.current) {
				const jump = getDistance(
					{ lat: bestSample.lat, lng: bestSample.lng },
					adminLastFiltered.current
				);
				if (jump > MAX_JUMP_DISTANCE) {
					positionSamples = [];
					return;
				}
			}

			if (!adminKalmanLat.current || !adminKalmanLng.current) {
				adminKalmanLat.current = new KalmanFilter({ R: KALMAN_R, Q: KALMAN_Q });
				adminKalmanLng.current = new KalmanFilter({ R: KALMAN_R, Q: KALMAN_Q });
			}

			const filteredLat = adminKalmanLat.current.filter(bestSample.lat);
			const filteredLng = adminKalmanLng.current.filter(bestSample.lng);
			adminLastFiltered.current = { lat: filteredLat, lng: filteredLng };
			adminLastAccuracy.current = bestSample.accuracy;

			const newPosition = { lat: filteredLat, lng: filteredLng };
			const now = Date.now();
			let direction = null;

			// 1. PRIORIDAD ÚNICA: Orientación del dispositivo (acelerómetro/brújula)
			const currentCompassHeading = compassHeadingRef.current;
			const useCompassValue = useCompassRef.current;
			if (useCompassValue && currentCompassHeading !== null) {
				const compassAge = now - lastCompassUpdate.current;
				if (compassAge < 1000) {
					direction = currentCompassHeading;
					// Si tenemos acelerómetro activo, NO usar otros métodos
				}
			}

			// Solo si NO tenemos acelerómetro disponible, usar fallbacks
			if (direction === null) {
				// 2. Fallback: Heading del GPS si está disponible
				if (bestSample.heading !== null && bestSample.heading !== undefined && !isNaN(bestSample.heading)) {
					direction = bestSample.heading;
				}
				// 3. Último recurso: Calcular dirección usando movimiento
				else if (adminPreviousPosition.current) {
					const distance = getDistance(adminPreviousPosition.current, newPosition);
					if (distance > 2) {
						direction = getBearing(adminPreviousPosition.current, newPosition);
					}
				}
			}

			adminPreviousPosition.current = newPosition;
			const effectiveDirection = typeof direction === 'number'
				? direction
				: (typeof adminDirectionRef.current === 'number' ? adminDirectionRef.current : null);
			adminDirectionRef.current = effectiveDirection;
			adminLastAcceptedUpdateTs.current = now;

			const previousLocation = adminLocationRef.current;
			const payload = {
				position: newPosition,
				accuracy: bestSample.accuracy,
				direction: effectiveDirection,
			};
			adminLocationRef.current = payload;

			updateAdminMarkerPosition(newPosition, effectiveDirection);

			let shouldUpdateState = !previousLocation;
			if (previousLocation) {
				const distanceMoved = getDistance(previousLocation.position, newPosition);
				if (distanceMoved > 0.5) {
					shouldUpdateState = true;
				}
				const prevDirection = typeof previousLocation.direction === 'number' ? previousLocation.direction : null;
				if (!shouldUpdateState && typeof effectiveDirection === 'number' && prevDirection != null) {
					if (angleDelta(prevDirection, effectiveDirection) > 8) {
						shouldUpdateState = true;
					}
				}
				if (!shouldUpdateState) {
					const prevAccuracy = previousLocation.accuracy ?? Infinity;
					if (Math.abs(prevAccuracy - bestSample.accuracy) > 5) {
						shouldUpdateState = true;
					}
				}
			}

			if (shouldUpdateState) {
				setAdminLocation(payload);
			}

			if (isFollowModeRef.current && mapRef.current) {
				mapRef.current.panTo(newPosition);
			}

			positionSamples = [];
		};

		const watchId = navigator.geolocation.watchPosition(
			({ coords }) => {
				const sample = {
					lat: coords.latitude,
					lng: coords.longitude,
					accuracy: coords.accuracy,
					heading: coords.heading,
					speed: coords.speed,
					timestamp: Date.now(),
				};
				positionSamples.push(sample);

				if (positionSamples.length === 1) {
					samplingWindow = setTimeout(() => {
						processBestSample();
						samplingWindow = null;
					}, SAMPLING_WINDOW_MS);
				}

				if (coords.accuracy <= ACCURACY_THRESHOLD && positionSamples.length >= MIN_SAMPLES) {
					if (samplingWindow) {
						clearTimeout(samplingWindow);
						samplingWindow = null;
					}
					processBestSample();
				}
			},
			(err) => {
				if (isDebugModeRef.current) {
					console.error('❌ Geolocation error (admin):', err);
				}
			},
			{
				enableHighAccuracy: true,
				maximumAge: 0,
				timeout: 15000,
			}
		);

		if (isDebugModeRef.current) {
			console.log('🌍 Admin geolocation watch ID assigned:', watchId);
		}

		navigator.geolocation.getCurrentPosition(
			(position) => {
				if (isDebugModeRef.current) {
					console.log('🧪 ✅ Admin getCurrentPosition SUCCESS:', {
						lat: position.coords.latitude,
						lng: position.coords.longitude,
						accuracy: position.coords.accuracy,
					});
				}
			},
			(err) => {
				if (isDebugModeRef.current) {
					console.error('🧪 ❌ Admin getCurrentPosition ERROR:', err);
				}
			},
			{
				enableHighAccuracy: true,
				timeout: 10000,
				maximumAge: 0,
			}
		);

		return () => {
			if (isDebugModeRef.current) {
				console.log('🛑 Clearing admin geolocation watch ID:', watchId);
			}
			navigator.geolocation.clearWatch(watchId);
			if (samplingWindow) {
				clearTimeout(samplingWindow);
			}
			positionSamples = [];
		};
	}, [isAdmin, adminPositionViewEnabled, permissionChecking, permissionOverlayVisible, geolocationPermissionGranted, initialCenter, updateAdminMarkerPosition]);

	// Marcadores renderizados solo cuando sea necesario (evitar re-renders por cambios de posición)
	const teamMarkers = React.useMemo(() => {
		// Verificar que Google Maps esté cargado y tengamos datos iniciales
		if (!mapsReady || !window.google?.maps || !teams || teams.length === 0) {
			if (isDebugMode) {
				console.log('⏳ Google Maps not loaded yet or no teams, skipping marker creation');
			}
			return [];
		}

		// Solo crear marcadores una vez o cuando cambie la estructura de equipos (no posiciones)
		if (!markersCreated) {
			if (isDebugMode) {
				console.log('🎯 Creating initial markers for teams (RENDER ONCE):', teams.length);
			}
			setMarkersCreated(true);
		} else {
			if (isDebugMode) {
				console.log('🎯 Using cached markers - positions updated via direct API calls');
			}
		}
		
		// Si es admin, mostrar información de posición de todos los equipos
		if (isAdmin) {
			if (isDebugMode) {
				console.log('👑 Admin view - Team positions:');
				teams.forEach(team => {
					if (team.lat != null && team.lon != null) {
						console.log(`📍 Team ${team.id} (${team.name || 'Sin nombre'}): lat: ${team.lat.toFixed(6)}, lng: ${team.lon.toFixed(6)}, direction: ${team.direction || 0}°, device: ${team.device || 'No device'}`);
					} else {
						console.log(`❌ Team ${team.id} (${team.name || 'Sin nombre'}): No position data, device: ${team.device || 'No device'}`);
					}
				});
			}
		}
		
		// OPTIMIZACIÓN: Filtrar equipos ANTES de procesarlos
		const teamsToRender = teams.filter(shouldShowTeam);

		if (isDebugMode) {
			console.log(`🎯 Teams to render: ${teamsToRender.length} of ${teams.length} total teams`);
		}
		
		return teamsToRender.map((team, index) => {
				if (isDebugMode) {
					console.log('🎯 Team marker:', team.id, 'lat:', team.lat, 'lon:', team.lon, 'isSelected:', team.id === selectedTeam?.id, 'device:', team.device);
				}
				
				if (team.lat == null || team.lon == null) return null;
				
				// Determinar si es el equipo seleccionado
				const isSelectedTeam = selectedTeam && team.id === selectedTeam.id;
				
				if (isSelectedTeam) {
					const baseIconUrl = markMe;
					const teamDirection = team.direction || 0;
					const iconUrl = createRotatedIconSync(baseIconUrl, toViewHeading(teamDirection), ICON_SIZE);
					const scale = new window.google.maps.Size(ICON_SIZE, ICON_SIZE);
					const anchor = new window.google.maps.Point(ICON_SIZE / 2, ICON_SIZE / 2);
					const markerOpacity = ownTeamStatus === 'online' || ownTeamStatus === 'sleep'
						? 1
						: ownTeamStatus === 'connecting'
							? 0.75
							: 0.45;
					const markerTitle = (() => {
						if (!ownTeamStatus) return undefined;
						switch (ownTeamStatus) {
							case 'sleep':
								return t('session.screen_locked', 'Pantalla bloqueada');
							case 'connecting':
								return t('session.connecting', 'Conectando…');
							case 'offline':
								return t('session.disconnected', 'Desconectado');
							default:
								return t('session.connected', 'Conectado');
						}
					})();
					const showOfflineBadge = !isAdmin && ownTeamStatus === 'offline';
				
					return (
						<React.Fragment key={team.id}>
							<Marker
								position={{ lat: team.lat, lng: team.lon }}
								icon={{ url: iconUrl, scaledSize: scale, anchor }}
								opacity={markerOpacity}
								title={markerTitle}
								zIndex={ownTeamStatus === 'offline' ? 200 : 300}
								onLoad={(marker) => { teamMarkersRef.current.set(team.id, marker); }}
							/>
							{showOfflineBadge && (
								<OverlayView
									position={{ lat: team.lat, lng: team.lon }}
									mapPaneName={OverlayView.OVERLAY_LAYER}
								>
									<div
										style={{
											transform: 'translate(-50%, -130%)',
											background: 'rgba(220, 38, 38, 0.95)',
											color: '#fff',
											padding: '4px 10px',
											borderRadius: '999px',
											fontSize: '0.75rem',
											fontWeight: 600,
											boxShadow: '0 4px 12px rgba(0,0,0,0.35)',
											whiteSpace: 'nowrap'
										}}
									>
										{t('session.disconnected', 'Desconectado')}
									</div>
								</OverlayView>
							)}
						</React.Fragment>
					);
				}
				
				// Para otros equipos, usar componente dedicado (ya filtrados por shouldShowTeam)
				return (
					<OtherTeamMarker
						key={team.id}
						team={team}
						index={index}
						onMarkerLoad={(marker) => { teamMarkersRef.current.set(team.id, marker); }}
					/>
				);
			});
	}, [isDebugMode, mapsReady, isAdmin, selectedTeam, teams, markersCreated, ownTeamStatus, t, shouldShowTeam]);

	// Renderizar actividades
	const renderActivities = () => {
		if (isAdmin) {
			return (event?.activities_data || [])
				.filter((activity) => isActivityVisible(activity, null, true))
				.map((activity) => {
					const completedTeams = teams.filter((team) =>
						team.activities_data?.some((act) => act.id === activity.id && act.complete && !act.del)
					);
					const completedTeamNames = completedTeams.map((team) => team.name).join(", ");
					const completedCount = completedTeams.length;
					const adminMessage = completedCount > 0
						? t(
							"activity_info.admin_completed",
							"Equipos que han completado esta actividad ({{count}}): {{teams}}",
							{
								count: completedCount,
								teams: completedTeamNames || t("activity_info.none", "Ninguno"),
							}
						  )
						: t(
							"activity_info.admin_no_completed",
							"Ningún equipo ha completado esta actividad aún."
						  );

					return (
						<ActivityMarker
							key={`activity-${activity.id}`}
							activity={activity}
							isAdmin
							isBubbleOpen={openActivityId === activity.id}
							onMarkerClick={handleActivityMarkerClick}
							onBubbleClose={handleActivityBubbleClose}
							adminInfo={{ message: adminMessage }}
							teamInfo={null}
							t={t}
						/>
					);
				});
		}

		const currentTeamData = selectedTeamData;
		if (!currentTeamData) {
			return [];
		}

		if (isDebugMode) {
			console.log('🎯 Rendering activities for team:', currentTeamData?.id, currentTeamData?.activities_data?.length);
		}

		const visibleActivities = (currentTeamData.activities_data || [])
			.filter((activity) => isActivityVisible(activity, currentTeamData, false));

		const teamPosition = currentTeamData.lat != null && currentTeamData.lon != null
			? { lat: currentTeamData.lat, lng: currentTeamData.lon }
			: null;

		const accuracyForDisplay = lastAccuracy.current ?? 100;

		if (!teamPosition) {
			const info = {
				state: 'no-position',
				message: t('activity_info.position_unknown', 'No se puede calcular la distancia. Posición del equipo desconocida.'),
			};

			return visibleActivities.map((activity) => (
				<ActivityMarker
					key={`activity-${activity.id}`}
					activity={activity}
					isAdmin={false}
					isBubbleOpen={openActivityId === activity.id}
					onMarkerClick={handleActivityMarkerClick}
					onBubbleClose={handleActivityBubbleClose}
					adminInfo={null}
					teamInfo={info}
					t={t}
				/>
			));
		}

		return visibleActivities.map((activity) => {
			if (typeof activity.lat !== 'number' || typeof activity.lon !== 'number') {
				const info = {
					state: 'no-position',
					message: t('activity_info.position_unknown', 'No se puede calcular la distancia. Posición del equipo desconocida.'),
				};

				return (
					<ActivityMarker
						key={`activity-${activity.id}`}
						activity={activity}
						isAdmin={false}
						isBubbleOpen={openActivityId === activity.id}
						onMarkerClick={handleActivityMarkerClick}
						onBubbleClose={handleActivityBubbleClose}
						adminInfo={null}
						teamInfo={info}
						t={t}
					/>
				);
			}

			let proximityInfo = activityProximityCacheRef.current.get(activity.id);

			if (!proximityInfo) {
				const computedInfo = computeActivityProximityInfo(activity, teamPosition, accuracyForDisplay);
				const nextCache = new Map(activityProximityCacheRef.current);
				nextCache.set(activity.id, computedInfo);
				activityProximityCacheRef.current = nextCache;
				proximityInfo = computedInfo;
			}

			const { distanceMessage, canStartByClick, statusMessages } = proximityInfo;

			const teamInfo = {
				state: 'ready',
				distanceMessage,
				canStartByClick,
				callToActionText: canStartByClick
					? t('activity_info.click_to_start', 'Pulsa para realizar la actividad')
					: null,
				statusText: !canStartByClick && statusMessages.length > 0 ? statusMessages.join(' ') : null,
				startButtonLabel: t('start_activity', 'Iniciar Actividad'),
				onStartActivity: () => handleStartActivityByClick(activity),
			};

			return (
				<ActivityMarker
					key={`activity-${activity.id}`}
					activity={activity}
					isAdmin={false}
					isBubbleOpen={openActivityId === activity.id}
					onMarkerClick={handleActivityMarkerClick}
					onBubbleClose={handleActivityBubbleClose}
					adminInfo={null}
					teamInfo={teamInfo}
					t={t}
				/>
			);
		});
	};

	// Función para cerrar popups y bocadillos abiertos
	const closeOpenPopups = useCallback(() => {
		// Cerrar cualquier popup del sistema global
		closePopup();
		setOpenActivityId(null);
		setMeetingPointBubbleOpen(false);
		
		// Cerrar InfoWindows de actividades - necesitamos notificar a los ActivityMarkers
		// Esto se manejará mediante un evento personalizado que los ActivityMarkers escucharán
		window.dispatchEvent(new CustomEvent('closeActivityBubbles'));
	}, [closePopup]);

	const handleActivityMarkerClick = useCallback((activityId) => {
		setOpenActivityId(activityId);
		
		// Restaurar la rotación del mapa después de un breve delay para evitar que el InfoWindow la resetee
		setTimeout(() => {
			if (mapRef.current && typeof mapRef.current.setHeading === "function") {
				mapRef.current.setHeading(MAP_ROTATION_DEG);
			}
		}, 100);
	}, []);

	const handleActivityBubbleClose = useCallback(() => {
		setOpenActivityId(null);
	}, []);

	const handleStartActivityByClick = useCallback((activity) => {
		dispatch(startActivityWithSuspensionCheck(activity));
		setOpenActivityId(null);
	}, [dispatch]);

	const handleMeetingPointMarkerClick = useCallback(() => {
		setMeetingPointBubbleOpen(true);
		
		// Restaurar la rotación del mapa después de un breve delay
		setTimeout(() => {
			if (mapRef.current && typeof mapRef.current.setHeading === "function") {
				mapRef.current.setHeading(MAP_ROTATION_DEG);
			}
		}, 100);
	}, []);

	const handleMeetingPointBubbleClose = useCallback(() => {
		setMeetingPointBubbleOpen(false);
	}, []);

	// Función para manejar clicks en el mapa
	const handleMapClick = useCallback((mapEvent) => {
		// Siempre cerrar popups/bocadillos al hacer clic en el mapa
		closeOpenPopups();

		const currentTeamData = selectedTeamData;
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
		console.log('🔧 Debug mode: Calling checkActivityProximityNew with position:', newPosition, 'accuracy: 10');
		
		// En modo debug, hacer múltiples verificaciones para asegurar que se detecta la proximidad
		// Primera verificación inmediata
		checkActivityProximityNew(newPosition, 10); // Usar excelente precisión para debug mode
		
		// Segunda verificación después de 100ms para dar tiempo a que se actualice el estado
		setTimeout(() => {
			console.log('🔧 Debug mode: Second proximity check after 100ms');
			checkActivityProximityNew(newPosition, 10);
		}, 100);
		
		// Tercera verificación después de 1.2 segundos para activación automática
		setTimeout(() => {
			console.log('🔧 Debug mode: Third proximity check after 1.2 seconds for auto-activation');
			checkActivityProximityNew(newPosition, 10);
		}, 1200);
		
	}, [isDebugMode, event, dispatch, checkActivityProximityNew, selectedTeamData, closeOpenPopups]);

	// Función para manejar cuando el usuario desplaza el mapa manualmente
	const handleMapDragEnd = useCallback(() => {
		if (isFollowMode) {
			if (isDebugModeRef.current) {
				console.log('🗺️ User dragged map, disabling follow mode');
			}
			setIsFollowMode(false);
		}
		persistMapView();
	}, [isFollowMode, persistMapView]);

	const handleZoomChanged = useCallback(() => {
		persistMapView();
	}, [persistMapView]);

	// Función para alternar el uso de la brújula
	// eslint-disable-next-line no-unused-vars
	const toggleCompass = useCallback(() => {
		const newUseCompass = !useCompass;
		setUseCompass(newUseCompass);
		
		if (!newUseCompass) {
			// Si se desactiva la brújula, limpiar los valores
			compassHeadingRef.current = null;
			deviceOrientationRef.current = null;
			if (isDebugModeRef.current) {
				console.log('🧭 Compass disabled by user');
			}
		} else {
			if (isDebugModeRef.current) {
				console.log('🧭 Compass enabled by user');
			}
		}
	}, [useCompass]);

	// Función para alternar el modo seguimiento
	const toggleFollowMode = useCallback(() => {
		const newFollowMode = !isFollowMode;
		setIsFollowMode(newFollowMode);
		
		if (newFollowMode && mapRef.current) {
			// Si se activa el modo seguimiento, centrar inmediatamente
			if (isAdmin) {
				const adminFocusPosition = adminPositionViewEnabled
					? adminLocationRef.current?.position || adminLocation?.position
					: null;
				if (adminFocusPosition) {
					mapRef.current.panTo(adminFocusPosition);
				} else if (event) {
					mapRef.current.panTo({ lat: event.lat, lng: event.lon });
				}
			} else {
				const currentTeamData = selectedTeamData;
				if (currentTeamData && currentTeamData.lat != null && currentTeamData.lon != null) {
					// Para equipo, centrar en la posición del equipo
					mapRef.current.panTo({ lat: currentTeamData.lat, lng: currentTeamData.lon });
				}
			}
		}
		persistMapView();
		
		if (isDebugModeRef.current) {
			console.log('🎯 Follow mode:', newFollowMode ? 'ENABLED' : 'DISABLED');
		}
	}, [isFollowMode, isAdmin, event, selectedTeamData, adminPositionViewEnabled, adminLocation, persistMapView]);

	const clearCenterButtonLongPress = useCallback(() => {
		if (centerButtonLongPressTimeoutRef.current) {
			clearTimeout(centerButtonLongPressTimeoutRef.current);
			centerButtonLongPressTimeoutRef.current = null;
		}
	}, []);

	const handleCenterButtonPointerDown = useCallback(() => {
		centerButtonLongPressTriggeredRef.current = false;
		if (!mapRef.current || !event || typeof event.lat !== 'number' || typeof event.lon !== 'number') {
			return;
		}

		clearCenterButtonLongPress();
		centerButtonLongPressTimeoutRef.current = setTimeout(() => {
			centerButtonLongPressTimeoutRef.current = null;
			centerButtonLongPressTriggeredRef.current = true;
			if (mapRef.current) {
				mapRef.current.panTo({ lat: event.lat, lng: event.lon });
				persistMapView();
			}
		}, CENTER_BUTTON_LONG_PRESS_MS);
	}, [clearCenterButtonLongPress, event, persistMapView]);

	const handleCenterButtonPointerUp = useCallback(() => {
		clearCenterButtonLongPress();
	}, [clearCenterButtonLongPress]);

	const handleCenterButtonPointerLeave = useCallback(() => {
		clearCenterButtonLongPress();
		centerButtonLongPressTriggeredRef.current = false;
	}, [clearCenterButtonLongPress]);

	const handleCenterButtonClick = useCallback((evt) => {
		if (centerButtonLongPressTriggeredRef.current) {
			evt.preventDefault();
			evt.stopPropagation();
			centerButtonLongPressTriggeredRef.current = false;
			return;
		}
		toggleFollowMode();
	}, [toggleFollowMode]);

	useEffect(() => () => {
		if (centerButtonLongPressTimeoutRef.current) {
			clearTimeout(centerButtonLongPressTimeoutRef.current);
			centerButtonLongPressTimeoutRef.current = null;
		}
	}, []);

	useEffect(() => {
		const mapInstance = mapRef.current;
		if (!mapInstance) {
			return;
		}

		if (!isActive) {
			if (typeof mapInstance.getCenter === 'function') {
				const center = mapInstance.getCenter();
				if (center) {
					lastVisibleCenterRef.current = { lat: center.lat(), lng: center.lng() };
				}
			}
			if (typeof mapInstance.getZoom === 'function') {
				const zoom = mapInstance.getZoom();
				if (typeof zoom === 'number' && !Number.isNaN(zoom)) {
					lastVisibleZoomRef.current = zoom;
				}
			}
			return;
		}

		if (window.google?.maps?.event) {
			window.google.maps.event.trigger(mapInstance, 'resize');
		}

		const storedCenter = lastVisibleCenterRef.current;
		if (storedCenter) {
			mapInstance.panTo(storedCenter);
		}

		const storedZoom = lastVisibleZoomRef.current;
		if (typeof storedZoom === 'number' && !Number.isNaN(storedZoom)) {
			mapInstance.setZoom(storedZoom);
		}
	}, [isActive]);

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

	if (!mapsReady || !initialCenter) return null;

	const handleLoad = (map) => {
		mapRef.current = map;
		if (initialCenter) {
			map.panTo(initialCenter);
		}
		
		// Calcular zoom inicial respetando los límites configurados
		const { minZoom, maxZoom } = zoomLimits;
		const defaultZoom = 15;
		const desiredZoom = typeof initialZoom === 'number' ? initialZoom : defaultZoom;
		const clampedZoom = Math.max(minZoom, Math.min(maxZoom, desiredZoom));
		
		map.setZoom(clampedZoom);
		persistMapView();

		if (typeof map.setHeading === "function") {
			map.setHeading(MAP_ROTATION_DEG);
		}
	};

	return (
		<div style={{ position: "relative", width: "100%", height: "100%" }}>
			<GoogleMap
				id="event-map"
				mapContainerStyle={containerStyle}
				onLoad={handleLoad}
				onClick={handleMapClick}
				onDragEnd={handleMapDragEnd}
				onZoomChanged={handleZoomChanged}
				options={mapOptions}
			>
				{ZONES.map((z) => (
					<React.Fragment key={z.id}>
						<Polygon
							path={z.path}
							options={{
								strokeColor: "#111",
								strokeOpacity: 1,
								strokeWeight: 2,
								fillColor: z.color,
								fillOpacity: 0.2,
								clickable: true,
								zIndex: 80, // sube/baja para que no tape tus markers
							}}
							onClick={() => {
								document.getElementById(`zone-label-${z.id}`).style.display =
									document.getElementById(`zone-label-${z.id}`).style.display ===
									"none"
										? "block"
										: "none";
							}}
							onMouseOver={(e) => (e.domEvent.target.style.cursor = "pointer")}
							onMouseOut={(e) => (e.domEvent.target.style.cursor = "")}
						/>

						{/* Etiqueta “ZONE X” al centro */}
						<OverlayView
							position={polygonCenter(z.path)}
							mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
						>
							<div
								id={`zone-label-${z.id}`}
								style={{
									transform: "translate(-50%, -50%)",
									padding: "6px 12px",
									fontWeight: 800,
									fontSize: 14,
									background: z.color,
									color: "#000",
									border: "2px solid #000",
									textTransform: "uppercase",
									boxShadow: "0 6px 18px rgba(0,0,0,.35)",
									whiteSpace: "nowrap",
									userSelect: "none",
									width: "max-content",
								}}
							>
								{z.name}
							</div>
						</OverlayView>
					</React.Fragment>
				))}
				{teamMarkers}
				{isAdmin &&
					adminPositionViewEnabled &&
					(adminLocation?.position || adminLocationRef.current?.position) && (
						<Marker
							position={
								adminLocation?.position || adminLocationRef.current?.position
							}
							zIndex={400}
							onLoad={(marker) => {
								adminMarkerRef.current = marker;
								const direction =
									typeof adminDirectionRef.current === "number"
										? adminDirectionRef.current
										: typeof (
												adminLocation?.direction ??
												adminLocationRef.current?.direction
										  ) === "number"
										? adminLocation?.direction ??
										  adminLocationRef.current?.direction
										: 0;
								const googlePosition = marker.getPosition?.();
								const initialPosition = googlePosition
									? { lat: googlePosition.lat(), lng: googlePosition.lng() }
									: adminLocation?.position ||
									  adminLocationRef.current?.position;
								if (initialPosition) {
									updateAdminMarkerPosition(initialPosition, direction);
								}
							}}
						/>
					)}
				{renderActivities()}
				{/* Marcador de punto de encuentro hardcodeado */}
				{/*<Marker
					position={{ lat: 37.38597, lng: -5.99227 }}
					icon={{
						url: pointMark,
						scaledSize: new window.google.maps.Size(20, 20),
						anchor: new window.google.maps.Point(10, 20),
					}}
					zIndex={150}
					title={t('meeting_point.title', 'Punto de encuentro')}
					onClick={handleMeetingPointMarkerClick}
				>
					{meetingPointBubbleOpen && (
						<InfoWindow
							onCloseClick={handleMeetingPointBubbleClose}
							options={{
								pixelOffset: new window.google.maps.Size(0, -20)
							}}
						>
							<div style={{
								padding: '8px',
								minWidth: '150px',
								textAlign: 'center',
								paddingTop: '14px'
							}}>
								<h3 style={{
									margin: '0 0 4px 0',
									fontSize: '16px',
									fontWeight: 'bold',
									color: '#333'
								}}>
									{t('meeting_point.title', 'Punto de encuentro')}
								</h3>
							</div>
						</InfoWindow>
					)}
				</Marker> */}
			</GoogleMap>

			{permissionOverlayVisible && (
				<div
					style={{
						position: "absolute",
						inset: 0,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						padding: "2rem",
						zIndex: 20,
					}}
				>
					<div
						style={{
							maxWidth: "420px",
							width: "100%",
							background: "rgba(20,20,20,0.9)",
							borderRadius: "18px",
							padding: "1.75rem",
							color: "#fff",
							boxShadow: "0 16px 40px rgba(0,0,0,0.45)",
							textAlign: "center",
						}}
					>
						<h3 style={{ fontSize: "1.4rem", marginBottom: "1rem" }}>
							{t(
								"permissions.map_title",
								"Necesitamos permisos para continuar"
							)}
						</h3>
						<p
							style={{
								fontSize: "0.95rem",
								lineHeight: 1.6,
								marginBottom: "1.1rem",
							}}
						>
							{t(
								"permissions.map_description",
								"Para mostrar tu posición y orientación, Escultura necesita acceso a la geolocalización y a los sensores de movimiento del dispositivo."
							)}
						</p>
						<ul
							style={{
								listStyle: "none",
								padding: 0,
								margin: "0 0 1.2rem 0",
								textAlign: "left",
								fontSize: "0.9rem",
								lineHeight: 1.5,
							}}
						>
							<li>
								📍 {t("permissions.geolocation", "Geolocalización")}:{" "}
								<strong>
									{formatPermissionStatus(permissionInfo.geolocation.status)}
								</strong>
							</li>
							{permissionInfo.motion.supported && (
								<li>
									🧭 {t("permissions.motion", "Sensores de movimiento")}:{" "}
									<strong>
										{formatPermissionStatus(permissionInfo.motion.status)}
									</strong>
								</li>
							)}
						</ul>
						{permissionError && (
							<div
								style={{
									color: "#ff9b9b",
									fontSize: "0.85rem",
									marginBottom: "1rem",
								}}
							>
								{permissionError}
							</div>
						)}
						<div
							style={{
								display: "flex",
								flexDirection: "column",
								gap: "0.75rem",
							}}
						>
							<button
								onClick={handleRequestPermissions}
								disabled={permissionRequesting}
								style={{
									padding: "0.8rem 1rem",
									borderRadius: "999px",
									border: "none",
									background: "#3b82f6",
									color: "#fff",
									fontSize: "1rem",
									fontWeight: 600,
									cursor: permissionRequesting ? "wait" : "pointer",
									transition: "transform 0.2s ease",
								}}
							>
								{permissionRequesting
									? t("permissions.requesting", "Solicitando permisos...")
									: t("permissions.grant_button", "Conceder permisos")}
							</button>
							<button
								onClick={handleSkipPermissions}
								style={{
									padding: "0.55rem 1rem",
									borderRadius: "999px",
									border: "1px solid rgba(255,255,255,0.45)",
									background: "transparent",
									color: "#fff",
									fontSize: "0.95rem",
									cursor: "pointer",
								}}
							>
								{t("permissions.skip", "Continuar sin activar ahora")}
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Botón de seguimiento */}
			<button
				type="button"
				onClick={handleCenterButtonClick}
				onPointerDown={handleCenterButtonPointerDown}
				onPointerUp={handleCenterButtonPointerUp}
				onPointerLeave={handleCenterButtonPointerLeave}
				onPointerCancel={handleCenterButtonPointerLeave}
				className={`follow-button ${isFollowMode ? "active" : ""}`}
				title={isFollowMode ? "Desactivar seguimiento" : "Activar seguimiento"}
			>
				<svg width="30" height="30" viewBox="0 0 422.932 422.932">
					<path d="M301.793,297.745c-12.594-6.73-27.314-11.873-43.309-15.277v-34.559c2.06,1.344,4.516,2.132,7.156,2.132 c7.236,0,13.098-5.868,13.098-13.1v-10.622c0.89-1.908,1.383-4.036,1.383-6.279v-96.897c0-7.137-5.038-13.285-12.031-14.684 l-26.83-5.368c-1.357-1.551-3.025-2.799-4.883-3.676c2.111-2.36,3.9-4.744,5.264-6.717c3.279-4.761,6.012-9.887,7.904-14.833 c0.935-2.086,1.723-4.182,2.371-6.238c2.541-2.133,4.039-5.321,4.039-8.664v-8.19c0-2.354-0.734-4.649-2.094-6.557V36.684 C253.86,16.455,237.403,0,217.175,0h-11.892C185.058,0,168.6,16.455,168.6,36.684v11.533c-1.355,1.907-2.097,4.204-2.097,6.556v8.19 c0,3.343,1.496,6.525,4.042,8.663c0.647,2.052,1.438,4.152,2.372,6.242c1.891,4.943,4.623,10.07,7.908,14.827 c1.363,1.98,3.153,4.366,5.273,6.733c-1.852,0.878-3.508,2.125-4.862,3.668l-26.428,5.354c-6.979,1.414-11.997,7.548-11.997,14.675 v96.915c0,2.243,0.495,4.372,1.378,6.279v10.622c0,7.231,5.863,13.1,13.1,13.1c2.638,0,5.097-0.788,7.149-2.132v34.561 c-15.991,3.404-30.709,8.547-43.299,15.275c-25.584,13.672-39.674,32.335-39.674,52.547c0,20.212,14.09,38.875,39.674,52.549 c24.24,12.955,56.317,20.091,90.326,20.091c34.01,0,66.086-7.136,90.327-20.091c25.584-13.674,39.673-32.337,39.673-52.549 C341.466,330.08,327.377,311.417,301.793,297.745z M216.981,120.51c-0.068-0.66,0.145-1.318,0.59-1.815 c0.244-0.273,0.549-0.478,0.889-0.614v-5.86c0-1.138,0.818-2.115,1.939-2.316c1.859-0.329,3.779-1.011,5.704-2.029 c0.733-0.382,1.608-0.36,2.312,0.063c0.71,0.428,1.139,1.19,1.139,2.018v14.049c0,0.51-0.164,1.007-0.473,1.413l-6.596,8.758 c-0.453,0.598-1.152,0.94-1.877,0.94c-0.211,0-0.426-0.031-0.637-0.087c-0.93-0.259-1.607-1.063-1.705-2.025L216.981,120.51z M182.552,65.912l-0.131-0.974l-2.28-1.482c-0.669-0.435-1.071-1.173-1.071-1.973v-3.867c0-1.3,1.054-2.353,2.352-2.353h0.957 v-4.194c0-0.893,0.506-1.705,1.303-2.104c3.238-1.612,9.662-4.328,16.314-4.328c5.304,0,9.704,1.768,13.077,5.249 c4.197,4.344,9.044,6.544,14.387,6.544c3.035,0,6.159-0.715,9.305-2.125c0.727-0.326,1.568-0.263,2.24,0.171 c0.314,0.203,0.564,0.472,0.752,0.787h1.281c1.299,0,2.355,1.053,2.355,2.353v3.868c0,0.799-0.406,1.537-1.072,1.972l-2.279,1.482 l-0.131,0.974c-0.744,5.618-3.9,12.9-8.439,19.482c-5.749,8.34-11.133,12.073-13.928,12.073h-12.631 c-2.791,0-8.181-3.734-13.931-12.073C186.447,78.813,183.291,71.532,182.552,65.912z M204.888,118.695 c0.446,0.496,0.662,1.154,0.593,1.815l-1.289,12.502c-0.1,0.958-0.775,1.762-1.708,2.02c-0.209,0.061-0.419,0.087-0.63,0.087 c-0.728,0-1.429-0.336-1.875-0.934l-6.61-8.767c-0.307-0.407-0.474-0.905-0.474-1.417l0.007-14.047 c0.002-0.825,0.434-1.588,1.141-2.018c0.704-0.425,1.582-0.446,2.313-0.063c1.921,1.02,3.844,1.702,5.708,2.031 c1.119,0.201,1.937,1.179,1.937,2.316v5.86C204.338,118.218,204.642,118.422,204.888,118.695z M211.466,392.714 c-55.367,0-102.143-23.412-102.143-51.124c0-19.29,22.667-36.494,55.115-45.171v51.816c0,12.988,10.53,23.515,23.518,23.515 c12.981,0,23.509-10.526,23.509-23.515c0,12.988,10.523,23.515,23.515,23.515c12.982,0,23.504-10.526,23.504-23.515v-51.819 c32.454,8.677,55.125,25.882,55.125,45.174C313.608,369.302,266.833,392.714,211.466,392.714z" />
				</svg>
			</button>
		</div>
	);
};


export default React.memo(EventMap);




















