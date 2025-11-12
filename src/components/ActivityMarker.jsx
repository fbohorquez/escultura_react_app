// src/components/ActivityMarker.jsx
import React from "react";
import { Marker, InfoWindow } from "@react-google-maps/api";
import { useActivityIcon } from "../hooks/useActivityIcon";
import "../styles/ActivityBubble.css";

const ActivityMarker = ({
	activity,
	isAdmin,
	isBubbleOpen,
	onMarkerClick,
	onBubbleClose,
	adminInfo,
	teamInfo,
	t,
}) => {
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

	if (!iconConfig) {
		return null;
	}

	const imageUrl = typeof iconConfig === "object" ? iconConfig.url : iconConfig;

	const handleMarkerClick = () => {
		if (typeof onMarkerClick === "function") {
			onMarkerClick(activity.id);
		}
	};

	const renderAdminContent = () => (
		<div className="activity-bubble">
			<div className="activity-bubble-title">{activity.name}</div>
			{imageUrl && (
				<img
					src={imageUrl}
					alt={activity.name}
					className="activity-bubble-image"
					onError={(evt) => {
						evt.currentTarget.style.display = "none";
					}}
				/>
			)}
			<div className="activity-bubble-content">
				{adminInfo?.message || t("activity_info.admin_no_completed", "Ningún equipo ha completado esta actividad aún.")}
			</div>
		</div>
	);

	const renderTeamContent = () => {
		if (!teamInfo || teamInfo.state === "no-team") {
			return (
				<div className="activity-bubble">
					<div className="activity-bubble-title">{activity.name}</div>
					<div className="activity-bubble-content">
						{teamInfo?.message || t("activity_info.no_team_selected", "Selecciona un equipo para ver la distancia")}
					</div>
				</div>
			);
		}

		if (teamInfo.state === "no-position") {
			return (
				<div className="activity-bubble">
					<div className="activity-bubble-title">{activity.name}</div>
					{imageUrl && (
						<img
							src={imageUrl}
							alt={activity.name}
							className="activity-bubble-image"
							onError={(evt) => {
								evt.currentTarget.style.display = "none";
							}}
						/>
					)}
					<div className="activity-bubble-content">
						{teamInfo.message || t("activity_info.position_unknown", "No se puede calcular la distancia. Posición del equipo desconocida.")}
					</div>
				</div>
			);
		}

		return (
			<div className="activity-bubble">
				<div className="activity-bubble-title">{activity.name}</div>
				{imageUrl && (
					<img
						src={imageUrl}
						alt={activity.name}
						className="activity-bubble-image"
						onError={(evt) => {
							evt.currentTarget.style.display = "none";
						}}
					/>
				)}
				<div className="activity-bubble-content">
					{teamInfo.distanceMessage}
					{teamInfo.canStartByClick && (
						<div className="activity-action-info">
							{teamInfo.callToActionText && (
								<p className="activity-status-text">{teamInfo.callToActionText}</p>
							)}
							<button
								className="btn btn-primary activity-start-btn"
								onClick={teamInfo.onStartActivity}
							>
								{teamInfo.startButtonLabel || t("start_activity", "Iniciar Actividad")}
							</button>
						</div>
					)}
					{!teamInfo.canStartByClick && teamInfo.statusText && (
						<p className="activity-status-text">{teamInfo.statusText}</p>
					)}
				</div>
			</div>
		);
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
			{isBubbleOpen && (
				<InfoWindow
					position={{ lat: activity.lat, lng: activity.lon }}
					onCloseClick={onBubbleClose}
					options={{
						pixelOffset: new window.google.maps.Size(0, -30),
						disableAutoPan: true,
						maxWidth: 300,
					}}
				>
					{isAdmin ? renderAdminContent() : renderTeamContent()}
				</InfoWindow>
			)}
		</>
	);
};

export default React.memo(ActivityMarker);






