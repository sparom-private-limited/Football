import React, {useState, useRef} from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';

import MyMatchesScreen from '../screens/match/MyMatchesScreen';
import CreateMatchScreen from '../screens/match/CreateMatchScreen';
import MatchDetailScreen from '../screens/match/MatchDetailScreen';
import MatchConsoleScreen from '../screens/match/MatchConsoleScreen';
import MatchSummaryScreen from '../screens/match/MatchSummaryScreen';
import MatchLineupScreen from '../screens/match/MatchLineupScreen';
import Header from '../components/Header/Header';
import {rf, vs, s, ms} from '../utils/responsive';

const Stack = createNativeStackNavigator();

// ✅ CUSTOM TAB BAR
function CustomTabBar({activeTab, onTabChange}) {
  const animVal = useRef(new Animated.Value(activeTab === 'UPCOMING' ? 0 : 1)).current;

  const handleChange = tab => {
    Animated.spring(animVal, {
      toValue: tab === 'UPCOMING' ? 0 : 1,
      useNativeDriver: false,
      tension: 80,
      friction: 10,
    }).start();
    onTabChange(tab);
  };

  const indicatorLeft = animVal.interpolate({
    inputRange: [0, 1],
    outputRange: ['2%', '52%'],
  });

  return (
    <View style={styles.tabWrapper}>
      <View style={styles.tabBar}>
        {/* Animated pill background */}
        <Animated.View style={[styles.tabPill, {left: indicatorLeft}]} />

        <TouchableOpacity
          style={styles.tab}
          onPress={() => handleChange('UPCOMING')}
          activeOpacity={0.8}>
          <Text
            style={[
              styles.tabText,
              activeTab === 'UPCOMING' && styles.activeTabText,
            ]}>
            Upcoming
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tab}
          onPress={() => handleChange('PAST')}
          activeOpacity={0.8}>
          <Text
            style={[
              styles.tabText,
              activeTab === 'PAST' && styles.activeTabText,
            ]}>
            Past
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ✅ MAIN MATCHES SCREEN
function MatchTabsScreen() {
  const [activeTab, setActiveTab] = useState('UPCOMING');

  return (
    <View style={styles.container}>
      <Header title="My Matches" forceBack />
      <CustomTabBar activeTab={activeTab} onTabChange={setActiveTab} />
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
        options={{gestureEnabled: false, headerShown: false}}
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
    backgroundColor: '#F8FAFC',
  },

  content: {
    flex: 1,
  },

  // --- Tab Wrapper ---
  tabWrapper: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: s(16),
    paddingVertical: vs(10),
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2FF',
    shadowColor: '#1E3A8A',
    shadowOffset: {width: 0, height: vs(2)},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: ms(14),
    padding: vs(3),
    position: 'relative',
    height: vs(44),
  },

  // Animated sliding pill
  tabPill: {
    position: 'absolute',
    top: vs(3),
    width: '46%',
    height: vs(38),
    backgroundColor: '#2563EB',
    borderRadius: ms(11),
    shadowColor: '#2563EB',
    shadowOffset: {width: 0, height: vs(3)},
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },

  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },

  tabText: {
    fontSize: rf(14),
    fontWeight: '700',
    color: '#64748B',
  },

  activeTabText: {
    color: '#FFFFFF',
  },
});