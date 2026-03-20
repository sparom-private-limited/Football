import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Image} from 'react-native';
import {DrawerContentScrollView} from '@react-navigation/drawer';

import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Entypo from 'react-native-vector-icons/Entypo';
import Fontisto from 'react-native-vector-icons/Fontisto';

import {useAuth} from '../context/AuthContext';
import useNavigationHelper from '../navigation/Navigationhelper';

import {s, ms, vs, rf} from '../utils/responsive';

export default function CustomDrawer(props) {
  const nav = useNavigationHelper();
  const {user, logout, updateUser} = useAuth();
  const role = user?.role;

  const go = cb => {
    cb();
    props.navigation.closeDrawer();
  };

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}>
      {/* ===== BRAND ===== */}
      <View style={styles.brandWrap}>
        <View style={styles.brandLogo}>
          <Image
            source={require('../assets/logo2.png')}
            style={styles.brandLogoImg}
            resizeMode="cover"
          />
        </View>
        <Text style={styles.brandName}>FTBL-XI</Text>
      </View>

      {/* ===== PROFILE ===== */}
      <View style={styles.profileCard}>
        {user?.profileImage ? (
          <Image
            source={{uri: user.profileImage}}
            style={styles.avatar}
            onError={e => console.log('❌ Image failed:', e.nativeEvent.error)}
          />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.avatarInitial}>
              {(user?.name || 'U')[0].toUpperCase()}
            </Text>
          </View>
        )}
        <View style={{flex: 1}}>
          <Text style={styles.name}>{user?.name || user?.email || 'User'}</Text>
          <Text style={styles.sub}>{role?.toUpperCase()}</Text>
        </View>
      </View>

      {/* ===== MENU ===== */}
      <DrawerItem
        icon={<Feather name="home" size={20} color="#2563EB" />}
        label="Home"
        active
        onPress={() => go(() => nav.to('Dashboard'))}
      />

      {role === 'team' && (
        <>
          <DrawerItem
            icon={
              <Ionicons name="football-outline" size={20} color="#475569" />
            }
            label="Matches"
            onPress={() => go(() => nav.toMatch('MyMatches'))}
          />
          <DrawerItem
            icon={<Entypo name="trophy" size={20} color="#475569" />}
            label="Tournaments"
            onPress={() => go(() => nav.toTournament('JoinTournament'))}
          />
          <DrawerItem
            icon={<Ionicons name="people-outline" size={20} color="#475569" />}
            label="My Team"
            onPress={() => go(() => nav.to('TeamHome'))}
          />
        </>
      )}

      {role === 'organiser' && (
        <>
          <DrawerItem
            icon={<Entypo name="trophy" size={20} color="#475569" />}
            label="My Tournaments"
            onPress={() => go(() => nav.toTournament('MyTournaments'))}
          />
          <DrawerItem
            icon={
              <MaterialIcons
                name="add-circle-outline"
                size={22}
                color="#475569"
              />
            }
            label="Create Tournament"
            onPress={() => go(() => nav.toTournament('CreateTournament'))}
          />
        </>
      )}

      {role === 'player' && (
        <DrawerItem
          icon={
            <Ionicons name="stats-chart-outline" size={20} color="#475569" />
          }
          label="My Stats"
          onPress={() => go(() => nav.to('PlayerStats'))}
        />
      )}

      <View style={styles.divider} />

      {/* ===== ACCOUNT ===== */}
      <DrawerItem
        icon={<Fontisto name="person" size={18} color="#475569" />}
        label="Profile"
        onPress={() =>
          go(() => {
            if (role === 'organiser') nav.to('OrganiserProfileScreen');
            else nav.toProfile('TeamProfile');
          })
        }
      />

      {/* ===== LOGOUT ===== */}
      <TouchableOpacity style={styles.logout} onPress={logout}>
        <Ionicons name="log-out-outline" size={20} color="#DC2626" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <Text style={styles.version}>v1.0.0</Text>
    </DrawerContentScrollView>
  );
}

/* ===== DRAWER ITEM ===== */
function DrawerItem({icon, label, onPress, active}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.item, active && styles.itemActive]}>
      <View style={styles.iconWrap}>{icon}</View>
      <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#FFFFFF',
  },

  /* BRAND */
  brandWrap: {
    alignItems: 'center',
    paddingTop: vs(24),
    paddingBottom: vs(16),
  },

  brandLogo: {
    width: s(72),
    height: s(72),
    borderRadius: s(36), 
    overflow: 'hidden', 
    borderWidth: 2.5,
    marginBottom: vs(8),
    shadowColor: '#2563EB',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },

  brandLogoText: {
    fontSize: ms(22),
    color: '#FFFFFF',
    fontWeight: '900',
  },
  brandLogoImg: {
    width: '100%',
    height: '100%',
  },

  brandName: {
    fontSize: rf(15),
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.3,
  },
  /* PROFILE */
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: s(16),
    paddingVertical: vs(14),
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
  },

  avatar: {
    width: s(48),
    height: s(48),
    borderRadius: s(24),
    marginRight: s(12),
  },

  name: {
    fontSize: rf(15),
    fontWeight: '700',
    color: '#0F172A',
  },

  sub: {
    fontSize: rf(12),
    color: '#64748B',
    marginTop: vs(2),
  },

  /* ITEMS */
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: vs(14),
    paddingHorizontal: s(20),
    marginHorizontal: s(8),
    borderRadius: ms(12),
  },

  itemActive: {
    backgroundColor: '#EEF2FF',
  },

  iconWrap: {
    width: s(26),
    alignItems: 'center',
    marginRight: s(14),
  },

  label: {
    fontSize: rf(15),
    fontWeight: '600',
    color: '#1E293B',
  },

  labelActive: {
    color: '#2563EB',
  },

  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: vs(12),
    marginHorizontal: s(16),
  },

  /* LOGOUT */
  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: s(16),
    marginTop: 'auto',
  },

  logoutText: {
    marginLeft: s(14),
    fontSize: rf(15),
    fontWeight: '700',
    color: '#DC2626',
  },

  version: {
    textAlign: 'center',
    fontSize: rf(12),
    color: '#94A3B8',
    marginBottom: vs(16),
  },
  avatarFallback: {
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontSize: rf(18),
    fontWeight: '900',
  },
});
