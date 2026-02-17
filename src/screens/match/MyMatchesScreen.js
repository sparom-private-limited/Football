import {useState, useCallback, useRef, useEffect} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';
import {getMyMatches} from '../../api/match.api';
import useNavigationHelper from '../../navigation/Navigationhelper';
import {useAuth} from '../../context/AuthContext'; 

export default function MyMatchesScreen({type, route}) {
  const nav = useNavigationHelper();
  const matchType = type || route?.params?.type;
  const {user} = useAuth(); 

  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); 
  const navigatingRef = useRef(false);

  const loadMatches = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await getMyMatches();

      const isUpcoming = matchType?.toUpperCase() === 'UPCOMING';

      const filtered = res.data.filter(m =>
        isUpcoming
          ? ['PENDING', 'ACCEPTED', 'LIVE'].includes(m.status)
          : ['COMPLETED', 'CANCELLED', 'REJECTED'].includes(m.status),
      );

      setMatches(filtered);
    } catch (err) {
      console.error(
        '❌ Error loading matches:',
        err.response?.status,
        err.response?.data?.message,
      );

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
    if (!matchType) {
      console.error('❌ Type parameter is missing!');
    }
    loadMatches();
  }, [loadMatches]);

  useEffect(() => {
    if (!type) {
      console.error('❌ Type parameter is missing!');
    }
    loadMatches();
  }, [loadMatches]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  // ← ADD ERROR STATE RENDERING
  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={loadMatches} style={styles.retryButton}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const getPlayerTeam = match => {
    if (user?.role !== 'player') return null;

    // This is a simplified version - you'll need player ID from context
    // For now, you can add this logic or skip it
    return null;
  };

  const renderItem = ({item}) => {
    const isCompleted = item.status === 'COMPLETED';
    const isLive = item.status === 'LIVE';

    // For players: determine which team they're in
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
        style={[
          styles.card,
          item.status === 'CANCELLED' && styles.cancelledCard,
        ]}
        onPress={handlePress}>
        <View style={styles.teamsRow}>
          {/* Home Team */}
          <View style={styles.teamBlock}>
            <TeamLogo team={item.homeTeam} />
            <Text style={styles.teamName} numberOfLines={1}>
              {item.homeTeam?.teamName || 'Home'}
            </Text>
            {playerTeam === 'home' && (
              <View style={styles.myTeamBadge}>
                <Text style={styles.myTeamText}>YOU</Text>
              </View>
            )}
          </View>

          {/* Score / VS */}
          <View style={styles.scoreBlock}>
            {item.status === 'COMPLETED' || item.status === 'LIVE' ? (
              <Text style={styles.score}>
                {item.score?.home ?? 0} : {item.score?.away ?? 0}
              </Text>
            ) : (
              <Text style={styles.vs}>VS</Text>
            )}
          </View>

          {/* Away Team */}
          <View style={styles.teamBlock}>
            <TeamLogo team={item.awayTeam} />
            <Text style={styles.teamName} numberOfLines={1}>
              {item.awayTeam?.teamName || 'Away'}
            </Text>
            {playerTeam === 'away' && (
              <View style={styles.myTeamBadge}>
                <Text style={styles.myTeamText}>YOU</Text>
              </View>
            )}
          </View>
        </View>

        <StatusBadge status={item.status} />

        <Text style={styles.meta}>
          {new Date(item.scheduledAt).toLocaleString()}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <FlatList
      data={matches}
      keyExtractor={item => item._id}
      renderItem={renderItem}
      contentContainerStyle={{padding: 16}}
      ListEmptyComponent={<Text style={styles.empty}>No matches found</Text>}
    />
  );
}

/* ---------- Small Components ---------- */

function StatusBadge({status}) {
  const colors = {
    PENDING: '#FACC15',
    ACCEPTED: '#22C55E',
    LIVE: '#10B981', // ← ADD THIS (was missing)
    COMPLETED: '#2563EB',
    CANCELLED: '#64748B',
    REJECTED: '#EF4444',
  };

  return (
    <View
      style={[styles.badge, {backgroundColor: colors[status] || '#64748B'}]}>
      <Text style={styles.badgeText}>{status}</Text>
    </View>
  );
}

function TeamLogo({team}) {
  return team?.teamLogoUrl ? (
    <Image source={{uri: team.teamLogoUrl}} style={styles.logo} />
  ) : (
    <View style={styles.logoFallback}>
      <Text style={styles.logoText}>{team?.teamName?.[0] || 'T'}</Text>
    </View>
  );
}

/* ---------- Styles ---------- */

const styles = StyleSheet.create({
  center: {flex: 1, justifyContent: 'center', alignItems: 'center'},

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  cancelledCard: {
    opacity: 0.6,
  },

  teamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  teamBlock: {
    width: 90,
    alignItems: 'center',
  },

  teamName: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
  },

  scoreBlock: {
    minWidth: 60,
    alignItems: 'center',
  },

  score: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },

  vs: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },

  logo: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },

  logoFallback: {
    width: 64, // ← FIXED: was 42, now matches logo size
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },

  logoText: {
    fontSize: 24, // ← Added size
    fontWeight: '800',
    color: '#374151',
  },

  meta: {
    textAlign: 'center',
    color: '#64748B',
    marginTop: 4,
    fontSize: 12,
  },

  badge: {
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 6,
  },

  badgeText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },

  empty: {
    textAlign: 'center',
    marginTop: 40,
    color: '#64748B',
    fontSize: 16,
  },

  // ← ADD ERROR STYLES
  errorText: {
    color: '#EF4444',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 32,
    lineHeight: 24,
  },

  retryButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },

  retryText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  myTeamBadge: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 4,
  },

  myTeamText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
});
