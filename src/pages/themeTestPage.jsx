// src/pages/themeTestPage.jsx
import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setEvent } from "../features/event/eventSlice";
import BackgroundLayout from "../components/backgroundLayout";

const ThemeTestPage = () => {
	const dispatch = useDispatch();
	const event = useSelector((state) => state.event.event);
	const [colorInput, setColorInput] = useState(event?.color || "rgb(192, 0, 31)");

	const predefinedColors = [
		{ name: "Rojo original", color: "rgb(192, 0, 31)", eventName: "Evento Corporativo" },
		{ name: "Azul", color: "rgb(0, 123, 192)", eventName: "Conferencia Tecnológica" },
		{ name: "Verde", color: "rgb(40, 167, 69)", eventName: "Festival Ecológico" },
		{ name: "Morado", color: "rgb(108, 117, 125)", eventName: "Gala de Arte" },
		{ name: "Naranja", color: "rgb(255, 136, 0)", eventName: "Evento Deportivo" },
		{ name: "Rosa", color: "rgb(214, 51, 132)", eventName: "Celebración Primavera" },
	];

	const handleColorChange = (newColor, eventName = "Evento de Prueba") => {
		const currentEvent = event || { name: eventName };
		dispatch(setEvent({
			...currentEvent,
			name: eventName,
			color: newColor
		}));
		setColorInput(newColor);
	};

	const handleCustomColorSubmit = (e) => {
		e.preventDefault();
		handleColorChange(colorInput, "Evento Personalizado");
	};

	return (
		<BackgroundLayout
			title="Prueba de Tema de Colores"
			subtitle="Cambia el color principal de la aplicación"
		>
			<div style={{ padding: "2rem", backgroundColor: "rgba(255, 255, 255, 0.9)", borderRadius: "1rem", margin: "2rem" }}>
				
				<h3>Evento actual: {event?.name || "Ninguno"}</h3>
				<h3>Color actual del evento: {event?.color || "No definido"}</h3>
				
				<div style={{ marginBottom: "2rem" }}>
					<h4>Colores predefinidos:</h4>
					<div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
						{predefinedColors.map((colorOption) => (
							<button
								key={colorOption.name}
								onClick={() => handleColorChange(colorOption.color, colorOption.eventName)}
								style={{
									backgroundColor: colorOption.color,
									color: "white",
									border: "none",
									padding: "0.5rem 1rem",
									borderRadius: "0.5rem",
									cursor: "pointer",
									minHeight: "60px",
									display: "flex",
									flexDirection: "column",
									alignItems: "center",
									justifyContent: "center",
									fontSize: "0.9rem",
									textAlign: "center"
								}}
							>
								<div>{colorOption.name}</div>
								<div style={{ fontSize: "0.7rem", opacity: 0.8 }}>{colorOption.eventName}</div>
							</button>
						))}
					</div>
				</div>

				<div style={{ marginBottom: "2rem" }}>
					<h4>Color personalizado:</h4>
					<form onSubmit={handleCustomColorSubmit} style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
						<input
							type="text"
							value={colorInput}
							onChange={(e) => setColorInput(e.target.value)}
							placeholder="rgb(192, 0, 31) o #C0001F"
							style={{ padding: "0.5rem", borderRadius: "0.25rem", border: "1px solid #ccc" }}
						/>
						<button 
							type="submit"
							style={{
								backgroundColor: "var(--primary-color)",
								color: "white",
								border: "none",
								padding: "0.5rem 1rem",
								borderRadius: "0.25rem",
								cursor: "pointer"
							}}
						>
							Aplicar
						</button>
					</form>
				</div>

				<div style={{ marginBottom: "2rem" }}>
					<h4>Elementos de ejemplo con el color aplicado:</h4>
					
					<div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
						<button 
							style={{
								backgroundColor: "var(--primary-color)",
								color: "white",
								border: "none",
								padding: "1rem 2rem",
								borderRadius: "0.5rem",
								cursor: "pointer"
							}}
						>
							Botón Principal
						</button>
						
						<div 
							style={{
								color: "var(--primary-color)",
								fontSize: "1.5rem",
								fontWeight: "bold"
							}}
						>
							Texto con color principal
						</div>
						
						<div 
							style={{
								backgroundColor: "var(--primary-color-alpha-1)",
								border: "2px solid var(--primary-color)",
								padding: "1rem",
								borderRadius: "0.5rem"
							}}
						>
							Caja con borde y fondo transparente
						</div>
						
						<button 
							style={{
								backgroundColor: "white",
								color: "var(--primary-color)",
								border: "2px solid var(--primary-color)",
								padding: "0.75rem 1.5rem",
								borderRadius: "0.5rem",
								cursor: "pointer"
							}}
							onMouseOver={(e) => {
								e.target.style.backgroundColor = "var(--primary-color)";
								e.target.style.color = "white";
							}}
							onMouseOut={(e) => {
								e.target.style.backgroundColor = "white";
								e.target.style.color = "var(--primary-color)";
							}}
						>
							Botón Secundario (hover para ver efecto)
						</button>
					</div>
				</div>
			</div>
		</BackgroundLayout>
	);
};

export default ThemeTestPage;
