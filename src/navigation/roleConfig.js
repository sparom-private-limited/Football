export const ROLES = {
  ORGANISER: "organiser",
  TEAM: "team",
  PLAYER: "player",
};

export const roleConfig = {
  [ROLES.ORGANISER]: {
    defaultRoute: "Home",
    bottomTabs: [
      { key: "home", label: "Home", route: "Home" },
      { key: "tournaments", label: "Tournaments", route: "Tournaments" },
      { key: "profile", label: "Profile", route: "PlayerProfileView" },
    ],
  },

  [ROLES.TEAM]: {
    defaultRoute: "TeamHome",
    bottomTabs: [
      { key: "home", label: "Home", route: "TeamHome" },
      { key: "team", label: "Team", route: "TeamHome" },
      { key: "matches", label: "Matches", route: "Matches" },
      { key: "profile", label: "Profile", route: "PlayerProfileView" },
    ],
  },

  [ROLES.PLAYER]: {
    defaultRoute: "Home",
    bottomTabs: [
      { key: "home", label: "Home", route: "Home" },
      { key: "matches", label: "Matches", route: "Matches" },
      { key: "profile", label: "Profile", route: "PlayerProfileView" },
    ],
  },
};
