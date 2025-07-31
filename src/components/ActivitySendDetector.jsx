// src/components/ActivitySendDetector.jsx
import { useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { addToQueue } from "../features/popup/popupSlice";
import { updateTeamData } from "../features/teams/teamsSlice";
import { startActivityWithSuspensionCheck } from "../features/activities/activitiesSlice";

/**
 * Componente que detecta cambios en la clave "send" del equipo actual
 * y muestra una notificación para realizar la actividad asignada
 */
const ActivitySendDetector = () => {
	const { t } = useTranslation();
	const dispatch = useDispatch();
	const lastSendValue = useRef(null);
	
	const selectedTeam = useSelector((state) => state.session.selectedTeam);
	const teams = useSelector((state) => state.teams.items);
	const event = useSelector((state) => state.event.event);
	const isAdmin = useSelector((state) => state.session.isAdmin);

	// Obtener datos actualizados del equipo seleccionado desde teams.items
	const currentTeamData = teams.find(team => 
		selectedTeam && team.id === selectedTeam.id
	);

	useEffect(() => {
		// Solo detectar cambios si no es admin y hay un equipo seleccionado
		if (isAdmin || !currentTeamData || !event) return;

		const currentSendValue = currentTeamData.send;
		
		// Si es la primera vez que ejecutamos, solo guardar el valor actual
		if (lastSendValue.current === null) {
			lastSendValue.current = currentSendValue;
			return;
		}

		// Detectar cambio en la clave send
		if (currentSendValue !== lastSendValue.current && currentSendValue > 0) {
			console.log('🔔 Detected activity send change:', {
				oldValue: lastSendValue.current,
				newValue: currentSendValue,
				teamId: currentTeamData.id,
				teamName: currentTeamData.name
			});

			// Buscar la actividad asignada
			const assignedActivity = currentTeamData.activities_data?.find(
				activity => activity.id === currentSendValue
			);

			if (assignedActivity) {
				console.log('🎯 Found assigned activity:', assignedActivity);
				
				// Mostrar popup de confirmación para hacer la actividad
				dispatch(addToQueue({
					titulo: t("activity_notification.title", "Nueva Actividad Asignada"),
					texto: t("activity_notification.message", "El organizador te ha asignado una nueva actividad: \"{{activityName}}\"", {
						activityName: assignedActivity.name
					}),
					array_botones: [
						{
							titulo: t("activity_notification.decline", "Ahora No"),
							callback: () => {
								// Restablecer send a 0 sin hacer la actividad
								resetSendValue();
							}
						},
						{
							titulo: t("activity_notification.accept", "Hacer Prueba"),
							callback: async () => {
								try {
									// Restablecer send a 0
									await resetSendValue();
									
									// Iniciar la actividad
									dispatch(startActivityWithSuspensionCheck(assignedActivity));
								} catch (error) {
									console.error("Error starting assigned activity:", error);
								}
							}
						}
					],
					overlay: true,
					close_button: false, // No permitir cerrar sin elegir una opción
					layout: "center",
					claseCss: "popup-activity-notification"
				}));
			} else {
				console.warn('⚠️ Activity not found for send value:', currentSendValue);
				// Restablecer send a 0 aunque no encontremos la actividad
				resetSendValue();
			}
		}

		// Actualizar el valor anterior
		lastSendValue.current = currentSendValue;
	}, [currentTeamData?.send, isAdmin, currentTeamData, event, dispatch, t]);

	// Función para restablecer la clave send a 0
	const resetSendValue = async () => {
		if (!currentTeamData || !event) return;
		
		try {
			await dispatch(updateTeamData({
				eventId: event.id,
				teamId: currentTeamData.id,
				changes: {
					send: 0
				}
			})).unwrap();
			
			console.log('✅ Send value reset to 0 for team:', currentTeamData.name);
		} catch (error) {
			console.error("Error resetting send value:", error);
		}
	};

	// Este componente no renderiza nada visible
	return null;
};

export default ActivitySendDetector;
