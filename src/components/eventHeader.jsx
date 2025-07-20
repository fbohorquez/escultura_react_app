// src/components/eventHeader.jsx
import React, { useRef } from "react";
import PropTypes from "prop-types";

import brandIcon from "../assets/escultura_brand.png";

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
				{teamPhoto && (
					<div className="logo-container">
						<img src={teamPhoto} alt={teamName} className="team-photo" />
					</div>
				) || (
					<div className="logo-container"></div>
				)}
			</div>
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

