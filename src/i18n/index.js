// src/i18n/index.js
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import es from "./es.json";
import en from "./en.json";

i18n.use(initReactI18next).init({
	resources: {
		es: { translation: es },
		en: { translation: en },
	},
	lng: "es",
	fallbackLng: "en", 
	interpolation: {
		escapeValue: false,
	},
});

export default i18n;

