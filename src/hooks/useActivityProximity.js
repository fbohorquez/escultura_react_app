// src/hooks/useActivityProximity.js
import { useState, useRef, useCallback } from 'react';
import { useDebugMode } from './useDebugMode';

// Configuración desde variables de entorno
const PRECISION_REQUIRED = parseInt(import.meta.env.VITE_ACTIVITY_PRECISION_REQUIRED) || 20;
const TIME_REQUIRED = parseInt(import.meta.env.VITE_ACTIVITY_TIME_REQUIRED) || 5;
const RESET_DISTANCE_MULTIPLIER = parseFloat(import.meta.env.VITE_ACTIVITY_RESET_DISTANCE_MULTIPLIER) || 2;

/**
 * Hook para gestionar el estado de proximidad de actividades
 * Incluye lógica para activación automática por tiempo y precisión
 */
export const useActivityProximity = () => {
	const { isDebugMode } = useDebugMode();
	
	// Estado para trackear las actividades que han sido notificadas por proximidad
	const [notifiedActivities, setNotifiedActivities] = useState(new Set());
	
	// Estado para trackear las actividades que han sido activadas automáticamente
	const [autoActivatedActivities, setAutoActivatedActivities] = useState(new Set());
	
	// Referencias para trackear el tiempo dentro del radio de cada actividad
	const proximityTimers = useRef(new Map());
	
	// Referencias para trackear si se está dentro del radio de cada actividad
	const inProximity = useRef(new Map());

	/**
	 * Función para verificar si una actividad puede ser activada automáticamente
	 * @param {Object} activity - Los datos de la actividad
	 * @param {Object} position - Posición actual del equipo {lat, lng}
	 * @param {number} accuracy - Precisión actual del GPS en metros
	 * @returns {Object} - Estado de proximidad
	 */
	const checkActivityProximity = useCallback((activity, position, accuracy) => {
		console.log('🧪 Hook checkActivityProximity called for activity:', activity.name, 'at position:', position, 'accuracy:', accuracy, 'isDebugMode:', isDebugMode);
		
		const activityKey = `${activity.id}`;
		const distance = getDistance(position, { lat: activity.lat, lng: activity.lon });
		const isWithinRange = distance <= activity.distance;
		const isWithinResetRange = distance <= (activity.distance * RESET_DISTANCE_MULTIPLIER);
		const hasPrecision = accuracy <= PRECISION_REQUIRED;
		
		console.log('🧪 Distance calculations:', {
			activityName: activity.name,
			activityId: activity.id,
			activityLat: activity.lat,
			activityLng: activity.lon,
			activityDistance: activity.distance,
			calculatedDistance: distance.toFixed(1),
			isWithinRange,
			isWithinResetRange,
			accuracy,
			precisionRequired: PRECISION_REQUIRED,
			hasPrecision,
			isDebugMode
		});
		
		const currentTime = Date.now();
		const isNotified = notifiedActivities.has(activityKey);
		const isAutoActivated = autoActivatedActivities.has(activityKey);
		
		console.log('🔍 Activity proximity debug:', {
			activityId: activity.id,
			activityName: activity.name,
			distance: distance.toFixed(1),
			activityDistance: activity.distance,
			isWithinRange,
			accuracy,
			precisionRequired: PRECISION_REQUIRED,
			hasPrecision,
			timeRequired: TIME_REQUIRED,
			resetMultiplier: RESET_DISTANCE_MULTIPLIER,
			isAutoActivated
		});
		
		// Si no está dentro del rango de reset, limpiar todo el estado de esta actividad
		if (!isWithinResetRange) {
			proximityTimers.current.delete(activityKey);
			inProximity.current.delete(activityKey);
			if (isAutoActivated) {
				setAutoActivatedActivities(prev => {
					const newSet = new Set(prev);
					newSet.delete(activityKey);
					return newSet;
				});
			}
			if (isNotified) {
				setNotifiedActivities(prev => {
					const newSet = new Set(prev);
					newSet.delete(activityKey);
					return newSet;
				});
			}
			return {
				canAutoActivate: false,
				canClickActivate: false,
				timeInProximity: 0,
				distance,
				isWithinRange: false,
				hasPrecision: false
			};
		}
		
		// Si está dentro del rango pero no tiene precisión suficiente
		if (isWithinRange && !hasPrecision) {
			// Pausar el timer pero no resetear
			return {
				canAutoActivate: false,
				canClickActivate: isWithinRange,
				timeInProximity: proximityTimers.current.has(activityKey) 
					? (currentTime - proximityTimers.current.get(activityKey)) / 1000 
					: 0,
				distance,
				isWithinRange: true,
				hasPrecision: false
			};
		}
		
		// Si está dentro del rango y tiene precisión
		if (isWithinRange && hasPrecision) {
			// Iniciar timer si no existe
			if (!proximityTimers.current.has(activityKey)) {
				console.log('🧪 Starting proximity timer for activity:', activity.name);
				proximityTimers.current.set(activityKey, currentTime);
			}
			
			const timeInProximity = (currentTime - proximityTimers.current.get(activityKey)) / 1000;
			const requiredTime = isDebugMode ? 0.5 : TIME_REQUIRED; // En modo debug solo 0.5 segundos
			const canAutoActivate = timeInProximity >= requiredTime && !isAutoActivated;
			
			console.log('🧪 Time proximity check:', {
				timeInProximity: timeInProximity.toFixed(1),
				timeRequired: requiredTime,
				isDebugMode,
				isAutoActivated,
				canAutoActivate,
				activityName: activity.name
			});
			
			if (isDebugMode && canAutoActivate) {
				console.log('🎯 DEBUG MODE: Auto-activation available for activity:', activity.name);
			}
			
			return {
				canAutoActivate,
				canClickActivate: true,
				timeInProximity,
				distance,
				isWithinRange: true,
				hasPrecision: true
			};
		}
		
		// Si no está dentro del rango, limpiar timer pero mantener otros estados
		if (!isWithinRange) {
			proximityTimers.current.delete(activityKey);
			inProximity.current.delete(activityKey);
		}
		
		return {
			canAutoActivate: false,
			canClickActivate: false,
			timeInProximity: 0,
			distance,
			isWithinRange: false,
			hasPrecision
		};
	}, [notifiedActivities, autoActivatedActivities, isDebugMode]);

	/**
	 * Marca una actividad como notificada por proximidad
	 */
	const markAsNotified = useCallback((activityId) => {
		setNotifiedActivities(prev => new Set(prev).add(`${activityId}`));
	}, []);

	/**
	 * Marca una actividad como activada automáticamente
	 */
	const markAsAutoActivated = useCallback((activityId) => {
		setAutoActivatedActivities(prev => new Set(prev).add(`${activityId}`));
	}, []);

	/**
	 * Verifica si una actividad ha sido activada automáticamente
	 */
	const isAutoActivated = useCallback((activityId) => {
		return autoActivatedActivities.has(`${activityId}`);
	}, [autoActivatedActivities]);

	/**
	 * Verifica si una actividad ha sido notificada
	 */
	const isNotified = useCallback((activityId) => {
		return notifiedActivities.has(`${activityId}`);
	}, [notifiedActivities]);

	/**
	 * Limpia todo el estado de proximidad (útil al cambiar de equipo)
	 */
	const clearProximityState = useCallback(() => {
		setNotifiedActivities(new Set());
		setAutoActivatedActivities(new Set());
		proximityTimers.current.clear();
		inProximity.current.clear();
	}, []);

	return {
		checkActivityProximity,
		markAsNotified,
		markAsAutoActivated,
		isAutoActivated,
		isNotified,
		clearProximityState,
		// Exponer las constantes para uso externo
		PRECISION_REQUIRED,
		TIME_REQUIRED,
		RESET_DISTANCE_MULTIPLIER
	};
};

// Función auxiliar para calcular distancia (duplicada aquí para independencia del hook)
const getDistance = (p1, p2) => {
	const R = 6371000; // Radio de la Tierra en metros
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
