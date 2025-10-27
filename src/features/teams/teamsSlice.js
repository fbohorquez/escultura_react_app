// src/features/teams/teamsSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

import { fetchInitialTeams, updateTeam } from "../../services/firebase";

import { refreshSession } from "../session/sessionSlice";

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
			state.items = action.payload;
			state.status = "succeeded";
			state.error = null;
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
        state.items = state.items.map(team =>
          team.id === teamId ? { ...team, ...changes } : team
        );
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

export const { setTeams, setTeamsLoading, setTeamsError } = teamsSlice.actions;
export default teamsSlice.reducer;

export const initTeams = (firebaseId, initialTeamsData) => async (dispatch) => {
  dispatch(setTeamsLoading());
  dispatch(setTeams(await fetchInitialTeams(firebaseId, initialTeamsData)));
  dispatch(refreshSession());
};













