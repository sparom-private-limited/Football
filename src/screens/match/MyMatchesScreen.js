import {useState, useCallback, useRef, useEffect} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Animated,
} from 'react-native';
import {getMyMatches} from '../../api/match.api';
import useNavigationHelper from '../../navigation/Navigationhelper';
import {useAuth} from '../../context/AuthContext';
import {s, vs, ms, rf} from '../../utils/responsive';
import { useIsFocused } from '@react-navigation/native';

export default function MyMatchesScreen({type, route}) {
  const nav = useNavigationHelper();
    const isFocused = useIsFocused(); // ✅ Now this will work
  
  const matchType = type || route?.params?.type;
  const {user} = useAuth();

  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigatingRef = useRef(false);

  useEffect(() => {
      if (isFocused) {
        loadMatches();
      }
    }, [isFocused]);

  const loadMatches = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getMyMatches();
      const isUpcoming = matchType?.toUpperCase() === 'UPCOMING';
      const filtered = (res.data.data || []).filter(m =>
        isUpcoming
          ? ['PENDING', 'ACCEPTED', 'LIVE'].includes(m.status)
          : ['COMPLETED', 'CANCELLED', 'REJECTED'].includes(m.status),
      );
      setMatches(filtered);
    } catch (err) {
      if (err.response?.status === 403) {
        setError('Access denied. Please login to view matches.');
      } else if (err.response?.status === 404) {
        if (user?.role === 'team') {
          setError('Team not found. Please create a team first.');
        } else if (user?.role === 'player') {
          setError('Player profile not found. Please complete your profile.');
        } else {
          setError('Profile not found.');
        }
      } else if (err.response?.status === 401) {
        setError('Session expired. Please login again.');
      } else {
        setError(err.response?.data?.message || 'Failed to load matches');
      }
    } finally {
      setLoading(false);
    }
  }, [matchType, user]);

  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading matches...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <View style={styles.errorIcon}>
          <Text style={styles.errorIconText}>!</Text>
        </View>
        <Text style={styles.errorTitle}>Oops!</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={loadMatches} style={styles.retryButton}>
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const getPlayerTeam = match => {
    if (user?.role !== 'player') return null;
    return null;
  };

  const renderItem = ({item, index}) => {
    const isCompleted = item.status === 'COMPLETED';
    const isLive = item.status === 'LIVE';
    const isCancelled = item.status === 'CANCELLED';
    const playerTeam = user?.role === 'player' ? getPlayerTeam(item) : null;

    const handlePress = () => {
      if (navigatingRef.current) return;
      navigatingRef.current = true;
      if (isCompleted) {
        nav.toMatch('MatchSummary', {matchId: item._id});
      } else if (isLive) {
        nav.toMatch('MatchConsole', {matchId: item._id});
      } else {
        nav.toMatch('MatchDetail', {matchId: item._id});
      }
      setTimeout(() => {
        navigatingRef.current = false;
      }, 400);
    };

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        style={[styles.card, isCancelled && styles.cancelledCard]}
        onPress={handlePress}>
        {/* Live pulse indicator */}
        {isLive && (
          <View style={styles.liveBanner}>
            <View style={styles.liveDot} />
            <Text style={styles.liveBannerText}>LIVE NOW</Text>
          </View>
        )}

        {/* Teams Row */}
        <View style={styles.teamsRow}>
          {/* Home Team */}
          <View style={styles.teamBlock}>
            <TeamLogo team={item.homeTeam} />
            <Text style={styles.teamName} numberOfLines={2}>
              {item.homeTeam?.teamName || 'Home'}
            </Text>
            {playerTeam === 'home' && <YouBadge />}
          </View>

          {/* Center Score / VS */}
          <View style={styles.centerBlock}>
            {isCompleted || isLive ? (
              <View style={styles.scoreContainer}>
                <Text style={styles.scoreNum}>{item.score?.home ?? 0}</Text>
                <Text style={styles.scoreSep}>:</Text>
                <Text style={styles.scoreNum}>{item.score?.away ?? 0}</Text>
              </View>
            ) : (
              <View style={styles.vsContainer}>
                <Text style={styles.vs}>VS</Text>
              </View>
            )}
            <StatusBadge status={item.status} />
          </View>

          {/* Away Team */}
          <View style={styles.teamBlock}>
            <TeamLogo team={item.awayTeam} />
            <Text style={styles.teamName} numberOfLines={2}>
              {item.awayTeam?.teamName || 'Away'}
            </Text>
            {playerTeam === 'away' && <YouBadge />}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.cardFooter}>
          <Text style={styles.calendarIcon}>🗓</Text>
          <Text style={styles.meta}>
            {new Date(item.scheduledAt).toLocaleString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <FlatList
      data={matches}
      keyExtractor={item => item._id}
      renderItem={renderItem}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🏟️</Text>
          <Text style={styles.emptyTitle}>No matches found</Text>
          <Text style={styles.emptySubtitle}>
            {matchType === 'UPCOMING'
              ? 'No upcoming matches scheduled yet.'
              : 'No past matches to show.'}
          </Text>
        </View>
      }
    />
  );
}

/* ---------- Small Components ---------- */

function YouBadge() {
  return (
    <View style={styles.youBadge}>
      <Text style={styles.youBadgeText}>YOU</Text>
    </View>
  );
}

function StatusBadge({status}) {
  const config = {
    PENDING:   {bg: '#FEF3C7', text: '#92400E', label: 'Pending'},
    ACCEPTED:  {bg: '#D1FAE5', text: '#065F46', label: 'Accepted'},
    LIVE:      {bg: '#DCFCE7', text: '#14532D', label: '● Live'},
    COMPLETED: {bg: '#DBEAFE', text: '#1E3A8A', label: 'Done'},
    CANCELLED: {bg: '#F1F5F9', text: '#475569', label: 'Cancelled'},
    REJECTED:  {bg: '#FEE2E2', text: '#7F1D1D', label: 'Rejected'},
  };
  const c = config[status] || config.CANCELLED;

  return (
    <View style={[styles.badge, {backgroundColor: c.bg}]}>
      <Text style={[styles.badgeText, {color: c.text}]}>{c.label}</Text>
    </View>
  );
}

function TeamLogo({team}) {
  return team?.teamLogoUrl ? (
    <Image source={{uri: team.teamLogoUrl}} style={styles.logo} />
  ) : (
    <View style={styles.logoFallback}>
      <Text style={styles.logoText}>{team?.teamName?.[0]?.toUpperCase() || 'T'}</Text>
    </View>
  );
}

/* ---------- Styles ---------- */
const styles = StyleSheet.create({
  listContent: {
    padding: s(16),
    paddingBottom: vs(32),
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: s(24),
  },

  loadingText: {
    marginTop: vs(12),
    color: '#94A3B8',
    fontSize: rf(14),
    fontWeight: '500',
  },

  // --- Card ---
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: ms(20),
    marginBottom: vs(14),
    overflow: 'hidden',
    shadowColor: '#1E3A8A',
    shadowOffset: {width: 0, height: vs(4)},
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#EEF2FF',
  },

  cancelledCard: {
    opacity: 0.55,
  },

  // --- Live banner ---
  liveBanner: {
    backgroundColor: '#DCFCE7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: vs(6),
    gap: s(6),
  },

  liveDot: {
    width: s(7),
    height: s(7),
    borderRadius: s(4),
    backgroundColor: '#16A34A',
  },

  liveBannerText: {
    color: '#15803D',
    fontSize: rf(11),
    fontWeight: '800',
    letterSpacing: 1.2,
  },

  // --- Teams row ---
  teamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: s(16),
    paddingTop: vs(20),
    paddingBottom: vs(12),
  },

  teamBlock: {
    width: s(88),
    alignItems: 'center',
    gap: vs(6),
  },

  teamName: {
    fontSize: rf(12),
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
    lineHeight: vs(16),
  },

  // --- Center ---
  centerBlock: {
    alignItems: 'center',
    gap: vs(8),
    flex: 1,
  },

  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(4),
  },

  scoreNum: {
    fontSize: ms(28),
    fontWeight: '900',
    color: '#0F172A',
    minWidth: s(28),
    textAlign: 'center',
  },

  scoreSep: {
    fontSize: ms(20),
    fontWeight: '700',
    color: '#94A3B8',
  },

  vsContainer: {
    width: s(44),
    height: s(44),
    borderRadius: s(22),
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },

  vs: {
    fontSize: rf(12),
    fontWeight: '900',
    color: '#64748B',
    letterSpacing: 1,
  },

  // --- Logos ---
  logo: {
    width: s(60),
    height: s(60),
    borderRadius: s(30),
    borderWidth: 2,
    borderColor: '#EEF2FF',
  },

  logoFallback: {
    width: s(60),
    height: s(60),
    borderRadius: s(30),
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#DBEAFE',
  },

  logoText: {
    fontSize: ms(22),
    fontWeight: '900',
    color: '#2563EB',
  },

  // --- Badge ---
  badge: {
    paddingHorizontal: s(10),
    paddingVertical: vs(3),
    borderRadius: ms(20),
  },

  badgeText: {
    fontSize: rf(10),
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // --- Footer ---
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: vs(10),
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: s(6),
    backgroundColor: '#FAFBFF',
  },

  calendarIcon: {
    fontSize: rf(12),
  },

  meta: {
    color: '#64748B',
    fontSize: rf(11),
    fontWeight: '600',
  },

  // --- YOU badge ---
  youBadge: {
    backgroundColor: '#2563EB',
    paddingHorizontal: s(8),
    paddingVertical: vs(2),
    borderRadius: ms(10),
  },

  youBadgeText: {
    color: '#FFFFFF',
    fontSize: rf(9),
    fontWeight: '800',
    letterSpacing: 0.8,
  },

  // --- Empty ---
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: vs(60),
  },

  emptyIcon: {
    fontSize: ms(48),
    marginBottom: vs(12),
  },

  emptyTitle: {
    fontSize: rf(18),
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: vs(6),
  },

  emptySubtitle: {
    fontSize: rf(13),
    color: '#94A3B8',
    textAlign: 'center',
    paddingHorizontal: s(32),
    lineHeight: vs(20),
  },

  // --- Error ---
  errorIcon: {
    width: s(56),
    height: s(56),
    borderRadius: s(28),
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: vs(12),
  },

  errorIconText: {
    fontSize: ms(26),
    fontWeight: '900',
    color: '#EF4444',
  },

  errorTitle: {
    fontSize: rf(20),
    fontWeight: '900',
    color: '#1E293B',
    marginBottom: vs(6),
  },

  errorText: {
    color: '#64748B',
    fontSize: rf(14),
    textAlign: 'center',
    marginBottom: vs(20),
    paddingHorizontal: s(32),
    lineHeight: vs(22),
  },

  retryButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: s(32),
    paddingVertical: vs(13),
    borderRadius: ms(14),
  },

  retryText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: rf(15),
    letterSpacing: 0.3,
  },
});