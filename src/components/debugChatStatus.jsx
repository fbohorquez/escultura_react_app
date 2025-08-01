// src/components/debugChatStatus.jsx
import React from "react";
import { useSelector } from "react-redux";

const DebugChatStatus = () => {
  const { unreadCounts, readStatus, messages } = useSelector((state) => state.chats);
  const isDebugMode = import.meta.env.VITE_DEBUG_MODE === 'true';

  if (!isDebugMode) return null;

  const totalUnread = Object.values(unreadCounts).reduce((total, count) => total + count, 0);

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999,
      maxWidth: '300px'
    }}>
      <h4>Debug Chat Status</h4>
      <p>Total Unread: {totalUnread}</p>
      <div>
        {Object.keys(unreadCounts).map(chatId => (
          <div key={chatId}>
            <strong>{chatId}</strong>: {unreadCounts[chatId]} unread
            <br />
            Messages: {messages[chatId]?.length || 0}
            <br />
            Read status: {Object.keys(readStatus[chatId] || {}).length} marked
          </div>
        ))}
      </div>
    </div>
  );
};

export default DebugChatStatus;
