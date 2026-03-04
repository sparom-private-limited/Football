import React from 'react';
import {createDrawerNavigator} from '@react-navigation/drawer';
import AppNavigator from './AppNavigator';
import CustomDrawer from './CustomDrawer';


const Drawer = createDrawerNavigator();

export default function AppDrawer() {
  return (
    <Drawer.Navigator
      screenOptions={{headerShown: false, swipeEnabled: true}}
      drawerContent={props => <CustomDrawer {...props} />}>
      <Drawer.Screen
        name="AppStack"
        component={AppNavigator}
        options={{
          headerShown: false,
          swipeEnabled: true,
        }}
      />
    </Drawer.Navigator>
  );
}

// import { useAuth } from "../context/AuthContext";

// export default function AppDrawer() {
//   const { user } = useAuth();

//   if (!user) return null;

//   let initialRoute = "PlayerHome";

//   if (user.role === "organiser") {
//     initialRoute = "OrganiserDashboard";
//   } else if (user.role === "team") {
//     initialRoute = "TeamHome";
//   }

//   return (
//     <Drawer.Navigator
//       initialRouteName={initialRoute}
//       screenOptions={{ headerShown: false }}
//       drawerContent={(props) => <CustomDrawer {...props} />}
//     >
//       {user.role === "organiser" && (
//         <Drawer.Screen
//           name="OrganiserDashboard"
//           component={OrganiserDashboardScreen}
//         />
//       )}

//       {user.role === "team" && (
//         <Drawer.Screen
//           name="TeamHome"
//           component={TeamHome}
//         />
//       )}

//       {user.role === "player" && (
//         <Drawer.Screen
//           name="PlayerHome"
//           component={PlayerHome}
//         />
//       )}
//     </Drawer.Navigator>
//   );
// }
