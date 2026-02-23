import React, {useEffect, useState, useRef} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  ScrollView
} from 'react-native';
import API from '../../api/api';
import MainLayout from '../../components/MainLayout';
import useNavigationHelper from '../../navigation/Navigationhelper';
import AppRefreshView from '../../components/AppRefreshView';
import {s, vs, ms, rf} from '../../utils/responsive';

export default function OrganiserDashboardScreen() {
  const nav = useNavigationHelper();
  const isMounted = useRef(true);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [tournaments, setTournaments] = useState([]);
  const [matches, setMatches] = useState([]);
  const [profileComplete, setProfileComplete] = useState(true);

  useEffect(() => {
    loadDashboard();
    return () => {
      isMounted.current = false;
    };
  }, []);

  const loadDashboard = async () => {
    try {
      const [tRes, mRes, profileRes] = await Promise.all([
        API.get('/api/organiser/tournaments'),
        API.get('/api/organiser/getMatches'),
        API.get('/api/organiser/profile/status'),
      ]);

      if (!isMounted.current) return;

      const sortedTournaments = (tRes.data || []).sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      );

      setTournaments(sortedTournaments);

      setMatches(
        (mRes.data || []).filter(m => m.createdByRole === 'organiser'),
      );

      setProfileComplete(profileRes.data.complete);
    } catch (err) {
      if (isMounted.current) {
        Alert.alert(
          'Error',
          err.response?.data?.message || 'Failed to load dashboard',
        );
      }
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  const handleAction = async url => {
    try {
      await API.post(url);
      loadDashboard();
    } catch (err) {
      if (isMounted.current) {
        Alert.alert('Error', err.response?.data?.message || 'Action failed');
      }
    }
  };

  const renderMatch = ({item}) => (
    <TouchableOpacity
      style={styles.matchCard}
      onPress={() => nav.toMatch('MatchDetail', {matchId: item._id})}>
      <Text style={styles.matchTitle}>
        {item.homeTeam.teamName} vs {item.awayTeam.teamName}
      </Text>
      <StatusBadge status={item.status} />
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <AppRefreshView
      refreshing={refreshing}
      onRefresh={() => loadDashboard(true)}
      style={{flex: 1}}>
      <MainLayout title="Dashboard">
        <ScrollView style={styles.container}>
          {/* HERO HEADER */}
          <View style={styles.heroHeader}>
            <Text style={styles.heroTitle}>Organiser Dashboard</Text>
            <Text style={styles.heroSub}>Manage tournaments and matches</Text>
          </View>

          {/* PROFILE CTA */}
          {!profileComplete && (
            <TouchableOpacity
              style={styles.profileBanner}
              onPress={() => nav.to('OrganiserProfileScreen')}>
              <Text style={styles.profileTitle}>
                Complete your organiser profile
              </Text>
              <Text style={styles.profileText}>
                Required to create and manage tournaments
              </Text>
            </TouchableOpacity>
          )}

          {/* TOURNAMENTS */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Tournaments</Text>

            <TouchableOpacity onPress={() => nav.toTournament('MyTournaments')}>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>

          {tournaments.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No tournaments yet</Text>
              <Text style={styles.emptyText}>
                Create your first tournament to get started
              </Text>

              <PrimaryBtn
                label="Create Tournament"
                onPress={() => nav.toTournament('CreateTournament')}
                disabled={!profileComplete}
              />
            </View>
          ) : (
            <View style={{paddingHorizontal: 16}}>
              {tournaments.map(item => (
                <TournamentCard
                  key={item._id}
                  item={item}
                  onPress={() =>
                    nav.toTournament('TournamentDetail', {
                      tournamentId: item._id,
                    })
                  }
                />
              ))}
            </View>
          )}

          {/* <View style={styles.statRow}>
          <StatCard label="Tournaments" value={tournaments.length} />
          <StatCard label="Matches" value={matches.length} />
          <StatCard
            label="Live"
            value={matches.filter(m => m.status === 'LIVE').length}
          />
        </View> */}
        </ScrollView>
      </MainLayout>
    </AppRefreshView>
  );
}

/* ---------------- UI Components ---------------- */

function PrimaryBtn({label, onPress}) {
  return (
    <TouchableOpacity style={styles.primaryBtn} onPress={onPress}>
      <Text style={styles.primaryBtnText}>{label}</Text>
    </TouchableOpacity>
  );
}

function StatusBadge({status}) {
  const map = {
    DRAFT: {bg: '#F1F5F9', text: '#475569'},
    REGISTRATION_OPEN: {bg: '#DCFCE7', text: '#166534'},
    REGISTRATION_CLOSED: {bg: '#FEF3C7', text: '#92400E'},
    FIXTURES_GENERATED: {bg: '#DBEAFE', text: '#1D4ED8'},
    LIVE: {bg: '#FEE2E2', text: '#B91C1C'},
    COMPLETED: {bg: '#E2E8F0', text: '#334155'},
  };

  const colors = map[status] || map.DRAFT;

  return (
    <View style={[styles.badge, {backgroundColor: colors.bg}]}>
      <Text style={[styles.badgeText, {color: colors.text}]}>
        {status.replaceAll('_', ' ')}
      </Text>
    </View>
  );
}

function TournamentCard({item, onPress}) {
  return (
    <TouchableOpacity style={styles.tournamentCard} onPress={onPress}>
      {/* TOP ROW */}
      <View style={styles.cardHeader}>
        <Text style={styles.tournamentName} numberOfLines={2}>
          {item.name}
        </Text>
        <StatusBadge status={item.status} />
      </View>

      {/* META INFO */}
      <View style={styles.metaRow}>
        <Text style={styles.metaMuted}>Location · {item.location || '—'}</Text>
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.metaText}>👥 {item.teams?.length || 0} Teams</Text>
        <Text style={styles.metaText}>📅 {formatDate(item.startDate)}</Text>
      </View>
    </TouchableOpacity>
  );
}

function formatDate(date) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/* ---------------- STYLES ---------------- */

// const styles = StyleSheet.create({
//   container: {
//     paddingHorizontal: 10,
//     paddingTop: 16,
//     paddingBottom: 40,
//     backgroundColor: '#F1F5F9',
//   },

//   center: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },

//   /* ---------------- HERO ---------------- */

//   heroHeader: {
//     marginBottom: 28,
//   },

//   heroTitle: {
//     fontSize: 26,
//     fontWeight: '800',
//     color: '#0F172A',
//     letterSpacing: -0.3,
//   },

//   heroSub: {
//     marginTop: 6,
//     fontSize: 14,
//     color: '#64748B',
//   },

//   /* ---------------- PROFILE BANNER ---------------- */

//   profileBanner: {
//     backgroundColor: '#FFFFFF',
//     borderRadius: 20,
//     padding: 18,
//     marginBottom: 26,
//     borderWidth: 1,
//     borderColor: '#E2E8F0',
//   },

//   profileTitle: {
//     fontSize: 15,
//     fontWeight: '700',
//     color: '#0F172A',
//   },

//   profileText: {
//     marginTop: 4,
//     fontSize: 13,
//     color: '#64748B',
//   },

//   /* ---------------- SECTION ---------------- */

//   sectionHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 18,
//   },

//   sectionTitle: {
//     fontSize: 16,
//     fontWeight: '700',
//     color: '#0F172A',
//   },

//   viewAll: {
//     fontSize: 13,
//     fontWeight: '600',
//     color: '#2563EB',
//   },

//   /* ---------------- TOURNAMENT CARD ---------------- */

//   tournamentCard: {
//     backgroundColor: '#FFFFFF',
//     borderRadius: 22,
//     padding: 20,
//     marginBottom: 18,

//     shadowColor: '#0F172A',
//     shadowOffset: {width: 0, height: 4},
//     shadowOpacity: 0.04,
//     shadowRadius: 12,
//     elevation: 2,
//   },

//   cardHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'flex-start',
//     marginBottom: 14,
//   },

//   tournamentName: {
//     fontSize: 17,
//     fontWeight: '700',
//     color: '#0F172A',
//     flex: 1,
//     marginRight: 12,
//   },

//   metaRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginTop: 6,
//   },

//   metaText: {
//     fontSize: 13,
//     color: '#334155',
//   },

//   metaMuted: {
//     fontSize: 13,
//     color: '#64748B',
//   },

//   /* ---------------- STATUS BADGE ---------------- */

//   badge: {
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: 999,
//   },

//   badgeText: {
//     fontSize: 11,
//     fontWeight: '600',
//     letterSpacing: 0.4,
//   },

//   /* ---------------- PRIMARY BUTTON ---------------- */

//   primaryBtn: {
//     backgroundColor: '#2563EB',
//     paddingVertical: 12,
//     borderRadius: 14,
//     alignItems: 'center',
//     marginTop: 12,
//   },

//   primaryBtnText: {
//     color: '#FFFFFF',
//     fontSize: 14,
//     fontWeight: '600',
//   },

//   /* ---------------- EMPTY STATE ---------------- */

//   emptyCard: {
//     backgroundColor: '#FFFFFF',
//     padding: 26,
//     borderRadius: 22,
//     alignItems: 'center',
//     borderWidth: 1,
//     borderColor: '#E2E8F0',
//   },

//   emptyTitle: {
//     fontSize: 16,
//     fontWeight: '700',
//     color: '#0F172A',
//   },

//   emptyText: {
//     fontSize: 13,
//     color: '#64748B',
//     marginTop: 6,
//     textAlign: 'center',
//   },
// });


const styles = StyleSheet.create({
  container: {
    paddingHorizontal: s(10),
    paddingTop: vs(16),
    paddingBottom: vs(40),
    backgroundColor: '#F1F5F9',
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* ---------------- HERO ---------------- */

  heroHeader: {
    marginBottom: vs(28),
  },

  heroTitle: {
    fontSize: ms(26),
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },

  heroSub: {
    marginTop: vs(6),
    fontSize: rf(14),
    color: '#64748B',
  },

  /* ---------------- PROFILE BANNER ---------------- */

  profileBanner: {
    backgroundColor: '#FFFFFF',
    borderRadius: ms(20),
    padding: s(18),
    marginBottom: vs(26),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  profileTitle: {
    fontSize: rf(15),
    fontWeight: '700',
    color: '#0F172A',
  },

  profileText: {
    marginTop: vs(4),
    fontSize: rf(13),
    color: '#64748B',
  },

  /* ---------------- SECTION ---------------- */

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: vs(18),
  },

  sectionTitle: {
    fontSize: rf(16),
    fontWeight: '700',
    color: '#0F172A',
  },

  viewAll: {
    fontSize: rf(13),
    fontWeight: '600',
    color: '#2563EB',
  },

  /* ---------------- TOURNAMENT CARD ---------------- */

  tournamentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: ms(22),
    padding: s(20),
    marginBottom: vs(18),
    shadowColor: '#0F172A',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: vs(14),
  },

  tournamentName: {
    fontSize: rf(17),
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
    marginRight: s(12),
  },

  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: vs(6),
  },

  metaText: {
    fontSize: rf(13),
    color: '#334155',
  },

  metaMuted: {
    fontSize: rf(13),
    color: '#64748B',
  },

  /* ---------------- STATUS BADGE ---------------- */

  badge: {
    paddingHorizontal: s(12),
    paddingVertical: vs(6),
    borderRadius: ms(999),
  },

  badgeText: {
    fontSize: rf(11),
    fontWeight: '600',
    letterSpacing: 0.4,
  },

  /* ---------------- PRIMARY BUTTON ---------------- */

  primaryBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: vs(12),
    borderRadius: ms(14),
    alignItems: 'center',
    marginTop: vs(12),
  },

  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: rf(14),
    fontWeight: '600',
  },

  /* ---------------- EMPTY STATE ---------------- */

  emptyCard: {
    backgroundColor: '#FFFFFF',
    padding: s(26),
    borderRadius: ms(22),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  emptyTitle: {
    fontSize: rf(16),
    fontWeight: '700',
    color: '#0F172A',
  },

  emptyText: {
    fontSize: rf(13),
    color: '#64748B',
    marginTop: vs(6),
    textAlign: 'center',
  },
});