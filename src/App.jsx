import React from "react";
import { Routes, Route } from "react-router-dom";

import RouteListener from "./components/routeListener";
import SubscriptionManager from "./components/subscriptionManager";
import CacheEventAssets from "./components/cacheEventAssets";
import ChatConnectionManager from "./components/ChatConnectionManager";
import ChatReadStatusManager from "./components/chatReadStatusManager";
import GadgetDetector from "./components/GadgetDetector";
import ActivityQueueManager from "./components/ActivityQueueManager";
import Popup from "./components/popup";
import NotificationContainer from "./components/notificationContainer";
import NotificationPermissionBanner from "./components/notifications/NotificationPermissionBanner";
import NotificationNavigationManager from "./components/NotificationNavigationManager";
import DebugModeIndicator from "./components/DebugModeIndicator";
import URLHandler from "./components/URLHandler";
import { useEventSuspensionCheck } from "./hooks/useEventSuspensionCheck";
import { useTheme } from "./hooks/useTheme";
import useForceOrientation from "./hooks/useForceOrientation";
import EventLoadBehaviorManager from "./components/EventLoadBehaviorManager";
import KeepaliveManager from "./components/KeepaliveManager";

// Importar utilidades de token de evento para disponibilidad global
import "./utils/eventTokenGenerator";

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
import TeamActivityReadOnlyPage from "./pages/teamActivityReadOnlyPage";
import NotFoundPage from "./pages/NotFoundPage";
import DeviceNotAssignedPage from "./pages/deviceNotAssignedPage";

import './styles/global.css';
import './styles/fonts.css';
import './styles/medias.css';
import './styles/reset.css';
import './styles/sessionControl.css';
import './styles/valorate.css';
import './styles/gadgets.css';
import './styles/ranking.css';
import './styles/teamActivityReadOnly.css';

function App() {
	// Hook para verificar suspensión del evento
	useEventSuspensionCheck();
	
	// Hook para aplicar el tema de colores basado en el evento
	useTheme();

	// Hook para controlar la orientación forzada según configuración
	useForceOrientation();

	return (
		<>
			<URLHandler />
			<RouteListener />
			<CacheEventAssets />
			<EventLoadBehaviorManager />
			<SubscriptionManager />
			<ChatConnectionManager />
			<ChatReadStatusManager />
			<GadgetDetector />
			<ActivityQueueManager />
			<Popup />
			<NotificationContainer />
			<NotificationPermissionBanner />
			<NotificationNavigationManager />
			<DebugModeIndicator />
			<KeepaliveManager />
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
				<Route
					path="/admin/photos/:eventId"
					element={<PhotoManagementPage />}
				/>
				<Route
					path="/admin/team-activities/:eventId"
					element={<TeamActivitiesPage />}
				/>
				<Route
					path="/admin/team-activities/:eventId/team/:teamId"
					element={<TeamActivityDetailPage />}
				/>
				<Route path="/admin/valorate/:eventId" element={<ValoratePage />} />
				<Route
					path="/admin/valorate/:eventId/activity/:teamId/:activityId"
					element={<ActivityValorate />}
				/>
				<Route
					path="/team/activity/:eventId/:teamId/:activityId"
					element={<TeamActivityReadOnlyPage />}
				/>
				<Route path="/device-not-assigned" element={<DeviceNotAssignedPage />} />
				<Route path="/404" element={<NotFoundPage />} />
			</Routes>
		</>
	);
}

export default App;











