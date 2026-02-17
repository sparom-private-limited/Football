import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import PlayerprofileView from '../screens/PlayerProfileView';
import PlayerprofileEdit from '../screens/PlayerProfileEdit';
import TeamProfile from '../screens/TeamScreens/TeamProfileScreen';
import PlayerStatsScreen from '../screens/PlayerStatsScreen';

const Stack = createNativeStackNavigator();

export default function ProfileNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="PlayerProfileView"
        component={PlayerprofileView}
        options={{title: 'Profile'}}
      />

      <Stack.Screen
        name="PlayerProfileEdit"
        component={PlayerprofileEdit}
        options={{title: 'Edit Profile'}}
      />

      <Stack.Screen
        name="TeamProfile"
        component={TeamProfile}
        options={{title: 'Team Profile'}}
      />
      <Stack.Screen
        name="PlayerStats"
        component={PlayerStatsScreen}
        options={{title: 'Player Stats'}}
      />
    </Stack.Navigator>
  );
}
