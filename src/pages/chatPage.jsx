// src/pages/chatPage.jsx
import React, { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

const ChatPage = () => {
  const navigate = useNavigate();
  const { eventId } = useParams();

  useEffect(() => {
    // Redirigir a la lista de chats
    navigate(`/event/${eventId}/chats`, { replace: true });
  }, [navigate, eventId]);

  return null;
};

export default ChatPage;
