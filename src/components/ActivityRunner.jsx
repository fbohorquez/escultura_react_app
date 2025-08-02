import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { updateActivityTime, restoreActivity, startActivity, completeActivityWithSync, finishActivityWithSync } from "../features/activities/activitiesSlice";
import PhotoVideoActivity from "./activities/PhotoVideoActivity";
import QuestionActivity from "./activities/QuestionActivity";
import ClueActivity from "./activities/ClueActivity";
import PuzzleActivity from "./activities/PuzzleActivity";
import PairsActivity from "./activities/PairsActivity";
import WordRelationsActivity from "./activities/WordRelationsActivity";
import { requiresManualReview } from "../utils/activityValidation";
import { useDebugMode } from "../hooks/useDebugMode";
import "../styles/ActivityRunner.css";

// Utility function to detect if file is video based on extension
const isVideoFile = (url) => {
	if (!url) return false;
	const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.ogg'];
	const extension = url.toLowerCase().substring(url.lastIndexOf('.'));
	return videoExtensions.includes(extension);
};

const ActivityRunner = ({ activity, onComplete, onExit }) => {
	const { t } = useTranslation();
	const dispatch = useDispatch();
	const { isDebugMode } = useDebugMode();
	const [showImageFullscreen, setShowImageFullscreen] = useState(true);
	const [timeExpired, setTimeExpired] = useState(false);
	const [hasTimerStarted, setHasTimerStarted] = useState(false);
	const [imageClosedOnce, setImageClosedOnce] = useState(false);
	const [activityResult, setActivityResult] = useState(null);
	const lastDispatchedTime = useRef(null);
	
	const selectedTeam = useSelector((state) => state.session.selectedTeam);
	const event = useSelector((state) => state.event.event);
	const activityStartTime = useSelector((state) => state.activities.activityStartTime);
	const storedTimeLeft = useSelector((state) => state.activities.activityTimeLeft);
	const activityResults = useSelector((state) => state.activities.activityResults);
	
	const [timeLeft, setTimeLeft] = useState(() => {
		if (storedTimeLeft !== null && storedTimeLeft !== undefined) {
			return storedTimeLeft;
		}
		// Si activity.time es 0, el tiempo es infinito
		return activity?.time === 0 ? Infinity : (activity?.time || 0);
	});

	const isVideo = useMemo(() => isVideoFile(activity?.file), [activity?.file]);

	const handleActivityComplete = useCallback((success, media = null) => {
		// Si el tiempo es infinito, calcular el tiempo transcurrido desde el inicio
		let timeTaken;
		if (activity.time === 0) {
			const elapsed = activityStartTime ? Math.floor((Date.now() - activityStartTime) / 1000) : 0;
			timeTaken = elapsed;
		} else {
			timeTaken = activity.time - timeLeft;
		}
		
		const result = { success, media, timeTaken };
		
		dispatch(completeActivityWithSync({
			eventId: event.id,
			teamId: selectedTeam?.id,
			activityId: activity.id,
			success,
			media,
			timeTaken
		}));
		
		setActivityResult(result);
	}, [activity.time, activity.id, timeLeft, dispatch, event.id, selectedTeam?.id, activityStartTime]);

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
			
			if (!hasStoredActivity) {
				setTimeLeft(activity.time === 0 ? Infinity : (activity.time || 0));
			}
		}
	}, [activity, dispatch, activityStartTime]);

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

	const handleContinue = () => {
		dispatch(finishActivityWithSync());
		
		if (onComplete && activityResult) {
			onComplete(activityResult.success, activityResult.media);
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

	const calculateTeamPoints = () => {
		return activityResults
			.filter(result => result.success)
			.reduce((total, result) => {
				const activity = selectedTeam?.activities_data?.find(a => a.id === result.activityId);
				return total + (activity?.points || 0);
			}, 0);
	};

	const renderActivityResult = () => {
		const { success } = activityResult;
		const currentTeamPoints = calculateTeamPoints();
		
		const isPendingReview = requiresManualReview(activity, success);
		
		const pointsEarned = isPendingReview ? 0 : (success ? activity.points : 0);
		
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
				
				{!isPendingReview && (
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
				)}
				
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
					<img src={activity.icon.icon} alt={activity.icon.name} className="activity-icon" />
					<div className="activity-details">
						<h2 className="activity-name">{activity.name}</h2>
					</div>
				</div>
				<div className="header-actions">
					{activity.file && (
						<button onClick={toggleImageFullscreen} className="btn-image" title={t("view_activity_media")}>
							<span>{isVideo ? "🎥" : "🖼️"}</span>
						</button>
					)}
					{import.meta.env.VITE_ACTIVITY_CLOSE_BUTTON !== 'false' && (
						<button onClick={onExit} className="btn-close">
							<span>&times;</span>
						</button>
					)}
				</div>
			</div>

			<div className="activity-runner-content">
				{renderActivityContent()}
			</div>

			{!activityResult && (
			<div className="activity-runner-footer">
				<div className="team-info">
					<span className="team-name">{selectedTeam?.name || t("admin")}</span>
					<span className="event-name">{event?.name}</span>
				</div>
				<div className="footer-center">
					{activity.file && !showImageFullscreen && (
						<div className="activity-image-thumbnail" onClick={toggleImageFullscreen}>
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
				<div className="activity-timer">
					<span className="time-left">{formattedTime}</span>
				</div>
			</div>
			)}

			{showImageFullscreen && activity.file && (
				<div className="image-fullscreen-overlay" onClick={toggleImageFullscreen}>
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
						
						<div className="debug-actions">
							<button 
								onClick={resetTimer}
								className="debug-btn"
								title={t("timer_reset")}
							>
								{t("reset_timer")}
							</button><br/>
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

