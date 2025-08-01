// src/components/notificationBubble.jsx
import React from "react";
import PropTypes from "prop-types";

const NotificationBubble = ({ count, size = "small" }) => {
  if (!count || count === 0) return null;

  const sizeClass = size === "large" ? "notification-bubble-large" : "notification-bubble-small";

  return (
    <div className={`notification-bubble ${sizeClass}`}>
      {count > 99 ? "99+" : count}
    </div>
  );
};

NotificationBubble.propTypes = {
  count: PropTypes.number,
  size: PropTypes.oneOf(["small", "large"])
};

export default NotificationBubble;
