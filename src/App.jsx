import React from "react";
import { Routes, Route } from "react-router-dom";

import RouteListener from "./components/routeListener";
import SubscriptionManager from "./components/subscriptionManager";
import CacheEventAssets from "./components/cacheEventAssets";
import ChatConnectionManager from "./components/ChatConnectionManager";
import ChatReadStatusManager from "./components/chatReadStatusManager";
import ChatConnectionStatus from "./components/ChatConnectionStatus";
import GadgetDetector from "./components/GadgetDetector";
import ActivitySendDetector from "./components/ActivitySendDetector";
import Popup from "./components/popup";
import NotificationContainer from "./components/notificationContainer";
import DebugModeIndicator from "./components/DebugModeIndicator";
import DebugWelcome from "./components/DebugWelcome";
import { useEventSuspensionCheck } from "./hooks/useEventSuspensionCheck";
import { useTheme } from "./hooks/useTheme";
import EventLoadBehaviorManager from "./components/EventLoadBehaviorManager";

import WelcomePage from "./pages/welcomePage";
import EventsPage from "./pages/eventsPage";
import TeamsPage from "./pages/teamsPage";
import TeamPage from "./pages/teamPage";
import EventPage from "./pages/eventPage";
import ChatPage from "./pages/chatPage";
import ChatsListPage from "./pages/chatsListPage";
import ChatRoomPage from "./pages/chatRoomPage";
import RankingPage from "./pages/rankingPage";
import GadgetsPage from "./pages/gadgetsPage";
import SessionControlPage from "./pages/sessionControlPage";
import ValoratePage from "./pages/valoratePage";
import ActivityValorate from "./components/ActivityValorate";
import PhotoManagementPage from "./pages/photoManagementPage";
import TeamActivitiesPage from "./pages/teamActivitiesPage";
import TeamActivityDetailPage from "./pages/teamActivityDetailPage";
import ThemeTestPage from "./pages/themeTestPage";

import './styles/global.css';
import './styles/fonts.css';
import './styles/medias.css';
import './styles/reset.css';
import './styles/sessionControl.css';
import './styles/valorate.css';
import './styles/gadgets.css';

function App() {
	// Hook para verificar suspensión del evento
	useEventSuspensionCheck();
	
	// Hook para aplicar el tema de colores basado en el evento
	useTheme();

	return (
		<>
			<RouteListener />
			<EventLoadBehaviorManager />
			<SubscriptionManager />
			<CacheEventAssets />
			<ChatConnectionManager />
			<ChatReadStatusManager />
			<GadgetDetector />
			<ActivitySendDetector />
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
				<Route path="/event/:eventId/chats" element={<ChatsListPage />} />
				<Route path="/event/:eventId/chat/:chatId" element={<ChatRoomPage />} />
				<Route path="/ranking/:eventId" element={<RankingPage />} />
				<Route path="/gadgets/:eventId" element={<GadgetsPage />} />
				<Route path="/admin/session-control" element={<SessionControlPage />} />
				<Route path="/admin/photos/:eventId" element={<PhotoManagementPage />} />
				<Route path="/admin/team-activities/:eventId" element={<TeamActivitiesPage />} />
				<Route path="/admin/team-activities/:eventId/team/:teamId" element={<TeamActivityDetailPage />} />
				<Route path="/admin/valorate/:eventId" element={<ValoratePage />} />
				<Route path="/admin/valorate/:eventId/activity/:teamId/:activityId" element={<ActivityValorate />} />
				<Route path="/theme-test" element={<ThemeTestPage />} />
			</Routes>
		</>
	);
}

export default App;








