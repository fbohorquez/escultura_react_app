// src/pages/teamActivityReadOnlyPage.jsx
import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import BackgroundLayout from "../components/backgroundLayout";
import BackButton from "../components/backButton";

const TeamActivityReadOnlyPage = () => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { eventId, teamId, activityId } = useParams();

	const event = useSelector((state) => state.event.event);
	const teams = useSelector((state) => state.teams.items);
	const selectedTeam = useSelector((state) => state.session.selectedTeam);
	const isAdmin = useSelector((state) => state.session.isAdmin);

	const handleBack = () => {
		if (eventId) {
			navigate(`/event/${eventId}/ranking`);
		}
	};

	// Encontrar el equipo y la actividad
	const { team, activity } = useMemo(() => {
		const foundTeam = teams.find(t => t.id === parseInt(teamId));
		if (!foundTeam || !foundTeam.activities_data) {
			return { team: null, activity: null };
		}

		const foundActivity = foundTeam.activities_data.find(a => a.id === parseInt(activityId));
		return { team: foundTeam, activity: foundActivity };
	}, [teams, teamId, activityId]);

	// Verificar permisos: solo el equipo dueño o admin pueden ver
	const hasPermission = useMemo(() => {
		if (isAdmin) return true;
		if (!selectedTeam || !team) return false;
		return selectedTeam.id === team.id;
	}, [isAdmin, selectedTeam, team]);

	const formatCompletedTime = (timestamp) => {
		if (!timestamp) return t("valorate.unknown_time", "Tiempo desconocido");
		const date = new Date(timestamp * 1000);
		return date.toLocaleString();
	};

	const getActivityTypeText = (typeId) => {
		switch (typeId) {
			case 1: return t("valorate.type_question", "Pregunta");
			case 2: return t("valorate.type_clue", "Pista");
			case 3: return t("valorate.type_media", "Foto/Video");
			case 4: return t("valorate.type_puzzle", "Puzzle");
			case 5: return t("valorate.type_pairs", "Parejas");
			default: return t("valorate.type_unknown", "Desconocido");
		}
	};

	const getActivityStatus = () => {
		if (!activity.complete) {
			return { 
				text: t("team_activities.activity_status.not_started", "Sin comenzar"), 
				class: "status-not-started" 
			};
		}
		if (activity.valorate === 0) {
			return { 
				text: t("team_activities.activity_status.pending_review", "Pendiente de valorar"), 
				class: "status-pending" 
			};
		}
		return { 
			text: t("team_activities.activity_status.reviewed", "Valorada"), 
			class: "status-reviewed" 
		};
	};

	const renderActivityPoints = () => {
		if (activity.valorate === 1 && activity.awarded_points !== undefined) {
			return `${activity.awarded_points} ${t("ranking.points_awarded", "puntos otorgados")}`;
		}
		if (activity.valorate === 0) {
			return t("ranking.activity_status.pending_review", "Pendiente de valorar");
		}
		return `${activity.points || 0} ${t("ranking.points", "puntos")}`;
	};

	const renderActivityContent = () => {
		if (!activity) return null;

		const typeId = activity.type?.id;

		switch (typeId) {
			case 1: // Preguntas
				return renderQuestionContent();
			case 3: // Foto/Video
				return renderMediaContent();
			default:
				return renderGenericContent();
		}
	};

	const renderQuestionContent = () => {
		try {
			const typeData = JSON.parse(activity.type_data || '{}');
			const isOpenQuestion = typeData.type_question === "2";

			if (isOpenQuestion && typeData.questions_open) {
				// Parse activity data if it's a string
				let activityData = activity.data;
				if (activityData && typeof activityData === "string") {
					try {
						activityData = JSON.parse(activityData);
					} catch (error) {
						console.error("Error parsing activity data for open questions:", error);
					}
				}

				return (
					<div className="question-content">
						<h4>{t("team_activity_readonly.questions_answers", "Preguntas y Respuestas")}</h4>
						{typeData.questions_open.map((questionData, index) => (
							<div key={index} className="question-item">
								<div className="question-text">
									<strong>{t("team_activity_readonly.question", "Pregunta")}:</strong>
									<p>{questionData.question}</p>
								</div>
								<div className="answer-text">
									<strong>{t("team_activity_readonly.your_answer", "Tu respuesta")}:</strong>
									<p className="team-answer">
										{activityData && activityData[index] 
											? activityData[index] 
											: t("team_activity_readonly.no_answer", "Sin respuesta")
										}
									</p>
								</div>
							</div>
						))}
					</div>
				);
			} else {
				// Pregunta tipo test
				return (
					<div className="question-content">
						<h4>{t("team_activity_readonly.test_question", "Pregunta tipo test")}</h4>
						<p>{t("team_activity_readonly.test_completed", "Has completado esta pregunta tipo test.")}</p>
						{activity.data && (
							<div className="test-answer">
								<strong>{t("team_activity_readonly.selected_answer", "Respuesta seleccionada")}:</strong>
								<p className="team-answer">{activity.data}</p>
							</div>
						)}
					</div>
				);
			}
		} catch (error) {
			console.error("Error parsing question data:", error);
			return renderGenericContent();
		}
	};

	const renderMediaContent = () => {
		if (!activity.data) {
			return (
				<div className="media-content">
					<h4>{t("team_activity_readonly.media_activity", "Actividad de Foto/Video")}</h4>
					<p>{t("team_activity_readonly.no_media", "No se ha subido contenido multimedia")}</p>
				</div>
			);
		}

		const isVideo = activity.data.toLowerCase().includes('.mp4') || 
		               activity.data.toLowerCase().includes('.mov') || 
		               activity.data.toLowerCase().includes('.avi');

		let url = activity.data;
		if (url.includes('.jpg') || url.includes('.jpeg') || url.includes('.png')) {
			url = url.replace(/(\.jpg|\.jpeg|\.png)$/, '_compressed$1');
		}

		if (isVideo) {
			return (
				<div className="media-content">
					<h4>{t("team_activity_readonly.video_activity", "Actividad de Video")}</h4>
					<div className="media-preview">
						<video src={activity.data} controls className="video-preview" />
					</div>
				</div>
			);
		}

		// Imagen
		return (
			<div className="media-content">
				<h4>{t("team_activity_readonly.photo_activity", "Actividad de Foto")}</h4>
				<div className="media-preview">
					{/* Debe intentar mostrar url y si no existe, debe mostrar activity.data */}
					<img 
						src={url} 
						loading="lazy"
						alt={activity.name} className="image-preview" />
				</div>
			</div>
		);
	};

	const renderGenericContent = () => {
		return (
			<div className="generic-content">
				<h4>{t("team_activity_readonly.activity_details", "Detalles de la Actividad")}</h4>
				<p>{activity.description || t("team_activity_readonly.no_description", "Sin descripción disponible")}</p>
				
				{activity.data && (
					<div className="activity-data">
						<p><strong>{t("team_activity_readonly.activity_completion", "Información de completado")}:</strong></p>
						{renderActivityData()}
					</div>
				)}
			</div>
		);
	};

	const renderActivityData = () => {
		// Si activity.data es un string, mostrarlo directamente
		if (typeof activity.data === 'string') {
			return <div className="data-preview">{activity.data}</div>;
		}
		
		// Si es un objeto, intentar mostrar información relevante
		if (typeof activity.data === 'object' && activity.data !== null) {
			try {
				// Para actividades de puzzle, pares, etc.
				const data = activity.data;
				
				if (data.type) {
					return (
						<div className="activity-stats">
							<div className="stat-row">
								<span className="stat-label">{t("team_activity_readonly.activity_type", "Tipo de actividad")}:</span>
								<span className="stat-value">{data.type}</span>
							</div>
							{data.completed !== undefined && (
								<div className="stat-row">
									<span className="stat-label">{t("team_activity_readonly.completed_status", "Estado")}:</span>
									<span className="stat-value">
										{data.completed ? t("team_activity_readonly.completed", "Completada") : t("team_activity_readonly.not_completed", "No completada")}
									</span>
								</div>
							)}
							{data.timeUsed !== undefined && (
								<div className="stat-row">
									<span className="stat-label">{t("team_activity_readonly.time_used", "Tiempo utilizado")}:</span>
									<span className="stat-value">{data.timeUsed}s</span>
								</div>
							)}
							{data.totalConnections !== undefined && (
								<div className="stat-row">
									<span className="stat-label">{t("team_activity_readonly.total_connections", "Conexiones totales")}:</span>
									<span className="stat-value">{data.totalConnections}</span>
								</div>
							)}
							{data.correctConnections !== undefined && (
								<div className="stat-row">
									<span className="stat-label">{t("team_activity_readonly.correct_connections", "Conexiones correctas")}:</span>
									<span className="stat-value">{data.correctConnections}</span>
								</div>
							)}
						</div>
					);
				}
				
				// Para otros tipos de objetos, mostrar información básica
				return (
					<div className="activity-stats">
						<div className="stat-row">
							<span className="stat-label">{t("team_activity_readonly.activity_completed_successfully", "Actividad completada exitosamente")}:</span>
							<span className="stat-value">✅</span>
						</div>
					</div>
				);
			} catch (error) {
				console.error("Error parsing activity data:", error);
				return (
					<div className="activity-stats">
						<div className="stat-row">
							<span className="stat-label">{t("team_activity_readonly.activity_completed_successfully", "Actividad completada exitosamente")}:</span>
							<span className="stat-value">✅</span>
						</div>
					</div>
				);
			}
		}
		
		// Si no hay datos o son de tipo desconocido
		return (
			<div className="activity-stats">
				<div className="stat-row">
					<span className="stat-label">{t("team_activity_readonly.activity_completed_successfully", "Actividad completada exitosamente")}:</span>
					<span className="stat-value">✅</span>
				</div>
			</div>
		);
	};

	// Verificaciones de seguridad
	if (!hasPermission) {
		return (
			<BackgroundLayout
				title={t("team_activity_readonly.access_denied", "Acceso Denegado")}
			>
				<BackButton onClick={handleBack} />
				<div className="error-container">
					<div className="error-content">
						<h2>{t("team_activity_readonly.access_denied", "Acceso Denegado")}</h2>
						<p>{t("team_activity_readonly.access_denied_desc", "No tienes permisos para ver esta actividad")}</p>
					</div>
				</div>
			</BackgroundLayout>
		);
	}

	if (!activity || !team) {
		return (
			<BackgroundLayout
				title={t("team_activity_readonly.not_found", "Actividad no encontrada")}
			>
				<BackButton onClick={handleBack} />
				<div className="error-container">
					<div className="error-content">
						<h2>{t("team_activity_readonly.not_found", "Actividad no encontrada")}</h2>
						<p>{t("team_activity_readonly.not_found_desc", "No se pudo encontrar la actividad solicitada")}</p>
					</div>
				</div>
			</BackgroundLayout>
		);
	}

	if (!activity.complete) {
		return (
			<BackgroundLayout
				title={activity.name}
				subtitle={`${t("team_activity_readonly.team", "Equipo")}: ${team.name}`}
			>
				<BackButton onClick={handleBack} />
				<div className="error-container">
					<div className="error-content">
						<h2>{t("team_activity_readonly.not_completed", "Actividad no completada")}</h2>
						<p>{t("team_activity_readonly.not_completed_desc", "Esta actividad aún no ha sido completada")}</p>
					</div>
				</div>
			</BackgroundLayout>
		);
	}

	const status = getActivityStatus();

	return (
		<BackgroundLayout
			title={activity.name}
			subtitle={`${t("team_activity_readonly.team", "Equipo")}: ${team.name}`}
		>
			<BackButton onClick={handleBack} />
			
			{/* Indicador de color del evento */}
			{event?.color && (
				<div 
					className="event-color-indicator" 
					style={{ backgroundColor: event.color }}
				></div>
			)}
			
			<div className="team-activity-readonly-container">
				{/* Información general de la actividad */}
				<div className="activity-info-header">
					<div className="activity-meta">
						<div className="meta-item">
							<span className="meta-label">{t("team_activity_readonly.type", "Tipo")}:</span>
							<span className="meta-value">{getActivityTypeText(activity.type?.id)}</span>
						</div>
						<div className="meta-item">
							<span className="meta-label">{t("team_activity_readonly.status", "Estado")}:</span>
							<span className={`meta-value status-badge ${status.class}`}>
								{status.text}
							</span>
						</div>
						<div className="meta-item">
							<span className="meta-label">{t("team_activity_readonly.completed_time", "Completada")}:</span>
							<span className="meta-value">{formatCompletedTime(activity.complete_time)}</span>
						</div>
						<div className="meta-item">
							<span className="meta-label">{t("team_activity_readonly.points", "Puntos")}:</span>
							<span className="meta-value">{renderActivityPoints()}</span>
						</div>
					</div>
				</div>

				{/* Contenido de la actividad */}
				<div className="activity-content-section">
					{renderActivityContent()}
				</div>

				{/* Información adicional solo lectura */}
				<div className="readonly-notice">
					<div className="notice-content">
						<span className="notice-icon">👁️</span>
						<span className="notice-text">
							{t("team_activity_readonly.readonly_notice", "Esta es una vista de solo lectura de tu actividad completada")}
						</span>
					</div>
				</div>
			</div>
		</BackgroundLayout>
	);
};

export default TeamActivityReadOnlyPage;
