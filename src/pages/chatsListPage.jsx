// src/pages/chatsListPage.jsx
import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { fetchChatRooms, setActiveChat } from "../features/chats/chatsSlice";

const ChatsListPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { rooms, status, error } = useSelector((state) => state.chats);
  const { id: eventId } = useSelector((state) => state.event);
  const session = useSelector((state) => state.session);
  const { id: teamId, isAdmin } = session;

  useEffect(() => {
    console.log('Session data:', session);
    console.log('EventId:', eventId, 'TeamId:', teamId, 'IsAdmin:', isAdmin);
    
    if (eventId && (teamId || isAdmin)) {
      dispatch(fetchChatRooms({ 
        eventId, 
        teamId: teamId || null, 
        isAdmin: isAdmin || false 
      }));
    }
  }, [dispatch, eventId, teamId, isAdmin, session]);

  const handleChatSelect = (room) => {
    dispatch(setActiveChat(room));
    navigate(`/event/${eventId}/chat/${room.id}`);
  };

  const getChatIcon = (type) => {
    switch (type) {
      case "group":
        return "👥";
      case "admin":
        return "👤";
      case "team":
        return "🤝";
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
      <div className="page chat-page">
        <div className="page-header">
          <button 
            className="back-btn" 
            onClick={() => navigate(`/event/${eventId}`)}
          >
            ←
          </button>
          <h1>{t("chats.title")}</h1>
        </div>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page chat-page">
        <div className="page-header">
          <button 
            className="back-btn" 
            onClick={() => navigate(`/event/${eventId}`)}
          >
            ←
          </button>
          <h1>{t("chats.title")}</h1>
        </div>
        <div className="error-container">
          <p className="error-text">{t("chats.error_loading")}: {error}</p>
          <button 
            className="retry-btn"
            onClick={() => dispatch(fetchChatRooms({ eventId, teamId, isAdmin }))}
          >
            {t("common.retry")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page chat-page">
      <div className="page-header">
        <button 
          className="back-btn" 
          onClick={() => navigate(`/event/${eventId}`)}
        >
          ←
        </button>
        <h1>{t("chats.title")}</h1>
      </div>
      
      <div className="page-content">
        {rooms.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">💬</div>
            <p className="empty-text">{t("chats.no_chats")}</p>
          </div>
        ) : (
          <div className="chats-list">
            {rooms.map((room) => (
              <div 
                key={room.id} 
                className="chat-item"
                onClick={() => handleChatSelect(room)}
              >
                <div className="chat-icon">
                  {getChatIcon(room.type)}
                </div>
                <div className="chat-info">
                  <div className="chat-name">{room.name}</div>
                  <div className="chat-type">{getChatTypeText(room.type)}</div>
                  {room.description && (
                    <div className="chat-description">{room.description}</div>
                  )}
                </div>
                <div className="chat-arrow">›</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatsListPage;
