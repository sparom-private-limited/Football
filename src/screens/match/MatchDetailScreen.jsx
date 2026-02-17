import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';

import { getMatchById, respondToMatch, cancelMatch } from '../../api/match.api';
import API from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import useNavigationHelper from '../../navigation/Navigationhelper';
  
export default function MatchDetailScreen() {
  const route = useRoute();
const nav = useNavigationHelper();
  const { user } = useAuth();

  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [myTeam, setMyTeam] = useState(null);

  const matchId = route.params?.matchId;

  /* -------------------- PARAM GUARD -------------------- */
  useEffect(() => {
    if (!matchId) {
      console.log('❌ Missing matchId, redirecting');
      nav.replace("MyMatches");
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
            { text: 'OK', onPress: () => nav.back() },
          ]);
          return;
        }
      } else {
        // Organiser doesn't need a team
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
        { text: 'Cancel', style: 'cancel' },
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
      const response = await API.post('/api/match/start', { matchId });

      // Just replace current screen with MatchConsole
      nav.replace('MatchConsole', { matchId });

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

  // Team-specific checks
  const isMyTeam =
    myTeam && myTeam._id &&
    (myTeam._id === match.homeTeam?._id || myTeam._id === match.awayTeam?._id);

  const isOpponent = user?.role === 'team' && !isCreator && isMyTeam;

  // Who can start match?
  const canStartMatch = isTournamentMatch ? isOrganiser : isCreator;

  // Button visibility
  const showRespond = match.status === 'PENDING' && isOpponent;
  const showCancel =
    ['PENDING', 'ACCEPTED'].includes(match.status) &&
    isCreator &&
    !isTournamentMatch;
  const showStart = match.status === 'ACCEPTED' && canStartMatch;

  // Lineup management (only for teams)
  const mySide =
    isMyTeam && myTeam && myTeam._id
      ? myTeam._id === match.homeTeam._id
        ? 'home'
        : 'away'
      : null;

  const myLineupSubmitted = mySide && match.lineups?.[mySide]?.submittedAt;
  const canEditLineup = mySide && !['LIVE', 'COMPLETED'].includes(match.status);

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
        { text: 'Cancel', style: 'cancel' },
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
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: async () => {
          setActionLoading(true);
          try {
            await cancelMatch({ matchId });
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

  /* -------------------- UI -------------------- */
  return (
    <View style={styles.container}>
      {/* HEADER CARD */}
      <View style={styles.card}>
        <Text style={styles.title}>
          {match.homeTeam.teamName} vs {match.awayTeam.teamName}
        </Text>
        <StatusBadge status={match.status} />
        {isTournamentMatch && (
          <View style={styles.tournamentBadge}>
            <Text style={styles.tournamentText}>🏆 Tournament Match</Text>
          </View>
        )}
      </View>

      {/* MATCH INFO */}
      <View style={styles.card}>
        <Info
          label="Date"
          value={new Date(match.scheduledAt).toLocaleString()}
        />
        <Info label="Venue" value={match.venue || 'TBD'} />
        <Info label="Format" value={match.format} />
        <Info label="Type" value={match.matchType} />
      </View>

      {/* LINEUP STATUS CARD */}
      {match.status === 'ACCEPTED' && (
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
          />
          <ActionBtn
            label="Reject"
            color="#EF4444"
            loading={actionLoading}
            onPress={handleReject}
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
          onPress={() =>
            nav.toMatch('MatchLineup', { matchId })
          }
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
    </View>
  );
}

/* ---------- Small Components ---------- */

function Info({ label, value }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function LineupStatus({ teamName, submitted }) {
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
        ]}
      >
        {submitted ? 'Submitted' : 'Pending'}
      </Text>
    </View>
  );
}

function ActionBtn({ label, color, loading, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.btn, { backgroundColor: color }]}
      onPress={onPress}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <Text style={styles.text}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

function StatusBadge({ status }) {
  const map = {
    PENDING: '#FACC15',
    ACCEPTED: '#22C55E',
    REJECTED: '#EF4444',
    CANCELLED: '#64748B',
    LIVE: '#3B82F6',
    COMPLETED: '#8B5CF6',
  };
  return (
    <View style={[styles.badge, { backgroundColor: map[status] || '#64748B' }]}>
      <Text style={styles.badgeText}>{status}</Text>
    </View>
  );
}

/* ---------- Styles ---------- */

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#F1F5F9' },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  infoLabel: { color: '#64748B', fontWeight: '600' },
  infoValue: { color: '#0F172A', fontWeight: '700' },

  lineupStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },

  teamName: {
    flex: 1,
    color: '#0F172A',
    fontWeight: '600',
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },

  statusDotGreen: { backgroundColor: '#22C55E' },
  statusDotRed: { backgroundColor: '#EF4444' },

  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },

  statusTextGreen: { color: '#22C55E' },
  statusTextRed: { color: '#EF4444' },

  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },

  btn: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  text: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },

  badgeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },

  tournamentBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 8,
  },

  tournamentText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },

  helperText: {
    textAlign: 'center',
    color: '#64748B',
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 8,
  },
});