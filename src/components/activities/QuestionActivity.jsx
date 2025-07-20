// src/components/activities/QuestionActivity.jsx
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import "../../styles/QuestionActivity.css";

const QuestionActivity = ({ activity, onComplete, timeExpired }) => {
	const { t } = useTranslation();
	const [typeData, setTypeData] = useState(null);
	const [currentQuestionIndex] = useState(0); // Para futuras expansiones múltiples preguntas
	const [selectedAnswer, setSelectedAnswer] = useState(null);
	const [openAnswers, setOpenAnswers] = useState({});
	const [shuffledAnswers, setShuffledAnswers] = useState([]);
	const [isCompleted, setIsCompleted] = useState(false);

	// Parsear type_data al cargar
	useEffect(() => {
		try {
			const parsed = JSON.parse(activity.type_data);
			setTypeData(parsed);
		} catch (error) {
			console.error("Error parsing question type_data:", error);
		}
	}, [activity.type_data]);

	// Mezclar respuestas para preguntas test
	useEffect(() => {
		if (typeData && typeData.type_question === "1" && typeData.questions && typeData.questions[currentQuestionIndex]) {
			const question = typeData.questions[currentQuestionIndex];
			const answers = [
				{ text: question.reposne_ok, isCorrect: true },
				{ text: question.reposne_ko1, isCorrect: false },
				{ text: question.reposne_ko2, isCorrect: false },
				{ text: question.reposne_ko3, isCorrect: false }
			].filter(answer => answer.text); // Filtrar respuestas vacías

			// Mezclar array usando Fisher-Yates
			const shuffled = [...answers];
			for (let i = shuffled.length - 1; i > 0; i--) {
				const j = Math.floor(Math.random() * (i + 1));
				[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
			}
			setShuffledAnswers(shuffled);
		}
	}, [typeData, currentQuestionIndex]);

	// Manejar expiración del tiempo
	useEffect(() => {
		if (timeExpired && !isCompleted) {
			setIsCompleted(true);
			onComplete(false, null);
		}
	}, [timeExpired, isCompleted, onComplete]);

	const handleAnswerSelect = (answerIndex) => {
		setSelectedAnswer(answerIndex);
	};

	const handleOpenAnswerChange = (questionIndex, value) => {
		setOpenAnswers(prev => ({
			...prev,
			[questionIndex]: value
		}));
	};

	const handleSubmit = (isTimeout = false) => {
		if (isCompleted) return;
		
		setIsCompleted(true);
		
		if (isTimeout) {
			// Tiempo agotado
			onComplete(false, null);
			return;
		}

		if (typeData.type_question === "1") {
			// Preguntas tipo TEST - valoración automática
			const isCorrect = selectedAnswer !== null && shuffledAnswers[selectedAnswer]?.isCorrect;
			onComplete(isCorrect, {
				type: "test",
				questionIndex: currentQuestionIndex,
				selectedAnswer: selectedAnswer,
				isCorrect
			});
		} else if (typeData.type_question === "2") {
			// Preguntas abiertas - requiere valoración manual
			onComplete("pending_review", {
				type: "open",
				answers: openAnswers
			});
		}
	};

	const canSubmit = () => {
		if (typeData?.type_question === "1") {
			return selectedAnswer !== null;
		} else if (typeData?.type_question === "2") {
			// Para preguntas abiertas, verificar que al menos una pregunta tenga respuesta
			return Object.values(openAnswers).some(answer => answer && answer.trim().length > 0);
		}
		return false;
	};

	if (!typeData) {
		return (
			<div className="question-activity loading">
				<p>{t("loading")}</p>
			</div>
		);
	}

	const renderTestQuestion = () => {
		if (!typeData.questions || typeData.questions.length === 0 || !typeData.questions[currentQuestionIndex]) {
			return (
				<div className="question-container">
					<p>{t("question_not_found")}</p>
				</div>
			);
		}
		
		const question = typeData.questions[currentQuestionIndex];
		
		return (
			<div className="question-container">
				<h3 className="question-title">{question.question}</h3>
				
				<div className="answers-container">
					{shuffledAnswers.map((answer, index) => (
						<button
							key={index}
							className={`answer-option ${selectedAnswer === index ? 'selected' : ''}`}
							onClick={() => handleAnswerSelect(index)}
							disabled={isCompleted}
						>
							<span className="answer-letter">{String.fromCharCode(65 + index)}</span>
							<span className="answer-text">{answer.text}</span>
						</button>
					))}
				</div>
			</div>
		);
	};

	const renderOpenQuestions = () => {
		if (!typeData.questions_open || typeData.questions_open.length === 0) {
			return (
				<div className="question-container">
					<p>{t("question_not_found")}</p>
				</div>
			);
		}
		
		return (
			<div className="question-container">
				{typeData.questions_open.map((questionData, index) => (
					<div key={index} className="open-question-item">
						<h3 className="question-title">{questionData.question}</h3>
						<textarea
							className="open-answer-input"
							placeholder={t("type_your_answer")}
							value={openAnswers[index] || ""}
							onChange={(e) => handleOpenAnswerChange(index, e.target.value)}
							disabled={isCompleted}
							rows={4}
						/>
					</div>
				))}
			</div>
		);
	};

	return (
		<div className="question-activity">
			<div className="question-header">
				<h2 className="activity-title">{activity.name}</h2>
				<div className="question-info">
					<span className="question-type">
						{typeData.type_question === "1" ? t("test_question") : t("open_question")}
					</span>
				</div>
			</div>

			<div className="question-content">
				{typeData.type_question === "1" ? renderTestQuestion() : renderOpenQuestions()}
			</div>

			<div className="question-actions">
				<button 
					onClick={() => handleSubmit(false)}
					className="btn btn-primary"
					disabled={!canSubmit() || isCompleted}
				>
					{isCompleted ? t("submitted") : t("submit_answer")}
				</button>
			</div>
		</div>
	);
};

export default QuestionActivity;
