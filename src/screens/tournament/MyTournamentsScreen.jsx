import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  ScrollView
} from 'react-native';
import API from '../../api/api';
import MainLayout from '../../components/MainLayout';
import useNavigationHelper from '../../navigation/Navigationhelper';
import { s, vs, ms, rf } from '../../utils/responsive';

export default function MyTournamentsScreen() {
  const nav = useNavigationHelper();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const navigatingRef = useRef(false);

  const load = async () => {
    try {
      setLoading(true);
      const res = await API.get('/api/organiser/tournaments');

      const sorted = (res.data || []).sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      );

      setTournaments(sorted);
    } catch (err) {
      Alert.alert('Error', 'Failed to load tournaments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleAction = async (id, action) => {
    if (actionLoading) return;

    setActionLoading(true);
    try {
      await API.post(`/api/tournament/${id}/${action}`);
      await load();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

const renderItem = ({ item }) => {
  const teamsJoined = item.teams?.length || 0;
  const maxTeams = item.maxTeams || 0;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={styles.card}
      onPress={() =>
        nav.to('TournamentDetail', {
          tournamentId: item._id,
        })
      }
    >
      {/* HEADER */}
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {item.name}
        </Text>
        <StatusBadge status={item.status} />
      </View>

      {/* META */}
      <Text style={styles.cardMeta}>
        {item.format} • {item.category || 'Open'}
      </Text>

      {/* STATS ROW */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Teams</Text>
          <Text style={styles.statValue}>
            {teamsJoined} / {maxTeams || '∞'}
          </Text>
        </View>

        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Created</Text>
          <Text style={styles.statValue}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>

      {/* Progress if registration open */}
      {item.status === 'REGISTRATION_OPEN' && maxTeams > 0 && (
        <View style={styles.progressBg}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${(teamsJoined / maxTeams) * 100}%`,
              },
            ]}
          />
        </View>
      )}
    </TouchableOpacity>
  );
};

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (tournaments.length === 0) {
    return (
      <MainLayout title="My Tournaments" forceBack>
        <View style={styles.empty}>
          <Text style={styles.emptyText}>
            You haven’t created any tournaments yet
          </Text>

          <TouchableOpacity
            style={styles.createBtn}
            onPress={() => nav.to('CreateTournament')}
          >
            <Text style={styles.createBtnText}>Create Tournament</Text>
          </TouchableOpacity>
        </View>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="My Tournaments" forceBack>
      <FlatList
        data={tournaments}
        keyExtractor={item => item._id}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={async () => {
              if (!loading) await load();
            }}
          />
        }
        contentContainerStyle={{ paddingBottom: 80 }}
      />

      <TouchableOpacity
        style={styles.createBtn}
        onPress={() => nav.to('CreateTournament')}
      >
        <Text style={styles.createBtnText}>Create Tournament</Text>
      </TouchableOpacity>
    </MainLayout>
  );
}

function StatusBadge({ status }) {
  const colorMap = {
    DRAFT: '#94A3B8', // Gray
    REGISTRATION_OPEN: '#22C55E', // Green
    REGISTRATION_CLOSED: '#F97316', // Orange
    FIXTURES_GENERATED: '#2563EB', // Blue
    LIVE: '#DC2626', // Red
    COMPLETED: '#64748B', // Muted gray
  };

  return (
    <View style={styles.badge}>
      <Text
        style={[styles.badgeText, { color: colorMap[status] || '#475569' }]}
      >
        {status.replaceAll('_', ' ')}
      </Text>
    </View>
  );
}

function ActionBtn({ label, onPress, warning, loading }) {
  return (
    <TouchableOpacity
      style={[
        styles.actionBtn,
        warning && styles.actionBtnWarning,
        loading && { opacity: 0.6 },
      ]}
      disabled={loading}
      onPress={onPress}
    >
      <Text style={styles.actionBtnText}>{loading ? '...' : label}</Text>
    </TouchableOpacity>
  );
}

// const styles = StyleSheet.create({
//   center: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   btn: {
//     backgroundColor: '#2563EB',
//     paddingVertical: 12,
//     paddingHorizontal: 16,
//     borderRadius: 15,
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginBottom: 9,
//     marginHorizontal: 15,
//   },
//   btnText: {
//     color: '#FFFFFF',
//     fontSize: 18,
//     fontWeight: '600',
//   },

// card: {
//   backgroundColor: '#FFFFFF',
//   marginHorizontal: 20,
//   marginTop: 16,
//   padding: 20,
//   borderRadius: 20,
//   shadowColor: '#000',
//   shadowOpacity: 0.06,
//   shadowRadius: 12,
//   elevation: 3,
// },

// cardHeader: {
//   flexDirection: 'row',
//   justifyContent: 'space-between',
//   alignItems: 'center',
// },

// cardTitle: {
//   fontSize: 18,
//   fontWeight: '800',
//   color: '#111827',
//   flex: 1,
//   marginRight: 10,
// },

// cardMeta: {
//   marginTop: 8,
//   fontSize: 14,
//   color: '#6B7280',
// },

// statsRow: {
//   flexDirection: 'row',
//   justifyContent: 'space-between',
//   marginTop: 18,
// },

// statItem: {
//   flex: 1,
// },

// statLabel: {
//   fontSize: 12,
//   color: '#6B7280',
//   marginBottom: 4,
// },

// statValue: {
//   fontSize: 16,
//   fontWeight: '700',
//   color: '#111827',
// },

// progressBg: {
//   height: 6,
//   backgroundColor: '#E5E7EB',
//   borderRadius: 4,
//   marginTop: 16,
// },

// progressFill: {
//   height: 6,
//   backgroundColor: '#2563EB',
//   borderRadius: 4,
// },
//   row: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 12,
//   },

//   title: {
//     fontSize: 16,
//     fontWeight: '700',
//     color: '#0F172A',
//     flex: 1,
//     marginRight: 8,
//   },

//   empty: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 24,
//   },

//   emptyText: {
//     fontSize: 14,
//     color: '#64748B',
//     marginBottom: 16,
//     textAlign: 'center',
//   },
//  badge: {
//   paddingHorizontal: 12,
//   paddingVertical: 6,
//   borderRadius: 999,
//   backgroundColor: '#F1F5F9',
// },

// badgeText: {
//   fontSize: 12,
//   fontWeight: '700',
// },

//   actionRow: {
//     flexDirection: 'row',
//     justifyContent: 'flex-end',
//     marginTop: 8,
//   },

//   actionBtn: {
//     backgroundColor: '#2563EB',
//     paddingVertical: 6,
//     paddingHorizontal: 14,
//     borderRadius: 999,
//   },

//   actionBtnWarning: {
//     backgroundColor: '#F97316',
//   },

//   actionBtnText: {
//     color: '#FFFFFF',
//     fontSize: 13,
//     fontWeight: '600',
//   },
//  createBtn: {
//   position: 'absolute',
//   bottom: 24,
//   left: 20,
//   right: 20,
//   backgroundColor: '#2563EB',
//   paddingVertical: 18,
//   borderRadius: 22,
//   alignItems: 'center',
//   shadowColor: '#2563EB',
//   shadowOpacity: 0.4,
//   shadowRadius: 10,
//   elevation: 8,
// },

//   createBtnText: {
//     color: '#FFFFFF',
//     fontSize: 16,
//     fontWeight: '700',
//   },
// });


const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btn: {
    backgroundColor: '#2563EB',
    paddingVertical: vs(12),
    paddingHorizontal: s(16),
    borderRadius: ms(15),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: vs(9),
    marginHorizontal: s(15),
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: rf(18),
    fontWeight: '600',
  },

  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: s(20),
    marginTop: vs(16),
    padding: s(20),
    borderRadius: ms(20),
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  cardTitle: {
    fontSize: rf(18),
    fontWeight: '800',
    color: '#111827',
    flex: 1,
    marginRight: s(10),
  },

  cardMeta: {
    marginTop: vs(8),
    fontSize: rf(14),
    color: '#6B7280',
  },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: vs(18),
  },

  statItem: {
    flex: 1,
  },

  statLabel: {
    fontSize: rf(12),
    color: '#6B7280',
    marginBottom: vs(4),
  },

  statValue: {
    fontSize: rf(16),
    fontWeight: '700',
    color: '#111827',
  },

  progressBg: {
    height: vs(6),
    backgroundColor: '#E5E7EB',
    borderRadius: ms(4),
    marginTop: vs(16),
  },

  progressFill: {
    height: vs(6),
    backgroundColor: '#2563EB',
    borderRadius: ms(4),
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: vs(12),
  },

  title: {
    fontSize: rf(16),
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
    marginRight: s(8),
  },

  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: s(24),
  },

  emptyText: {
    fontSize: rf(14),
    color: '#64748B',
    marginBottom: vs(16),
    textAlign: 'center',
  },

  badge: {
    paddingHorizontal: s(12),
    paddingVertical: vs(6),
    borderRadius: ms(999),
    backgroundColor: '#F1F5F9',
  },

  badgeText: {
    fontSize: rf(12),
    fontWeight: '700',
  },

  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: vs(8),
  },

  actionBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: vs(6),
    paddingHorizontal: s(14),
    borderRadius: ms(999),
  },

  actionBtnWarning: {
    backgroundColor: '#F97316',
  },

  actionBtnText: {
    color: '#FFFFFF',
    fontSize: rf(13),
    fontWeight: '600',
  },

  createBtn: {
    position: 'absolute',
    bottom: vs(24),
    left: s(20),
    right: s(20),
    backgroundColor: '#2563EB',
    paddingVertical: vs(18),
    borderRadius: ms(22),
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },

  createBtnText: {
    color: '#FFFFFF',
    fontSize: rf(16),
    fontWeight: '700',
  },
});