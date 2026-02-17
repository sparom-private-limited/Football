import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import BottomTabs from "./BottomTabs";

import CreateTeamScreen from "../screens/TeamScreens/CreateTeamScreen";
import EditTeamScreen from "../screens/TeamScreens/EditTeamScreen";
import AddPlayerScreen from "../screens/TeamScreens/AddPlayerScreen";
import TeamProfileScreen from "../screens/TeamScreens/TeamProfileScreen";
import TeamLineupScreen from "../screens/TeamScreens/TeamLineupScreen";
import ProfileNavigator from "./ProfileNavigator";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, gestureEnabled: false }}>
      <Stack.Screen name="MainTabs" component={BottomTabs}  options={{
    headerShown: false,
    headerBackButtonMenuEnabled: false, 
  }} />
     <Stack.Screen
        name="ProfileNavigator"
        component={ProfileNavigator}
      />
      
      {/* Team Management Screens */}
      <Stack.Screen name="CreateTeam" component={CreateTeamScreen} />
      <Stack.Screen name="EditTeam" component={EditTeamScreen} />
      <Stack.Screen name="AddPlayer" component={AddPlayerScreen} />
      <Stack.Screen name="TeamProfile" component={TeamProfileScreen} />
      <Stack.Screen name="TeamLineup" component={TeamLineupScreen} />
    </Stack.Navigator>
  );
}