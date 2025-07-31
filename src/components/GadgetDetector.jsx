// src/components/GadgetDetector.jsx
import { useEffect, useRef, useCallback, useState } from "react";
import { useSelector } from "react-redux";
import { completeGadget, GADGETS } from "../services/firebase";
import { useNotification } from "../hooks/useNotification";

/**
 * Componente que detecta cuando se recibe un gadget y ejecuta la acción correspondiente
 */
const GadgetDetector = () => {
  const event = useSelector((state) => state.event.event);
	const eventId  = event?.id;
	const { showNotification } = useNotification();
	
	const selectedTeam = useSelector((state) => state.session.selectedTeam);
	const isAdmin = useSelector((state) => state.session.isAdmin);
	
	// Usar directamente selectedTeam ya que se mantiene actualizado por subscriptionManager
	const currentTeam = selectedTeam;
	
	// Referencia para el valor anterior del gadget
	const previousGadgetRef = useRef(null);
	
	// Estado para la cola de gadgets
	const [gadgetQueue, setGadgetQueue] = useState([]);
	const [isProcessingQueue, setIsProcessingQueue] = useState(false);
	
	const executeRotateScreen = useCallback(() => {
		return new Promise((resolve) => {
			console.log("Screen rotation gadget started");
			
			// Rotar la pantalla aplicando una transformación CSS
			const body = document.body;
			
			// Aplicar rotación
			body.style.transform = "rotate(180deg)";
			body.style.transition = "transform 1s ease-in-out";
			
			// Volver a la normalidad después de 15 segundos
			setTimeout(() => {
				body.style.transform = "rotate(0deg)";
				
				// Limpiar estilos después de la transición
				setTimeout(() => {
					body.style.transform = "";
					body.style.transition = "";
					console.log("Screen rotation gadget completed");
					resolve(); // Resolver la promesa cuando termine completamente
				}, 1000);
			}, 15000);
		});
	}, []);
	
	const executeSusto = useCallback(() => {
		return new Promise((resolve) => {
			console.log("Scare gadget started");
			
			// Crear efecto de susto con vibración y sonido
			
			// Vibración si está disponible
			if (navigator.vibrate) {
				navigator.vibrate([200, 100, 200, 100, 200]);
			}
			
			// Crear overlay de susto
			const scareOverlay = document.createElement('div');
			scareOverlay.style.cssText = `
				position: fixed;
				top: 0;
				left: 0;
				right: 0;
				bottom: 0;
				background: linear-gradient(45deg, #ff0000, #000000, #ff0000, #000000);
				background-size: 4px 4px;
				z-index: 9999;
				display: flex;
				align-items: center;
				justify-content: center;
				animation: scareFlash 0.2s infinite;
			`;
			
			// Agregar texto de susto
			const scareText = document.createElement('div');
			scareText.innerHTML = '😱<br/>¡SUSTO!';
			scareText.style.cssText = `
				color: white;
				font-size: 3rem;
				font-weight: bold;
				text-align: center;
				text-shadow: 2px 2px 4px black;
				animation: scareShake 0.1s infinite;
			`;
			
			scareOverlay.appendChild(scareText);
			
			// Agregar estilos de animación
			const style = document.createElement('style');
			style.textContent = `
				@keyframes scareFlash {
					0%, 50% { opacity: 1; }
					25%, 75% { opacity: 0.8; }
				}
				@keyframes scareShake {
					0% { transform: translate(0px, 0px) rotate(0deg); }
					25% { transform: translate(2px, -2px) rotate(1deg); }
					50% { transform: translate(-1px, 2px) rotate(-1deg); }
					75% { transform: translate(-2px, -1px) rotate(1deg); }
					100% { transform: translate(1px, 1px) rotate(0deg); }
				}
			`;
			document.head.appendChild(style);
			document.body.appendChild(scareOverlay);
			
			// Remover después de 3 segundos y resolver la promesa
			setTimeout(() => {
				document.body.removeChild(scareOverlay);
				document.head.removeChild(style);
				console.log("Scare gadget completed");
				resolve(); // Resolver la promesa cuando termine completamente
			}, 3000);
		});
	}, []);
	
	// Función para ejecutar un gadget individual
	const executeSingleGadget = useCallback(async (gadgetId) => {
		console.log(`🎯 Executing gadget: ${gadgetId}`);
		
		const gadgetInfo = GADGETS[gadgetId];
		if (!gadgetInfo) {
			console.error(`Unknown gadget: ${gadgetId}`);
			return;
		}
		
		// Mostrar notificación del gadget recibido
		showNotification({
			type: "warning",
			title: "¡Gadget Recibido!",
			message: `${gadgetInfo.name}: ${gadgetInfo.description}`,
			duration: 5000
		});
		
		// Ejecutar la acción específica del gadget y esperar a que termine
		try {
			switch (gadgetId) {
				case "rotate_screen":
					await executeRotateScreen();
					break;
				case "susto":
					await executeSusto();
					break;
				default:
					console.log(`No implementation for gadget: ${gadgetId}`);
					// Para gadgets sin implementación, esperar un poco
					await new Promise(resolve => setTimeout(resolve, 1000));
			}
			
			console.log(`✅ Gadget ${gadgetId} execution completed`);
			
			
			
		} catch (error) {
			console.error(`❌ Error executing gadget ${gadgetId}:`, error);
		}
	}, [showNotification, executeRotateScreen, executeSusto, eventId, currentTeam?.id]);

	// Función para procesar la cola de gadgets
	const processGadgetQueue = useCallback(async () => {
		if (isProcessingQueue || gadgetQueue.length === 0) {
			return;
		}

		setIsProcessingQueue(true);
		console.log('🎯 Processing gadget queue:', gadgetQueue);

		try {
			for (let i = 0; i < gadgetQueue.length; i++) {
				const gadgetId = gadgetQueue[i];
				console.log(`🎯 Executing gadget ${i + 1}/${gadgetQueue.length}: ${gadgetId}`);
				
				await executeSingleGadget(gadgetId);

				const sleepTime = parseInt(import.meta.env.VITE_GADGET_SLEEP || '3') * 1000;
				console.log(`⏰ Waiting ${sleepTime}ms before next gadget...`);
				await new Promise(resolve => setTimeout(resolve, sleepTime));
			}
		} catch (error) {
			console.error('Error processing gadget queue:', error);
		} finally {
			// Limpiar la cola y el estado de procesamiento
			// setGadgetQueue([]);
			// remove first gadget from queue
			setGadgetQueue(prev => prev.slice(1));
			setIsProcessingQueue(false);
			console.log('✅ Gadget queue processing completed');
		}
	}, [gadgetQueue, isProcessingQueue, executeSingleGadget]);

	// Función para añadir un gadget a la cola
	const addGadgetToQueue = useCallback((gadgetId) => {
		console.log(`🎯 Adding gadget to queue: ${gadgetId}`);
		setGadgetQueue(prev => [...prev, gadgetId]);
	}, []);

	// Effect para procesar la cola cuando se añaden gadgets
	useEffect(() => {
		if (gadgetQueue.length > 0 && !isProcessingQueue) {
			console.log('🎯 Starting gadget queue processing...');
			processGadgetQueue();
		}
	}, [gadgetQueue, isProcessingQueue, processGadgetQueue]);
	
	useEffect(() => {
		// Solo procesar gadgets para equipos (no admin)
		if (isAdmin || !currentTeam || !eventId) {
			console.log('🔧 GadgetDetector: Skipping - conditions not met', {
				isAdmin,
				hasCurrentTeam: !!currentTeam,
				hasEventId: !!eventId
			});
			return;
		}

		// Marcar como completado en Firebase
			completeGadget(eventId, currentTeam.id);
			// console.log(`✅ Gadget ${currentGadget} marked as completed in Firebase`);
		
		const currentGadget = currentTeam.gadget;
		const previousGadget = previousGadgetRef.current;
		
		console.log('🔧 GadgetDetector: Checking gadget change', {
			currentGadget,
			previousGadget,
			teamId: currentTeam.id,
			teamName: currentTeam.name,
			selectedTeamFromRedux: currentTeam
		});
		
		// Si es la primera vez o no hay cambio, no hacer nada
		if (previousGadget === null) {
			previousGadgetRef.current = currentGadget;
			console.log('🔧 GadgetDetector: First time, setting initial gadget:', currentGadget);
			return;
		}
		
		// Si el gadget cambió y no es "0", añadir a la cola
		if (currentGadget !== previousGadget && currentGadget !== "0" && currentGadget !== "") {
			// Verificar si se debe prevenir la ejecución durante actividades
			const preventActivity = import.meta.env.VITE_GADGET_PREVENT_ACTIVITY === 'true';
			
			if (preventActivity && currentTeam.isActivityActive) {
				console.log('🔧 GadgetDetector: Gadget execution prevented - team is doing activity');
				
				// Mostrar notificación sobre el bloqueo
				showNotification({
					type: "info",
					title: "Gadget Diferido",
					message: "El gadget se ejecutará cuando termines la actividad actual",
					duration: 4000
				});
				
				// No actualizar la referencia para que se ejecute cuando termine la actividad
				return;
			}
			
			console.log('🎯 GadgetDetector: Gadget changed! Adding to queue:', currentGadget);
			addGadgetToQueue(currentGadget);
		} else {
			console.log('🔧 GadgetDetector: No gadget to execute', {
				changed: currentGadget !== previousGadget,
				notZero: currentGadget !== "0",
				notEmpty: currentGadget !== ""
			});
		}
		
		// Actualizar la referencia
		previousGadgetRef.current = currentGadget;
		
	}, [currentTeam, isAdmin, eventId, addGadgetToQueue, showNotification]);
	
	// Este componente no renderiza nada
	return null;
};

export default GadgetDetector;

