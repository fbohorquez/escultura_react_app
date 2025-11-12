// src/components/GadgetsInitializer.jsx
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { setAvailableGadgets } from "../features/gadgets/gadgetsSlice";
import { getGadgets } from "../services/firebase";

/**
 * Componente que inicializa los gadgets con traducciones
 * Se ejecuta cuando i18n está listo y cuando cambia el idioma
 */
const GadgetsInitializer = () => {
	const dispatch = useDispatch();
	const { i18n } = useTranslation();
	const availableGadgets = useSelector((state) => state.gadgets.availableGadgets);
	
	useEffect(() => {
		// Cargar gadgets cuando i18n esté listo
		if (i18n.isInitialized) {
			const gadgets = getGadgets();
			dispatch(setAvailableGadgets(gadgets));
			console.log('Gadgets initialized with translations:', i18n.language);
		}
	}, [dispatch, i18n.isInitialized, i18n.language]);
	
	// También recargar cuando cambie el idioma
	useEffect(() => {
		const handleLanguageChange = () => {
			const gadgets = getGadgets();
			dispatch(setAvailableGadgets(gadgets));
			console.log('Gadgets reloaded for language:', i18n.language);
		};
		
		i18n.on('languageChanged', handleLanguageChange);
		
		return () => {
			i18n.off('languageChanged', handleLanguageChange);
		};
	}, [dispatch, i18n]);
	
	// Log para debug
	useEffect(() => {
		if (availableGadgets) {
			console.log('Available gadgets updated:', Object.keys(availableGadgets));
		}
	}, [availableGadgets]);
	
	// Este componente no renderiza nada
	return null;
};

export default GadgetsInitializer;
