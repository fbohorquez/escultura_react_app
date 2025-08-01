// src/components/chatReadStatusManager.jsx
import { useSelector } from "react-redux";
import { useChatReadStatus } from "../hooks/useChatReadStatus";

const ChatReadStatusManager = () => {
  const { id: eventId } = useSelector((state) => state.event);
  const session = useSelector((state) => state.session);
  const { selectedTeam, isAdmin } = session;
  const { id: teamId } = selectedTeam || { id: null };

  const currentUserId = isAdmin ? "admin" : teamId;
  const currentUserType = isAdmin ? "admin" : "team";

  // Usar el hook para inicializar el estado de lectura
  useChatReadStatus(eventId, currentUserId, currentUserType);

  return null; // Este componente no renderiza nada
};

export default ChatReadStatusManager;
