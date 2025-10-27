// src/hooks/useActivityIcon.js
import { useState, useEffect } from "react";
import defaultQuestionIcon from "../assets/icon_query@2x.png";
import defaultTrackIcon from "../assets/icon_track@2x.png";
import defaultPhotoIcon from "../assets/icon_foto@2x.png";
import defaultVideoIcon from "../assets/icon_video@2x.png";
import defaultPuzzleIcon from "../assets/icon_puzzle@2x.png";
import defaultMemoryIcon from "../assets/icon_memory@2x.png";

const ACTIVITY_ICON_WIDTH = 28;
const ACTIVITY_ICON_HEIGHT = 28;

// Función para obtener el icono por defecto según el tipo de actividad
const getDefaultIconByType = (activityType) => {
	switch (activityType) {
		case 1: // Preguntas
			return defaultQuestionIcon;
		case 2: // Pista/Tracking
			return defaultTrackIcon;
		case 3: // Foto
			return defaultPhotoIcon;
		case 333: // Video
			return defaultVideoIcon;
		case 4: // Puzzle
			return defaultPuzzleIcon;
		case 5: // Parejas/Memory
			return defaultMemoryIcon;
		default:
			// Usar icono de foto como fallback
			return defaultPhotoIcon;
	}
};

const buildIconObject = (url) => {
	const g = window.google;
	if (!g || !g.maps) return url; // devolver string si Google Maps aún no está listo
	return {
		url,
		size: new g.maps.Size(ACTIVITY_ICON_WIDTH, ACTIVITY_ICON_HEIGHT),
		scaledSize: new g.maps.Size(ACTIVITY_ICON_WIDTH, ACTIVITY_ICON_HEIGHT),
		anchor: new g.maps.Point(ACTIVITY_ICON_WIDTH / 2, ACTIVITY_ICON_HEIGHT),
	};
};

// Devuelve una lista de URLs candidatas para un icono, probando a:
// - Resolver relativas
// - Actualizar http->https si la página es https
// - Reescribir a dominio de uploads (VITE_API_BASE_URL) si coincide con ruta /uploads/
const buildIconUrlCandidates = (rawUrl) => {
	const result = [];
	const dedup = new Set();
	const push = (u) => { if (!u) return; if (!dedup.has(u)) { dedup.add(u); result.push(u); } };

	let abs;
	try { abs = new URL(rawUrl, window.location.origin); } catch { abs = null; }

	const apiBase = (import.meta?.env?.VITE_API_BASE_URL || "").replace(/\/$/, "");
	let uploadsOrigin = null;
	try {
		if (apiBase) {
			const api = new URL(apiBase);
			// quitar "/api" del final si existe
			const origin = api.origin + (api.pathname.replace(/\/?api\/?$/, ""));
			uploadsOrigin = origin || api.origin;
		}
	} catch { /* noop */ }

	if (abs) {
		// Preferir https si la página es https
		if (window.location.protocol === 'https:' && abs.protocol === 'http:') {
			try {
				const upgraded = new URL(abs.href);
				upgraded.protocol = 'https:';
				push(upgraded.href);
			} catch { /* ignore */ }
		}
		push(abs.href);

		// Si es ruta de uploads, probar sobre el dominio de uploads del backend
		if (uploadsOrigin && abs.pathname.startsWith('/uploads/')) {
			push(uploadsOrigin.replace(/\/$/, "") + abs.pathname);
		}
	} else {
		push(rawUrl);
	}

	return result;
};

export const useActivityIcon = (iconUrl, activityType = 3) => {
	const [processedIcon, setProcessedIcon] = useState(null);

	useEffect(() => {
		if (!iconUrl || iconUrl === "") {
			// Usar icono por defecto según el tipo de actividad SIN procesar
			const defaultIcon = getDefaultIconByType(activityType);
			setProcessedIcon(buildIconObject(defaultIcon));
			return;
		}

		const candidates = buildIconUrlCandidates(iconUrl);
		let index = 0;

		// Mostrar de inmediato la primera URL candidata (mejor UX y evita fallos de canvas en móviles)
		if (candidates.length > 0) {
			setProcessedIcon(buildIconObject(candidates[0]));
		}

		// Crear canvas para icono personalizado con borde SOLO para iconos personalizados
		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d');
		canvas.width = ACTIVITY_ICON_WIDTH;
		canvas.height = ACTIVITY_ICON_HEIGHT;

		const img = new Image();

		const applySuccess = () => {
			try {
				// Limpiar canvas
				ctx.clearRect(0, 0, canvas.width, canvas.height);

				// Dibujar fondo blanco con borde redondeado primero (tamaño fijo)
				const bgPadding = 2;
				const bgWidth = ACTIVITY_ICON_WIDTH - (bgPadding * 2);
				const bgHeight = ACTIVITY_ICON_HEIGHT - (bgPadding * 2);
				const bgX = bgPadding;
				const bgY = bgPadding;

				ctx.fillStyle = '#ffffff';
				ctx.strokeStyle = '#000000';
				ctx.lineWidth = 1;

				if (typeof ctx.roundRect === 'function') {
					ctx.beginPath();
					ctx.roundRect(bgX, bgY, bgWidth, bgHeight, 3);
					ctx.fill();
					ctx.stroke();
				} else {
					ctx.fillRect(bgX, bgY, bgWidth, bgHeight);
					ctx.strokeRect(bgX, bgY, bgWidth, bgHeight);
				}

				// Calcular dimensiones de la imagen manteniendo proporción dentro del fondo
				const aspectRatio = img.width / img.height;
				const availableWidth = bgWidth - 4; // -4 para padding interno
				const availableHeight = bgHeight - 4; // -4 para padding interno
				const availableAspectRatio = availableWidth / availableHeight;

				let drawWidth, drawHeight;

				if (aspectRatio > availableAspectRatio) {
					// La imagen es más ancha proporcionalmente que el área disponible
					drawWidth = availableWidth;
					drawHeight = drawWidth / aspectRatio;
				} else {
					// La imagen es más alta proporcionalmente que el área disponible
					drawHeight = availableHeight;
					drawWidth = drawHeight * aspectRatio;
				}

				// Centrar la imagen dentro del fondo
				const x = bgX + (bgWidth - drawWidth) / 2;
				const y = bgY + (bgHeight - drawHeight) / 2;

				// Dibujar imagen
				ctx.drawImage(img, x, y, drawWidth, drawHeight);

				try {
					const dataUrl = canvas.toDataURL();
					setProcessedIcon(buildIconObject(dataUrl));
				} catch {
					// Canvas posiblemente tainted: conservar URL actual
					// No hacer nada: ya se mostró la URL original
				}
			} catch {
				// Cualquier error: conservar URL actual
			}
		};

		const tryNext = () => {
			if (index >= candidates.length) {
				// Nada más que probar, conservar URL mostrada o fallback por tipo si no había candidatos
				if (!processedIcon) {
					const defIcon = getDefaultIconByType(activityType);
					setProcessedIcon(buildIconObject(defIcon));
				}
				return;
			}
			img.src = candidates[index++];
		};

		img.onload = applySuccess;
		img.onerror = tryNext;

		tryNext();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [iconUrl, activityType]);

	return processedIcon;
};
