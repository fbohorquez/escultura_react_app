// src/services/uniqueActivityService.js
import { doc, getDoc, runTransaction } from "firebase/firestore";
import { db } from "./firebase";

/**
 * Completa una actividad única de forma atómica
 * Verifica que ningún otro equipo la haya completado antes y la marca como eliminada para los demás
 * 
 * @param {number} eventId - ID del evento
 * @param {number} teamId - ID del equipo que completa la actividad
 * @param {number} activityId - ID de la actividad
 * @param {object} activity - Objeto de la actividad con todos sus datos
 * @param {boolean} success - Si la actividad fue exitosa
 * @param {object|null} media - Datos multimedia si aplica
 * @param {number} valorateValue - Valor de valoración calculado
 * @param {number} pointsToAdd - Puntos a agregar al equipo
 * @returns {Promise<{success: boolean, alreadyCompleted: boolean, completedByTeam?: number}>}
 */
export const completeUniqueActivityWithTransaction = async (
  eventId,
  teamId,
  activityId,
  activity,
  success,
  media,
  valorateValue,
  pointsToAdd
) => {
  const eventRef = doc(db, "events", `event_${eventId}`);
  const teamRef = doc(db, "events", `event_${eventId}`, "teams", `team_${teamId}`);

  try {
    const result = await runTransaction(db, async (transaction) => {
      // 1. Leer el documento del evento para obtener todos los equipos
      const eventDoc = await transaction.get(eventRef);
      if (!eventDoc.exists()) {
        throw new Error("Event not found");
      }

      const eventData = eventDoc.data();
      
      // 2. Obtener los IDs reales de los equipos desde teams_data del evento
      const teamsDataFromEvent = eventData.teams_data || [];
      const teamIds = teamsDataFromEvent.map(t => t.id);
      
      if (teamIds.length === 0) {
        throw new Error("No teams found in event");
      }
      
      // Leer todos los documentos de los equipos
      const teamsData = [];
      
      // Leer el equipo actual primero
      const currentTeamDoc = await transaction.get(teamRef);
      if (!currentTeamDoc.exists()) {
        throw new Error("Team not found");
      }
      
      const currentTeam = currentTeamDoc.data();
      teamsData.push({
        id: teamId,
        ref: teamRef,
        data: currentTeam
      });

      // Leer los demás equipos usando sus IDs reales
      for (const otherTeamId of teamIds) {
        if (otherTeamId === teamId) continue; // Ya lo leímos arriba
        
        const otherTeamRef = doc(db, "events", `event_${eventId}`, "teams", `team_${otherTeamId}`);
        const otherTeamDoc = await transaction.get(otherTeamRef);
        
        if (otherTeamDoc.exists()) {
          teamsData.push({
            id: otherTeamId,
            ref: otherTeamRef,
            data: otherTeamDoc.data()
          });
        }
      }

      // 3. Verificar si algún otro equipo ya completó esta actividad
      let alreadyCompletedBy = null;
      for (const teamData of teamsData) {
        if (teamData.id === teamId) continue; // Saltar el equipo actual

        const activities = teamData.data.activities_data || [];
        const activityInTeam = activities.find(a => a.id === activityId);
        
        if (activityInTeam && activityInTeam.complete && !activityInTeam.del) {
          alreadyCompletedBy = teamData.id;
          break;
        }
      }

      // 4. Si otro equipo ya la completó, rechazar esta transacción
      if (alreadyCompletedBy !== null) {
        return {
          success: false,
          alreadyCompleted: true,
          completedByTeam: alreadyCompletedBy
        };
      }

      // 5. Actualizar la actividad del equipo actual como completada
      // (currentTeam ya fue leído al inicio)
      const updatedActivitiesData = (currentTeam.activities_data || []).map(activityItem => {
        if (activityItem.id === activityId) {
          return {
            ...activityItem,
            complete: true,
            complete_time: Math.floor(Date.now() / 1000),
            data: media?.data || null,
            valorate: valorateValue,
            awarded_points: valorateValue === 1 ? (success ? (activity.points || 0) : 0) : 0
          };
        }
        return activityItem;
      });

      // 7. Preparar cambios para el equipo actual
      const changes = {
        activities_data: updatedActivitiesData
      };

      // Si hay puntos que sumar, actualizar también los puntos del equipo
      if (pointsToAdd > 0) {
        const currentPoints = currentTeam.points || 0;
        changes.points = currentPoints + pointsToAdd;
      }

      // 8. Actualizar el equipo actual
      transaction.update(teamRef, changes);

      // 9. Marcar la actividad como eliminada para todos los demás equipos
      for (const teamData of teamsData) {
        if (teamData.id === teamId) continue; // Saltar el equipo actual

        const activities = teamData.data.activities_data || [];
        const activityExists = activities.find(a => a.id === activityId);

        if (activityExists) {
          const updatedOtherActivities = activities.map(a => {
            if (a.id === activityId) {
              return {
                ...a,
                del: true
              };
            }
            return a;
          });

          transaction.update(teamData.ref, {
            activities_data: updatedOtherActivities
          });
        }
      }

      return {
        success: true,
        alreadyCompleted: false,
        pointsAwarded: pointsToAdd
      };
    });

    return result;
  } catch (error) {
    console.error("Error in unique activity transaction:", error);
    throw error;
  }
};

/**
 * Marca una actividad como eliminada para todos los equipos excepto el especificado
 * NOTA: Esta función es para uso manual/administrativo, NO para concurrencia
 * Para completar actividades únicas, usar completeUniqueActivityWithTransaction
 * 
 * @param {number} eventId - ID del evento
 * @param {number} excludeTeamId - ID del equipo a excluir
 * @param {number} activityId - ID de la actividad
 */
export const markActivityAsDeletedForOtherTeams = async (eventId, excludeTeamId, activityId) => {
  const eventRef = doc(db, "events", `event_${eventId}`);
  
  try {
    // Obtener el evento para saber cuántos equipos hay
    const eventDoc = await getDoc(eventRef);
    if (!eventDoc.exists()) {
      throw new Error("Event not found");
    }

    const eventData = eventDoc.data();
    const teamsDataFromEvent = eventData.teams_data || [];
    const teamIds = teamsDataFromEvent.map(t => t.id);

    // Actualizar cada equipo (excepto el excluido)
    const updates = [];
    for (const teamId of teamIds) {
      if (teamId === excludeTeamId) continue;

      const teamRef = doc(db, "events", `event_${eventId}`, "teams", `team_${teamId}`);
      const teamDoc = await getDoc(teamRef);

      if (teamDoc.exists()) {
        const teamData = teamDoc.data();
        const activities = teamData.activities_data || [];

        // Buscar la actividad y marcarla como eliminada
        const updatedActivities = activities.map(activity => {
          if (activity.id === activityId) {
            return {
              ...activity,
              del: true
            };
          }
          return activity;
        });

        // Solo actualizar si hubo cambios
        const hasActivity = activities.some(a => a.id === activityId);
        if (hasActivity) {
          const { updateDoc: updateDocFirebase } = await import("firebase/firestore");
          updates.push(
            updateDocFirebase(teamRef, { activities_data: updatedActivities })
          );
        }
      }
    }

    // Ejecutar todas las actualizaciones en paralelo
    await Promise.all(updates);
    
    console.log(`Activity ${activityId} marked as deleted for all teams except team ${excludeTeamId}`);
  } catch (error) {
    console.error("Error marking activity as deleted for other teams:", error);
    throw error;
  }
};
