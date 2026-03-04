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
import {CommonActions} from '@react-navigation/native';

import {s, vs, ms, rf} from '../utils/responsive';

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
          listeners={({navigation, route}) => ({
            tabPress: e => {
              // ✅ Special case for ProfileNavigator
              if (tab.name === 'ProfileNavigator') {
                e.preventDefault();
                navigation.navigate('ProfileNavigator', {
                  screen: 'PlayerProfileView',
                });
                return;
              }

              // ✅ Reset stack to root when re-tapping active tab
              const state = navigation.getState();
              const currentTab = state.routes[state.index];
              if (currentTab.name === tab.name) {
                navigation.dispatch(
                  CommonActions.reset({
                    index: 0,
                    routes: [{name: tab.name}],
                  }),
                );
              }
            },
          })}
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
    height: vs(70),
    paddingBottom: vs(8),
    paddingTop: vs(6),
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
    paddingHorizontal: s(14),
    paddingVertical: vs(8),
    borderRadius: ms(18),
  },

  tabItemActive: {
    backgroundColor: '#EEF2FF',
  },

  activeLabel: {
    marginLeft: s(6),
    fontSize: rf(12),
    fontWeight: '700',
    color: '#2563EB',
  },
});
