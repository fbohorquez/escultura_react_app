// src/services/api.js

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
	throw new Error("No se ha configurado VITE_API_BASE_URL en el .env");
}

export const getEvents = async () => {
	const response = await fetch(`${API_BASE_URL}/events`);
	if (!response.ok) {
		throw new Error("Network response was not ok");
	}
	const json = await response.json();
	// Suponemos la estructura { data: { events: [...] } }
	return json.data.events;
};

export const initEvent = async (eventId) => {
	const response = await fetch(`${API_BASE_URL}/event`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ id: eventId }),
	});
	if (!response.ok) {
		throw new Error("Network response was not ok");
	}
	const json = await response.json();
	return json.data.event;
};



