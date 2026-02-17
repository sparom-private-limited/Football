import React, {useEffect, useState, useRef} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import API from '../../api/api';
import MainLayout from '../../components/MainLayout';
import useNavigationHelper from '../../navigation/Navigationhelper';
import AppRefreshView from '../../components/AppRefreshView';

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
        <View style={styles.container}>
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
        </View>
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

function WarningBtn({label, onPress}) {
  return (
    <TouchableOpacity style={styles.warningBtn} onPress={onPress}>
      <Text style={styles.primaryBtnText}>{label}</Text>
    </TouchableOpacity>
  );
}

function StatusBadge({status}) {
  const colorMap = {
    DRAFT: '#94A3B8',
    REGISTRATION_OPEN: '#22C55E',
    REGISTRATION_CLOSED: '#F97316',
    FIXTURES_GENERATED: '#2563EB',
    LIVE: '#DC2626',
    COMPLETED: '#64748B',
  };

  return (
    <View style={styles.badge}>
      <Text style={[styles.badgeText, {color: colorMap[status] || '#475569'}]}>
        {status.replaceAll('_', ' ')}
      </Text>
    </View>
  );
}

function Empty({text}) {
  return <Text style={styles.emptyText}>{text}</Text>;
}

function ProfileBanner({onPress}) {
  return (
    <View style={styles.banner}>
      <View>
        <Text style={styles.bannerTitle}>Complete your organiser profile</Text>
        <Text style={styles.bannerText}>
          Unlock tournament creation & management features.
        </Text>
      </View>

      <TouchableOpacity style={styles.bannerBtn} onPress={onPress}>
        <Text style={styles.bannerBtnText}>Complete Profile</Text>
      </TouchableOpacity>
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

function MatchCard({item, nav}) {
  return (
    <TouchableOpacity
      style={styles.matchCard}
      onPress={() => nav.toMatch('MatchDetail', {matchId: item._id})}>
      <Text style={styles.matchTitle}>
        {item.homeTeam.teamName} vs {item.awayTeam.teamName}
      </Text>
      <StatusBadge status={item.status} />
    </TouchableOpacity>
  );
}

function StatCard({label, value}) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#F8FAFC',
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  heroHeader: {
    marginBottom: 18,
  },

  heroTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#020617',
    letterSpacing: 0.3,
  },

  heroSub: {
    marginTop: 6,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },

  profileBanner: {
    backgroundColor: '#EEF2FF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 22,
    borderLeftWidth: 4,
    borderLeftColor: '#2563EB',
  },

  profileTitle: {
    color: '#1E293B',
    fontSize: 16,
    fontWeight: '800',
  },

  profileText: {
    marginTop: 4,
    color: '#475569',
    fontSize: 13,
  },

  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    color: '#0F172A',
  },

  card: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },

  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },

  metaText: {
    marginTop: 4,
    fontSize: 12,
    color: '#64748B',
  },

  matchCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },

  matchTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },

  emptyText: {
    color: '#94A3B8',
    fontSize: 13,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  viewAll: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563EB',
  },

  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
  },

  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },

  primaryBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },

  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  warningBtn: {
    backgroundColor: '#F97316',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  /* EMPTY STATE */
  emptyCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 3,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },

  emptyText: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 16,
    textAlign: 'center',
  },

  tournamentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    elevation: 6,

    shadowColor: '#000',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.08,
    shadowRadius: 10,

    borderLeftWidth: 4,
    borderLeftColor: '#2563EB', // default
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },

  tournamentName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#020617',
    flex: 1,
    marginRight: 8,
  },

  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },

  metaText: {
    fontSize: 12,
    color: '#475569',
  },
  metaMuted: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 24,
  },

  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 20,
    alignItems: 'center',

    elevation: 6,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },

  statValue: {
    fontSize: 26,
    fontWeight: '900',
    color: '#020617',
  },

  statLabel: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    letterSpacing: 0.4,
  },
});
