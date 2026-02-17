import React from "react";
import { Text } from "react-native";
import { useAuth } from "../context/AuthContext";

import PlayerHome from "./PlayerHome";
import TeamHome from "./TeamScreens/TeamHome";
import OrganiserDashboardScreen from "./organiser/OrganiserDashboardScreen";

export default function HomePage() {
  const { user } = useAuth();

  if (!user) return null;

  switch (user.role) {
    case "player":
      return <PlayerHome />;

    case "organiser":
      return <OrganiserDashboardScreen />;

    case "team":
      return <TeamHome />;

    default:
      return <Text>Invalid role</Text>;
  }
}
