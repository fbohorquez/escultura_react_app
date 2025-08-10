import { useEffect, useCallback, useRef } from 'react';

/**
 * Hook para forzar orientación portrait según configuración
 * Utiliza las variables de entorno:
 * - VITE_FORCE_PORTRAIT_ORIENTATION: true/false para activar/desactivar
 * - VITE_FORCE_PORTRAIT_DEVICE_TYPES: mobile|tablet|todos|mobile,tablet
 */
const useForceOrientation = () => {
	const screenLockRef = useRef(null);
	const orientationLockAttempted = useRef(false);

	// Leer configuración desde variables de entorno
	const forcePortrait =
		import.meta.env.VITE_FORCE_PORTRAIT_ORIENTATION === "true";
	const deviceTypes =
		import.meta.env.VITE_FORCE_PORTRAIT_DEVICE_TYPES || "mobile";
	/**
	 * Aplica estilos CSS como hint visual para orientación
	 */
	const applyCSSOrientationHint = useCallback(() => {
		const style = document.createElement("style");
		style.id = "force-portrait-orientation";
		style.textContent = `
			@media (orientation: landscape) and (max-width: 1024px) {
				body::before {
					content: "Por favor, gira tu dispositivo a modo vertical para una mejor experiencia";
					position: fixed;
					top: 0;
					left: 0;
					width: 100%;
					height: 100%;
					background: rgba(0, 0, 0, 0.9);
					color: white;
					display: flex;
					align-items: center;
					justify-content: center;
					text-align: center;
					font-size: 18px;
					padding: 20px;
					box-sizing: border-box;
					z-index: 10000;
					font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
				}
			}
		`;

		// Remover estilo existente si existe
		const existingStyle = document.getElementById("force-portrait-orientation");
		if (existingStyle) {
			existingStyle.remove();
		}

		document.head.appendChild(style);
		console.log("📱 Applied CSS orientation hint for landscape warning");
	}, []);
	/**
	 * Detecta el tipo de dispositivo basado en user agent y dimensiones
	 */
	const detectDeviceType = useCallback(() => {
		const userAgent = navigator.userAgent;
		const isMobile =
			/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
				userAgent
			);

		// Detectar tablet vs móvil basado en dimensiones de pantalla
		const screenWidth = Math.max(screen.width, screen.height);
		const screenHeight = Math.min(screen.width, screen.height);
		const aspectRatio = screenWidth / screenHeight;

		// Heurística: tablets tienden a tener pantallas más grandes y diferentes ratios
		const isTablet =
			isMobile &&
			(screenWidth >= 768 || // iPad y tablets Android típicos
				(screenWidth >= 600 && aspectRatio < 1.6)); // Tablets en portrait con ratio menos alargado

		if (isTablet) {
			return "tablet";
		} else if (isMobile) {
			return "mobile";
		} else {
			return "desktop";
		}
	}, []);

	/**
	 * Verifica si el dispositivo actual debe verse afectado por la orientación forzada
	 */
	const shouldForceOrientation = useCallback(() => {
		if (!forcePortrait) {
			return false;
		}

		const currentDeviceType = detectDeviceType();
		const targetDevices = deviceTypes
			.toLowerCase()
			.split(",")
			.map((type) => type.trim());

		// Si se especifica "todos", aplicar a cualquier dispositivo
		if (targetDevices.includes("todos") || targetDevices.includes("all")) {
			return true;
		}

		// Verificar si el tipo de dispositivo actual está en la lista
		return targetDevices.includes(currentDeviceType);
	}, [forcePortrait, deviceTypes, detectDeviceType]);

	/**
	 * Intenta forzar la orientación portrait usando Screen Orientation API
	 */
	const lockToPortrait = useCallback(async () => {
		if (!shouldForceOrientation() || orientationLockAttempted.current) {
			return;
		}

		orientationLockAttempted.current = true;

		try {
			// Verificar soporte de Screen Orientation API
			if (screen.orientation && typeof screen.orientation.lock === "function") {
				console.log("🔒 Attempting to lock screen orientation to portrait");

				await screen.orientation.lock("portrait");
				screenLockRef.current = "portrait";
				console.log("✅ Screen orientation locked to portrait successfully");
			} else {
				console.log("⚠️ Screen Orientation API not supported on this device");

				// Fallback: CSS para forzar orientación (solo visual)
				applyCSSOrientationHint();
			}
		} catch (error) {
			console.warn("❌ Failed to lock screen orientation:", error.message);

			// En caso de error, aplicar hint CSS como fallback
			applyCSSOrientationHint();
		}
	}, [shouldForceOrientation, applyCSSOrientationHint]);

	/**
	 * Libera el bloqueo de orientación
	 */
	const unlockOrientation = useCallback(async () => {
		if (!screenLockRef.current) return;

		try {
			if (
				screen.orientation &&
				typeof screen.orientation.unlock === "function"
			) {
				await screen.orientation.unlock();
				screenLockRef.current = null;
				orientationLockAttempted.current = false;
				console.log("🔓 Screen orientation unlocked");
			}
		} catch (error) {
			console.warn("⚠️ Failed to unlock screen orientation:", error.message);
		}

		// Remover CSS hint si existe
		const existingStyle = document.getElementById("force-portrait-orientation");
		if (existingStyle) {
			existingStyle.remove();
		}
	}, []);

	/**
	 * Maneja cambios en la orientación de la pantalla
	 */
	const handleOrientationChange = useCallback(() => {
		if (!shouldForceOrientation()) return;

		// Si está en landscape, intentar volver a portrait
		if (
			screen.orientation &&
			screen.orientation.angle !== 0 &&
			screen.orientation.angle !== 180
		) {
			console.log(
				"📱 Orientation changed to landscape, attempting to return to portrait"
			);
			setTimeout(() => {
				lockToPortrait();
			}, 100); // Pequeño delay para permitir que la orientación se estabilice
		}
	}, [shouldForceOrientation, lockToPortrait]);

	// Efecto principal para configurar la orientación forzada
	useEffect(() => {
		if (!shouldForceOrientation()) {
			console.log("🔄 Force orientation disabled or device type not targeted");
			return;
		}

		console.log(
			"🔒 Force portrait orientation enabled for device type:",
			detectDeviceType()
		);
		console.log("📋 Configuration:", {
			forcePortrait,
			deviceTypes,
			currentDevice: detectDeviceType(),
			shouldForce: shouldForceOrientation(),
		});

		// Intentar bloquear orientación al cargar
		lockToPortrait();

		// Escuchar cambios de orientación
		if (screen.orientation) {
			screen.orientation.addEventListener("change", handleOrientationChange);
		} else {
			// Fallback para dispositivos más antiguos
			window.addEventListener("orientationchange", handleOrientationChange);
		}

		// Cleanup
		return () => {
			if (screen.orientation) {
				screen.orientation.removeEventListener(
					"change",
					handleOrientationChange
				);
			} else {
				window.removeEventListener(
					"orientationchange",
					handleOrientationChange
				);
			}
		};
	}, [
		shouldForceOrientation,
		lockToPortrait,
		handleOrientationChange,
		detectDeviceType,
		forcePortrait,
		deviceTypes,
	]);

	// Cleanup al desmontar el componente
	useEffect(() => {
		return () => {
			unlockOrientation();
		};
	}, [unlockOrientation]);

	return {
		isOrientationForced: shouldForceOrientation(),
		deviceType: detectDeviceType(),
		forcePortrait,
		deviceTypes,
		lockToPortrait,
		unlockOrientation,
	};
};

export default useForceOrientation;

