// src/pages/chatPage.jsx
import React, { useState } from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import BackgroundLayout from "../components/backgroundLayout";
import BackButton from "../components/backButton";

const ChatPage = () => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { eventId } = useParams();

	const event = useSelector((state) => state.event.event);
	const selectedTeam = useSelector((state) => state.session.selectedTeam);
	const isAdmin = useSelector((state) => state.session.isAdmin);
	const [message, setMessage] = useState("");
	const [messages, setMessages] = useState([
		{
			id: 1,
			sender: "Organizador",
			text: "¡Bienvenidos al evento! El chat está disponible para comunicarse con el organizador.",
			timestamp: new Date().toISOString(),
			isAdmin: true
		}
	]);

	const handleBack = () => {
		navigate(`/event/${eventId}`);
	};

	const handleSendMessage = () => {
		if (message.trim() === "") return;

		const newMessage = {
			id: Date.now(),
			sender: isAdmin ? "Organizador" : selectedTeam?.name || "Participante",
			text: message,
			timestamp: new Date().toISOString(),
			isAdmin: isAdmin
		};

		setMessages(prev => [...prev, newMessage]);
		setMessage("");
	};

	const handleKeyPress = (e) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSendMessage();
		}
	};

	return (
		<BackgroundLayout
			title={t("chat.title", "Chat")}
			subtitle={event?.name}
		>
			<BackButton onClick={handleBack} />
			
			<div className="chat-container">
				<div className="chat-header">
					<h3>{isAdmin ? t("chat.admin_mode", "Modo Administrador") : t("chat.team_mode", "Chat del Equipo")}</h3>
					{!isAdmin && selectedTeam && (
						<p className="team-info">{selectedTeam.name}</p>
					)}
				</div>

				<div className="chat-messages">
					{messages.map((msg) => (
						<div 
							key={msg.id} 
							className={`message ${msg.isAdmin ? 'admin' : 'team'} ${!isAdmin && msg.isAdmin ? 'received' : 'sent'}`}
						>
							<div className="message-header">
								<span className="sender">{msg.sender}</span>
								<span className="timestamp">
									{new Date(msg.timestamp).toLocaleTimeString()}
								</span>
							</div>
							<div className="message-text">{msg.text}</div>
						</div>
					))}
				</div>

				<div className="chat-input">
					<textarea
						value={message}
						onChange={(e) => setMessage(e.target.value)}
						onKeyPress={handleKeyPress}
						placeholder={t("chat.type_message", "Escribe tu mensaje...")}
						rows={2}
						maxLength={500}
					/>
					<button 
						onClick={handleSendMessage}
						disabled={message.trim() === ""}
						className="send-button"
					>
						{t("chat.send", "Enviar")}
					</button>
				</div>
			</div>
		</BackgroundLayout>
	);
};

export default ChatPage;
