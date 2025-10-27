// src/utils/activityCheck.js
// Utilidades para validar la configuración de las actividades

const ACTIVITY_TYPE_IDS = {
	PUZZLE: 4,
	PAIRS: 5,
	WORD_RELATIONS: 6
};

const DEFAULT_TIMEOUT_MS = 7000;

const isBrowser = typeof window !== "undefined";

const ensureArray = (value) => {
	if (Array.isArray(value)) {
		return value;
	}
	if (value == null) {
		return [];
	}
	return [value];
};

const parseTypeData = (typeData) => {
	if (typeData == null || typeData === "") {
		return { data: {}, error: null };
	}

	if (typeof typeData === "object") {
		return { data: typeData, error: null };
	}

	try {
		const parsed = JSON.parse(typeData);
		return { data: parsed, error: null };
	} catch (error) {
		return { data: {}, error };
	}
};

const normalizeUrl = (url) => {
	if (typeof url !== "string") {
		return "";
	}
	return url.trim();
};

const imageCache = new Map();

const validateImageUrl = (url, timeout = DEFAULT_TIMEOUT_MS) => {
	const normalizedUrl = normalizeUrl(url);
	if (!normalizedUrl) {
		return Promise.resolve({ ok: false, error: "URL vacía" });
	}

	if (!isBrowser) {
		// En entornos sin window no podemos validar, devolvemos warning
		return Promise.resolve({ ok: false, error: "Validación no disponible" });
	}

	if (imageCache.has(normalizedUrl)) {
		return imageCache.get(normalizedUrl);
	}

	const validationPromise = new Promise((resolve) => {
		const img = new Image();
		let settled = false;
		const timer = setTimeout(() => {
			if (!settled) {
				settled = true;
				resolve({ ok: false, error: "Tiempo de carga excedido" });
			}
		}, timeout);

		img.onload = () => {
			if (!settled) {
				settled = true;
				clearTimeout(timer);
				resolve({ ok: true });
			}
		};

		img.onerror = () => {
			if (!settled) {
				settled = true;
				clearTimeout(timer);
				resolve({ ok: false, error: "No se pudo cargar la imagen" });
			}
		};

		img.crossOrigin = "anonymous";
		img.referrerPolicy = "no-referrer";
		img.src = normalizedUrl;
	});

	imageCache.set(normalizedUrl, validationPromise);
	return validationPromise;
};

const buildResult = (activity, { errors = [], warnings = [], metadata = {} }) => {
	const status = errors.length > 0 ? "error" : (warnings.length > 0 ? "warning" : "success");
	return {
		id: activity?.id,
		name: activity?.name || `Actividad ${activity?.id ?? ""}`,
		typeId: activity?.type?.id,
		typeName: activity?.type?.name || "Desconocido",
		errors,
		warnings,
		metadata,
		status
	};
};

const checkPuzzle = async (activity, typeData) => {
	const errors = [];
	const warnings = [];
	const metadata = {};

	const piecesRaw = typeData.pieces_number ?? typeData.piecesNumber;
	const pieces = typeof piecesRaw === "string" ? parseInt(piecesRaw, 10) : Number(piecesRaw);

	if (!Number.isFinite(pieces)) {
		errors.push("'pieces_number' debe ser un número válido");
	} else if (pieces < 2) {
		errors.push("El puzzle debe tener al menos 2 piezas");
	} else if (pieces > 120) {
		warnings.push("Más de 120 piezas puede afectar el rendimiento");
	}

	metadata.pieces = Number.isFinite(pieces) ? pieces : null;

	const imageUrl = normalizeUrl(typeData.img_puzzle);
	if (!imageUrl) {
		errors.push("'img_puzzle' es obligatorio y debe ser una URL de imagen");
	} else {
		const imageValidation = await validateImageUrl(imageUrl);
		metadata.image = imageUrl;
		if (!imageValidation.ok) {
			errors.push(`La imagen del puzzle no carga correctamente (${imageValidation.error})`);
		}
	}

	return buildResult(activity, { errors, warnings, metadata });
};

const checkPairs = async (activity, typeData) => {
	const errors = [];
	const warnings = [];
	const metadata = {};

	const rawImages = ensureArray(typeData.img_pairs);
	const images = rawImages.filter((url) => normalizeUrl(url));

	if (images.length === 0) {
		errors.push("'img_pairs' debe contener al menos una imagen válida");
	} else if (images.length === 1) {
		warnings.push("Solo hay una imagen; se necesitan pares completos");
	}

	metadata.imageCount = images.length;

	const validationResults = await Promise.all(images.map((url) => validateImageUrl(url)));
	validationResults.forEach((result, index) => {
		if (!result.ok) {
			errors.push(`La imagen del par ${index + 1} no carga (${result.error})`);
		}
	});

	return buildResult(activity, { errors, warnings, metadata });
};

const checkWordRelations = async (activity, typeData) => {
	const errors = [];
	const warnings = [];
	const metadata = {};

	const words = Array.isArray(typeData.words) ? typeData.words : [];

	if (words.length === 0) {
		errors.push("'words' debe contener al menos un par");
	}

	words.forEach((pair, index) => {
		const word1 = normalizeUrl(pair?.word1);
		const word2 = normalizeUrl(pair?.word2);
		if (!word1 || !word2) {
			errors.push(`Par ${index + 1} incompleto; se requieren 'word1' y 'word2'`);
		}
	});

	metadata.totalPairs = words.length;

	if (Array.isArray(typeData.questions_open)) {
		// const meaningfulQuestions = typeData.questions_open.filter((q) => normalizeUrl(q?.question)).length;
		metadata.openQuestions = typeData.questions_open.length;
		// if (typeData.questions_open.length > 0 && meaningfulQuestions === 0) {
		// 	warnings.push("La sección 'questions_open' no contiene preguntas con contenido");
		// }
	} else if (typeData.questions_open != null) {
		warnings.push("'questions_open' debería ser un array");
	}

	return buildResult(activity, { errors, warnings, metadata });
};

const defaultCheck = async (activity, typeData, parseError) => {
	const errors = [];
	const warnings = [];
	const metadata = {};

	if (parseError) {
		errors.push("type_data no es un JSON válido");
	}

	metadata.hasTypeData = Object.keys(typeData || {}).length > 0;

	return buildResult(activity, { errors, warnings, metadata });
};

export const checkActivity = async (activity) => {
	if (!activity) {
		return buildResult({ id: null, name: "Actividad desconocida" }, { errors: ["Actividad no proporcionada"] });
	}

	const { data, error } = parseTypeData(activity.type_data);

	switch (activity?.type?.id) {
		case ACTIVITY_TYPE_IDS.PUZZLE:
			return checkPuzzle(activity, data);
		case ACTIVITY_TYPE_IDS.PAIRS:
			return checkPairs(activity, data);
		case ACTIVITY_TYPE_IDS.WORD_RELATIONS:
			return checkWordRelations(activity, data);
		default:
			return defaultCheck(activity, data, error);
	}
};

export const checkActivities = async (activities = []) => {
	const list = Array.isArray(activities) ? activities : [];
	const results = await Promise.all(list.map((activity) => checkActivity(activity)));
	return results;
};

export const getActivitySummary = (results = []) => {
	return results.reduce(
		(acc, result) => {
			const key = result.status || "unknown";
			acc[key] = (acc[key] || 0) + 1;
			return acc;
		},
		{ success: 0, warning: 0, error: 0, unknown: 0 }
	);
};

export const activityStatusLabel = (status) => {
	switch (status) {
		case "success":
			return "Correcto";
		case "warning":
			return "Advertencia";
		case "error":
			return "Error";
		default:
			return status || "Desconocido";
	}
};

export default checkActivities;
