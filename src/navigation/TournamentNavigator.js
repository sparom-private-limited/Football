import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import MyTournamentsScreen from "../screens/tournament/MyTournamentsScreen";
import CreateTournamentScreen from "../screens/tournament/CreateTournamentScreen";
import TournamentDetailsScreen from "../screens/tournament/TournamentDetailScreen";
import JoinTournamentScreen from "../screens/tournament/JoinTournamentScreen";
import TeamTournamentDetailScreen from "../screens/TeamScreens/TeamTournamentDetailScreen";
import OrganiserTournamentMatchesScreen from "../screens/organiser/Organisertournamentmatchesscreen"; // ✅ NEW
import TournamentStandingsScreen from "../screens/tournament/Tournamentstandingsscreen"; // ✅ NEW

const Stack = createNativeStackNavigator();

export default function TournamentNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* ORGANISER */}
      <Stack.Screen name="MyTournaments" component={MyTournamentsScreen} />
      <Stack.Screen name="CreateTournament" component={CreateTournamentScreen} />
      <Stack.Screen name="TournamentDetail" component={TournamentDetailsScreen} />

      {/* TEAM – DISCOVERY */}
      <Stack.Screen name="JoinTournament" component={JoinTournamentScreen} />

      {/* TEAM – MANAGEMENT */}
      <Stack.Screen
        name="TeamTournamentDetail"
        component={TeamTournamentDetailScreen}
      />
      <Stack.Screen 
  name="OrganiserTournamentMatches" 
  component={OrganiserTournamentMatchesScreen}
  options={{ title: "Tournament Fixtures" }}
/>

<Stack.Screen 
  name="TournamentStandings" 
  component={TournamentStandingsScreen}
  options={{ title: "League Standings" }}
/>
    </Stack.Navigator>
  );
}