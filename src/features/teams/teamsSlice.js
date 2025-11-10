// src/features/teams/teamsSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

import { fetchInitialTeams, updateTeam } from "../../services/firebase";

import { refreshSession } from "../session/sessionSlice";

/**
 * 🔒 PROTECCIÓN: Preserva actividades completadas (complete:true)
 * Una actividad marcada como complete:true NUNCA puede volver a complete:false
 */
function protectCompletedActivities(oldActivities, newActivities) {
	if (!oldActivities || !Array.isArray(oldActivities)) {
		return newActivities;
	}
	
	if (!newActivities || !Array.isArray(newActivities)) {
		return oldActivities;
	}
	
	return newActivities.map(newActivity => {
		// Buscar la misma actividad en el estado anterior
		const oldActivity = oldActivities.find(a => a.id === newActivity.id);
		
		// Si la actividad estaba completada (complete:true) en el estado anterior
		if (oldActivity && oldActivity.complete === true) {
			// Si la nueva actividad intenta cambiar a complete:false, RECHAZAR
			if (newActivity.complete === false || !newActivity.complete) {
				console.warn(`🛡️ [TEAMS SLICE] Protección activada: Actividad ${newActivity.id} bloqueada (complete:true → false)`);
				
				// Preservar todos los campos del estado completado anterior
				return {
					...newActivity,
					complete: true,
					complete_time: oldActivity.complete_time || newActivity.complete_time,
					data: oldActivity.data || newActivity.data,
					valorate: oldActivity.valorate !== undefined ? oldActivity.valorate : newActivity.valorate,
					awarded_points: oldActivity.awarded_points !== undefined ? oldActivity.awarded_points : newActivity.awarded_points
				};
			}
		}
		
		return newActivity;
	});
}

export const updateTeamData = createAsyncThunk(
        "teams/updateTeam",
        async ({ eventId, teamId, changes }, { rejectWithValue }) => {
                try {
                        console.log("updateTeamData thunk called with:", {
                                eventId,
                                teamId,
                                changes
                        });
                        await updateTeam(eventId, teamId, changes);
                        console.log("updateTeam completed, returning payload:", { teamId, changes });
                        return { teamId, changes };
                } catch (err) {
                        console.error("updateTeamData thunk error:", err);
                        return rejectWithValue(err.message);
                }
        }
);

export const requestTeamRefresh = createAsyncThunk(
        "teams/requestTeamRefresh",
        async ({ eventId, teamId }, { rejectWithValue }) => {
                try {
                        console.log("requestTeamRefresh thunk called for team:", teamId);
                        await updateTeam(eventId, teamId, { 
                                refreshRequested: true,
                                refreshTimestamp: Date.now()
                        });
                        return { teamId, refreshRequested: true, refreshTimestamp: Date.now() };
                } catch (err) {
                        console.error("requestTeamRefresh thunk error:", err);
                        return rejectWithValue(err.message);
                }
        }
);const teamsSlice = createSlice({
	name: "teams",
	initialState: {
		items: [],
		status: "idle",
		error: null,
	},
	reducers: {
		setTeams(state, action) {
			// 🔒 PROTEGER actividades completadas antes de actualizar
			const newTeams = action.payload.map(newTeam => {
				const oldTeam = state.items.find(t => t.id === newTeam.id);
				
				if (oldTeam?.activities_data && newTeam.activities_data) {
					return {
						...newTeam,
						activities_data: protectCompletedActivities(
							oldTeam.activities_data,
							newTeam.activities_data
						)
					};
				}
				
				return newTeam;
			});
			
			state.items = newTeams;
			state.status = "succeeded";
			state.error = null;
		},
		updateTeamActivityLocal(state, action) {
			// Actualizar una actividad específica localmente (optimistic update)
			const { teamId, activityId, updates } = action.payload;
			const teamIndex = state.items.findIndex(t => t.id === teamId);
			
			if (teamIndex !== -1) {
				const team = state.items[teamIndex];
				if (team.activities_data) {
					const activityIndex = team.activities_data.findIndex(a => a.id === activityId);
					if (activityIndex !== -1) {
						state.items[teamIndex].activities_data[activityIndex] = {
							...team.activities_data[activityIndex],
							...updates
						};
						console.log(`🔄 Local update: team ${teamId}, activity ${activityId}`, updates);
					}
				}
			}
		},
		setTeamsLoading(state) {
			state.status = "loading";
			state.error = null;
		},
		setTeamsError(state, action) {
			state.status = "failed";
			state.error = action.payload;
		},
	},
  extraReducers: (builder) => {
    builder
      .addCase(updateTeamData.pending, (state) => {
        state.status = "loading";
      })
      .addCase(updateTeamData.fulfilled, (state, { payload }) => {
        const { teamId, changes } = payload;
        
        state.items = state.items.map(team => {
          if (team.id === teamId) {
            const updatedTeam = { ...team, ...changes };
            
            // 🔒 PROTEGER actividades completadas si se está actualizando activities_data
            if (changes.activities_data && team.activities_data) {
              updatedTeam.activities_data = protectCompletedActivities(
                team.activities_data,
                changes.activities_data
              );
            }
            
            return updatedTeam;
          }
          return team;
        });
        
        state.status = "succeeded";
      })
      .addCase(updateTeamData.rejected, (state, { payload }) => {
        state.status = "failed";
        state.error = payload;
      })
      .addCase(requestTeamRefresh.fulfilled, (state, { payload }) => {
        const { teamId, refreshRequested, refreshTimestamp } = payload;
        state.items = state.items.map(team =>
          team.id === teamId ? { ...team, refreshRequested, refreshTimestamp } : team
        );
        state.status = "succeeded";
      });
  }
});

export const { setTeams, updateTeamActivityLocal, setTeamsLoading, setTeamsError } = teamsSlice.actions;
export default teamsSlice.reducer;

export const initTeams = (firebaseId, initialTeamsData) => async (dispatch) => {
  dispatch(setTeamsLoading());
  dispatch(setTeams(await fetchInitialTeams(firebaseId, initialTeamsData)));
  dispatch(refreshSession());
};













