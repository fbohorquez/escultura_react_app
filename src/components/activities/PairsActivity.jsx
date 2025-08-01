// src/components/activities/PairsActivity.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import "../../styles/PairsActivity.css";
import reversoCardImg from "../../assets/Reverso carta.png";

const PairsActivity = ({ activity, onComplete, timeLeft, timeExpired }) => {
	const { t } = useTranslation();
	const [pairsData, setPairsData] = useState(null);
	const [cards, setCards] = useState([]);
	const [flippedCards, setFlippedCards] = useState([]);
	const [matchedCards, setMatchedCards] = useState([]);
	const [isActivityCompleted, setIsActivityCompleted] = useState(false);
	const [isChecking, setIsChecking] = useState(false);

	// Parsear datos del juego de parejas
	useEffect(() => {
		try {
			const typeData = JSON.parse(activity.type_data || '{}');
			const images = typeData.img_pairs || [];
			
			setPairsData({
				images: images,
				description: activity.description || ""
			});

			// Crear cartas duplicadas y mezclarlas
			const gameCards = [];
			images.forEach((image, index) => {
				// Agregar dos cartas por cada imagen
				gameCards.push(
					{ id: `${index}-a`, image, pairId: index },
					{ id: `${index}-b`, image, pairId: index }
				);
			});

			// Mezclar las cartas usando Fisher-Yates shuffle
			for (let i = gameCards.length - 1; i > 0; i--) {
				const j = Math.floor(Math.random() * (i + 1));
				[gameCards[i], gameCards[j]] = [gameCards[j], gameCards[i]];
			}

			setCards(gameCards);
			console.log('Cartas generadas:', gameCards.length, 'Total de pares:', images.length);

		} catch (error) {
			console.error("Error parsing pairs type_data:", error);
			// Datos por defecto si hay error
			setPairsData({
				images: [],
				description: activity.description || ""
			});
			setCards([]);
		}
	}, [activity.type_data, activity.description]);

	// Manejar expiración del tiempo
	useEffect(() => {
		if (timeExpired && !isActivityCompleted) {
			console.log('Tiempo expirado para juego de parejas, marcando como fallido');
			setIsActivityCompleted(true);
			
			onComplete(false, {
				data: {
					type: "pairs",
					completed: false,
					reason: "time_expired",
					timeUsed: activity.time === 0 ? 0 : activity.time,
					matchedPairs: matchedCards.length / 2,
					totalPairs: pairsData?.images.length || 0
				}
			});
		}
	}, [timeExpired, isActivityCompleted, onComplete, activity.time, matchedCards.length, pairsData?.images.length]);

	// Manejar clic en carta
	const handleCardClick = useCallback((cardId) => {
		if (isChecking || isActivityCompleted) return;

		const card = cards.find(c => c.id === cardId);
		if (!card) return;

		// No permitir voltear cartas ya emparejadas o ya volteadas
		if (matchedCards.includes(cardId) || flippedCards.includes(cardId)) return;

		// No permitir más de 2 cartas volteadas
		if (flippedCards.length >= 2) return;

		const newFlippedCards = [...flippedCards, cardId];
		setFlippedCards(newFlippedCards);

		// Si se voltearon 2 cartas, verificar si hacen par
		if (newFlippedCards.length === 2) {
			setIsChecking(true);
			
			const [firstCardId, secondCardId] = newFlippedCards;
			const firstCard = cards.find(c => c.id === firstCardId);
			const secondCard = cards.find(c => c.id === secondCardId);

			console.log('Verificando par:', {
				firstCard: { id: firstCard.id, pairId: firstCard.pairId },
				secondCard: { id: secondCard.id, pairId: secondCard.pairId }
			});

			setTimeout(() => {
				if (firstCard.pairId === secondCard.pairId) {
					// ¡Par encontrado!
					console.log('¡Par encontrado!');
					const newMatchedCards = [...matchedCards, firstCardId, secondCardId];
					setMatchedCards(newMatchedCards);
					setFlippedCards([]);

					// Verificar si se completó el juego
					const totalCards = cards.length;
					if (newMatchedCards.length === totalCards) {
						console.log('¡Juego completado!');
						setTimeout(() => {
							setIsActivityCompleted(true);
							onComplete(true, {
								data: {
									type: "pairs",
									completed: true,
									timeUsed: activity.time === 0 ? 0 : activity.time - (timeLeft || 0),
									matchedPairs: newMatchedCards.length / 2,
									totalPairs: pairsData?.images.length || 0
								}
							});
						}, 800); // Esperar menos tiempo antes de completar
					}
				} else {
					// No es par, voltear las cartas de vuelta
					console.log('No es par, volteando cartas');
					setFlippedCards([]);
				}
				setIsChecking(false);
			}, 1000); // Reducido a 1 segundo
		}
	}, [cards, flippedCards, matchedCards, isChecking, isActivityCompleted, timeLeft, activity.time, onComplete, pairsData?.images.length]);

	// Determinar el número de columnas basado en el número de cartas
	const getGridColumns = (totalCards) => {
		if (totalCards <= 4) return 2;
		if (totalCards <= 6) return 3;
		if (totalCards <= 8) return 4;
		if (totalCards <= 12) return 4;
		if (totalCards <= 16) return 4;
		return 6;
	};

	const gridColumns = getGridColumns(cards.length);

	if (!pairsData) {
		return (
			<div className="pairs-activity loading">
				<p>{t("loading", "Cargando...")}</p>
			</div>
		);
	}

	if (cards.length === 0) {
		return (
			<div className="pairs-activity error">
				<p>{t("pairs.no_images", "No se encontraron imágenes para el juego de parejas")}</p>
			</div>
		);
	}

	return (
		<div className="pairs-activity">
			<div className="pairs-header">
				<h2 className="activity-title">{activity.name}</h2>
				{pairsData.description && (
					<p className="pairs-description">{pairsData.description}</p>
				)}
				<div className="pairs-info">
					<span className="pairs-count">
						{t("pairs.total", "Pares")}: {pairsData.images.length}
					</span>
					<span className="pairs-matched">
						{t("pairs.found", "Encontrados")}: {matchedCards.length / 2}
					</span>
					{timeLeft !== null && (
						<span className="pairs-time">
							{t("time_left", "Tiempo restante")}: {Math.floor(timeLeft)}seg
						</span>
					)}
				</div>
			</div>

			<div className="pairs-content">
				{!isActivityCompleted ? (
					<div 
						className="pairs-grid" 
						style={{ 
							gridTemplateColumns: `repeat(${gridColumns}, 1fr)`,
							gap: '10px'
						}}
					>
						{cards.map((card) => {
							const isFlipped = flippedCards.includes(card.id) || matchedCards.includes(card.id);
							const isMatched = matchedCards.includes(card.id);
							
							return (
								<div
									key={card.id}
									className={`pairs-card ${isFlipped ? 'flipped' : ''} ${isMatched ? 'matched' : ''}`}
									onClick={() => handleCardClick(card.id)}
								>
									<div className="card-inner">
										<div className="card-front">
											<img 
												src={reversoCardImg} 
												alt={t("pairs.card_back", "Reverso de carta")}
												className="card-back-image"
											/>
										</div>
										<div className="card-back">
											<img 
												src={card.image} 
												alt={t("pairs.card_image", "Imagen de carta")}
												className="card-front-image"
											/>
										</div>
									</div>
								</div>
							);
						})}
					</div>
				) : (
					<div className="pairs-completed">
						<div className="success-icon">🎉</div>
						<h3>{t("pairs.completed", "¡Juego Completado!")}</h3>
						<p>{t("pairs.success_message", "¡Felicidades! Has encontrado todas las parejas.")}</p>
						<div className="pairs-stats">
							<p>{t("pairs.final_score", "Pares encontrados")}: {matchedCards.length / 2} / {pairsData.images.length}</p>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default PairsActivity;
