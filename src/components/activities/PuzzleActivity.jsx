// src/components/activities/PuzzleActivity.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { JigsawPuzzle } from "react-jigsaw-puzzle";
import "react-jigsaw-puzzle/lib/jigsaw-puzzle.css";
import "../../styles/PuzzleActivity.css";

const PuzzleActivity = ({ activity, onComplete, timeLeft, timeExpired }) => {
	const { t } = useTranslation();
	const [isPuzzleCompleted, setIsPuzzleCompleted] = useState(false);
	const [isActivityCompleted, setIsActivityCompleted] = useState(false);
	const [puzzleData, setPuzzleData] = useState(null);
	const [imageLoaded, setImageLoaded] = useState(false);
	const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
	const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
	const [checkInterval, setCheckInterval] = useState(null);

	// Parsear datos del puzzle
	useEffect(() => {
		try {
			const typeData = JSON.parse(activity.type_data || '{}');
			setPuzzleData({
				image: typeData.img_puzzle || activity.file || "",
				pieces: parseInt(typeData.pieces_number) || 12,
				description: activity.description || ""
			});
		} catch (error) {
			console.error("Error parsing puzzle type_data:", error);
			// Datos por defecto si hay error
			setPuzzleData({
				image: activity.file || "",
				pieces: 12,
				description: activity.description || ""
			});
		}
	}, [activity.type_data, activity.file, activity.description]);

	// Calcular tamaño del contenedor
	useEffect(() => {
		const updateContainerSize = () => {
			const vh = window.innerHeight;
			const vw = window.innerWidth;
			
			// Reservar espacio para header (aprox 150px) y actions (aprox 100px) y padding
			const availableHeight = vh - 250;
			const availableWidth = vw - 40; // 20px padding en cada lado
			
			const newSize = {
				width: Math.max(Math.min(availableWidth, 600), 250), // entre 250px y 600px
				height: Math.max(Math.min(availableHeight, 500), 200) // entre 200px y 500px
			};
			
			console.log('Tamaño del contenedor actualizado:', {
				viewport: { width: vw, height: vh },
				available: { width: availableWidth, height: availableHeight },
				container: newSize
			});
			
			setContainerSize(newSize);
		};

		updateContainerSize();
		window.addEventListener('resize', updateContainerSize);
		
		return () => window.removeEventListener('resize', updateContainerSize);
	}, []);

	// Cargar imagen para obtener sus dimensiones
	useEffect(() => {
		if (puzzleData?.image) {
			const img = new Image();
			img.crossOrigin = 'anonymous'; // Para evitar problemas de CORS
			
			img.onload = () => {
				console.log('Imagen cargada:', {
					src: puzzleData.image,
					naturalWidth: img.naturalWidth,
					naturalHeight: img.naturalHeight
				});
        let width = img.naturalWidth;
        let height = img.naturalHeight;
        let heightContainer = window.innerHeight - 350; // Reservar espacio para header y actions
        if (height > heightContainer) {
          const aspectRatio = width / height;
          height = heightContainer;
          width = height * aspectRatio;
        }
        let widthContainer = window.innerWidth - 40; // Reservar espacio para padding
        if (width > widthContainer) {
          const aspectRatio = height / width;
          width = widthContainer;
          height = width * aspectRatio;
        }

				setImageDimensions({
					width: width,
					height: height
				});
				setImageLoaded(true);
			};
			
			img.onerror = (error) => {
				console.error('Error cargando imagen:', error, puzzleData.image);
				// Establecer dimensiones por defecto si falla la carga
				setImageDimensions({
					width: 400,
					height: 400
				});
				setImageLoaded(true); // Permitir que continúe con dimensiones por defecto
			};
			
			img.src = puzzleData.image;
		} else {
			// Si no hay imagen, usar dimensiones por defecto
			setImageDimensions({
				width: 400,
				height: 400
			});
			setImageLoaded(true);
		}
	}, [puzzleData?.image]);

	// Manejar expiración del tiempo
	useEffect(() => {
		if (timeExpired && !isActivityCompleted) {
			console.log('Tiempo expirado para puzzle, marcando como fallido');
			setIsActivityCompleted(true);
			
			// Puzzle terminado por tiempo - fallo pero debe registrarse como completado
			onComplete(false, {
				data: {
					type: "puzzle",
					completed: false,
					reason: "time_expired",
					timeUsed: activity.time === 0 ? 0 : activity.time
				}
			});
		}
	}, [timeExpired, isActivityCompleted, onComplete, activity.time]);

	// Función para verificar si el puzzle está completado
	const checkPuzzleCompletion = useCallback(() => {
		const puzzleContainer = document.querySelector('.jigsaw-puzzle');
		if (!puzzleContainer) {
			console.log('Contenedor del puzzle no encontrado');
			return false;
		}

		// Verificar diferentes indicadores de que el puzzle está completado
		const pieces = puzzleContainer.querySelectorAll('.puzzle-piece, [class*="piece"]');
		const totalPieces = puzzleData?.pieces || 12;
		
		console.log(`Verificando puzzle: ${pieces.length} piezas encontradas de ${totalPieces} esperadas`);

		// Método 1: Verificar si todas las piezas están en su posición correcta
		let correctlyPlacedPieces = 0;
		pieces.forEach((piece) => {
			if (piece.classList.contains('jigsaw-puzzle__piece--solved')) {
				correctlyPlacedPieces++;
			}
		});

		// El puzzle está completado si:
		// - Todas las piezas están correctamente colocadas
		const isCompleted = (correctlyPlacedPieces === totalPieces && totalPieces > 0);

		return isCompleted;
	}, [puzzleData?.pieces]);

	const handlePuzzleComplete = useCallback(() => {
		console.log('handlePuzzleComplete llamado, estado actual:', {
			isPuzzleCompleted,
			isActivityCompleted,
			timeLeft,
			timeExpired
		});
		
		if (isActivityCompleted) {
			console.log('Actividad ya completada, saliendo');
			return;
		}
		
		setIsPuzzleCompleted(true);
		console.log('¡Puzzle completado! Esperando 3 segundos antes de continuar...');
		
		// Esperar 3 segundos antes de marcar la actividad como completada
		setTimeout(() => {
			console.log('Timeout completado, marcando actividad como exitosa');
			setIsActivityCompleted(true);
			
			// Puzzle completado exitosamente
			onComplete(true, {
				data: {
					type: "puzzle",
					completed: true,
					timeUsed: activity.time === 0 ? 0 : activity.time - (timeLeft || 0)
				}
			});
		}, 3000); // 3 segundos
	}, [isPuzzleCompleted, isActivityCompleted, timeLeft, timeExpired, onComplete, activity.time]);	// Efecto para verificar periódicamente si el puzzle está completado
	useEffect(() => {
		if (!puzzleData || isPuzzleCompleted || isActivityCompleted) {
			return;
		}

		console.log('Iniciando verificación periódica del puzzle');
		
		// const interval = setInterval(() => {
			if (checkPuzzleCompletion()) {
				console.log('¡Puzzle detectado como completado por verificación manual!');
				// clearInterval(interval);
				handlePuzzleComplete();
			}
		// }, 1000); // Verificar cada segundo

		// setCheckInterval(interval);

		// Cleanup
		return () => {
			// if (interval) {
			// 	clearInterval(interval);
			// }
		};
	}, [puzzleData, isPuzzleCompleted, isActivityCompleted, checkPuzzleCompletion, handlePuzzleComplete]);

	// Limpiar interval cuando el puzzle se complete
	useEffect(() => {
		if (isPuzzleCompleted && checkInterval) {
			clearInterval(checkInterval);
			setCheckInterval(null);
		}
	}, [isPuzzleCompleted, checkInterval]);

	// Calcular dimensiones del puzzle basado en la imagen y el contenedor
	const getPuzzleDimensions = () => {
		const defaultSize = { width: 300, height: 300 };
		
		if (!imageDimensions.width || !imageDimensions.height) {
			console.log('Usando dimensiones por defecto - imagen no cargada');
			return defaultSize;
		}

		if (!containerSize.width || !containerSize.height) {
			console.log('Usando dimensiones por defecto - contenedor no calculado');
			return defaultSize;
		}

		const imageAspectRatio = imageDimensions.width / imageDimensions.height;
		
		// Usar un margen de seguridad del 90% del contenedor
		const maxWidth = containerSize.width * 0.9;
		const maxHeight = containerSize.height * 0.9;

		let puzzleWidth, puzzleHeight;

		// Calcular basado en el ancho máximo
		puzzleWidth = maxWidth;
		puzzleHeight = maxWidth / imageAspectRatio;

		// Si la altura calculada excede el máximo, recalcular basado en la altura
		if (puzzleHeight > maxHeight) {
			puzzleHeight = maxHeight;
			puzzleWidth = maxHeight * imageAspectRatio;
		}

		const result = {
			width: Math.floor(Math.max(puzzleWidth, 200)), // mínimo 200px
			height: Math.floor(Math.max(puzzleHeight, 200)) // mínimo 200px
		};

		console.log('Dimensiones calculadas:', {
			imageDimensions,
			containerSize,
			imageAspectRatio,
			result
		});

		return result;
	};

	const puzzleDimensions = getPuzzleDimensions();

	// Calcular filas y columnas basado en el número de piezas
	const getPuzzleGridDimensions = (pieces) => {
		// Para evitar problemas con la librería, usemos configuraciones más estables
		const presetConfigs = {
			4: { rows: 2, columns: 2 },
			6: { rows: 2, columns: 3 },
			8: { rows: 2, columns: 4 },
			9: { rows: 3, columns: 3 },
			12: { rows: 3, columns: 4 },
			16: { rows: 4, columns: 4 },
			20: { rows: 4, columns: 5 },
			24: { rows: 4, columns: 6 },
			25: { rows: 5, columns: 5 },
			30: { rows: 5, columns: 6 },
			36: { rows: 6, columns: 6 }
		};

		if (presetConfigs[pieces]) {
			console.log(`Usando configuración preset para ${pieces} piezas:`, presetConfigs[pieces]);
			return presetConfigs[pieces];
		}

		// Calcular la raíz cuadrada y ajustar para obtener una distribución rectangular
		const sqrt = Math.sqrt(pieces);
		let rows = Math.floor(sqrt);
		let columns = Math.ceil(pieces / rows);
		
		// Ajustar para que rows * columns = pieces exactamente
		while (rows * columns !== pieces) {
			if (rows * columns < pieces) {
				if (columns <= rows) {
					columns++;
				} else {
					rows++;
				}
			} else {
				if (rows > columns) {
					rows--;
				} else {
					columns--;
				}
			}
		}
		
		console.log(`Puzzle de ${pieces} piezas calculado: ${rows} filas x ${columns} columnas = ${rows * columns} piezas`);
		
		return { rows, columns };
	};

	const { rows, columns } = getPuzzleGridDimensions(puzzleData?.pieces || 12);

	useEffect(() => {
		if (!imageLoaded) {
			return;
		}

		const puzzleElement = document.querySelector('.jigsaw-puzzle');
		if (!puzzleElement) {
			return;
		}

		puzzleElement.classList.add('touch-optimized');

		const preventDefaultScroll = (event) => {
			if (event.cancelable) {
				event.preventDefault();
			}
		};

		const listenerOptions = { passive: false };
		puzzleElement.addEventListener('touchstart', preventDefaultScroll, listenerOptions);
		puzzleElement.addEventListener('touchmove', preventDefaultScroll, listenerOptions);

		return () => {
			puzzleElement.classList.remove('touch-optimized');
			puzzleElement.removeEventListener('touchstart', preventDefaultScroll, listenerOptions);
			puzzleElement.removeEventListener('touchmove', preventDefaultScroll, listenerOptions);
		};
	}, [imageLoaded, rows, columns]);

	// Log cuando cambian las dimensiones del puzzle
	useEffect(() => {
		if (puzzleData) {
			console.log('Configuración del puzzle:', {
				pieces: puzzleData.pieces,
				rows,
				columns,
				total: rows * columns,
				image: puzzleData.image
			});
		}
	}, [puzzleData, rows, columns]);

	if (!puzzleData) {
		return (
			<div className="puzzle-activity loading">
				<p>{t("loading", "Cargando...")}</p>
			</div>
		);
	}

	return (
		<div className="puzzle-activity">
			<div className="puzzle-header">
				<h2 className="activity-title">{activity.name}</h2>
				{puzzleData.description && (
					<div className="puzzle-description" dangerouslySetInnerHTML={{ __html: puzzleData.description }} />
				)}
				<div className="puzzle-info">
					<span className="puzzle-pieces">
						{t("puzzle.pieces", "Piezas")}: {puzzleData.pieces || 12}
					</span>
					{timeLeft !== null && (
						<span className="puzzle-time">
							{t("time_left", "Tiempo restante")}: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
						</span>
					)}
				</div>
			</div>

			<div className="puzzle-content">
				{!isPuzzleCompleted ? (
					<div className="puzzle-container" style={{
						width: imageDimensions.width,
						height: imageDimensions.height,
						maxWidth: '100%',
						maxHeight: '100%'
					}}>
						{imageLoaded ? (
							<>
								<JigsawPuzzle
									imageSrc={puzzleData.image}
									rows={rows}
									columns={columns}
									onDone={() => {
										handlePuzzleComplete();
									}}
									className="jigsaw-puzzle"
									style={{
										width: puzzleDimensions.width,
										height: puzzleDimensions.height
									}}
								/>
							</>
						) : (
							<div className="puzzle-loading">
								<p>{t("loading", "Cargando puzzle...")}</p>
								<p style={{ fontSize: '12px', opacity: 0.7 }}>
									Imagen: {puzzleData.image}
								</p>
							</div>
						)}
					</div>
				) : (
					<div className="puzzle-completed">
						<div className="success-icon">🎉</div>
						<h3>{t("puzzle.completed", "¡Puzzle Completado!")}</h3>
						<p>{t("puzzle.success_message", "¡Felicidades! Has completado el puzzle exitosamente.")}</p>
						{!isActivityCompleted && (
							<p className="waiting-message" style={{ 
								fontSize: '14px', 
								opacity: 0.8, 
								marginTop: '10px',
								animation: 'pulse 1.5s infinite'
							}}>
								{t("puzzle.processing", "Procesando resultado...")}
							</p>
						)}
						<img 
							src={puzzleData.image} 
							alt={t("puzzle.completed_image", "Imagen completada")}
							className="completed-image"
						/>
					</div>
				)}
			</div>
		</div>
	);
};

export default PuzzleActivity;
