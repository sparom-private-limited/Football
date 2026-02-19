import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import API from '../api/api';
import MainLayout from '../components/MainLayout';
import useNavigationHelper from '../navigation/Navigationhelper';
import {s, vs, ms, rf} from '../utils/responsive';

export default function PlayerHome() {
  const nav = useNavigationHelper();
  const [loading, setLoading] = useState(true);
  const [isProfileCompleted, setIsProfileCompleted] = useState(false);
  const [player, setPlayer] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchPlayerDetails();
  }, []);

  const fetchPlayerDetails = async () => {
    try {
      const res = await API.get('/api/player/me');
      setIsProfileCompleted(res.data.isProfileCompleted);
      setUser(res.data.user);
      setPlayer(res.data.player);
    } catch (err) {
      console.log('PLAYER HOME ERROR:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <MainLayout title="Home">
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Home">
      <ScrollView contentContainerStyle={styles.container}>
        {/* PLAYER HEADER CARD */}
        {/* PLAYER HEADER CARD */}
        <View style={styles.profileCard}>
          <View style={styles.profileRow}>
            {/* AVATAR */}
            <View style={styles.avatarWrapper}>
              {player?.profileImageUrl ? (
                <Image
                  source={{uri: player.profileImageUrl}}
                  style={styles.avatar}
                />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarText}>
                    {user?.name?.[0]?.toUpperCase() || 'P'}
                  </Text>
                </View>
              )}
            </View>

            {/* INFO */}
            <View style={{flex: 1}}>
              <Text style={styles.playerName}>{user?.name}</Text>
              <Text style={styles.playerMeta}>
                {player?.position || 'Position'} •{' '}
                {player?.teamId ? 'Team Player' : 'Free Agent'}
              </Text>

              <View
                style={[
                  styles.statusBadge,
                  {backgroundColor: player?.teamId ? '#22C55E' : '#F97316'},
                ]}>
                <Text style={styles.statusText}>
                  {player?.teamId ? 'SIGNED' : 'FREE AGENT'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* PROFILE INCOMPLETE CTA */}
        {!isProfileCompleted && (
          <View style={styles.warningCard}>
            <Text style={styles.warningTitle}>Complete Your Profile</Text>
            <Text style={styles.warningText}>
              Complete your profile to join teams, matches and tournaments.
            </Text>

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => nav.toProfile('PlayerProfileEdit')}>
              <Text style={styles.primaryBtnText}>Complete Profile</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* QUICK ACTIONS */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsRow}>
          <ActionCard
            label="My Matches"
            onPress={() => nav.toMatch('MyMatches')}
          />
          <ActionCard label="My Stats" onPress={() => nav.toProfile('PlayerStats')} />
          <ActionCard
            label="Edit Profile"
            onPress={() => nav.toProfile('PlayerProfileEdit')}
          />
          <ActionCard
            label="Tournaments"
            onPress={() => nav.toTournament('JoinTournament')}
          />
        </View>

        {/* PERFORMANCE SNAPSHOT */}
        {player && (
          <>
            <Text style={styles.sectionTitle}>Performance</Text>
            <View style={styles.statsRow}>
              <StatBox label="Matches" value={player.matchesPlayed} />
              <StatBox label="Goals" value={player.goals} />
              <StatBox label="Assists" value={player.assists} />
            </View>
          </>
        )}
      </ScrollView>
    </MainLayout>
  );
}

/* ---------- Small Components ---------- */

function ActionCard({label, onPress}) {
  return (
    <TouchableOpacity style={styles.actionCard} onPress={onPress}>
      <Text style={styles.actionText}>{label}</Text>
    </TouchableOpacity>
  );
}

function StatBox({label, value}) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statValue}>{value ?? 0}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

/* ---------- Styles ---------- */

// const styles = StyleSheet.create({
//   container: {
//     padding: 16,
//     backgroundColor: '#F8FAFC',
//   },

//   center: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },

//   profileCard: {
//     backgroundColor: '#2665ec',
//     padding: 18,
//     borderRadius: 16,
//     marginBottom: 20,
//   },

//   playerName: {
//     fontSize: 22,
//     fontWeight: '800',
//     color: '#FFFFFF',
//   },

//   playerMeta: {
//     marginTop: 6,
//     color: '#DBEAFE',
//     fontWeight: '600',
//   },

//   statusBadge: {
//     alignSelf: 'flex-start',
//     marginTop: 10,
//     paddingHorizontal: 10,
//     paddingVertical: 4,
//     borderRadius: 20,
//   },

//   statusText: {
//     color: '#fff',
//     fontSize: 11,
//     fontWeight: '700',
//   },

//   warningCard: {
//     backgroundColor: '#FFF7ED',
//     padding: 16,
//     borderRadius: 14,
//     marginBottom: 22,
//   },

//   warningTitle: {
//     fontWeight: '700',
//     color: '#9A3412',
//     fontSize: 16,
//   },

//   warningText: {
//     marginTop: 6,
//     color: '#9A3412',
//     fontSize: 14,
//   },

//   primaryBtn: {
//     marginTop: 12,
//     backgroundColor: '#2563EB',
//     paddingVertical: 12,
//     borderRadius: 10,
//   },

//   primaryBtnText: {
//     color: '#fff',
//     textAlign: 'center',
//     fontWeight: '700',
//   },

//   sectionTitle: {
//     fontSize: 16,
//     fontWeight: '800',
//     marginBottom: 12,
//     color: '#0F172A',
//   },

//   actionsRow: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     gap: 12,
//     marginBottom: 24,
//   },

//   actionCard: {
//     width: '48%',
//     backgroundColor: '#fff',
//     paddingVertical: 18,
//     borderRadius: 14,
//     alignItems: 'center',
//     elevation: 2,
//   },

//   actionText: {
//     fontWeight: '700',
//     color: '#1E293B',
//   },

//   statsRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginBottom: 30,
//   },

//   statBox: {
//     width: '30%',
//     backgroundColor: '#fff',
//     padding: 16,
//     borderRadius: 14,
//     alignItems: 'center',
//     elevation: 2,
//   },

//   statValue: {
//     fontSize: 20,
//     fontWeight: '800',
//     color: '#2563EB',
//   },

//   statLabel: {
//     marginTop: 4,
//     color: '#64748B',
//     fontWeight: '600',
//   },
//   profileRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 14,
//   },

//   avatarWrapper: {
//     width: 80,
//     height: 80,
//     borderRadius: 32,
//     backgroundColor: '#DBEAFE',
//     alignItems: 'center',
//     justifyContent: 'center',
//     overflow: 'hidden',
//   },

//   avatar: {
//     width: '100%',
//     height: '100%',
//   },

//   avatarFallback: {
//     width: '100%',
//     height: '100%',
//     alignItems: 'center',
//     justifyContent: 'center',
//     backgroundColor: '#1D4ED8',
//   },

//   avatarText: {
//     color: '#FFFFFF',
//     fontSize: 26,
//     fontWeight: '800',
//   },
// });


const styles = StyleSheet.create({
  container: {
    padding: s(16),
    backgroundColor: '#F8FAFC',
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  profileCard: {
    backgroundColor: '#2665ec',
    padding: s(18),
    borderRadius: ms(16),
    marginBottom: vs(20),
  },

  playerName: {
    fontSize: ms(22),
    fontWeight: '800',
    color: '#FFFFFF',
  },

  playerMeta: {
    marginTop: vs(6),
    color: '#DBEAFE',
    fontWeight: '600',
    fontSize: rf(14),
  },

  statusBadge: {
    alignSelf: 'flex-start',
    marginTop: vs(10),
    paddingHorizontal: s(10),
    paddingVertical: vs(4),
    borderRadius: ms(20),
  },

  statusText: {
    color: '#fff',
    fontSize: rf(11),
    fontWeight: '700',
  },

  warningCard: {
    backgroundColor: '#FFF7ED',
    padding: s(16),
    borderRadius: ms(14),
    marginBottom: vs(22),
  },

  warningTitle: {
    fontWeight: '700',
    color: '#9A3412',
    fontSize: rf(16),
  },

  warningText: {
    marginTop: vs(6),
    color: '#9A3412',
    fontSize: rf(14),
  },

  primaryBtn: {
    marginTop: vs(12),
    backgroundColor: '#2563EB',
    paddingVertical: vs(12),
    borderRadius: ms(10),
  },

  primaryBtnText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '700',
    fontSize: rf(14),
  },

  sectionTitle: {
    fontSize: rf(16),
    fontWeight: '800',
    marginBottom: vs(12),
    color: '#0F172A',
  },

  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: s(12),
    marginBottom: vs(24),
  },

  actionCard: {
    width: '48%',
    backgroundColor: '#fff',
    paddingVertical: vs(18),
    borderRadius: ms(14),
    alignItems: 'center',
    elevation: 2,
  },

  actionText: {
    fontWeight: '700',
    color: '#1E293B',
    fontSize: rf(14),
  },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: vs(30),
  },

  statBox: {
    width: '30%',
    backgroundColor: '#fff',
    padding: s(16),
    borderRadius: ms(14),
    alignItems: 'center',
    elevation: 2,
  },

  statValue: {
    fontSize: ms(20),
    fontWeight: '800',
    color: '#2563EB',
  },

  statLabel: {
    marginTop: vs(4),
    color: '#64748B',
    fontWeight: '600',
    fontSize: rf(12),
  },

  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(14),
  },

  avatarWrapper: {
    width: s(80),
    height: s(80),
    borderRadius: ms(32),
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  avatar: {
    width: '100%',
    height: '100%',
  },

  avatarFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1D4ED8',
  },

  avatarText: {
    color: '#FFFFFF',
    fontSize: ms(26),
    fontWeight: '800',
  },
});