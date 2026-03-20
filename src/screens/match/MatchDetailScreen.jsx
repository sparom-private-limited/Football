import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Image,
  ScrollView,
} from 'react-native';
import {useRoute, useNavigation, useIsFocused} from '@react-navigation/native';

import {getMatchById, respondToMatch, cancelMatch} from '../../api/match.api';
import API from '../../api/api';
import {useAuth} from '../../context/AuthContext';
import useNavigationHelper from '../../navigation/Navigationhelper';
import MainLayout from '../../components/MainLayout';
import LinearGradient from 'react-native-linear-gradient';
import {s, vs, ms, rf} from '../../utils/responsive';

export default function MatchDetailScreen() {
  const isFocused = useIsFocused();
  const route = useRoute();
  const nav = useNavigationHelper();
  const {user} = useAuth();

  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [myTeam, setMyTeam] = useState(null);

  const matchId = route.params?.matchId;

  useEffect(() => {
    if (isFocused && matchId) {
      loadInitial(); // reload match data every time screen is focused
    }
  }, [isFocused]);

  /* -------------------- PARAM GUARD -------------------- */
  useEffect(() => {
    if (!matchId) {
      console.log('❌ Missing matchId, redirecting');
      nav.replace('MyMatches');
      return;
    }
    loadInitial();
  }, [matchId]);

  /* -------------------- LOAD DATA -------------------- */
  const loadInitial = async () => {
    try {
      const matchRes = await getMatchById(matchId);
      setMatch(matchRes.data);

      // ✅ ONLY load team if user is a team role
      if (user?.role === 'team') {
        try {
          const teamRes = await API.get('/api/team/my-team');
          setMyTeam(teamRes.data);
        } catch (teamErr) {
          console.log('Team not found for team user:', teamErr);
          Alert.alert('No Team Found', 'You need to create a team first.', [
            {text: 'OK', onPress: () => nav.back()},
          ]);
          return;
        }
      } else {
        setMyTeam({});
      }
    } catch (e) {
      console.error('❌ LOAD ERROR:', e.response?.data || e.message);
      Alert.alert('Error', 'Failed to load match details');
      nav.back();
    } finally {
      setLoading(false);
    }
  };

  /* -------------------- START MATCH -------------------- */
  const handleStartMatch = async () => {
    // Pre-flight validation
    const homeLineup = match.lineups?.home;
    const awayLineup = match.lineups?.away;

    const isHomeSubmitted = homeLineup?.submittedAt;
    const isAwaySubmitted = awayLineup?.submittedAt;

    if (!isHomeSubmitted || !isAwaySubmitted) {
      Alert.alert(
        'Cannot Start Match',
        'Both teams must submit their lineups before the match can start.\n\n' +
          `${match.homeTeam.teamName}: ${isHomeSubmitted ? '✅' : '❌'}\n` +
          `${match.awayTeam.teamName}: ${isAwaySubmitted ? '✅' : '❌'}`,
      );
      return;
    }

    Alert.alert(
      'Start Match?',
      'Once started, lineups cannot be changed and the match timer will begin.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Start Match',
          style: 'default',
          onPress: confirmStartMatch,
        },
      ],
    );
  };

  const confirmStartMatch = async () => {
    setActionLoading(true);
    try {
      const response = await API.post('/api/match/start', {matchId});

      // Just replace current screen with MatchConsole
      nav.replace('MatchConsole', {matchId});
    } catch (e) {
      console.error('START MATCH ERROR:', e.response?.data || e.message);
      Alert.alert(
        'Cannot Start Match',
        e.response?.data?.message || 'Unable to start match. Please try again.',
      );
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = date =>
    new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  const formatTime = date =>
    new Date(date).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  /* -------------------- LOADER -------------------- */
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1D4ED8" />
      </View>
    );
  }

  /* -------------------- DATA SAFETY -------------------- */
  if (!match) {
    return (
      <View style={styles.center}>
        <Text>Loading match data…</Text>
      </View>
    );
  }

  /* -------------------- PERMISSIONS -------------------- */

  const isTournamentMatch = !!match.tournamentId;
  const isCreator = match.createdBy?._id === user?._id;
  const isOrganiser = user?.role === 'organiser';

  // ✅ Define mySide FIRST before using it
  const mySide =
    myTeam && myTeam._id
      ? myTeam._id.toString() === match.homeTeam?._id?.toString()
        ? 'home'
        : myTeam._id.toString() === match.awayTeam?._id?.toString()
        ? 'away'
        : null
      : null;

  // ✅ Use .toString() for ObjectId comparison
  const isMyTeam = mySide !== null;
  const isOpponent = user?.role === 'team' && !isCreator && isMyTeam;

  // Who can start match?
  const canStartMatch = isTournamentMatch ? isOrganiser : isCreator;

  // ✅ Now mySide is defined so these work correctly
  const myAcceptance = mySide ? match.acceptance?.[mySide] : false;
  const myTeamAccepted = mySide ? match.acceptance?.[mySide] : false;

  const showRespond = match.status === 'PENDING' && isOpponent && !myAcceptance;
  const showCancel =
    ['PENDING', 'ACCEPTED'].includes(match.status) &&
    isCreator &&
    !isTournamentMatch;
  const showStart = match.status === 'ACCEPTED' && canStartMatch;

  const myLineupSubmitted = mySide && match.lineups?.[mySide]?.submittedAt;
  const canEditLineup = mySide && !['LIVE', 'COMPLETED'].includes(match.status);

  const showWaitingForOpponent =
    isTournamentMatch && match.status === 'PENDING' && myTeamAccepted;

  /* -------------------- ACTIONS -------------------- */
  const handleAccept = async () => {
    setActionLoading(true);
    try {
      await respondToMatch({
        matchId,
        action: 'ACCEPT',
      });

      // Refresh and go back
      const updated = await getMatchById(matchId);
      setMatch(updated.data);
      nav.back();
    } catch (e) {
      console.error('❌ ACCEPT ERROR:', e.response?.data || e.message);
      Alert.alert(
        'Error',
        e.response?.data?.message || 'Failed to accept match',
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    Alert.alert(
      'Reject Match?',
      'Are you sure you want to reject this match request?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              await respondToMatch({
                matchId,
                action: 'REJECT',
                reason: 'Rejected by opponent',
              });
              await loadInitial();
            } catch (e) {
              console.error('❌ REJECT ERROR:', e.response?.data || e.message);
              Alert.alert(
                'Error',
                e.response?.data?.message || 'Reject failed',
              );
            } finally {
              setActionLoading(false);
            }
          },
        },
      ],
    );
  };

  const handleCancel = async () => {
    Alert.alert('Cancel Match?', 'This action cannot be undone.', [
      {text: 'No', style: 'cancel'},
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: async () => {
          setActionLoading(true);
          try {
            await cancelMatch({matchId});
            await loadInitial();
          } catch (e) {
            console.error('❌ CANCEL ERROR:', e.response?.data || e.message);
            Alert.alert('Error', e.response?.data?.message || 'Cancel failed');
          } finally {
            setActionLoading(false);
          }
        },
      },
    ]);
  };

  const getCountdown = date => {
    const diff = new Date(date) - new Date();
    if (diff <= 0) return null;

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff / (1000 * 60)) % 60);

    return `${hours}h ${mins}m`;
  };
  /* -------------------- UI -------------------- */
  return (
    <MainLayout title="Match Details">
      <ScrollView style={styles.container}>
        {/* HEADER CARD */}
        <View style={styles.heroCard}>
          <LinearGradient
            colors={['#2563EB', '#4477e5']}
            style={styles.heroGradient}>
            <View style={styles.heroTeamsRow}>
              <TeamBlock team={match.homeTeam} />

              <View style={styles.centerScore}>
                {match.status === 'LIVE' || match.status === 'COMPLETED' ? (
                  <Text style={styles.heroScore}>
                    {match.score?.home ?? 0} : {match.score?.away ?? 0}
                  </Text>
                ) : (
                  <Text style={styles.heroVS}>VS</Text>
                )}
              </View>

              <TeamBlock team={match.awayTeam} />
            </View>

            <View style={styles.heroBottom}>
              <View style={{alignItems: 'center'}}>
                <StatusBadge status={match.status} />
              </View>
              <Text style={styles.heroDate}>
                {formatDate(match.scheduledAt)} •{' '}
                {formatTime(match.scheduledAt)}
              </Text>
              <Text style={styles.heroVenue}>📍 {match.venue || 'TBD'}</Text>
            </View>
          </LinearGradient>
        </View>

        {/* MATCH INFO */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Match Info</Text>

          <View style={styles.infoGrid}>
            <InfoTile label="Format" value={match.format} />
            <InfoTile label="Type" value={match.matchType} />
            <InfoTile label="Round" value={match.round || '—'} />
            <InfoTile label="Created" value={formatDate(match.createdAt)} />
          </View>
        </View>

        {showWaitingForOpponent && (
          <Text style={styles.helperText}>
            ✅ You have accepted. Waiting for opponent to accept...
          </Text>
        )}
        {/* LINEUP STATUS CARD */}
        {/* LINEUP STATUS CARD */}
        {(match.status === 'ACCEPTED' ||
          (isTournamentMatch && match.status === 'PENDING')) && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Lineup Status</Text>
            <LineupStatus
              teamName={match.homeTeam.teamName}
              submitted={!!match.lineups?.home?.submittedAt}
            />
            <LineupStatus
              teamName={match.awayTeam.teamName}
              submitted={!!match.lineups?.away?.submittedAt}
            />
          </View>
        )}

        {/* ACTION BUTTONS */}
        {showRespond && (
          <View style={styles.row}>
            <ActionBtn
              label="Accept"
              color="#22C55E"
              loading={actionLoading}
              onPress={handleAccept}
              flex
            />
            <ActionBtn
              label="Reject"
              color="#EF4444"
              loading={actionLoading}
              onPress={handleReject}
              flex
            />
          </View>
        )}

        {showCancel && (
          <ActionBtn
            label="Cancel Match"
            color="#64748B"
            loading={actionLoading}
            onPress={handleCancel}
          />
        )}

        {showStart && (
          <ActionBtn
            label="🚀 Start Match"
            color="#1D4ED8"
            loading={actionLoading}
            onPress={handleStartMatch}
          />
        )}

        {canEditLineup && (
          <ActionBtn
            label={myLineupSubmitted ? 'View Lineup' : 'Add Lineup'}
            color="#2563EB"
            onPress={() => nav.toMatch('MatchLineup', {matchId})}
          />
        )}

        {/* HELPER TEXT */}
        {!canStartMatch && match.status === 'ACCEPTED' && (
          <Text style={styles.helperText}>
            {isTournamentMatch
              ? '⏳ Waiting for tournament organiser to start the match'
              : '⏳ Waiting for match creator to start the match'}
          </Text>
        )}

        {getCountdown(match.scheduledAt) && (
          <View style={styles.countdownBox}>
            <Text style={styles.countdownText}>
              Starts in {getCountdown(match.scheduledAt)}
            </Text>
          </View>
        )}
      </ScrollView>
    </MainLayout>
  );
}

/* ---------- Small Components ---------- */

function LineupStatus({teamName, submitted}) {
  return (
    <View style={styles.lineupStatusRow}>
      <Text style={styles.teamName}>{teamName}</Text>
      <View
        style={[
          styles.statusDot,
          submitted ? styles.statusDotGreen : styles.statusDotRed,
        ]}
      />
      <Text
        style={[
          styles.statusText,
          submitted ? styles.statusTextGreen : styles.statusTextRed,
        ]}>
        {submitted ? 'Submitted' : 'Pending'}
      </Text>
    </View>
  );
}

function ActionBtn({label, color, loading, onPress, flex}) {
  return (
    <TouchableOpacity
      style={[
        styles.btn,
        {backgroundColor: color},
        flex && {flex: 1, width: undefined},
      ]}
      onPress={onPress}
      disabled={loading}>
      {loading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <Text style={styles.text}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

function StatusBadge({status}) {
  const map = {
    PENDING: '#FACC15',
    ACCEPTED: '#22C55E',
    REJECTED: '#EF4444',
    CANCELLED: '#64748B',
    LIVE: '#3B82F6',
    COMPLETED: '#8B5CF6',
  };
  return (
    <View style={[styles.badge, {backgroundColor: map[status] || '#64748B'}]}>
      <Text style={styles.badgeText}>{status}</Text>
    </View>
  );
}

function TeamBlock({team}) {
  return (
    <View style={styles.teamBlockModern}>
      <Image source={{uri: team?.teamLogoUrl}} style={styles.heroLogo} />
      <Text style={styles.heroTeamName}>{team?.teamName}</Text>
    </View>
  );
}

function InfoTile({label, value}) {
  return (
    <View style={styles.infoTile}>
      <Text style={styles.tileLabel}>{label}</Text>
      <Text style={styles.tileValue}>{value}</Text>
    </View>
  );
}

/* ---------- Styles ---------- */

// const styles = StyleSheet.create({
// scroll: { flex: 1, backgroundColor: '#F1F5F9' },

// container: { padding: 16, paddingBottom: 30 },

//   center: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },

//   /* ---------- HERO CARD ---------- */

//   heroCard: {
//     borderRadius: 24,
//     overflow: 'hidden',
//     marginBottom: 20,
//   },

//   heroGradient: {
//     padding: 22,
//   },

//   heroTeamsRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//   },

//   heroLogo: {
//     width: 80,
//     height: 80,
//     borderRadius: 40,
//     borderWidth: 3,
//     borderColor: '#FFFFFF',
//   },

//   heroTeamName: {
//     color: '#FFFFFF',
//     fontWeight: '700',
//     marginTop: 8,
//     fontSize: 14,
//     textAlign: 'center',
//   },

//   heroScore: {
//     fontSize: 26,
//     fontWeight: '900',
//     color: '#FFFFFF',
//   },

//   heroVS: {
//     fontSize: 18,
//     fontWeight: '700',
//     color: '#DBEAFE',
//   },

//   heroBottom: {
//     marginTop: 20,
//     alignItems: 'center',
//   },

//   heroDate: {
//     color: '#E0F2FE',
//     marginTop: 6,
//     fontSize: 14,
//   },

//   heroVenue: {
//     color: '#BFDBFE',
//     fontSize: 13,
//     marginTop: 2,
//   },

//   /* ---------- CARD ---------- */

//   card: {
//     backgroundColor: '#FFFFFF',
//     borderRadius: 18,
//     padding: 18,
//     marginBottom: 16,
//     shadowColor: '#000',
//     shadowOpacity: 0.04,
//     shadowRadius: 6,
//     elevation: 2,
//   },

//   sectionTitle: {
//     fontSize: 16,
//     fontWeight: '700',
//     color: '#0F172A',
//     marginBottom: 12,
//   },

//   /* ---------- INFO GRID ---------- */

//   infoGrid: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     justifyContent: 'space-between',
//   },

//   infoTile: {
//     width: '48%',
//     backgroundColor: '#F8FAFC',
//     padding: 14,
//     borderRadius: 16,
//     marginBottom: 14,
//   },

//   tileLabel: {
//     fontSize: 12,
//     color: '#6B7280',
//   },

//   tileValue: {
//     fontSize: 16,
//     fontWeight: '800',
//     marginTop: 4,
//     color: '#111827',
//   },

//   /* ---------- LINEUP STATUS ---------- */

//   lineupStatusRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 8,
//   },

//   teamName: {
//     flex: 1,
//     color: '#0F172A',
//     fontWeight: '600',
//   },

//   statusDot: {
//     width: 8,
//     height: 8,
//     borderRadius: 4,
//     marginRight: 6,
//   },

//   statusDotGreen: {
//     backgroundColor: '#22C55E',
//   },

//   statusDotRed: {
//     backgroundColor: '#EF4444',
//   },

//   statusText: {
//     fontSize: 14,
//     fontWeight: '600',
//   },

//   statusTextGreen: {
//     color: '#22C55E',
//   },

//   statusTextRed: {
//     color: '#EF4444',
//   },

//   /* ---------- BUTTONS ---------- */

//   row: {
//     flexDirection: 'row',
//     gap: 12,
//     marginBottom: 12,
//   },

//  btn: {
//   width: '100%',
//   paddingVertical: 15,
//   borderRadius: 12,
//   alignItems: 'center',
//   justifyContent: 'center',
//   marginBottom: 12,
// },

//   text: {
//     color: '#FFFFFF',
//     fontSize: 16,
//     fontWeight: '600',
//   },

//   /* ---------- BADGE ---------- */

//   badge: {
//     alignSelf: 'flex-start',
//     paddingHorizontal: 10,
//     paddingVertical: 4,
//     borderRadius: 12,
//     marginTop: 4,
//   },

//   badgeText: {
//     color: '#fff',
//     fontWeight: '700',
//     fontSize: 12,
//   },

//   /* ---------- HELPERS ---------- */

//   helperText: {
//     textAlign: 'center',
//     color: '#64748B',
//     fontSize: 14,
//     fontStyle: 'italic',
//     marginTop: 8,
//   },

//  countdownBox: {
//   marginTop: 12,
//   backgroundColor: '#DBEAFE',      // light blue bg
//   paddingVertical: 12,
//   paddingHorizontal: 20,
//   borderRadius: 12,
//   alignItems: 'center',
//   alignSelf: 'stretch',            // full width
//   borderWidth: 1,
//   borderColor: '#BFDBFE',
//   marginBottom: 20,
// },
// countdownText: {
//   color: '#1E3A8A',                // dark blue text
//   fontWeight: '700',
//   fontSize: 15,
//   letterSpacing: 0.3,
// },
// });

const styles = StyleSheet.create({
  scroll: {flex: 1, backgroundColor: '#F1F5F9'},

  container: {padding: s(16), paddingBottom: vs(30)},

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* ---------- HERO CARD ---------- */

  heroCard: {
    borderRadius: ms(24),
    overflow: 'hidden',
    marginBottom: vs(20),
  },

  heroGradient: {
    padding: s(22),
  },

  heroTeamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  heroLogo: {
    width: s(80),
    height: s(80),
    borderRadius: s(40),
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },

  heroTeamName: {
    color: '#FFFFFF',
    fontWeight: '700',
    marginTop: vs(8),
    fontSize: rf(14),
    textAlign: 'center',
  },

  heroScore: {
    fontSize: ms(26),
    fontWeight: '900',
    color: '#FFFFFF',
  },

  heroVS: {
    fontSize: ms(18),
    fontWeight: '700',
    color: '#DBEAFE',
  },

  heroBottom: {
    marginTop: vs(20),
    alignItems: 'center',
  },

  heroDate: {
    color: '#E0F2FE',
    marginTop: vs(6),
    fontSize: rf(14),
  },

  heroVenue: {
    color: '#BFDBFE',
    fontSize: rf(13),
    marginTop: vs(2),
  },

  /* ---------- CARD ---------- */

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: ms(18),
    padding: s(18),
    marginBottom: vs(16),
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },

  sectionTitle: {
    fontSize: rf(16),
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: vs(12),
  },

  /* ---------- INFO GRID ---------- */

  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  infoTile: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    padding: s(14),
    borderRadius: ms(16),
    marginBottom: vs(14),
  },

  tileLabel: {
    fontSize: rf(12),
    color: '#6B7280',
  },

  tileValue: {
    fontSize: rf(16),
    fontWeight: '800',
    marginTop: vs(4),
    color: '#111827',
  },

  /* ---------- LINEUP STATUS ---------- */

  lineupStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: vs(8),
  },

  teamName: {
    flex: 1,
    color: '#0F172A',
    fontWeight: '600',
    fontSize: rf(14),
  },

  statusDot: {
    width: s(8),
    height: s(8),
    borderRadius: s(4),
    marginRight: s(6),
  },

  statusDotGreen: {
    backgroundColor: '#22C55E',
  },

  statusDotRed: {
    backgroundColor: '#EF4444',
  },

  statusText: {
    fontSize: rf(14),
    fontWeight: '600',
  },

  statusTextGreen: {
    color: '#22C55E',
  },

  statusTextRed: {
    color: '#EF4444',
  },

  /* ---------- BUTTONS ---------- */

  row: {
    flexDirection: 'row',
    gap: s(12),
    marginBottom: vs(12),
  },

  btn: {
    width: '100%',
    paddingVertical: vs(15),
    borderRadius: ms(12),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: vs(12),
  },

  text: {
    color: '#FFFFFF',
    fontSize: rf(16),
    fontWeight: '600',
  },

  /* ---------- BADGE ---------- */

  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: s(10),
    paddingVertical: vs(4),
    borderRadius: ms(12),
    marginTop: vs(4),
  },

  badgeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: rf(12),
  },

  /* ---------- HELPERS ---------- */

  helperText: {
    textAlign: 'center',
    color: '#64748B',
    fontSize: rf(14),
    fontStyle: 'italic',
    marginTop: vs(8),
  },

  countdownBox: {
    marginTop: vs(12),
    backgroundColor: '#DBEAFE',
    paddingVertical: vs(12),
    paddingHorizontal: s(20),
    borderRadius: ms(12),
    alignItems: 'center',
    alignSelf: 'stretch',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: vs(20),
  },

  countdownText: {
    color: '#1E3A8A',
    fontWeight: '700',
    fontSize: rf(15),
    letterSpacing: 0.3,
  },
});
