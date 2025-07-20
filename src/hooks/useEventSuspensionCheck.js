// src/hooks/useEventSuspensionCheck.js
import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { addToQueue, closeCurrentPopup } from '../features/popup/popupSlice';

export const useEventSuspensionCheck = () => {
	const dispatch = useDispatch();
	const event = useSelector((state) => state.event.event);
	const isAdmin = useSelector((state) => state.session.isAdmin);
	const currentPopup = useSelector((state) => state.popup.currentPopup);

	useEffect(() => {
		const isSuspensionPopupOpen = currentPopup?.titulo === "SUSPENDED_EVENT";
		
		if (!isAdmin) {
			if (event?.suspend === true) {
				// Si el evento está suspendido y no hay popup abierto, mostrarlo
				if (!isSuspensionPopupOpen) {
					dispatch(addToQueue({
						titulo: "SUSPENDED_EVENT", // Identificador especial
						texto: "suspend.event_suspended_message",
						array_botones: [], // Sin botones
						overlay: true,
						close_button: false, // No se puede cerrar
						layout: "center"
					}));
				}
			} else {
				// Si el evento no está suspendido pero hay popup de suspensión abierto, cerrarlo
				if (isSuspensionPopupOpen) {
					dispatch(closeCurrentPopup());
				}
			}
		}
	}, [event?.suspend, isAdmin, dispatch, currentPopup]);
};
