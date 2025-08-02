// src/components/eventHeader.jsx
import React, { useRef } from "react";
import PropTypes from "prop-types";
import { useSelector } from "react-redux";

import brandIcon from "../assets/escultura_brand.png";
import defaultLogoTeam from "../assets/icono_equpo@2x.png";
import adminIcon from "../assets/Icono_Organizacion@2x.png";

const SWIPE_THRESHOLD = 30; // px

const EventHeader = ({
	eventName,
	teamName,
	teamPhoto,
	logo,
	onCollapse,
	collapsed,
}) => {
	const touchStartY = useRef(0);
	const touchEndY = useRef(0);

	const isAdmin = useSelector((state) => state.session.isAdmin);

	const handleTouchStart = (e) => {
		touchStartY.current = e.touches[0].clientY;
	};

	const handleTouchMove = (e) => {
		touchEndY.current = e.touches[0].clientY;
	};

	const handleTouchEnd = () => {
		const deltaY = touchEndY.current - touchStartY.current;
		if (deltaY < -SWIPE_THRESHOLD && !collapsed) {
			onCollapse(); // swiper up => collapse
		} else if (deltaY > SWIPE_THRESHOLD && collapsed) {
			onCollapse(); // swipe down => expand
		}
	};

	const handleCollapseClick = () => {
		onCollapse();
	};

	return (
		<header
			className={`event-header ${collapsed ? "collapsed" : ""}`}
			onTouchStart={handleTouchStart}
			onTouchMove={handleTouchMove}
			onTouchEnd={handleTouchEnd}
		>
			<div className="header-content">
				{logo && (
					<div className="logo-container">
						<img src={logo} alt={`${eventName} logo`} className="event-logo" />
					</div>
				)}
				<div className="titles">
					<img src={brandIcon} alt="logo escultura" className="brand-icon" />
					<h1 className="event-title">{eventName}</h1>
					<h2 className="team-name">{teamName}</h2>
				</div>
				{(teamPhoto && (
					<div className="logo-container">
						<img src={teamPhoto} alt={teamName} className="team-photo" />
					</div>
				)) ||
					(isAdmin && (
						<div className="logo-container">
							<img
								src={adminIcon}
								alt="default team logo"
								className="team-photo"
							/>
						</div>
					)) || (
						<div className="logo-container">
							<img
								src={defaultLogoTeam}
								alt="default team logo"
								className="team-photo"
							/>
						</div>
					)}
			</div>
			{/* Botón de colapso con icono sutil */}
			<button 
				className="collapse-button"
				onClick={handleCollapseClick}
				title={collapsed ? "Expandir cabecera" : "Colapsar cabecera"}
			>
				<svg
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					className="collapse-icon"
				>
					{collapsed ? (
						// Icono de expandir (flecha hacia abajo)
						<path
							d="M7 10l5 5 5-5z"
							fill="currentColor"
						/>
					) : (
						// Icono de colapsar (flecha hacia arriba)
						<path
							d="M7 14l5-5 5 5z"
							fill="currentColor"
						/>
					)}
				</svg>
			</button>
		</header>
	);
};

EventHeader.propTypes = {
	eventName: PropTypes.string.isRequired,
	teamName: PropTypes.string.isRequired,
	teamPhoto: PropTypes.string,
	logo: PropTypes.string,
	onCollapse: PropTypes.func,
	collapsed: PropTypes.bool,
};

EventHeader.defaultProps = {
	teamPhoto: "",
	logo: "",
	onCollapse: () => {},
	collapsed: false,
};

export default EventHeader;




