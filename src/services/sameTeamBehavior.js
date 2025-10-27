// src/services/sameTeamBehavior.js

export const SAME_TEAM_BEHAVIORS = {
  NOT: "not",
  ADMIN: "admin",
  TAKE: "take",
};

const DEFAULT_BEHAVIOR = SAME_TEAM_BEHAVIORS.NOT;

const VALID_BEHAVIORS = new Set(Object.values(SAME_TEAM_BEHAVIORS));

export const getSameTeamBehavior = () => {
  const raw = (import.meta.env.VITE_SAME_TEAM || "").toLowerCase();
  return VALID_BEHAVIORS.has(raw) ? raw : DEFAULT_BEHAVIOR;
};

export const isSameTeamBehavior = (behavior) => getSameTeamBehavior() === behavior;

export const isSameTeamTakeEnabled = () => isSameTeamBehavior(SAME_TEAM_BEHAVIORS.TAKE);

export const isSameTeamAdminEnabled = () => isSameTeamBehavior(SAME_TEAM_BEHAVIORS.ADMIN);
