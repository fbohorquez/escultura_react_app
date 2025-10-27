import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { updateActivityTime, restoreActivity, startActivity, completeActivityWithSync, finishActivityWithSync } from "../features/activities/activitiesSlice";
import { addToQueue } from "../features/popup/popupSlice";
import PhotoVideoActivity from "./activities/PhotoVideoActivity";
import QuestionActivity from "./activities/QuestionActivity";
import ClueActivity from "./activities/ClueActivity";
import PuzzleActivity from "./activities/PuzzleActivity";
import PairsActivity from "./activities/PairsActivity";
import WordRelationsActivity from "./activities/WordRelationsActivity";
import { requiresManualReview } from "../utils/activityValidation";
import { shouldShowActivityResult } from "../utils/activityResult";
import { useDebugMode } from "../hooks/useDebugMode";
import { useAppStateTracker } from "../hooks/useAppStateTracker";
import "../styles/ActivityRunner.css";
import { useActivityIcon } from "../hooks/useActivityIcon";

// Utility function to detect if file is video based on extension
const isVideoFile = (url) => {
	if (!url) return false;
	const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.ogg', '.flv', '.wmv', '.m4v', '.3gp', '.3g2'];
	const extension = url.toLowerCase().substring(url.lastIndexOf('.'));
	return videoExtensions.includes(extension);
};

const ActivityRunner = ({ activity, onComplete, onExit }) => {
	const { t } = useTranslation();
	const dispatch = useDispatch();
	const { isDebugMode } = useDebugMode();
	const { setActivityStartState, setActivityFinishingState, clearActivity } = useAppStateTracker();
	const [showImageFullscreen, setShowImageFullscreen] = useState(true);
	const [timeExpired, setTimeExpired] = useState(false);
	const [hasTimerStarted, setHasTimerStarted] = useState(false);
	const [imageClosedOnce, setImageClosedOnce] = useState(false);
	const [activityResult, setActivityResult] = useState(null);
	const lastDispatchedTime = useRef(null);
	// Ref para evitar múltiples completes
	const hasCompletedRef = useRef(false);
	
	const selectedTeam = useSelector((state) => state.session.selectedTeam);
	const event = useSelector((state) => state.event.event);
	const activityStartTime = useSelector((state) => state.activities.activityStartTime);
	const storedTimeLeft = useSelector((state) => state.activities.activityTimeLeft);
	// Para mostrar estado actual durante desarrollo
	const { appState, currentActivity } = useSelector((state) => state.keepalive);


	let activityTypeIcon = activity.type?.id || 3;
	if (activity.type?.id === 3) {
		let activityData = activity.type_data;
		if (typeof activityData === "string") {
			activityData = JSON.parse(activityData);
		}
		if (Number(activityData.type) !== 0) {
			activityTypeIcon = 333; // Video
		}
	}
	const iconConfig = useActivityIcon(activity.icon?.icon || "", activityTypeIcon);

	const imageIconUrl = typeof iconConfig === "object" && iconConfig != null ? iconConfig.url : iconConfig;
	
	const [timeLeft, setTimeLeft] = useState(() => {
		if (storedTimeLeft !== null && storedTimeLeft !== undefined) {
			return storedTimeLeft;
		}
		// Si activity.time es 0, el tiempo es infinito
		return activity?.time === 0 ? Infinity : (activity?.time || 0);
	});

	const isVideo = useMemo(() => isVideoFile(activity?.file), [activity?.file]);

	const finalizeActivity = useCallback((result) => {
		dispatch(finishActivityWithSync());
		clearActivity();

		if (onComplete && result) {
			onComplete(result.success, result.media);
		}
	}, [dispatch, clearActivity, onComplete]);

	const handleActivityComplete = useCallback((success, media = null) => {
		// Evitar múltiples ejecuciones
		if (hasCompletedRef.current) return;
		hasCompletedRef.current = true;
		
		// Si el tiempo es infinito, calcular el tiempo transcurrido desde el inicio
		let timeTaken;
		if (activity.time === 0) {
			const elapsed = activityStartTime ? Math.floor((Date.now() - activityStartTime) / 1000) : 0;
			timeTaken = elapsed;
		} else {
			timeTaken = activity.time - timeLeft;
		}
		
		const result = { success, media, timeTaken };
		const showResult = shouldShowActivityResult(activity);

		if (showResult) {
			// Mostrar inmediatamente la pantalla de resultado
			setActivityResult(result);
		}


		// Diferir la actualización global para evitar "Cannot update a component while rendering another"
		setTimeout(async () => {
			// Actualizar estado a "finalizando prueba"
			setActivityFinishingState({ id: activity.id, name: activity.name });
			
			try {
				await dispatch(completeActivityWithSync({
					eventId: event.id,
					teamId: selectedTeam?.id,
					activityId: activity.id,
					success,
					media,
					timeTaken
				})).unwrap();

				if (!showResult) {
					finalizeActivity(result);
				}
			} catch (error) {
				console.error("Error completando actividad:", error);
				
				// Verificar si es un error de actividad única ya completada
				if (error.message && error.message.startsWith("ACTIVITY_ALREADY_COMPLETED:")) {
					const completedByTeam = error.message.split(":")[1];
					
					// Finalizar la actividad sin completarla
					dispatch(finishActivityWithSync());
					clearActivity();

					// Mostrar mensaje específico
					dispatch(addToQueue({
						titulo: t("activity_runner.activity_completed_by_other", "Actividad Ya Completada"),
						texto: t("activity_runner.activity_completed_by_other_message", 
							`Lo sentimos, esta actividad única ya fue completada por el equipo ${completedByTeam}. Se ha eliminado de tu mapa.`),
						array_botones: [
							{
								titulo: t("activity_runner.back_to_map", "Volver al Mapa"),
								callback: () => {
									if (onExit) {
										onExit();
									}
								}
							}
						],
						overlay: true,
						close_button: false,
						layout: "center"
					}));
				} else {
					// Error genérico
					dispatch(addToQueue({
						titulo: t("error", "Error"),
						texto: t("activity_runner.completion_error", "Hubo un error al completar la actividad. Por favor, inténtalo de nuevo."),
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
					
					// Permitir reintentar
					hasCompletedRef.current = false;
				}
			}
		}, 0);
	}, [activity, timeLeft, dispatch, event.id, selectedTeam?.id, activityStartTime, setActivityFinishingState, finalizeActivity, clearActivity, onExit, t]);

	const handleContinue = useCallback(() => {
		if (!activityResult) {
			return;
		}

		finalizeActivity(activityResult);
	}, [activityResult, finalizeActivity]);

	const formattedTime = useMemo(() => {
		if (timeLeft === Infinity) {
			return "∞";
		}
		const mins = Math.floor(timeLeft / 60);
		const secs = timeLeft % 60;
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	}, [timeLeft]);

	useEffect(() => {
		if (activity) {
			const stored = localStorage.getItem('currentActivity');
			let hasStoredActivity = false;
			
			if (stored) {
				try {
					const data = JSON.parse(stored);
					hasStoredActivity = data.activity?.id === activity.id;
					
					if (hasStoredActivity && !activityStartTime) {
						const elapsed = Math.floor((Date.now() - data.startTime) / 1000);
						const remaining = Math.max(0, data.timeLeft - elapsed);
						
						dispatch(restoreActivity({
							activity: data.activity,
							startTime: data.startTime,
							timeLeft: remaining
						}));
						
						setTimeLeft(remaining);
						// Actualizar estado de la aplicación al restaurar actividad
						setActivityStartState({ id: data.activity.id, name: data.activity.name });
					}
				} catch (error) {
					console.error('Error parsing stored activity:', error);
					localStorage.removeItem('currentActivity');
				}
			}
			
			setShowImageFullscreen(!!activity.file);
			
			setHasTimerStarted(hasStoredActivity);
			
			setImageClosedOnce(hasStoredActivity && !!activity.file);
			
			setActivityResult(null);
			setTimeExpired(false);
			hasCompletedRef.current = false;
			
			if (!hasStoredActivity) {
				setTimeLeft(activity.time === 0 ? Infinity : (activity.time || 0));
			}
		}
	}, [activity, dispatch, activityStartTime, setActivityStartState]);

	// Detectar si la actividad es eliminada (del: true) mientras se está realizando
        useEffect(() => {
                if (!activity || !selectedTeam) return;

                // Buscar la actividad actual en el equipo para verificar su estado
                const currentActivityInTeam = selectedTeam.activities_data?.find(a => a.id === activity.id);

                // Si la actividad fue marcada como eliminada (del: true), redirigir al mapa
                if (currentActivityInTeam?.del === true) {
                        console.warn(`⚠️ Actividad ${activity.id} eliminada mientras se realizaba`);
                        
                        // Finalizar la actividad sin completarla
                        dispatch(finishActivityWithSync());
                        clearActivity();

                        // Mostrar mensaje al usuario
                        dispatch(addToQueue({
                                titulo: t("activity_runner.activity_unavailable", "Actividad No Disponible"),
                                texto: t("activity_runner.activity_unavailable_message", 
                                        "Esta actividad ya no está disponible. Otro equipo la ha completado primero."),
                                array_botones: [
                                        {
                                                titulo: t("activity_runner.back_to_map", "Volver al Mapa"),
                                                callback: () => {
                                                        // Redirigir al mapa
                                                        if (onExit) {
                                                                onExit();
                                                        }
                                                }
                                        }
                                ],
                                overlay: true,
                                close_button: false,
                                layout: "center"
                        }));
                }
        }, [activity, selectedTeam, dispatch, clearActivity, onExit, t]);

        // Actualizar estado de la aplicación inmediatamente al montar el componente
        useEffect(() => {
                if (activity) {
                        setActivityStartState({ id: activity.id, name: activity.name });
		}
	}, [activity, setActivityStartState]);

	useEffect(() => {
		if (!activityStartTime && !hasTimerStarted && activity) {
			if (!activity.file) {
				dispatch(startActivity(activity));
				setHasTimerStarted(true);
			}
		}
	}, [activity, activityStartTime, hasTimerStarted, dispatch]);

	useEffect(() => {
		if (!activityStartTime) return;
		
		const updateTimer = () => {
			const elapsed = Math.floor((Date.now() - activityStartTime) / 1000);
			
			// Si activity.time es 0, el tiempo es infinito (no hay limite de tiempo)
			if (activity?.time === 0) {
				setTimeLeft(Infinity);
				dispatch(updateActivityTime(Infinity));
				return true; // Continuar sin expirar nunca
			}
			
			const remaining = Math.max(0, (activity?.time || 0) - elapsed);
			
			setTimeLeft(prevTime => {
				if (prevTime !== remaining) {
					if (lastDispatchedTime.current !== remaining) {
						lastDispatchedTime.current = remaining;
						dispatch(updateActivityTime(remaining));
					}
					return remaining;
				}
				return prevTime;
			});
			
			if (remaining <= 0) {
				setTimeExpired(true);
				return false;
			}
			return true;
		};
		
		if (!updateTimer()) return;
		
		const timer = setInterval(() => {
			if (!updateTimer()) {
				clearInterval(timer);
			}
		}, 1000);

		return () => clearInterval(timer);
	}, [activityStartTime, activity?.time, dispatch]);

	useEffect(() => {
		if (timeExpired && !activityResult) {
			handleActivityComplete(false, null);
		}
	}, [timeExpired, activityResult, handleActivityComplete]);

	if (!activity) {
		return null;
	}

	const toggleImageFullscreen = () => {
		const newState = !showImageFullscreen;
		setShowImageFullscreen(newState);
		
		if (!newState && !imageClosedOnce) {
			setImageClosedOnce(true);
			
			if (!hasTimerStarted && !activityStartTime && activity) {
				dispatch(startActivity(activity));
				setHasTimerStarted(true);
			}
		}
	};

	const resetTimer = () => {
		if (activity) {
			dispatch(startActivity(activity));
			setHasTimerStarted(true);
			setTimeExpired(false);
			console.log('🔧 Debug: Timer reset for activity:', activity.name);
		}
	};

	const endTimer = () => {
		if (activityStartTime) {
			const elapsed = Math.floor((Date.now() - activityStartTime) / 1000);
			
			// Si activity.time es 0, el tiempo es infinito
			if (activity?.time === 0) {
				setTimeLeft(Infinity);
				setTimeExpired(true);
				dispatch(updateActivityTime(Infinity));
			} else {
				const timeLeft = Math.max(0, (activity?.time || 0) - elapsed);
				setTimeLeft(timeLeft);
				setTimeExpired(true);
				dispatch(updateActivityTime(timeLeft));
			}
		}
	};

	const renderActivityResult = () => {
		const { success } = activityResult;
		
		const isPendingReview = requiresManualReview(activity, success);
		
		let resultContent = null;
		
		if (isPendingReview) {
			resultContent = (
				<div className="activity-result-content pending-review">
					<div className="result-icon">
						⏳
					</div>
					<h3 className="result-title">
						{t("pending_review_title")}
					</h3>
					<p className="result-message">
						{t("pending_review_message")}
					</p>
				</div>
			);
		} else if (success && activity.ok) {
			resultContent = (
				<div 
					className="activity-result-content"
					dangerouslySetInnerHTML={{ __html: activity.ok }}
				/>
			);
		} else if (!success && activity.ko) {
			resultContent = (
				<div 
					className="activity-result-content"
					dangerouslySetInnerHTML={{ __html: activity.ko }}
				/>
			);
		} else {
			resultContent = (
				<div className="activity-result-content">
					<div className="result-icon">
						{success ? "✅" : "❌"}
					</div>
					<h3 className="result-title">
						{success ? t("activity_completed") : t("activity_failed")}
					</h3>
					<p className="result-message">
						{success ? t("activity_success") : t("activity_failure")}
					</p>
				</div>
			);
		}

		return (
			<div className="activity-result">
				{resultContent}
				
				{/* {!isPendingReview && (
					<div className="result-stats">
						<div className="stat-item">
							<span className="stat-label">{t("points_earned")}:</span>
							<span className="stat-value">{pointsEarned}</span>
						</div>
						<div className="stat-item">
							<span className="stat-label">{t("current_team_points")}:</span>
							<span className="stat-value">{currentTeamPoints}</span>
						</div>
					</div>
				)} */}
				
				<div className="result-actions">
					<button onClick={handleContinue} className="btn btn-primary">
						{t("continue")}
					</button>
				</div>
			</div>
		);
	};

	const renderActivityContent = () => {
		if (activityResult) {
			return renderActivityResult();
		}
		
		switch (activity.type.id) {
			case 1:
				return (
					<QuestionActivity
						activity={activity}
						onComplete={handleActivityComplete}
						onExit={onExit}
						timeLeft={timeLeft}
						timeExpired={timeExpired}
					/>
				);
			case 2:
				return (
					<ClueActivity
						activity={activity}
						onComplete={handleActivityComplete}
						onExit={onExit}
						timeExpired={timeExpired}
					/>
				);
			case 3:
				return (
					<PhotoVideoActivity
						activity={activity}
						onComplete={handleActivityComplete}
						onExit={onExit}
						timeLeft={timeLeft}
						timeExpired={timeExpired}
					/>
				);
			case 4:
				return (
					<PuzzleActivity
						activity={activity}
						onComplete={handleActivityComplete}
						onExit={onExit}
						timeLeft={timeLeft}
						timeExpired={timeExpired}
					/>
				);
			case 5:
				return (
					<PairsActivity
						activity={activity}
						onComplete={handleActivityComplete}
						onExit={onExit}
						timeLeft={timeLeft}
						timeExpired={timeExpired}
					/>
				);
			case 6:
				return (
					<WordRelationsActivity
						activity={activity}
						onComplete={handleActivityComplete}
						onExit={onExit}
						timeLeft={timeLeft}
						timeExpired={timeExpired}
					/>
				);
			default:
				return (
					<div className="activity-content">
						<p>{t("activity_not_implemented")}</p>
						{import.meta.env.VITE_ACTIVITY_CLOSE_BUTTON !== 'false' && (
							<button onClick={onExit} className="btn btn-secondary">
								{t("back")}
							</button>
						)}
					</div>
				);
		}
	};

	return (
		<div className="activity-runner">
			<div className="activity-runner-header">
				<div className="activity-info">
					<img
						src={activity.icon.icon || imageIconUrl}
						alt={activity.icon.name}
						className="activity-icon"
					/>
					<div className="activity-details">
						<h2 className="activity-name">{activity.name}</h2>
					</div>
				</div>
				<div className="header-actions">
					{activity.file && (
						<button
							onClick={toggleImageFullscreen}
							className="btn-image"
							title={t("view_activity_media")}
						>
							<span>{isVideo ? "🎥" : "🖼️"}</span>
						</button>
					)}
					{import.meta.env.VITE_ACTIVITY_CLOSE_BUTTON !== "false" && (
						<button onClick={onExit} className="btn-close">
							<span>&times;</span>
						</button>
					)}
				</div>
			</div>

			<div className="activity-runner-content">{renderActivityContent()}</div>

			{!activityResult && (
				<div className="activity-runner-footer">
					<div className="team-info">
						<span className="team-name">
							{selectedTeam?.name || t("admin")}
						</span>
						<span className="event-name">{event?.name}</span>
					</div>
					<div className="footer-center">
						{activity.file && !showImageFullscreen && (
							<div
								className="activity-image-thumbnail"
								onClick={toggleImageFullscreen}
							>
								{isVideo ? (
									<video
										src={activity.file}
										className="thumbnail-image"
										title={t("view_activity_media")}
										muted
										preload="metadata"
									/>
								) : (
									<img
										src={activity.file}
										alt={activity.name}
										className="thumbnail-image"
										title={t("view_activity_media")}
									/>
								)}
							</div>
						)}
					</div>
					{formattedTime !== "∞" && (
						<div className="activity-timer">
							<span className="time-left">{formattedTime}</span>
						</div>
					)}
				</div>
			)}

			{showImageFullscreen && activity.file && (
				<div
					className="image-fullscreen-overlay"
					onClick={toggleImageFullscreen}
				>
					<div className="image-fullscreen-container">
						{isVideo ? (
							<video
								src={activity.file}
								className="image-fullscreen"
								controls
								autoPlay
								muted
								onClick={(e) => e.stopPropagation()}
							/>
						) : (
							<img
								src={activity.file}
								alt={activity.name}
								className="image-fullscreen"
								onClick={(e) => e.stopPropagation()}
							/>
						)}
						<button
							className="btn-close-fullscreen"
							onClick={toggleImageFullscreen}
							title={t("close")}
						>
							<span>&times;</span>
						</button>
					</div>
				</div>
			)}

			{isDebugMode && (
				<div className="activity-debug-panel">
					<div className="debug-header">
						<strong>🔧 {t("debug_panel")}</strong>
					</div>

					<div className="debug-content">
						<div className="debug-info">
							<strong>{t("current_time")}:</strong>
							<span>{formattedTime}</span>
						</div>

						<div className="debug-info">
							<strong>{t("activity_debug")}:</strong>
							<span>{activity.name}</span>
						</div>

						{/* Debug info para estado de keepalive */}
						<div className="debug-info">
							<strong>App State:</strong>
							<span>{appState}</span>
						</div>
						<div className="debug-info">
							<strong>Current Activity:</strong>
							<span>{currentActivity?.name || "None"}</span>
						</div>

						<div className="debug-actions">
							<button
								onClick={resetTimer}
								className="debug-btn"
								title={t("timer_reset")}
							>
								{t("reset_timer")}
							</button>
							<br />
							<button
								onClick={endTimer}
								className="debug-btn"
								title={t("end_timer")}
							>
								{t("end_timer")}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default React.memo(ActivityRunner);




