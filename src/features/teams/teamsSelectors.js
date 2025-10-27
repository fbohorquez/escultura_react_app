import { createSelector } from "@reduxjs/toolkit";

const selectTeamsItems = (state) => state.teams.items || [];
const selectSessionSelectedTeam = (state) => state.session.selectedTeam;

export const selectSelectedTeamData = createSelector(
	[selectTeamsItems, selectSessionSelectedTeam],
	(teams, selectedTeam) => {
		if (!selectedTeam) {
			return null;
		}

		const matchedTeam = teams.find((team) => team.id === selectedTeam.id);
		return matchedTeam || selectedTeam;
	}
);
