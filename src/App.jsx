import React, { useEffect, useRef } from "react";
import { Routes, Route } from "react-router-dom";

import RouteListener from "./components/routeListener";
import SubscriptionManager from "./components/subscriptionManager";
import CacheEventAssets from "./components/cacheEventAssets";
import ChatConnectionManager from "./components/ChatConnectionManager";
import ChatReadStatusManager from "./components/chatReadStatusManager";
import GadgetDetector from "./components/GadgetDetector";
import GadgetsInitializer from "./components/GadgetsInitializer";
import ActivityQueueManager from "./components/ActivityQueueManager";
import Popup from "./components/popup";
// import NotificationContainer from "./components/notificationContainer.jsx";
import NotificationPermissionBanner from "./components/notifications/NotificationPermissionBanner";
import NotificationNavigationManager from "./components/NotificationNavigationManager";
import UserActivityTracker from "./components/UserActivityTracker";
import DebugModeIndicator from "./components/DebugModeIndicator";
import URLHandler from "./components/URLHandler";
import { useEventSuspensionCheck } from "./hooks/useEventSuspensionCheck";
import { useTheme } from "./hooks/useTheme";
import useForceOrientation from "./hooks/useForceOrientation";
import useAppConfig from "./hooks/useAppConfig";
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
import TeamGroupDetailPage from "./pages/teamGroupDetailPage";
import TeamActivityReadOnlyPage from "./pages/teamActivityReadOnlyPage";
import NotFoundPage from "./pages/NotFoundPage";
import DeviceNotAssignedPage from "./pages/deviceNotAssignedPage";
import InitPage from "./pages/initPage";
import SystemStatusPage from "./pages/SystemStatusPage";
import MediaListPage from "./pages/mediaListPage";
import EventShell from "./pages/EventShell";

import './styles/global.css';
import './styles/fonts.css';
import './styles/medias.css';
import './styles/reset.css';
import './styles/sessionControl.css';
import './styles/valorate.css';
import './styles/gadgets.css';
import './styles/ranking.css';
import './styles/mediaList.css';
import './styles/teamActivityReadOnly.css';

function App() {
	// Hook para verificar suspensión del evento
	useEventSuspensionCheck();
	
	// Hook para aplicar el tema de colores basado en el evento
	useTheme();

	// Hook para controlar la orientación forzada según configuración
	useForceOrientation();

	// Hook para aplicar configuración dinámica de la aplicación (título e icono)
	useAppConfig();

	const wakeLockRef = useRef(null);
	const wakeLockRetryTimeout = useRef(null);
	const wakeLockRetryAttempts = useRef(0);

	const MAX_WAKELOCK_RETRIES = 5;
	const RETRY_BASE_DELAY = 2000; // 2 seconds

	useEffect(() => {
		const clearRetry = () => {
			if (wakeLockRetryTimeout.current) {
				clearTimeout(wakeLockRetryTimeout.current);
				wakeLockRetryTimeout.current = null;
			}
		};

		const requestWakeLock = async () => {
			if (!('wakeLock' in navigator)) {
				return;
			}

			try {
				wakeLockRef.current = await navigator.wakeLock.request('screen');
				wakeLockRetryAttempts.current = 0;
				clearRetry();
				wakeLockRef.current.addEventListener('release', () => {
					wakeLockRef.current = null;
					if (document.visibilityState === 'visible') {
						retryWakeLock();
					}
				});
			} catch (error) {
				console.warn('Wake Lock request failed:', error);
				retryWakeLock();
			}
		};

		const retryWakeLock = () => {
			if (!('wakeLock' in navigator)) {
				return;
			}

			if (wakeLockRetryAttempts.current >= MAX_WAKELOCK_RETRIES) {
				console.warn('Wake Lock max retry attempts reached');
				return;
			}

			const delay = RETRY_BASE_DELAY * Math.pow(2, wakeLockRetryAttempts.current);
			wakeLockRetryAttempts.current += 1;
			clearRetry();
			wakeLockRetryTimeout.current = setTimeout(() => {
				requestWakeLock();
			}, delay);
		};

		requestWakeLock();

		const handleVisibilityChange = () => {
			if (document.visibilityState === 'visible' && !wakeLockRef.current) {
				wakeLockRetryAttempts.current = 0;
				retryWakeLock();
			}
		};

		document.addEventListener('visibilitychange', handleVisibilityChange);

		return () => {
			document.removeEventListener('visibilitychange', handleVisibilityChange);
			clearRetry();
			if (wakeLockRef.current) {
				wakeLockRef.current.release().catch(() => {});
				wakeLockRef.current = null;
			}
		};
	}, []);

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
			<GadgetsInitializer />
			<ActivityQueueManager />
			<Popup />
			{/* <NotificationContainer /> */}
			<NotificationPermissionBanner />
			<NotificationNavigationManager />
			<UserActivityTracker />
			<DebugModeIndicator />
			<KeepaliveManager />
			<Routes>
				<Route path="/" element={<WelcomePage />} />
				<Route path="/init" element={<InitPage />} />
				<Route path="/events" element={<EventsPage />} />
				<Route path="/teams/:eventId" element={<TeamsPage />} />
				<Route path="/team/:teamId" element={<TeamPage />} />
				<Route path="/event/:eventId" element={<EventShell />}>
					<Route index element={<></>} />
					<Route path="chats" element={<ChatsListPage />} />
					<Route path="chat/:chatId" element={<ChatRoomPage />} />
					<Route path="media-list" element={<MediaListPage />} />
					<Route path="ranking" element={<RankingPage />} />
					<Route path="gadgets" element={<GadgetsPage />} />
					<Route path="system-status" element={<SystemStatusPage />} />
					<Route path="admin">
						<Route path="session-control" element={<SessionControlPage />} />
						<Route path="photos" element={<PhotoManagementPage />} />
						<Route path="team-activities" element={<TeamActivitiesPage />} />
						<Route path="team-activities/team/:teamId" element={<TeamActivityDetailPage />} />
						<Route path="team-activities/team-group/:teamGroupName" element={<TeamGroupDetailPage />} />
						<Route path="valorate" element={<ValoratePage />} />
						<Route path="valorate/activity/:teamId/:activityId" element={<ActivityValorate />} />
					</Route>
					<Route path="team/activity/:teamId/:activityId" element={<TeamActivityReadOnlyPage />} />
				</Route>
				<Route path="/chat/:eventId" element={<ChatPage />} />
				<Route path="/device-not-assigned" element={<DeviceNotAssignedPage />} />
				<Route path="/404" element={<NotFoundPage />} />
			</Routes>
		</>
	);
}

export default App;











