import React from "react";
import { Routes, Route } from "react-router-dom";

import RouteListener from "./components/routeListener";
import SubscriptionManager from "./components/subscriptionManager";
import CacheEventAssets from "./components/cacheEventAssets";
import Popup from "./components/popup";
import NotificationContainer from "./components/notificationContainer";
import DebugModeIndicator from "./components/DebugModeIndicator";
import DebugWelcome from "./components/DebugWelcome";
import { useEventSuspensionCheck } from "./hooks/useEventSuspensionCheck";

import WelcomePage from "./pages/welcomePage";
import EventsPage from "./pages/eventsPage";
import TeamsPage from "./pages/teamsPage";
import TeamPage from "./pages/teamPage";
import EventPage from "./pages/eventPage";
import ChatPage from "./pages/chatPage";
import RankingPage from "./pages/rankingPage";
import GadgetsPage from "./pages/gadgetsPage";
import SessionControlPage from "./pages/sessionControlPage";

import './styles/global.css';
import './styles/fonts.css';
import './styles/medias.css';
import './styles/reset.css';
import './styles/sessionControl.css';

function App() {
	// Hook para verificar suspensión del evento
	useEventSuspensionCheck();

	return (
		<>
			<RouteListener />
			<SubscriptionManager />
			<CacheEventAssets />
			<Popup />
			<NotificationContainer />
			<DebugModeIndicator />
			<DebugWelcome />
			<Routes>
				<Route path="/" element={<WelcomePage />} />
				<Route path="/events" element={<EventsPage />} />
				<Route path="/teams/:eventId" element={<TeamsPage />} />
				<Route path="/team/:teamId" element={<TeamPage />} />
				<Route path="/event/:eventId" element={<EventPage />} />
				<Route path="/chat/:eventId" element={<ChatPage />} />
				<Route path="/ranking/:eventId" element={<RankingPage />} />
				<Route path="/gadgets/:eventId" element={<GadgetsPage />} />
				<Route path="/admin/session-control" element={<SessionControlPage />} />
			</Routes>
		</>
	);
}

export default App;








