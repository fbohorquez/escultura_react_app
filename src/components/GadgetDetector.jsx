// src/components/GadgetDetector.jsx
import { useEffect, useRef, useCallback, useState } from "react";
import { useSelector } from "react-redux";
import { completeGadget, GADGETS } from "../services/firebase";
import { useNotification } from "../hooks/useNotification";
import glassBackground from "../assets/glass-background.png";
import corazonGif from "../assets/corazon.gif";
import besoKissGif from "../assets/beso-kiss.gif";

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
	
	const executeBrokenGlass = useCallback(() => {
		return new Promise((resolve) => {
			console.log("Broken glass gadget started");
			
			// Crear overlay de cristal roto que bloquea la interfaz
			const glassOverlay = document.createElement('div');
			glassOverlay.style.cssText = `
				position: fixed;
				top: 0;
				left: 0;
				right: 0;
				bottom: 0;
				background-image: url('${glassBackground}');
				background-size: cover;
				background-position: center;
				background-repeat: no-repeat;
				z-index: 9999;
				display: flex;
				align-items: center;
				justify-content: center;
				cursor: not-allowed;
			`;
			
			// Agregar estilos de animación
			const style = document.createElement('style');
			style.textContent = `
				@keyframes glassShake {
					0% { transform: translate(0px, 0px) rotate(0deg); }
					25% { transform: translate(1px, -1px) rotate(0.5deg); }
					50% { transform: translate(-1px, 1px) rotate(-0.5deg); }
					75% { transform: translate(-1px, -1px) rotate(0.5deg); }
					100% { transform: translate(1px, 1px) rotate(0deg); }
				}
			`;
			document.head.appendChild(style);
			document.body.appendChild(glassOverlay);
			
			// Remover después de 10 segundos y resolver la promesa
			setTimeout(() => {
				document.body.removeChild(glassOverlay);
				document.head.removeChild(style);
				console.log("Broken glass gadget completed");
				resolve(); // Resolver la promesa cuando termine completamente
			}, 10000);
		});
	}, []);
	
	const executeHearts = useCallback(() => {
		return new Promise((resolve) => {
			console.log("Hearts gadget started");
			
			// Crear overlay para los corazones que permita pasar clicks
			const heartsOverlay = document.createElement('div');
			heartsOverlay.style.cssText = `
				position: fixed;
				top: 0;
				left: 0;
				right: 0;
				bottom: 0;
				z-index: 9998;
				pointer-events: none;
				overflow: hidden;
			`;
			
			// Generar número aleatorio de corazones (entre 10 y 18)
			const numberOfHearts = Math.floor(Math.random() * 9) + 10;
			const hearts = [];
			
			// Crear los corazones con diferentes tamaños y posiciones
			for (let i = 0; i < numberOfHearts; i++) {
				const heart = document.createElement('img');
				heart.src = corazonGif;
				
				// Tamaño aleatorio entre 30px y 80px
				const size = Math.random() * 50 + 30;
				// Posición inicial aleatoria
				const initialX = Math.random() * 100;
				const initialY = Math.random() * 100;
				// Rotación inicial aleatoria
				const initialRotation = Math.random() * 360;
				// Duración de animación aleatoria entre 2 y 6 segundos
				const animationDuration = Math.random() * 4 + 2;
				// Delay inicial aleatorio para que no aparezcan todos a la vez
				const delay = Math.random() * 1000;
				
				heart.style.cssText = `
					position: absolute;
					width: ${size}px;
					height: auto;
					left: ${initialX}%;
					top: ${initialY}%;
					transform: rotate(${initialRotation}deg) scale(0);
					opacity: 0;
					animation: heartAppear 0.5s ease-out ${delay}ms forwards, 
					           heartFloat ${animationDuration}s ease-in-out infinite ${delay + 500}ms;
					z-index: 9999;
				`;
				
				hearts.push(heart);
				heartsOverlay.appendChild(heart);
			}
			
			// Agregar estilos de animación más sofisticados
			const style = document.createElement('style');
			style.textContent = `
				@keyframes heartAppear {
					0% { 
						transform: rotate(var(--initial-rotation, 0deg)) scale(0);
						opacity: 0;
					}
					100% { 
						transform: rotate(var(--initial-rotation, 0deg)) scale(1);
						opacity: 0.9;
					}
				}
				
				@keyframes heartFloat {
					0% { 
						transform: translateY(0px) translateX(0px) rotate(var(--initial-rotation, 0deg)) scale(1);
						opacity: 0.9;
					}
					25% { 
						transform: translateY(-15px) translateX(10px) rotate(calc(var(--initial-rotation, 0deg) + 20deg)) scale(1.1);
						opacity: 1;
					}
					50% { 
						transform: translateY(-8px) translateX(-5px) rotate(calc(var(--initial-rotation, 0deg) - 10deg)) scale(0.95);
						opacity: 0.8;
					}
					75% { 
						transform: translateY(-20px) translateX(8px) rotate(calc(var(--initial-rotation, 0deg) + 15deg)) scale(1.05);
						opacity: 0.9;
					}
					100% { 
						transform: translateY(0px) translateX(0px) rotate(var(--initial-rotation, 0deg)) scale(1);
						opacity: 0.9;
					}
				}
				
				@keyframes heartDisappear {
					0% { 
						opacity: 0.9;
						transform: scale(1);
					}
					100% { 
						opacity: 0;
						transform: scale(0.5);
					}
				}
			`;
			document.head.appendChild(style);
			document.body.appendChild(heartsOverlay);
			
			// Después de 6 segundos, empezar a desvanecer los corazones
			setTimeout(() => {
				hearts.forEach((heart, index) => {
					setTimeout(() => {
						heart.style.animation += ', heartDisappear 1s ease-in forwards';
					}, index * 100); // Desvanecer en cascada
				});
			}, 6000);
			
			// Remover después de 8 segundos y resolver la promesa
			setTimeout(() => {
				if (document.body.contains(heartsOverlay)) {
					document.body.removeChild(heartsOverlay);
				}
				if (document.head.contains(style)) {
					document.head.removeChild(style);
				}
				console.log("Hearts gadget completed");
				resolve(); // Resolver la promesa cuando termine completamente
			}, 8000);
		});
	}, []);
	
	const executeKiss = useCallback(() => {
		return new Promise((resolve) => {
			console.log("Kiss gadget started");
			
			// Crear overlay para el beso que permita pasar clicks
			const kissOverlay = document.createElement('div');
			kissOverlay.style.cssText = `
				position: fixed;
				top: 0;
				left: 0;
				right: 0;
				bottom: 0;
				z-index: 9998;
				pointer-events: none;
				display: flex;
				align-items: center;
				justify-content: center;
				background: rgba(255, 192, 203, 0.1);
			`;
			
			// Crear el elemento del beso
			const kissElement = document.createElement('img');
			kissElement.src = besoKissGif;
			kissElement.style.cssText = `
				width: 200px;
				height: auto;
				opacity: 0;
				transform: scale(0.5);
				animation: kissAppear 0.8s ease-out forwards, kissFloat 2s ease-in-out infinite 0.8s;
				z-index: 9999;
			`;
			
			kissOverlay.appendChild(kissElement);
			
			// Agregar estilos de animación
			const style = document.createElement('style');
			style.textContent = `
				@keyframes kissAppear {
					0% { 
						opacity: 0;
						transform: scale(0.5) rotate(-10deg);
					}
					50% { 
						opacity: 1;
						transform: scale(1.2) rotate(5deg);
					}
					100% { 
						opacity: 1;
						transform: scale(1) rotate(0deg);
					}
				}
				
				@keyframes kissFloat {
					0% { 
						transform: scale(1) rotate(0deg) translateY(0px);
					}
					50% { 
						transform: scale(1.05) rotate(2deg) translateY(-10px);
					}
					100% { 
						transform: scale(1) rotate(0deg) translateY(0px);
					}
				}
				
				@keyframes kissDisappear {
					0% { 
						opacity: 1;
						transform: scale(1);
					}
					100% { 
						opacity: 0;
						transform: scale(0.8) rotate(-5deg);
					}
				}
			`;
			document.head.appendChild(style);
			document.body.appendChild(kissOverlay);
			
			// Después de 4 segundos, empezar a desvanecer
			setTimeout(() => {
				kissElement.style.animation += ', kissDisappear 1s ease-in forwards';
			}, 4000);
			
			// Remover después de 6 segundos y resolver la promesa
			setTimeout(() => {
				if (document.body.contains(kissOverlay)) {
					document.body.removeChild(kissOverlay);
				}
				if (document.head.contains(style)) {
					document.head.removeChild(style);
				}
				console.log("Kiss gadget completed");
				resolve(); // Resolver la promesa cuando termine completamente
			}, 6000);
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
				case "broken_glass":
					await executeBrokenGlass();
					break;
				case "hearts":
					await executeHearts();
					break;
				case "kiss":
					await executeKiss();
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
	}, [showNotification, executeRotateScreen, executeSusto, executeBrokenGlass, executeHearts, executeKiss]);

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

