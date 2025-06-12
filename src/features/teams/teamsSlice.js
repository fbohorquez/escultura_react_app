// src/features/teams/teamsSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

import { fetchInitialTeams, updateTeam } from "../../services/firebase";

import { refreshSession } from "../session/sessionSlice";

export const updateTeamData = createAsyncThunk(
	"teams/updateTeam",
	async ({ eventId, teamId, changes }, { rejectWithValue }) => {
		try {
			await updateTeam(eventId, teamId, changes);
			return { teamId, changes };
		} catch (err) {
			return rejectWithValue(err.message);
		}
	}
);

const teamsSlice = createSlice({
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













