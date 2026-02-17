import React, {useState} from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';

import MyMatchesScreen from '../screens/match/MyMatchesScreen';
import CreateMatchScreen from '../screens/match/CreateMatchScreen';
import MatchDetailScreen from '../screens/match/MatchDetailScreen';
import MatchConsoleScreen from '../screens/match/MatchConsoleScreen';
import MatchSummaryScreen from '../screens/match/MatchSummaryScreen';
import MatchLineupScreen from '../screens/match/MatchLineupScreen';
import Header from '../components/Header/Header';

const Stack = createNativeStackNavigator();

// ✅ CUSTOM TAB BAR COMPONENT
function CustomTabBar({activeTab, onTabChange}) {
  return (
    <View style={styles.tabBar}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'UPCOMING' && styles.activeTab]}
        onPress={() => onTabChange('UPCOMING')}>
        <Text
          style={[
            styles.tabText,
            activeTab === 'UPCOMING' && styles.activeTabText,
          ]}>
          Upcoming
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'PAST' && styles.activeTab]}
        onPress={() => onTabChange('PAST')}>
        <Text
          style={[styles.tabText, activeTab === 'PAST' && styles.activeTabText]}>
          Past
        </Text>
      </TouchableOpacity>

      {/* Active indicator */}
      <View
        style={[
          styles.indicator,
          {left: activeTab === 'UPCOMING' ? '0%' : '50%'},
        ]}
      />
    </View>
  );
}

// ✅ MAIN MATCHES SCREEN WITH CUSTOM TABS
function MatchTabsScreen() {
  const [activeTab, setActiveTab] = useState('UPCOMING');

  return (
    <View style={styles.container}>
      <Header title="My Matches" forceBack />
      
      <CustomTabBar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Render screen based on active tab */}
      <View style={styles.content}>
        {activeTab === 'UPCOMING' ? (
          <MyMatchesScreen type="UPCOMING" />
        ) : (
          <MyMatchesScreen type="PAST" />
        )}
      </View>
    </View>
  );
}

export default function MatchNavigator() {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="MyMatches" component={MatchTabsScreen} />
      <Stack.Screen name="CreateMatch" component={CreateMatchScreen} />
      <Stack.Screen name="MatchDetail" component={MatchDetailScreen} />
      <Stack.Screen
        name="MatchConsole"
        component={MatchConsoleScreen}
        options={{
          gestureEnabled: false,
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="MatchSummary"
        component={MatchSummaryScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen name="MatchLineup" component={MatchLineupScreen} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    position: 'relative',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTab: {
    // Optional: add background if desired
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  activeTabText: {
    color: '#2563EB',
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    width: '50%',
    height: 3,
    backgroundColor: '#2563EB',
  },
});