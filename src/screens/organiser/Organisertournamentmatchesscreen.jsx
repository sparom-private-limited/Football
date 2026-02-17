import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Image,
} from 'react-native';
import {useRoute, useNavigation} from '@react-navigation/native';
import API from '../../api/api';
import MainLayout from '../../components/MainLayout';
import useNavigationHelper from '../../navigation/Navigationhelper';

export default function OrganiserTournamentMatchesScreen() {
  const route = useRoute();
  const nav = useNavigationHelper();
  const {tournamentId, tournamentName} = route.params;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fixtures, setFixtures] = useState({});
  const [tournament, setTournament] = useState(null);
  const [totalMatches, setTotalMatches] = useState(0);
  const [advancing, setAdvancing] = useState(false);

  useEffect(() => {
    loadFixtures();
  }, []);

  const loadFixtures = async () => {
    try {
      const res = await API.get(`/api/tournament/${tournamentId}/fixtures`);

      setFixtures(res.data.fixtures || {});
      setTournament(res.data.tournament);
      setTotalMatches(res.data.totalMatches || 0);
    } catch (err) {
      console.error('Load fixtures error:', err);
      Alert.alert('Error', 'Failed to load fixtures');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadFixtures();
  };

  const advanceRound = async () => {
    Alert.alert(
      'Advance Round?',
      'This will create the next round of matches based on completed results.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Advance',
          onPress: async () => {
            setAdvancing(true);
            try {
              await API.post(`/api/tournament/${tournamentId}/advance-round`);
              Alert.alert('Success', 'Next round created');
              loadFixtures();
            } catch (err) {
              Alert.alert(
                'Error',
                err.response?.data?.message || 'Failed to advance round',
              );
            } finally {
              setAdvancing(false);
            }
          },
        },
      ],
    );
  };

  const navigateToMatch = match => {
    if (match.status === 'COMPLETED') {
      nav.toMatch('MatchSummary', {matchId: match._id});
    } else if (match.status === 'LIVE') {
      nav.toMatch('MatchConsole', {matchId: match._id});
    } else {
      nav.toMatch('MatchDetail', {matchId: match._id});
    }
  };
  const endTournament = async () => {
    // Check if all matches are completed
    const allMatches = Object.values(fixtures).flat();
    const incompleteMatches = allMatches.filter(
      m => m.status !== 'COMPLETED' && m.status !== 'CANCELLED',
    );

    if (incompleteMatches.length > 0) {
      Alert.alert(
        'Cannot End Tournament',
        `${incompleteMatches.length} match(es) are still in progress. Please complete or cancel all matches before ending the tournament.`,
        [{text: 'OK'}],
      );
      return;
    }

    Alert.alert(
      'End Tournament?',
      'This will complete the tournament and declare a winner. This action cannot be undone.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'End Tournament',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await API.post(`/api/tournament/${tournamentId}/end`);

              Alert.alert(
                '🏆 Tournament Ended!',
                res.data.tournament.winner
                  ? `Winner: ${res.data.tournament.winner.teamName}\n\nCongratulations!`
                  : 'Tournament completed successfully',
                [
                  {
                    text: 'View Details',
                    onPress: () => {
                      nav.back(); // Go back to tournament detail
                    },
                  },
                ],
              );
            } catch (err) {
              Alert.alert(
                'Error',
                err.response?.data?.message || 'Failed to end tournament',
              );
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <MainLayout title="Fixtures">
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      </MainLayout>
    );
  }

  const isKnockout = tournament?.format === 'KNOCKOUT';
  const roundKeys = Object.keys(fixtures).sort((a, b) => Number(a) - Number(b));

  return (
    <MainLayout title="">
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        {/* ===== HEADER ===== */}
        <View style={styles.topHeader}>
          <View>
            <Text style={styles.title}>{tournament?.name}</Text>
            <Text style={styles.subtitle}>{tournament?.format}</Text>
          </View>

          {tournament?.status === 'LIVE' && (
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>Live</Text>
            </View>
          )}
        </View>

        {/* ===== HERO CARD ===== */}
        <View style={styles.heroCard}>
          <View style={styles.heroContent}>
            <View style={styles.heroLeft}>
              <View style={styles.metaRow}>
                <Text style={styles.metaText}>
                  {tournament?.format} • {totalMatches} matches
                </Text>

                {tournament?.status === 'FIXTURES_GENERATED' && (
                  <View style={styles.generatedBadge}>
                    <Text style={styles.generatedText}>FIXTURES GENERATED</Text>
                  </View>
                )}
              </View>

              <Text style={styles.heroTitle}>
                {isKnockout ? 'Knockout Stage' : 'League Stage'}
              </Text>

              {/* <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => nav.to('TournamentBracket', {tournamentId})}>
                <Text style={styles.primaryBtnText}>View Bracket</Text>
              </TouchableOpacity> */}
            </View>
          </View>
        </View>

        {/* ===== UPCOMING MATCH ===== */}
        <Text style={styles.sectionTitle}>Upcoming Matches</Text>

        {roundKeys.map(roundNum => {
          const roundMatches = fixtures[roundNum] || [];

          return roundMatches.map(match => (
            <MatchCard
              key={match._id}
              match={match}
              onPress={() => navigateToMatch(match)}
            />
          ));
        })}

        {/* ===== ACTIONS ===== */}
        {isKnockout && tournament?.status === 'LIVE' && (
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={advanceRound}
            disabled={advancing}>
            <Text style={styles.secondaryBtnText}>
              {advancing ? 'Creating...' : 'Advance to Next Round'}
            </Text>
          </TouchableOpacity>
        )}

        {tournament?.status === 'LIVE' && (
          <TouchableOpacity style={styles.dangerBtn} onPress={endTournament}>
            <Text style={styles.dangerBtnText}>End Tournament</Text>
          </TouchableOpacity>
        )}

        <View style={{height: 100}} />
      </ScrollView>
    </MainLayout>
  );
}

function MatchCard({match, onPress}) {
  const formatDate = date => {
    const d = new Date(date);

    const day = d.getDate().toString().padStart(2, '0');
    const month = d.toLocaleString('en-IN', {month: 'short'});
    const year = d.getFullYear();

    const time = d.toLocaleString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    return `${day} ${month} ${year} • ${time}`;
  };
  console.log('MATCH DATA:', match);
  console.log('SCHEDULED AT:', match?.scheduledAt);

  const renderLogo = team => {
    if (team?.teamLogoUrl) {
      return <Image source={{uri: team.teamLogoUrl}} style={styles.teamLogo} />;
    }

    return (
      <View style={styles.logoFallback}>
        <Text style={styles.logoFallbackText}>{team?.teamName?.charAt(0)}</Text>
      </View>
    );
  };

  return (
    <TouchableOpacity style={styles.matchCard} onPress={onPress}>
    <View style={styles.matchTopRow}>
  <View style={{ flex: 1 }}>
    <Text style={styles.dateText}>
      {new Date(match.scheduledAt).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })}
    </Text>
    <Text style={styles.timeText}>
      {new Date(match.scheduledAt).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      })}
    </Text>
  </View>

  <MatchStatusBadge status={match.status} />
</View>

      <View style={styles.matchTeamsRow}>
        {/* HOME */}
        <View style={styles.teamRowCompact}>
          {renderLogo(match.homeTeam)}
          <Text
            style={styles.teamNameCompact}
            numberOfLines={3}
            ellipsizeMode="tail">
            {match.homeTeam.teamName}
          </Text>
        </View>

        {/* VS / SCORE */}
        <View style={styles.centerBlock}>
          <Text style={styles.vsText}>
            {match.status === 'COMPLETED'
              ? `${match.score.home} - ${match.score.away}`
              : 'VS'}
          </Text>
        </View>

        {/* AWAY */}
        <View style={[styles.teamRowCompact, {justifyContent: 'flex-end'}]}>
          <Text
            style={styles.teamNameCompact}
            numberOfLines={3}
            ellipsizeMode="tail">
            {match.awayTeam.teamName}
          </Text>
          {renderLogo(match.awayTeam)}
        </View>
      </View>

      {match.venue && <Text style={styles.venueModern}>📍 {match.venue}</Text>}
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
    <View
      style={[
        styles.statusBadge,
        {backgroundColor: colorMap[status] || '#64748B'},
      ]}>
      <Text style={styles.statusText}>
        {status?.replace(/_/g, ' ') || 'Unknown'}
      </Text>
    </View>
  );
}

function MatchStatusBadge({status}) {
  const config = {
    PENDING: {color: '#F59E0B', label: 'Pending'},
    ACCEPTED: {color: '#10B981', label: 'Accepted'},
    LIVE: {color: '#DC2626', label: 'Live'},
    COMPLETED: {color: '#6B7280', label: 'Completed'},
    CANCELLED: {color: '#64748B', label: 'Cancelled'},
  };

  const {color, label} = config[status] || {
    color: '#64748B',
    label: status,
  };

  return (
    <View style={[styles.matchStatusBadge, {backgroundColor: color}]}>
      <Text style={styles.matchStatusText}>{label}</Text>
    </View>
  );
}

function getKnockoutRoundName(roundNum, totalRounds) {
  const remainingRounds = totalRounds - roundNum + 1;

  if (remainingRounds === 1) return '🏆 Final';
  if (remainingRounds === 2) return 'Semi-Finals';
  if (remainingRounds === 3) return 'Quarter-Finals';
  return `Round of ${Math.pow(2, remainingRounds)}`;
}

// ================= STYLES =================

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 20,
  },

  topHeader: {
    paddingHorizontal: 20,
    paddingTop: 20,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
  },

  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 6,
  },

  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },

  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFF',
    marginRight: 6,
  },

  liveText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 12,
  },

  heroCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 20,
    padding: 20,
    backgroundColor: '#EEF2FF',
  },

  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginTop: 12,
    marginBottom: 18,
    color: '#111827',
  },

  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  metaText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
  },

  generatedBadge: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },

  generatedText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },

  primaryBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 18,
    alignSelf: 'flex-start',
  },

  primaryBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginHorizontal: 20,
    marginBottom: 16,
    color: '#111827',
  },

  matchCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },

  matchTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  teamRowModern: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  teamModern: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },
  matchTeamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  teamRowCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },

  teamNameCompact: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    flexShrink: 1,
  },

  teamBlock: {
    flex: 1,
    alignItems: 'center',
  },
  teamNameModern: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  centerBlock: {
    width: 70,
    alignItems: 'center',
  },

  vsText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2563EB',
  },
  vsModern: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563EB',
    marginHorizontal: 10,
  },

  venueModern: {
    marginTop: 10,
    fontSize: 12,
    color: '#64748B',
  },
  teamLogo: {
    width: 45,
    height: 45,
    borderRadius: 25,
  },
  logoFallback: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoFallbackText: {
    fontWeight: '800',
    color: '#111827',
    fontSize: 30,
  },
  secondaryBtn: {
    marginHorizontal: 20,
    backgroundColor: '#E5E7EB',
    paddingVertical: 18,
    borderRadius: 18,
    alignItems: 'center',
    marginBottom: 18,
  },

  secondaryBtnText: {
    fontWeight: '700',
    color: '#111827',
    fontSize: 15,
  },

  dangerBtn: {
    marginHorizontal: 20,
    backgroundColor: '#DC2626',
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: 'center',
  },

  dangerBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 16,
  },

  matchStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: '#9CA3AF',
    alignSelf: 'flex-start', // prevents vertical stretch
  },
  matchStatusText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
  matchStage: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  dateText: {
  fontSize: 13,
  fontWeight: '700',
  color: '#111827',
},

timeText: {
  fontSize: 12,
  color: '#6B7280',
  marginTop: 2,
},
});
