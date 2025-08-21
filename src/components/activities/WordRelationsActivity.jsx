// src/components/activities/WordRelationsActivity.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import "../../styles/WordRelationsActivity.css";

const WordRelationsActivity = ({ activity, onComplete, timeLeft, timeExpired }) => {
	const { t } = useTranslation();
	const [wordsData, setWordsData] = useState(null);
	const [leftWords, setLeftWords] = useState([]);
	const [rightWords, setRightWords] = useState([]);
	const [connections, setConnections] = useState([]);
	const [selectedWord, setSelectedWord] = useState(null);
	const [isActivityCompleted, setIsActivityCompleted] = useState(false);
	const [showSuccess, setShowSuccess] = useState(false);
	const svgRef = useRef(null);
	const leftColumnRef = useRef(null);
	const rightColumnRef = useRef(null);
	// Ref para evitar completar varias veces
	const completedRef = useRef(false);
	// Ref para evitar programar múltiples timeouts de finalización
	const completionScheduledRef = useRef(false);
	// Refs para evitar dependencias que reinicien efectos
	const onCompleteRef = useRef(onComplete);
	const timeLeftRef = useRef(timeLeft);
	const activityTimeRef = useRef(activity.time);

	useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);
	useEffect(() => { timeLeftRef.current = timeLeft; }, [timeLeft]);
	useEffect(() => { activityTimeRef.current = activity.time; }, [activity.time]);

	// Parsear datos de las palabras relacionadas
	useEffect(() => {
		try {
			const typeData = JSON.parse(activity.type_data || '{}');
			const words = typeData.words || [];
			
			setWordsData({
				words: words,
				description: activity.description || ""
			});

			// Separar y mezclar las palabras
			const leftWordsArray = words.map((pair, index) => ({
				id: `left-${index}`,
				text: pair.word1,
				pairId: index,
				isConnected: false
			}));

			const rightWordsArray = words.map((pair, index) => ({
				id: `right-${index}`,
				text: pair.word2,
				pairId: index,
				isConnected: false
			}));

			// Mezclar las palabras para que no estén en el mismo orden
			const shuffledLeft = [...leftWordsArray].sort(() => Math.random() - 0.5);
			const shuffledRight = [...rightWordsArray].sort(() => Math.random() - 0.5);

			setLeftWords(shuffledLeft);
			setRightWords(shuffledRight);

			// Resetear estado de finalización al cargar/rehidratar actividad
			setConnections([]);
			setSelectedWord(null);
			setIsActivityCompleted(false);
			setShowSuccess(false);
			completedRef.current = false;
			completionScheduledRef.current = false;

			console.log('Palabras para relacionar:', {
				original: words,
				left: shuffledLeft,
				right: shuffledRight
			});

		} catch (error) {
			console.error("Error parsing word relations type_data:", error);
			// Datos por defecto si hay error
			setWordsData({
				words: [],
				description: activity.description || ""
			});
		}
	}, [activity.type_data, activity.description]);

	// Manejar expiración del tiempo
	useEffect(() => {
		if (timeExpired && !isActivityCompleted && !completedRef.current) {
			console.log('Tiempo expirado para relaciones de palabras, marcando como fallido');
			setIsActivityCompleted(true);
			completedRef.current = true;
			
			onCompleteRef.current(false, {
				data: {
					type: "word_relations",
					completed: false,
					reason: "time_expired",
					timeUsed: activityTimeRef.current === 0 ? 0 : activityTimeRef.current,
					correctConnections: connections.length,
					totalConnections: wordsData?.words?.length || 0
				}
			});
		}
	}, [timeExpired, isActivityCompleted, connections.length, wordsData?.words?.length]);

	// Verificar si todas las conexiones están hechas (ejecutar solo una vez y no depender de timeLeft/onComplete)
	useEffect(() => {
		if (!wordsData) return;
		if (isActivityCompleted || completedRef.current || completionScheduledRef.current) return;
		if (connections.length === wordsData.words.length && connections.length > 0) {
			console.log('¡Todas las conexiones realizadas!');
			setShowSuccess(true);

			// Snapshot inmutable del tiempo usado en el momento de completar
			const timeUsedSnapshot = activityTimeRef.current === 0 ? 0 : activityTimeRef.current - (timeLeftRef.current || 0);
			completionScheduledRef.current = true;

			const timer = setTimeout(() => {
				setIsActivityCompleted(true);
				completedRef.current = true;
				onCompleteRef.current(true, {
					data: {
						type: "word_relations",
						completed: true,
						timeUsed: timeUsedSnapshot,
						correctConnections: connections.length,
						totalConnections: wordsData.words.length
					}
				});
			}, 2000);

			return () => clearTimeout(timer);
		}
	}, [connections.length, wordsData, isActivityCompleted]);

	// Función para obtener la posición de una palabra
	const getWordPosition = useCallback((wordId) => {
		const element = document.querySelector(`[data-word-id="${wordId}"]`);
		if (!element) return null;

		const rect = element.getBoundingClientRect();
		const svgRect = svgRef.current?.getBoundingClientRect();
		
		if (!svgRect) return null;

		return {
			x: rect.left + rect.width / 2 - svgRect.left,
			y: rect.top + rect.height / 2 - svgRect.top
		};
	}, []);

	// Manejar clic en palabra
	const handleWordClick = useCallback((word) => {
		if (word.isConnected || showSuccess) return;

		if (!selectedWord) {
			// Primera palabra seleccionada
			setSelectedWord(word);
		} else {
			// Segunda palabra seleccionada
			if (selectedWord.id === word.id) {
				// Deseleccionar si es la misma palabra
				setSelectedWord(null);
				return;
			}

			// Verificar si es una conexión válida (una de cada columna)
			const isLeftToRight = selectedWord.id.startsWith('left-') && word.id.startsWith('right-');
			const isRightToLeft = selectedWord.id.startsWith('right-') && word.id.startsWith('left-');

			if (!isLeftToRight && !isRightToLeft) {
				// Cambiar selección si ambas son de la misma columna
				setSelectedWord(word);
				return;
			}

			// Verificar si es la pareja correcta
			const leftWord = isLeftToRight ? selectedWord : word;
			const rightWord = isLeftToRight ? word : selectedWord;

			if (leftWord.pairId === rightWord.pairId) {
				// Conexión correcta
				const newConnection = {
					id: `connection-${leftWord.pairId}`,
					leftWordId: leftWord.id,
					rightWordId: rightWord.id,
					leftText: leftWord.text,
					rightText: rightWord.text
				};

				setConnections(prev => [...prev, newConnection]);

				// Marcar palabras como conectadas
				setLeftWords(prev => prev.map(w => 
					w.id === leftWord.id ? { ...w, isConnected: true } : w
				));
				setRightWords(prev => prev.map(w => 
					w.id === rightWord.id ? { ...w, isConnected: true } : w
				));

				console.log('Conexión correcta:', newConnection);
			} else {
				// Conexión incorrecta - mostrar feedback visual
				console.log('Conexión incorrecta');
				// Aquí podrías agregar un efecto visual de error
			}

			setSelectedWord(null);
		}
	}, [selectedWord, showSuccess]);

	// Renderizar líneas de conexión
	const renderConnections = () => {
		return connections.map(connection => {
			const leftPos = getWordPosition(connection.leftWordId);
			const rightPos = getWordPosition(connection.rightWordId);

			if (!leftPos || !rightPos) return null;

			return (
				<line
					key={connection.id}
					x1={leftPos.x}
					y1={leftPos.y}
					x2={rightPos.x}
					y2={rightPos.y}
					stroke="#4CAF50"
					strokeWidth="3"
					strokeLinecap="round"
				/>
			);
		});
	};

	// Renderizar línea temporal mientras se selecciona
	const renderTemporaryLine = () => {
		if (!selectedWord) return null;

		const selectedPos = getWordPosition(selectedWord.id);
		if (!selectedPos) return null;

		return (
			<circle
				cx={selectedPos.x}
				cy={selectedPos.y}
				r="8"
				fill="none"
				stroke="#2196F3"
				strokeWidth="2"
				className="pulse-circle"
			/>
		);
	};

	if (!wordsData) {
		return (
			<div className="word-relations-activity loading">
				<p>{t("loading", "Cargando...")}</p>
			</div>
		);
	}

	if (wordsData.words.length === 0) {
		return (
			<div className="word-relations-activity error">
				<p>{t("word_relations.no_words", "No hay palabras para relacionar")}</p>
			</div>
		);
	}

	return (
		<div className="word-relations-activity">
			<div className="word-relations-header">
				<h2 className="activity-title">{activity.name}</h2>
				{wordsData.description && (
					<div className="word-relations-description" dangerouslySetInnerHTML={{ __html: wordsData.description }} />
				)}
				<div className="word-relations-info">
					<span className="word-relations-progress">
						{t("word_relations.progress", "Progreso")}: {connections.length}/{wordsData.words.length}
					</span>
					{timeLeft !== null && timeLeft !== Infinity && (
						<span className="word-relations-time">
							{t("time_left", "Tiempo restante")}: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
						</span>
					)}
				</div>
				<p className="word-relations-instructions">
					{t("word_relations.instructions", "Toca una palabra de cada columna para conectar las palabras relacionadas")}
				</p>
			</div>

			<div className="word-relations-content">
				{showSuccess && (
					<div className="success-overlay">
						<div className="success-message">
							<div className="success-icon">🎉</div>
							<h3>{t("word_relations.completed", "¡Todas las palabras relacionadas!")}</h3>
							<p>{t("word_relations.success_message", "¡Felicidades! Has conectado todas las palabras correctamente.")}</p>
						</div>
					</div>
				)}

				<div className="words-container">
					<div className="words-column left-column" ref={leftColumnRef}>
						<h3>{t("word_relations.left_column", "Columna A")}</h3>
						{leftWords.map(word => (
							<div
								key={word.id}
								data-word-id={word.id}
								className={`word-item ${word.isConnected ? 'connected' : ''} ${selectedWord?.id === word.id ? 'selected' : ''}`}
								onClick={() => handleWordClick(word)}
							>
								{word.text}
							</div>
						))}
					</div>

					<div className="words-column right-column" ref={rightColumnRef}>
						<h3>{t("word_relations.right_column", "Columna B")}</h3>
						{rightWords.map(word => (
							<div
								key={word.id}
								data-word-id={word.id}
								className={`word-item ${word.isConnected ? 'connected' : ''} ${selectedWord?.id === word.id ? 'selected' : ''}`}
								onClick={() => handleWordClick(word)}
							>
								{word.text}
							</div>
						))}
					</div>
				</div>

				<svg 
					ref={svgRef}
					className="connections-svg"
					style={{
						position: 'absolute',
						top: 0,
						left: 0,
						width: '100%',
						height: '100%',
						pointerEvents: 'none',
						zIndex: 1
					}}
				>
					{renderConnections()}
					{renderTemporaryLine()}
				</svg>
			</div>
		</div>
	);
};

export default WordRelationsActivity;
