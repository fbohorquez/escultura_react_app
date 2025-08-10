// src/hooks/useActivityIcon.js
import { useState, useEffect } from "react";
import defaultQuestionIcon from "../assets/icon_query@2x.png";
import defaultTrackIcon from "../assets/icon_track@2x.png";
import defaultPhotoIcon from "../assets/icon_foto@2x.png";
import defaultPuzzleIcon from "../assets/icon_puzzle@2x.png";
import defaultMemoryIcon from "../assets/icon_memory@2x.png";

const ACTIVITY_ICON_WIDTH = 23;
const ACTIVITY_ICON_HEIGHT = 33;

// Función para obtener el icono por defecto según el tipo de actividad
const getDefaultIconByType = (activityType) => {
	switch (activityType) {
		case 1: // Preguntas
			return defaultQuestionIcon;
		case 2: // Pista/Tracking
			return defaultTrackIcon;
		case 3: // Foto/Video
			return defaultPhotoIcon;
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
			// Usar icono por defecto según el tipo de actividad
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

		// Crear canvas para icono personalizado con borde
		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d');
		canvas.width = ACTIVITY_ICON_WIDTH;
		canvas.height = ACTIVITY_ICON_HEIGHT;

		const img = new Image();

		const applySuccess = () => {
			try {
				// Limpiar canvas
				ctx.clearRect(0, 0, canvas.width, canvas.height);

				// Calcular dimensiones manteniendo proporción
				const aspectRatio = img.width / img.height;
				let drawWidth = ACTIVITY_ICON_WIDTH - 4; // -4 para el borde y padding
				let drawHeight = ACTIVITY_ICON_HEIGHT - 4; // -4 para el borde y padding

				if (aspectRatio > drawWidth / drawHeight) {
					drawHeight = drawWidth / aspectRatio;
				} else {
					drawWidth = drawHeight * aspectRatio;
				}

				const x = (canvas.width - drawWidth) / 2;
				const y = (canvas.height - drawHeight) / 2;

				// Dibujar fondo blanco con borde redondeado (fallback si roundRect no está disponible)
				ctx.fillStyle = '#ffffff';
				ctx.strokeStyle = '#000000';
				ctx.lineWidth = 1;

				if (typeof ctx.roundRect === 'function') {
					ctx.beginPath();
					ctx.roundRect(x - 2, y - 2, drawWidth + 4, drawHeight + 4, 3);
					ctx.fill();
					ctx.stroke();
				} else {
					ctx.fillRect(x - 2, y - 2, drawWidth + 4, drawHeight + 4);
					ctx.strokeRect(x - 2, y - 2, drawWidth + 4, drawHeight + 4);
				}

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
