import React from "react";
import { Outlet, useMatch } from "react-router-dom";
import EventPage from "./eventPage";

const EventShell = () => {
	const isBaseRoute = Boolean(useMatch({ path: "/event/:eventId", end: true }));

	return (
		<>
			<EventPage isVisible={isBaseRoute} />
			<Outlet />
		</>
	);
};

export default EventShell;
