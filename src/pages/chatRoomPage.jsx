// src/pages/chatRoomPage.jsx
import React, { useEffect, useState, useRef, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { 
  sendMessage, 
  setChatMessages 
} from "../features/chats/chatsSlice";
import { subscribeToChat } from "../services/firebase";

const ChatRoomPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { chatId } = useParams();
  const messagesEndRef = useRef(null);
  
  const [messageText, setMessageText] = useState("");
  
  const { activeChat, messages, sendingMessage } = useSelector((state) => state.chats);
  const { id: eventId } = useSelector((state) => state.event);
  const session = useSelector((state) => state.session);
  const { selectedTeam, isAdmin } = session;
  const { id: teamId } = selectedTeam || { id: null };
  const teams = useSelector((state) => state.teams.items);
  
  // Obtener el equipo actual
  const currentTeam = teams?.find(team => team.id === teamId);
  const teamName = currentTeam?.name || "";
  
  const chatMessages = useMemo(() => messages[chatId] || [], [messages, chatId]);
  const currentUserName = isAdmin ? t("chats.admin") : (teamName || t("chats.team"));
  const currentUserId = isAdmin ? "admin" : teamId;
  const currentUserType = isAdmin ? "admin" : "team";

  // Suscribirse a los mensajes del chat
  useEffect(() => {
    if (eventId && chatId) {
      const unsubscribe = subscribeToChat(eventId, chatId, (newMessages) => {
        dispatch(setChatMessages({ chatId, messages: newMessages }));
      });
      
      return () => {
        unsubscribe();
      };
    }
  }, [eventId, chatId, dispatch]);

  // Auto-scroll al final de los mensajes
  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!messageText.trim() || sendingMessage) return;

    try {
      await dispatch(sendMessage({
        eventId,
        chatId,
        message: messageText.trim(),
        senderName: currentUserName,
        senderId: currentUserId,
        senderType: currentUserType
      })).unwrap();
      
      setMessageText("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isMyMessage = (message) => {
    if (isAdmin) {
      return message.type === "admin";
    } else {
      return message.team === teamId || message.team === currentUserId;
    }
  };

  const getMessageSenderName = (message) => {
    if (message.type === "admin") {
      return t("chats.admin");
    }
    return message.name || t("chats.team");
  };

  const getChatTitle = () => {
    if (activeChat) {
      return activeChat.name;
    }
    
    // Fallback basado en el chatId
    if (chatId === "group") {
      return t("chats.group");
    } else if (chatId.startsWith("admin_")) {
      return isAdmin ? t("chats.team") : t("chats.admin");
    } else if (chatId.startsWith("team_")) {
      return t("chats.team_chat");
    }
    
    return t("chats.chat");
  };

  return (
    <div className="page chat-room-page">
      <div className="chat-header">
        <button 
          className="back-btn" 
          onClick={() => {
            console.log('Navigating back to chats list');
            navigate(`/event/${eventId}/chats`);
          }}
        >
          ←
        </button>
        <div className="chat-title">
          <h1>{getChatTitle()}</h1>
          {activeChat?.description && (
            <p className="chat-subtitle">{activeChat.description}</p>
          )}
        </div>
      </div>
      
      <div className="chat-messages">
        {chatMessages.length === 0 ? (
          <div className="empty-chat">
            <div className="empty-icon">💬</div>
            <p>{t("chats.no_messages")}</p>
            <small>{t("chats.start_conversation")}</small>
          </div>
        ) : (
          <div className="messages-list">
            {chatMessages.map((message, index) => (
              <div 
                key={index} 
                className={`message ${isMyMessage(message) ? 'my-message' : 'other-message'}`}
              >
                <div className="message-content">
                  {!isMyMessage(message) && (
                    <div className="message-sender">
                      {getMessageSenderName(message)}
                    </div>
                  )}
                  <div className="message-text">
                    {message.message}
                  </div>
                  <div className="message-time">
                    {formatMessageTime(message.date)}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      <form className="chat-input-form" onSubmit={handleSendMessage}>
        <div className="input-container">
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder={t("chats.type_message")}
            className="message-input"
            disabled={sendingMessage}
          />
          <button 
            type="submit" 
            className="send-button"
            disabled={!messageText.trim() || sendingMessage}
          >
            {sendingMessage ? "..." : "➤"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatRoomPage;


