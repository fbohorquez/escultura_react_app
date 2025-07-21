// src/components/ActivityValorate.jsx
import React, { useState, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { updateTeamData } from "../features/teams/teamsSlice";
import { addToQueue } from "../features/popup/popupSlice";
import "../styles/photoManagement.css";

const ActivityValorate = () => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const dispatch = useDispatch();
	const { eventId, teamId, activityId } = useParams();

	const [points, setPoints] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);


	const teams = useSelector((state) => state.teams.items);

	// Encontrar el equipo y la actividad
	const { team, activity } = useMemo(() => {
		const foundTeam = teams.find(t => t.id === parseInt(teamId));
		const foundActivity = foundTeam?.activities_data?.find(a => a.id === parseInt(activityId));
		
		return {
			team: foundTeam,
			activity: foundActivity
		};
	}, [teams, teamId, activityId]);

	const isAlreadyValued = activity?.valorate === 1;

	// Inicializar el campo de puntos con los puntos ya otorgados si la actividad está valorada
	React.useEffect(() => {
		if (isAlreadyValued && activity?.awarded_points !== undefined) {
			setPoints(activity.awarded_points.toString());
		}
	}, [isAlreadyValued, activity?.awarded_points]);

	const handleBack = () => {
		// Verificar si venimos de la página de gestión de fotos
		const fromPhotos = window.location.pathname.includes('/admin/photos/');
		if (fromPhotos) {
			navigate(`/admin/photos/${eventId}`);
		} else {
			navigate(`/admin/valorate/${eventId}`);
		}
	};

	const handleSubmit = async () => {
		const pointsToAdd = parseInt(points) || 0;
		
		if (pointsToAdd < 0) {
			dispatch(addToQueue({
				titulo: t("valorate.error", "Error"),
				texto: t("valorate.negative_points_error", "Los puntos no pueden ser negativos"),
				array_botones: [
					{
						titulo: t("close", "Cerrar"),
						callback: null
					}
				],
				overlay: true,
				close_button: true,
				layout: "center"
			}));
			return;
		}

		if (!activity || !team) {
			console.error("Activity or team not found");
			return;
		}

		setIsSubmitting(true);

		try {
			// Calcular la diferencia de puntos si la actividad ya estaba valorada
			let pointsDifference = pointsToAdd;
			if (isAlreadyValued && activity.awarded_points !== undefined) {
				pointsDifference = pointsToAdd - activity.awarded_points;
			}

			// Actualizar activities_data del equipo
			const updatedActivitiesData = team.activities_data.map(activityItem => {
				if (activityItem.id === activity.id) {
					return {
						...activityItem,
						valorate: 1, // Marcar como valorada
						awarded_points: pointsToAdd // Almacenar los puntos otorgados
					};
				}
				return activityItem;
			});

			// Preparar cambios para Firebase
			const changes = {
				activities_data: updatedActivitiesData
			};

			// Actualizar los puntos del equipo con la diferencia
			if (pointsDifference !== 0) {
				const currentPoints = team.points || 0;
				changes.points = currentPoints + pointsDifference;
				console.log(`✅ ${isAlreadyValued ? 'Ajustando' : 'Sumando'} ${pointsDifference} puntos al equipo ${team.name}. Total: ${changes.points}`);
			}

			// Actualizar Firebase usando el thunk de teams para asegurar sincronización
			await dispatch(updateTeamData({ eventId, teamId, changes })).unwrap();

			// Mostrar mensaje de éxito - NO redirigir, quedarse en la página de la actividad
			dispatch(addToQueue({
				titulo: t("valorate.success", "Actividad Valorada"),
				texto: isAlreadyValued 
					? t("valorate.points_updated", "Se han actualizado los puntos de la actividad. Total otorgado: {{points}} puntos", {
						points: pointsToAdd
					})
					: pointsToAdd > 0 
						? t("valorate.points_awarded", "Se han otorgado {{points}} puntos al equipo {{team}}", {
							points: pointsToAdd,
							team: team.name
						})
						: t("valorate.activity_reviewed", "La actividad ha sido marcada como revisada"),
				array_botones: [
					{
						titulo: t("close", "Cerrar"),
						callback: null
					}
				],
				overlay: true,
				close_button: true,
				layout: "center"
			}));

		} catch (error) {
			console.error("Error updating activity valoration:", error);
			
			dispatch(addToQueue({
				titulo: t("error", "Error"),
				texto: t("valorate.update_error", "Error al actualizar la valoración de la actividad"),
				array_botones: [
					{
						titulo: t("close", "Cerrar"),
						callback: null
					}
				],
				overlay: true,
				close_button: true,
				layout: "center"
			}));
		} finally {
			setIsSubmitting(false);
		}
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
				if (activity.data && typeof activity.data === "string") {
					try {
						activity.data = JSON.parse(activity.data);
					}
					catch (error) {
						console.error("Error parsing activity data for open questions:", error);
					}
				}
				return (
					<div className="question-content">
						<h4>{t("valorate.questions_answers", "Preguntas y Respuestas")}</h4>
						{typeData.questions_open.map((questionData, index) => (
							<div key={index} className="question-item">
								<div className="question-text">
									<strong>{t("valorate.question", "Pregunta")}:</strong>
									<p>{questionData.question}</p>
								</div>
								<div className="answer-text">
									<strong>{t("valorate.answer", "Respuesta del equipo")}:</strong>
									<p className="team-answer">{activity.data && activity.data[index] ? activity.data[index] || t("valorate.no_answer", "Sin respuesta") : t("valorate.no_answer", "Sin respuesta")}</p>
								</div>
							</div>
						))}
					</div>
				);
			} else {
				// Pregunta tipo test
				return (
					<div className="question-content">
						<h4>{t("valorate.test_question", "Pregunta tipo test")}</h4>
						<p>{t("valorate.test_completed", "Esta actividad fue completada automáticamente (pregunta tipo test)")}</p>
					</div>
				);
			}
		} catch (error) {
			console.error("Error parsing question data:", error);
			return renderGenericContent();
		}
	};

	const renderMediaContent = () => {
		console.log(activity);
		//Case is Photo
		const photoRegex = /\.(jpg|jpeg|png|gif)$/i;
		const isPhoto = activity.data && photoRegex.test(activity.data);
		
		//Case is Video
		const videoRegex = /\.(mp4|webm|ogg)$/i;
		const isVideo = activity.data && videoRegex.test(activity.data);

		if (isPhoto) {
			return (
				<div className="media-content">
					<h4>{t("valorate.photo_activity", "Actividad de Foto")}</h4>
					{activity.data && <img src={activity.data} alt={t("valorate.photo_preview", "Vista previa de la foto")} className="photo-preview" />}
				</div>
			);
		}
		
		if (isVideo) {
			return (
				<div className="media-content">
					<h4>{t("valorate.video_activity", "Actividad de Video")}</h4>
					{activity.data && <video src={activity.data} controls className="video-preview" />}
				</div>
			);
		}
		return (
			<div className="media-content">
				<h4>{t("valorate.media_activity", "Actividad de Foto/Video")}</h4>				
				<p>{t("valorate.no_media_preview", "No se puede mostrar una vista previa del contenido multimedia")}</p>
			</div>
		);
	};

	const renderGenericContent = () => {
		return (
			<div className="generic-content">
				<h4>{t("valorate.activity_details", "Detalles de la Actividad")}</h4>
				<p>{activity.description || t("valorate.no_description", "Sin descripción disponible")}</p>
				
				{activity.data && (
					<div className="activity-data">
						<p><strong>{t("valorate.activity_data", "Datos de la actividad")}:</strong></p>
						<pre className="data-preview">{activity.data}</pre>
					</div>
				)}
			</div>
		);
	};

	if (!activity || !team) {
		return (
			<div className="activity-valorate error">
				<h2>{t("valorate.not_found", "Actividad no encontrada")}</h2>
				<button onClick={handleBack} className="btn btn-secondary">
					{t("back", "Volver")}
				</button>
			</div>
		);
	}

	return (
		<div className="activity-valorate">
			<div className="valorate-header">
				<div className="activity-info">
					<h2 className="activity-title">{activity.name}</h2>
					<div className="team-info">
						<span className="team-label">{t("valorate.team", "Equipo")}:</span>
						<span className="team-name">{team.name}</span>
					</div>
				</div>
				<button onClick={handleBack} className="btn-close">
					<span>&times;</span>
				</button>
			</div>

			<div className="valorate-content">
				{renderActivityContent()}

				<div className="valorate-form">
					{isAlreadyValued ? (
						<div className="form-section">
							<h4>{t("valorate.already_valued", "Actividad Ya Valorada")}</h4>
							<div className="already-valued-info">
								<p className="form-description">
									{t("valorate.edit_valued_desc", "Esta actividad ya ha sido valorada. Puedes modificar los puntos otorgados si es necesario.")}
								</p>
								<div className="valued-status">
									<span className="status-badge valued">
										✅ {t("valorate.reviewed", "Revisada")}
									</span>
								</div>
								<div className="points-input-group">
									<label htmlFor="points">{t("valorate.awarded_points", "Puntos Otorgados")}:</label>
									<input
										type="number"
										id="points"
										min="0"
										value={points}
										onChange={(e) => setPoints(e.target.value)}
										placeholder="0"
										disabled={isSubmitting}
										className="points-input"
									/>
									<span className="suggested-points">
										{t("valorate.current_points", "Puntos actuales")}: {activity.awarded_points || 0}
									</span>
								</div>
							</div>
						</div>
					) : (
						<div className="form-section">
							<h4>{t("valorate.award_points", "Otorgar Puntos")}</h4>
							<p className="form-description">
								{t("valorate.points_description", "Introduce los puntos a otorgar al equipo por esta actividad (0 para marcar como revisada sin puntos)")}
							</p>
							
							<div className="points-input-group">
								<label htmlFor="points">{t("valorate.points", "Puntos")}:</label>
								<input
									type="number"
									id="points"
									min="0"
									value={points}
									onChange={(e) => setPoints(e.target.value)}
									placeholder={activity.points?.toString() || "0"}
									disabled={isSubmitting}
									className="points-input"
								/>
								<span className="suggested-points">
									{t("valorate.suggested", "Sugerido")}: {activity.points || 0}
								</span>
							</div>
						</div>
					)}

					<div className="form-actions">
						<button 
							onClick={handleBack}
							className="btn btn-secondary"
							disabled={isSubmitting}
						>
							{t("back", "Volver")}
						</button>
						<button 
							onClick={handleSubmit}
							className="btn btn-primary"
							disabled={isSubmitting}
						>
							{isSubmitting 
								? t("valorate.submitting", "Enviando...") 
								: isAlreadyValued 
									? t("valorate.update", "Actualizar Puntos")
									: t("valorate.submit", "Valorar Actividad")
							}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default ActivityValorate;

