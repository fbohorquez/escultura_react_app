// src/pages/gadgetsPage.jsx
import React from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import BackgroundLayout from "../components/backgroundLayout";
import BackButton from "../components/backButton";

const GadgetsPage = () => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { eventId } = useParams();

	const event = useSelector((state) => state.event.event);
	const selectedTeam = useSelector((state) => state.session.selectedTeam);
	const isAdmin = useSelector((state) => state.session.isAdmin);

	const handleBack = () => {
		navigate(`/event/${eventId}`);
	};

	// Gadgets de ejemplo basados en la estructura del proyecto
	const gadgets = [
		{
			id: 1,
			name: t("gadgets.camera", "Cámara"),
			description: t("gadgets.camera_desc", "Captura fotos para las actividades"),
			icon: "📸",
			available: true,
			category: "tools"
		},
		{
			id: 2,
			name: t("gadgets.compass", "Brújula"),
			description: t("gadgets.compass_desc", "Encuentra la dirección correcta"),
			icon: "🧭",
			available: true,
			category: "navigation"
		},
		{
			id: 3,
			name: t("gadgets.magnifier", "Lupa"),
			description: t("gadgets.magnifier_desc", "Examina pistas más de cerca"),
			icon: "🔍",
			available: selectedTeam?.points >= 50,
			category: "tools",
			requiredPoints: 50
		},
		{
			id: 4,
			name: t("gadgets.flashlight", "Linterna"),
			description: t("gadgets.flashlight_desc", "Ilumina lugares oscuros"),
			icon: "🔦",
			available: selectedTeam?.points >= 100,
			category: "tools",
			requiredPoints: 100
		},
		{
			id: 5,
			name: t("gadgets.map", "Mapa detallado"),
			description: t("gadgets.map_desc", "Muestra ubicaciones especiales"),
			icon: "🗺️",
			available: selectedTeam?.points >= 150,
			category: "navigation",
			requiredPoints: 150
		},
		{
			id: 6,
			name: t("gadgets.radio", "Radio"),
			description: t("gadgets.radio_desc", "Comunicación especial con el organizador"),
			icon: "📻",
			available: selectedTeam?.points >= 200,
			category: "communication",
			requiredPoints: 200
		}
	];

	const categories = {
		tools: t("gadgets.category_tools", "Herramientas"),
		navigation: t("gadgets.category_navigation", "Navegación"),
		communication: t("gadgets.category_communication", "Comunicación")
	};

	const groupedGadgets = gadgets.reduce((groups, gadget) => {
		const category = gadget.category;
		if (!groups[category]) {
			groups[category] = [];
		}
		groups[category].push(gadget);
		return groups;
	}, {});

	return (
		<BackgroundLayout
			title={t("gadgets.title", "Gadgets")}
			subtitle={event?.name}
		>
			<BackButton onClick={handleBack} />
			
			<div className="gadgets-container">
				{!isAdmin && selectedTeam && (
					<div className="team-info">
						<h3>{selectedTeam.name}</h3>
						<p className="points-info">
							{t("gadgets.current_points", "Puntos actuales")}: <strong>{selectedTeam.points || 0}</strong>
						</p>
					</div>
				)}

				<div className="gadgets-intro">
					<p>{t("gadgets.description", "Los gadgets te ayudan a completar las actividades. Algunos requieren puntos para desbloquearse.")}</p>
				</div>

				{Object.entries(groupedGadgets).map(([category, categoryGadgets]) => (
					<div key={category} className="gadgets-category">
						<h4 className="category-title">{categories[category]}</h4>
						
						<div className="gadgets-grid">
							{categoryGadgets.map((gadget) => (
								<div 
									key={gadget.id}
									className={`gadget-item ${gadget.available ? 'available' : 'locked'}`}
								>
									<div className="gadget-icon">{gadget.icon}</div>
									<div className="gadget-content">
										<h5 className="gadget-name">{gadget.name}</h5>
										<p className="gadget-description">{gadget.description}</p>
										
										{!gadget.available && gadget.requiredPoints && (
											<div className="requirement">
												<small>
													{t("gadgets.requires_points", "Requiere {{points}} puntos", {
														points: gadget.requiredPoints
													})}
												</small>
											</div>
										)}
									</div>
									
									<div className="gadget-status">
										{gadget.available ? (
											<span className="status-available">
												{t("gadgets.available", "Disponible")}
											</span>
										) : (
											<span className="status-locked">
												{t("gadgets.locked", "Bloqueado")}
											</span>
										)}
									</div>
								</div>
							))}
						</div>
					</div>
				))}

				{isAdmin && (
					<div className="admin-controls">
						<h4>{t("gadgets.admin_controls", "Controles de Administrador")}</h4>
						<p>{t("gadgets.admin_description", "Aquí podrás gestionar los gadgets disponibles para los equipos.")}</p>
						<button className="btn btn-secondary">
							{t("gadgets.manage_gadgets", "Gestionar Gadgets")}
						</button>
					</div>
				)}
			</div>
		</BackgroundLayout>
	);
};

export default GadgetsPage;
