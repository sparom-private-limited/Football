// import React from 'react';
// import {Text} from 'react-native';
// import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
// import {useAuth} from '../context/AuthContext';

// // Screens & Navigators
// import TeamHome from '../screens/TeamScreens/TeamHome';
// import TeamProfile from '../screens/TeamScreens/TeamProfileScreen';
// import OrganiserProfileScreen from '../screens/organiser/OrganiserProfileScreen';
// import PlayerHome from '../screens/PlayerHome';
// import MatchNavigator from './MatchNavigator';
// import TournamentNavigator from './TournamentNavigator';
// import ProfileNavigator from './ProfileNavigator';
// import OrganiserDashboardScreen from '../screens/organiser/OrganiserDashboardScreen';

// const Tab = createBottomTabNavigator();

// export const ROLES = {
//   ORGANISER: 'organiser',
//   TEAM: 'team',
//   PLAYER: 'player',
// };

// const roleConfig = {
//   [ROLES.ORGANISER]: {
//     defaultRoute: 'Dashboard',
//     tabs: [
//       {
//         name: 'Dashboard',
//         label: 'Home',
//         component: OrganiserDashboardScreen,
//         icon: f => (f ? '📊' : '📈'),
//       },
//        {
//         name: 'MatchNavigator',
//         label: 'Matches',
//         component: MatchNavigator,
//         icon: f => (f ? '⚽' : '🥅'),
//       },
//       {
//         name: 'TournamentNavigator',
//         label: 'Tournaments',
//         component: TournamentNavigator,
//         icon: f => (f ? '🏆' : '🥇'),
//       },
//       {
//         name: 'Profile',
//         label: 'Profile',
//         component: OrganiserProfileScreen,
//         icon: f => (f ? '👤' : '👥'),
//       },
//     ],
//   },

//   [ROLES.TEAM]: {
//     defaultRoute: 'Dashboard',
//     tabs: [
//       {
//         name: 'Dashboard',
//         label: 'Home',
//         component: TeamHome,
//         icon: f => (f ? '🏠' : '🏡'),
//       },
//       {
//         name: 'MatchNavigator',
//         label: 'Matches',
//         component: MatchNavigator,
//         icon: f => (f ? '⚽' : '🥅'),
//       },
//       {
//         name: 'TournamentNavigator', // ✅ ADD THIS for teams too!
//         label: 'Tournaments',
//         component: TournamentNavigator,
//         icon: f => (f ? '🏆' : '🥇'),
//       },
//       {
//         name: 'Profile',
//         label: 'Profile',
//         component: TeamProfile,
//         icon: f => (f ? '👤' : '👥'),
//       },
//     ],
//   },

//   [ROLES.PLAYER]: {
//     defaultRoute: 'Dashboard',
//     tabs: [
//       {
//         name: 'Dashboard',
//         label: 'Home',
//         component: PlayerHome,
//         icon: f => (f ? '🏠' : '🏡'),
//       },
//       {
//         name: 'MatchNavigator',
//         label: 'Matches',
//         component: MatchNavigator,
//         icon: f => (f ? '⚽' : '🥅'),
//       },
//       {
//         name: 'ProfileNavigator',
//         label: 'Profile',
//         component: ProfileNavigator,
//         icon: f => (f ? '👤' : '👥'),
//       },
//       //  {
//       //   name: 'TournamentNavigator', // ✅ ADD THIS for teams too!
//       //   label: 'Tournaments',
//       //   component: TournamentNavigator,
//       //   icon: f => (f ? '🏆' : '🥇'),
//       // },
//     ],
//   },
// };

// export default function BottomTabs() {
//   const {user} = useAuth();
//   const config = roleConfig[user?.role];

//   // Safety guard
//   if (!config) return null;

//   return (
//     <Tab.Navigator
//       initialRouteName={config.defaultRoute}
//       screenOptions={{
//         headerShown: false,
//         tabBarStyle: {
//           height: 60,
//           paddingBottom: 6,
//           paddingTop: 6,
//         },
//         tabBarHideOnKeyboard: true,
//       }}>
//       {config.tabs.map(tab => (
//         <Tab.Screen
//           key={tab.name} // ✅ Use name as key
//           name={tab.name} // ✅ Use name prop (matches navigator names)
//           component={tab.component}
//           options={{
//             tabBarLabel: tab.label, // ✅ Display label on tab bar
//             tabBarIcon: ({focused}) => (
//               <Text style={{fontSize: 22}}>{tab.icon(focused)}</Text>
//             ),
//           }}
//         />
//       ))}
//     </Tab.Navigator>
//   );
// }

import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {useAuth} from '../context/AuthContext';

import Feather from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Entypo from 'react-native-vector-icons/Entypo';

/* ===== SCREENS ===== */
import TeamHome from '../screens/TeamScreens/TeamHome';
import TeamProfile from '../screens/TeamScreens/TeamProfileScreen';
import OrganiserProfileScreen from '../screens/organiser/OrganiserProfileScreen';
import PlayerHome from '../screens/PlayerHome';
import MatchNavigator from './MatchNavigator';
import TournamentNavigator from './TournamentNavigator';
import ProfileNavigator from './ProfileNavigator';
import OrganiserDashboardScreen from '../screens/organiser/OrganiserDashboardScreen';

const Tab = createBottomTabNavigator();

/* ===== ROLES ===== */
const ROLES = {
  ORGANISER: 'organiser',
  TEAM: 'team',
  PLAYER: 'player',
};

/* ===== ROLE CONFIG ===== */
const roleConfig = {
  organiser: {
    defaultRoute: 'Dashboard',
    bottomTabs: [
      {name: 'Dashboard', label: 'Home', component: OrganiserDashboardScreen},
      {
        name: 'TournamentNavigator',
        label: 'Tournaments',
        component: TournamentNavigator,
      },
      {name: 'Profile', label: 'Profile', component: OrganiserProfileScreen},
    ],
    hiddenRoutes: [{name: 'MatchNavigator', component: MatchNavigator}],
  },

  team: {
    defaultRoute: 'Dashboard',
    bottomTabs: [
      {name: 'Dashboard', label: 'Home', component: TeamHome},
      {name: 'MatchNavigator', label: 'Matches', component: MatchNavigator},
      {name: 'Profile', label: 'Profile', component: TeamProfile},
    ],
    hiddenRoutes: [
      {name: 'TournamentNavigator', component: TournamentNavigator},
    ],
  },

  player: {
    defaultRoute: 'Dashboard',
    bottomTabs: [
      {name: 'Dashboard', label: 'Home', component: PlayerHome},
      {name: 'MatchNavigator', label: 'Matches', component: MatchNavigator},
      {name: 'ProfileNavigator', label: 'Profile', component: ProfileNavigator},
    ],
    hiddenRoutes: [],
  },
};

/* ===== ICON RENDERER ===== */
function TabIcon({route, focused}) {
  const color = focused ? '#2563EB' : '#94A3B8';
  const size = 22;

  switch (route.name) {
    case 'Dashboard':
      return <Feather name="home" size={size} color={color} />;

    case 'MatchNavigator':
      return (
        <Ionicons
          name={focused ? 'football' : 'football-outline'}
          size={size}
          color={color}
        />
      );

    case 'TournamentNavigator':
      return <Entypo name="trophy" size={size} color={color} />;

    case 'Profile':
    case 'ProfileNavigator':
      return (
        <Ionicons
          name={focused ? 'person' : 'person-outline'}
          size={size}
          color={color}
        />
      );

    default:
      return null;
  }
}

/* ===== BOTTOM TABS ===== */
export default function BottomTabs() {
  const {user} = useAuth();
  const config = roleConfig[user?.role];
  if (!config) return null;

  return (
    <Tab.Navigator
      initialRouteName={config.defaultRoute}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: {paddingVertical: 4},
        tabBarLabelStyle: {display: 'none'},
      }}>
      {config.bottomTabs.map(tab => (
        <Tab.Screen
          key={tab.name}
          name={tab.name}
          component={tab.component}
          options={{
            tabBarShowLabel: false,
            tabBarIcon: ({focused}) => (
              <View style={[styles.tabItem, focused && styles.tabItemActive]}>
                <TabIcon route={{name: tab.name}} focused={focused} />
                {focused && <Text style={styles.activeLabel}>{tab.label}</Text>}
              </View>
            ),
          }}
        />
      ))}

      {(config.hiddenRoutes || []).map(route => (
        <Tab.Screen
          key={route.name}
          name={route.name}
          component={route.component}
          options={{tabBarButton: () => null}}
        />
      ))}
    </Tab.Navigator>
  );
}

/* ===== STYLES ===== */
const styles = StyleSheet.create({
  tabBar: {
    height: 70,
    paddingBottom: 8,
    paddingTop: 6,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 0,
    elevation: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },

  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
  },

  tabItemActive: {
    backgroundColor: '#EEF2FF',
  },

  activeLabel: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
  },
});
