// src/components/ActivityMarker.jsx
import React, { useState } from "react";
import { Marker, InfoWindow } from "@react-google-maps/api";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { useActivityIcon } from "../hooks/useActivityIcon";
import { useActivityProximity } from "../hooks/useActivityProximity";
import { startActivityWithSuspensionCheck } from "../features/activities/activitiesSlice";
import "../styles/ActivityBubble.css";

// Función para calcular distancia usando fórmula de Haversine
const getDistance = (p1, p2) => {
	const R = 6371000; // Radio de la Tierra en metros
	const toRad = (deg) => (deg * Math.PI) / 180;
	const φ1 = toRad(p1.lat);
	const φ2 = toRad(p2.lat);
	const Δφ = toRad(p2.lat - p1.lat);
	const Δλ = toRad(p2.lng - p1.lng);
	const a =
		Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
		Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	return R * c;
};

const ActivityMarker = ({ activity }) => {
	const { t } = useTranslation();
	const dispatch = useDispatch();
	const iconConfig = useActivityIcon(activity.icon?.icon || "", activity.type?.id || 3);
	const [showBubble, setShowBubble] = useState(false);
	const { checkActivityProximity, isAutoActivated } = useActivityProximity();

	// Obtener estado del usuario
	const isAdmin = useSelector((state) => state.session.isAdmin);
	const selectedTeam = useSelector((state) => state.session.selectedTeam);
	const teams = useSelector((state) => state.teams.items);

	// Si el icono aún no está procesado, no renderizar el marker
	if (!iconConfig) {
		return null;
	}

	const handleMarkerClick = () => {
		setShowBubble(true);
	};

	const handleBubbleClose = () => {
		setShowBubble(false);
	};

	const getBubbleContent = () => {
		if (isAdmin) {
			// Mostrar información administrativa
			const completedTeams = teams.filter(team => 
				team.activities_data?.some(act => 
					act.id === activity.id && act.complete
				)
			);

			const completedTeamNames = completedTeams.map(team => team.name).join(", ");
			const completedCount = completedTeams.length;
			return (
				<div className="activity-bubble">
					<div className="activity-bubble-title">{activity.name}</div>
					{activity.icon && (
						<img
							src={activity.icon.icon}
							alt={activity.name}
							className="activity-bubble-image"
						/>
					)}
					<div className="activity-bubble-content">
						{completedCount > 0
							? t(
									"activity_info.admin_completed",
									"Equipos que han completado esta actividad ({{count}}): {{teams}}",
									{
										count: completedCount,
										teams:
											completedTeamNames || t("activity_info.none", "Ninguno"),
									}
							  )
							: t(
									"activity_info.admin_no_completed",
									"Ningún equipo ha completado esta actividad aún."
							  )}
					</div>
				</div>
			);
		} else {
			// Mostrar información para equipos
			if (!selectedTeam) {
				return (
					<div className="activity-bubble">
						<div className="activity-bubble-title">{activity.name}</div>
						<div className="activity-bubble-content">
							{t('activity_info.no_team_selected', 'Selecciona un equipo para ver la distancia')}
						</div>
					</div>
				);
			}

			// Obtener datos actualizados del equipo
			const currentTeamData = teams.find(team => team.id === selectedTeam.id) || selectedTeam;
			
			if (!currentTeamData.lat || !currentTeamData.lon) {
				return (
					<div className="activity-bubble">
						<button className="activity-bubble-close" onClick={handleBubbleClose}>
							×
						</button>
						<div className="activity-bubble-title">{activity.name}</div>
						{activity.icon && (
							<img
								src={activity.icon.icon}
								alt={activity.name}
								className="activity-bubble-image"
							/>
						)}
						<div className="activity-bubble-content">
							{t('activity_info.position_unknown', 'No se puede calcular la distancia. Posición del equipo desconocida.')}
						</div>
					</div>
				);
			}

			// Calcular distancia a la actividad
			const distance = getDistance(
				{ lat: currentTeamData.lat, lng: currentTeamData.lon },
				{ lat: activity.lat, lng: activity.lon }
			);

			const distanceText = distance < 1000 
				? `${Math.round(distance)} ${t('activity_info.meters', 'metros')}`
				: `${(distance / 1000).toFixed(1)} ${t('activity_info.kilometers', 'kilómetros')}`;

			// Verificar proximidad y si se puede iniciar por clic
			const proximityStatus = checkActivityProximity(
				activity, 
				{ lat: currentTeamData.lat, lng: currentTeamData.lon }, 
				100 // Usar precisión por defecto para el cálculo
			);

			const canStartByClick = proximityStatus.canClickActivate && !activity.complete;
			const wasAutoActivated = isAutoActivated(activity.id);

			// Función para manejar el inicio de actividad por clic
			const handleStartActivity = () => {
				console.log('🚀 Iniciando actividad por clic:', activity.name, 'ID:', activity.id);
				dispatch(startActivityWithSuspensionCheck(activity));
				setShowBubble(false);
			};

			return (
				<div className="activity-bubble">
					<div className="activity-bubble-title">{activity.name}</div>
					{activity.icon && (
						<img
							src={activity.icon.icon}
							alt={activity.name}
							className="activity-bubble-image"
						/>
					)}
					<div className="activity-bubble-content">
						{t('activity_info.team_distance', 'Distancia: {{distance}}', {
							distance: distanceText
						})}
						
						{/* Mostrar información adicional según el estado */}
						{canStartByClick && (
							<div className="activity-action-info">
								{wasAutoActivated ? (
									<p className="activity-status-text">
										{t('activity_info.click_to_start', 'Pulsa para realizar la actividad')}
									</p>
								) : (
									<p className="activity-status-text">
										{t('activity_info.click_to_start', 'Pulsa para realizar la actividad')}
									</p>
								)}
								<button 
									className="btn btn-primary activity-start-btn"
									onClick={handleStartActivity}
								>
									{t('start_activity', 'Iniciar Actividad')}
								</button>
							</div>
						)}
						
						{!canStartByClick && proximityStatus.isWithinRange && (
							<p className="activity-status-text">
								{!proximityStatus.hasPrecision && 
									t('activity_info.poor_precision', 'Precisión GPS insuficiente')
								}
								{activity.complete && 
									t('activity_info.already_completed', 'Actividad ya completada')
								}
							</p>
						)}
						
						{!proximityStatus.isWithinRange && (
							<p className="activity-status-text">
								{t('activity_info.too_far', 'Debes acercarte más para realizar esta actividad')}
							</p>
						)}
					</div>
				</div>
			);
		}
	};

	return (
		<>
			<Marker
				key={`activity-${activity.id}`}
				position={{ lat: activity.lat, lng: activity.lon }}
				icon={iconConfig}
				title={activity.name}
				onClick={handleMarkerClick}
			/>
			{showBubble && (
				<InfoWindow
					position={{ lat: activity.lat, lng: activity.lon }}
					onCloseClick={handleBubbleClose}
					options={{
						pixelOffset: new window.google.maps.Size(0, -30),
						disableAutoPan: false,
						maxWidth: 300
					}}
				>
					{getBubbleContent()}
				</InfoWindow>
			)}
		</>
	);
};

export default ActivityMarker;


