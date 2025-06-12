import React from "react";
import { Routes, Route } from "react-router-dom";

import RouteListener from "./components/routeListener";
import SubscriptionManager from "./components/subscriptionManager";
import CacheEventAssets from "./components/cacheEventAssets";

import WelcomePage from "./pages/welcomePage";
import EventsPage from "./pages/eventsPage";
import TeamsPage from "./pages/teamsPage";
import TeamPage from "./pages/teamPage";
import EventPage from "./pages/eventPage";

import './styles/global.css';
import './styles/fonts.css';
import './styles/medias.css';
import './styles/reset.css';

function App() {
	return (
		<>
			<RouteListener />
			<SubscriptionManager />
			<CacheEventAssets />
			<Routes>
				<Route path="/" element={<WelcomePage />} />
				<Route path="/events" element={<EventsPage />} />
				<Route path="/teams/:eventId" element={<TeamsPage />} />
				<Route path="/team/:teamId" element={<TeamPage />} />
				<Route path="/event/:eventId" element={<EventPage />} />
			</Routes>
		</>
	);
}

export default App;








