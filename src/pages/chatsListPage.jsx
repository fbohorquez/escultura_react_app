// src/pages/chatsListPage.jsx
import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { fetchChatRooms, setActiveChat } from "../features/chats/chatsSlice";
import BackgroundLayout from "../components/backgroundLayout";
import BackButton from "../components/backButton";
import NotificationBubble from "../components/notificationBubble";
import useChatReadStatus from "../hooks/useChatReadStatus";

const ChatsListPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { rooms, status, error } = useSelector((state) => state.chats);
  const unreadCounts = useSelector((state) => state.chats.unreadCounts);
  const { id: eventId } = useSelector((state) => state.event);
  const session = useSelector((state) => state.session);
  const teams = useSelector((state) => state.teams.items);
  const { selectedTeam, isAdmin } = session;
  const { id: teamId } = selectedTeam || { id: null };

  const currentUserId = isAdmin ? "admin" : teamId;
  const currentUserType = isAdmin ? "admin" : "team";

  // Inicializar estado de lectura
  useChatReadStatus(eventId, currentUserId, currentUserType);

  useEffect(() => {
    console.log('Session data:', session);
    console.log('EventId:', eventId, 'TeamId:', teamId, 'IsAdmin:', isAdmin);
    console.log('Teams available:', teams);
    
    if (eventId && (teamId || isAdmin)) {
      dispatch(fetchChatRooms({ 
        eventId, 
        teamId: teamId || null, 
        isAdmin: isAdmin || false,
        teams: teams || []
      }));
    }
  }, [dispatch, eventId, teamId, isAdmin, session, teams]);

  const handleChatSelect = (room) => {
    dispatch(setActiveChat(room));
    navigate(`/event/${eventId}/chat/${room.id}`);
  };

  const getChatIcon = (type) => {
    switch (type) {
      case "group":
        return (
					<>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							xmlns:xlink="http://www.w3.org/1999/xlink"
							fill="#000000"
							height="80px"
							width="80px"
							version="1.1"
							id="Capa_1"
							viewBox="0 0 297 297"
							xml:space="preserve"
						>
							<g>
								<path d="M286.932,0H10.068C4.508,0,0,4.508,0,10.068v161.505c0,2.988,1.327,5.821,3.623,7.735l138.432,115.36   c1.866,1.555,4.156,2.333,6.445,2.333s4.579-0.778,6.445-2.333l138.432-115.36c2.296-1.913,3.623-4.747,3.623-7.735V10.068   C297,4.508,292.492,0,286.932,0z M276.864,166.857L148.5,273.827L20.136,166.857V20.136h256.729V166.857z" />
								<path d="M45.404,160.262l96.651,80.542c1.866,1.555,4.156,2.333,6.445,2.333s4.579-0.778,6.445-2.333l96.651-80.542   c2.296-1.913,3.623-4.747,3.623-7.735V48.829c0-5.56-4.508-10.068-10.068-10.068H51.849c-5.56,0-10.068,4.508-10.068,10.068   v103.698C41.781,155.515,43.109,158.349,45.404,160.262z M61.917,58.897h173.166v88.915L148.5,219.965l-86.583-72.153V58.897z" />
							</g>
						</svg>
					</>
				);
      case "admin":
        return (
					<>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							xmlns:xlink="http://www.w3.org/1999/xlink"
							fill="#000000"
							height="80px"
							width="80px"
							version="1.1"
							id="Capa_1"
							viewBox="0 0 297 297"
							xml:space="preserve"
						>
							<g>
								<path d="M117.089,93.852c-30.133,0-54.648,24.515-54.648,54.648s24.515,54.648,54.648,54.648s54.648-24.515,54.648-54.648   S147.221,93.852,117.089,93.852z M117.089,183.08c-19.068,0-34.58-15.512-34.58-34.58s15.512-34.58,34.58-34.58   s34.58,15.512,34.58,34.58S136.157,183.08,117.089,183.08z" />
								<path d="M117.089,130.376c-9.994,0-18.124,8.13-18.124,18.124s8.13,18.124,18.124,18.124s18.124-8.13,18.124-18.124   S127.082,130.376,117.089,130.376z M117.089,150.444c-1.072,0-1.944-0.872-1.944-1.944s0.872-1.944,1.944-1.944   c1.072,0,1.944,0.872,1.944,1.944S118.161,150.444,117.089,150.444z" />
								<path d="M117.089,49.483c-46.654,0-85.87,32.436-96.295,75.94C9.127,126.632,0,136.519,0,148.5s9.127,21.868,20.793,23.077   c10.426,43.504,49.641,75.94,96.295,75.94c53.948,0,97.952-43.369,98.992-97.073h70.885c5.541,0,10.034-4.493,10.034-10.034V59.517   c0-5.541-4.493-10.034-10.034-10.034H117.089z M14.047,148.5c0-3.275,1.734-6.146,4.328-7.764c-0.2,2.563-0.303,5.152-0.303,7.764   s0.104,5.202,0.303,7.764C15.782,154.646,14.047,151.775,14.047,148.5z M117.089,227.449c-43.533,0-78.949-35.416-78.949-78.949   s35.416-78.949,78.949-78.949s78.949,35.416,78.949,78.949S160.622,227.449,117.089,227.449z M276.932,130.376h-62.495   c-4.588-24.701-18.374-46.209-37.66-60.826h35.831c3.749,7.784,11.717,13.168,20.919,13.168c9.202,0,17.17-5.385,20.918-13.168   h22.487V130.376z" />
							</g>
						</svg>
					</>
				);
      case "team":
        return (
					<>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							xmlns:xlink="http://www.w3.org/1999/xlink"
							fill="#000000"
							height="80px"
							width="80px"
							version="1.1"
							id="Capa_1"
							viewBox="0 0 297 297"
							xml:space="preserve"
						>
							<g>
								<path d="M164.808,42.252c-27.113,0-49.171,22.057-49.171,49.171s22.057,49.171,49.171,49.171s49.171-22.057,49.171-49.171   S191.921,42.252,164.808,42.252z M129.474,91.423c0-8.577,3.074-16.449,8.176-22.575c0.191,0.261,0.388,0.518,0.572,0.783   l-1.426,1.155c-1.697,1.373-1.958,3.863-0.584,5.56c0.781,0.964,1.923,1.465,3.074,1.465c0.874,0,1.754-0.289,2.486-0.881   l0.309-0.25c0.196,0.47,0.389,0.942,0.566,1.42l-2.027,1.367c-1.811,1.221-2.288,3.678-1.068,5.488   c0.764,1.133,2.011,1.743,3.282,1.743c0.62,0,1.243-0.154,1.82-0.456c0.055,0.409,0.114,0.816,0.155,1.228h-1.129   c-2.183,0-3.953,1.77-3.953,3.953s1.77,3.953,3.953,3.953h1.129c-0.042,0.416-0.102,0.827-0.157,1.239   c-1.759-0.922-3.964-0.409-5.101,1.276c-1.221,1.81-0.743,4.267,1.068,5.488l2.027,1.367c-0.177,0.478-0.37,0.95-0.566,1.42   l-0.309-0.25c-1.697-1.375-4.186-1.112-5.56,0.584c-1.374,1.698-1.113,4.187,0.584,5.56l1.426,1.155   c-0.184,0.265-0.381,0.522-0.572,0.783C132.549,107.871,129.474,100,129.474,91.423z M143.407,119.513   c0.333-0.432,0.654-0.872,0.97-1.314l1.213,0.982c0.733,0.594,1.612,0.881,2.486,0.881c1.151,0,2.293-0.501,3.074-1.465   c1.374-1.698,1.113-4.187-0.584-5.56l-2.125-1.72c0.322-0.674,0.628-1.355,0.916-2.044l0.645,0.435   c0.678,0.457,1.446,0.676,2.206,0.676c1.27,0,2.518-0.611,3.282-1.743c1.221-1.81,0.743-4.267-1.068-5.488l-2.587-1.745   c0.431-1.975,0.731-3.988,0.902-6.031h1.506c2.183,0,3.953-1.77,3.953-3.953s-1.77-3.953-3.953-3.953h-1.506   c-0.171-2.043-0.471-4.057-0.902-6.031l2.587-1.745c1.811-1.221,2.288-3.678,1.068-5.488c-1.222-1.812-3.678-2.287-5.488-1.067   l-0.645,0.435c-0.288-0.689-0.594-1.37-0.916-2.044l2.125-1.72c1.697-1.373,1.958-3.863,0.584-5.56   c-1.373-1.697-3.863-1.956-5.56-0.584l-1.213,0.982c-0.316-0.442-0.637-0.882-0.97-1.314c5.944-4.539,13.361-7.243,21.4-7.243   s15.456,2.704,21.4,7.243c-0.333,0.432-0.654,0.872-0.97,1.314l-1.213-0.982c-1.697-1.374-4.187-1.113-5.56,0.584   c-1.374,1.698-1.113,4.187,0.584,5.56l2.125,1.72c-0.322,0.674-0.628,1.355-0.916,2.044l-0.645-0.435   c-1.81-1.221-4.267-0.742-5.488,1.067s-0.743,4.267,1.068,5.488l2.587,1.745c-0.431,1.975-0.731,3.988-0.902,6.031h-1.506   c-2.183,0-3.953,1.77-3.953,3.953s1.77,3.953,3.953,3.953h1.506c0.171,2.043,0.471,4.057,0.902,6.031l-2.587,1.745   c-1.811,1.221-2.288,3.678-1.068,5.488c0.764,1.133,2.011,1.743,3.282,1.743c0.761,0,1.529-0.219,2.206-0.676l0.645-0.435   c0.288,0.689,0.594,1.37,0.916,2.044l-2.125,1.72c-1.697,1.373-1.958,3.863-0.584,5.56c0.781,0.964,1.923,1.465,3.074,1.465   c0.874,0,1.754-0.289,2.486-0.881l1.213-0.982c0.316,0.442,0.637,0.882,0.97,1.314c-5.944,4.539-13.361,7.243-21.4,7.243   S149.351,124.052,143.407,119.513z M191.965,113.998c-0.191-0.261-0.388-0.518-0.572-0.783l1.426-1.155   c1.697-1.373,1.958-3.863,0.584-5.56c-1.373-1.696-3.864-1.956-5.56-0.584l-0.309,0.25c-0.196-0.47-0.389-0.942-0.566-1.42   l2.027-1.367c1.811-1.221,2.288-3.678,1.067-5.488c-1.139-1.687-3.341-2.196-5.101-1.275c-0.055-0.413-0.115-0.824-0.157-1.24   h1.129c2.183,0,3.953-1.77,3.953-3.953s-1.77-3.953-3.953-3.953h-1.129c0.042-0.412,0.101-0.819,0.155-1.228   c0.577,0.302,1.2,0.456,1.82,0.456c1.27,0,2.518-0.611,3.282-1.743c1.221-1.81,0.743-4.267-1.067-5.488l-2.027-1.367   c0.177-0.478,0.37-0.95,0.566-1.42l0.309,0.25c0.733,0.594,1.612,0.881,2.486,0.881c1.151,0,2.293-0.501,3.074-1.465   c1.374-1.698,1.113-4.187-0.584-5.56l-1.426-1.155c0.184-0.265,0.381-0.522,0.572-0.783c5.102,6.127,8.176,13.998,8.176,22.575   S197.067,107.871,191.965,113.998z" />
								<path d="M256.534,91.423l15.708-62.834c0.738-2.953,0.075-6.081-1.798-8.48c-1.872-2.398-4.747-3.801-7.79-3.801H74.902   C70.993,6.752,61.599,0,50.653,0C36.211,0,24.462,11.749,24.462,26.191v244.617c0,14.442,11.749,26.191,26.191,26.191   s26.191-11.749,26.191-26.191V166.537h185.81c3.043,0,5.918-1.402,7.79-3.801c1.873-2.399,2.537-5.527,1.798-8.48L256.534,91.423z    M57.077,270.809c0,3.542-2.882,6.424-6.424,6.424s-6.424-2.882-6.424-6.424V26.191c0-3.542,2.882-6.424,6.424-6.424   s6.424,2.882,6.424,6.424V270.809z M236.759,93.82l13.238,52.95H76.844V36.075h173.152l-13.238,52.95   C236.365,90.599,236.365,92.246,236.759,93.82z" />
							</g>
						</svg>
					</>
				);
      default:
        return "💬";
    }
  };

  const getChatTypeText = (type) => {
    switch (type) {
      case "group":
        return t("chats.group");
      case "admin":
        return isAdmin ? t("chats.team") : t("chats.admin");
      case "team":
        return t("chats.team");
      default:
        return t("chats.chat");
    }
  };

  if (status === "loading") {
    return (
      <BackgroundLayout title={t("chats.title")}>
        <BackButton onClick={() => navigate(`/event/${eventId}`)} />
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>{t("common.loading")}</p>
        </div>
      </BackgroundLayout>
    );
  }

  if (error) {
    return (
      <BackgroundLayout title={t("chats.title")}>
        <BackButton onClick={() => navigate(`/event/${eventId}`)} />
        <div className="error-container">
          <p className="error-text">{t("chats.error_loading")}: {error}</p>
          <button 
            className="retry-btn"
            onClick={() => dispatch(fetchChatRooms({ eventId, teamId, isAdmin, teams }))}
          >
            {t("common.retry")}
          </button>
        </div>
      </BackgroundLayout>
    );
  }

  return (
    <BackgroundLayout title={t("chats.title")}>
      <BackButton onClick={() => navigate(`/event/${eventId}`)} />
      
      {rooms.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">💬</div>
          <p className="empty-text">{t("chats.no_chats")}</p>
        </div>
      ) : (
        <div className="listing">
          {rooms.map((room) => (
            <div 
              key={room.id} 
              className="listing-item"
              onClick={() => handleChatSelect(room)}
            >
              <div className="chat-icon-container">
                <span className="chat-icon">{getChatIcon(room.type)}</span>
                <NotificationBubble count={unreadCounts[room.id]} size="small" />
              </div>
              <div className="listing-item-details">
                <h3 className="listing-item-name">{room.name}</h3>
                <p className="chat-type">{getChatTypeText(room.type)}</p>
                {room.description && (
                  <p className="chat-description">{room.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </BackgroundLayout>
  );
};

export default ChatsListPage;






