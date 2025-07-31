// src/components/GadgetDetector.jsx
import { useEffect, useRef, useCallback } from "react";
import { useSelector } from "react-redux";
import { completeGadget, GADGETS } from "../services/firebase";
import { useNotification } from "../hooks/useNotification";
import { useParams } from "react-router-dom";

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
	
	const executeRotateScreen = useCallback(() => {
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
			}, 1000);
		}, 15000);
		
		console.log("Screen rotation gadget executed");
	}, []);
	
	const executeSusto = useCallback(() => {
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
		
		// Remover después de 3 segundos
		setTimeout(() => {
			document.body.removeChild(scareOverlay);
			document.head.removeChild(style);
		}, 3000);
		
		console.log("Scare gadget executed");
	}, []);
	
	const executeGadget = useCallback(async (gadgetId) => {
		console.log(`Executing gadget: ${gadgetId}`);
		
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
		
		// Ejecutar la acción específica del gadget
		switch (gadgetId) {
			case "rotate_screen":
				executeRotateScreen();
				break;
			case "susto":
				executeSusto();
				break;
			default:
				console.log(`No implementation for gadget: ${gadgetId}`);
		}
		
		// Marcar como completado después de un delay
		setTimeout(async () => {
			try {
				await completeGadget(eventId, currentTeam.id);
				console.log(`Gadget ${gadgetId} completed`);
			} catch (error) {
				console.error("Error completing gadget:", error);
			}
		}, 3000); // 3 segundos de delay para que se vea el efecto
	}, [showNotification, executeRotateScreen, executeSusto, eventId, currentTeam?.id]);
	
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
		
		// Si el gadget cambió y no es "0", ejecutar el gadget
		if (currentGadget !== previousGadget && currentGadget !== "0" && currentGadget !== "") {
			console.log('🎯 GadgetDetector: Gadget changed! Executing:', currentGadget);
			executeGadget(currentGadget);
		} else {
			console.log('🔧 GadgetDetector: No gadget to execute', {
				changed: currentGadget !== previousGadget,
				notZero: currentGadget !== "0",
				notEmpty: currentGadget !== ""
			});
		}
		
		// Actualizar la referencia
		previousGadgetRef.current = currentGadget;
		
	}, [currentTeam, isAdmin, eventId, executeGadget]);
	
	// Este componente no renderiza nada
	return null;
};

export default GadgetDetector;
