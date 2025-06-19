// src/hooks/useActivityIcon.js
import { useState, useEffect } from "react";
import defaultActivityIcon from "../assets/icon_foto@2x.png";

const ACTIVITY_ICON_WIDTH = 23;
const ACTIVITY_ICON_HEIGHT = 33;

export const useActivityIcon = (iconUrl) => {
	const [processedIcon, setProcessedIcon] = useState(null);

	useEffect(() => {
		if (!iconUrl || iconUrl === "") {
			// Usar icono por defecto
			setProcessedIcon({
				url: defaultActivityIcon,
				scaledSize: new window.google.maps.Size(ACTIVITY_ICON_WIDTH, ACTIVITY_ICON_HEIGHT),
				anchor: new window.google.maps.Point(ACTIVITY_ICON_WIDTH / 2, ACTIVITY_ICON_HEIGHT),
			});
			return;
		}

		// Crear canvas para icono personalizado con borde
		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d');
		canvas.width = ACTIVITY_ICON_WIDTH;
		canvas.height = ACTIVITY_ICON_HEIGHT;

		const img = new Image();
		img.crossOrigin = 'anonymous';

		img.onload = () => {
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

			// Dibujar fondo blanco con borde redondeado
			ctx.fillStyle = '#ffffff';
			ctx.strokeStyle = '#000000';
			ctx.lineWidth = 1;

			ctx.beginPath();
			ctx.roundRect(x - 2, y - 2, drawWidth + 4, drawHeight + 4, 3);
			ctx.fill();
			ctx.stroke();

			// Dibujar imagen
			ctx.drawImage(img, x, y, drawWidth, drawHeight);

			setProcessedIcon({
				url: canvas.toDataURL(),
				scaledSize: new window.google.maps.Size(ACTIVITY_ICON_WIDTH, ACTIVITY_ICON_HEIGHT),
				anchor: new window.google.maps.Point(ACTIVITY_ICON_WIDTH / 2, ACTIVITY_ICON_HEIGHT),
			});
		};

		img.onerror = () => {
			// Si falla la carga, usar icono por defecto
			setProcessedIcon({
				url: defaultActivityIcon,
				scaledSize: new window.google.maps.Size(ACTIVITY_ICON_WIDTH, ACTIVITY_ICON_HEIGHT),
				anchor: new window.google.maps.Point(ACTIVITY_ICON_WIDTH / 2, ACTIVITY_ICON_HEIGHT),
			});
		};

		img.src = iconUrl;
	}, [iconUrl]);

	return processedIcon;
};
