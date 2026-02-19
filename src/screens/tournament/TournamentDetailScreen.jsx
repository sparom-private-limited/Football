import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Alert,
  TouchableOpacity,
  Image,
} from 'react-native';
import {useRoute, useNavigation, useIsFocused} from '@react-navigation/native';
import API from '../../api/api';
import MainLayout from '../../components/MainLayout';
import {useAuth} from '../../context/AuthContext';
import useNavigationHelper from '../../navigation/Navigationhelper';
import {s, vs, ms, rf} from '../../utils/responsive';

export default function TournamentDetailScreen() {
  const {params} = useRoute();
  const nav = useNavigationHelper();
  const {tournamentId} = params;

  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const isFocused = useIsFocused();
  const {user} = useAuth();

  const load = async () => {
    try {
      let res;

      if (user.role === 'team') {
        res = await API.get(`/api/tournament/${tournamentId}/teamView`);
      } else {
        res = await API.get(`/api/tournament/${tournamentId}`);
      }

      let tournamentData;
      let teamContext = null;

      if (user.role === 'team') {
        tournamentData = res.data.tournament;
        teamContext = res.data.teamContext;

        if (teamContext?.canViewManagement) {
          nav.replace('TeamTournamentDetail', {
            tournamentId: tournamentData._id,
          });
          return;
        }
      } else {
        tournamentData = res.data;
      }

      setTournament({
        ...tournamentData,
        teamContext,
      });
    } catch (err) {
      console.error(
        'Tournament load error:',
        err.response?.data || err.message,
      );

      Alert.alert('Error', 'Failed to load tournament', [
        {text: 'OK', onPress: () => nav.back()},
      ]);

      setTournament(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isFocused) {
      load();
    }
  }, [isFocused]);

  const handleAction = async action => {
    if (actionLoading) return;

    setActionLoading(true);
    try {
      await API.post(`/api/tournament/${tournamentId}/${action}`);
      await load();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <MainLayout title="Tournament Details" forceBack>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      </MainLayout>
    );
  }

  if (!tournament) {
    return (
      <MainLayout title="Tournament Details" forceBack>
        <View style={styles.center}>
          <Text style={styles.emptyText}>Tournament not available</Text>
        </View>
      </MainLayout>
    );
  }

  const isOrganiser = user.role === 'organiser';

  return (
    <MainLayout title="Tournament Details" forceBack>
      <ScrollView contentContainerStyle={styles.container}>
        {/* HEADER */}
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <Text style={styles.heroTitle}>{tournament.name}</Text>
            <StatusBadge status={tournament.status} />
          </View>

          <Text style={styles.heroMeta}>
            {tournament.format} • {tournament.category || 'Open'}
          </Text>

          <View style={styles.heroInfoRow}>
            <View style={styles.heroInfoBox}>
              <Text style={styles.heroLabel}>Venue</Text>
              <Text style={styles.heroValue}>{tournament.venue || 'TBA'}</Text>
            </View>

            <View style={styles.heroInfoBox}>
              <Text style={styles.heroLabel}>Dates</Text>
              <Text style={styles.heroValue}>
                {formatDate(tournament.startDate)} –{' '}
                {formatDate(tournament.endDate)}
              </Text>
            </View>
          </View>
        </View>

        {/* META INFO */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Overview</Text>
          </View>

          <View style={styles.infoRow}>
            <InfoItem label="Format" value={tournament.format} />
            <InfoItem
              label="Match duration"
              value={tournament.matchDuration || '40 mins'}
            />
          </View>

          <View style={styles.infoRow}>
            <InfoItem
              label="Entry fee"
              value={tournament.entryFee ? `₹${tournament.entryFee}` : 'Free'}
            />
            <InfoItem
              label="Prize pool"
              value={tournament.prizePool ? `₹${tournament.prizePool}` : '—'}
            />
          </View>
        </View>

        {/* REGISTRATION */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Registration</Text>
          </View>

          {/* 2 INFO PER ROW */}
          <View style={styles.infoRow}>
            <InfoItem
              label="Teams"
              value={`${tournament.teams.length} / ${
                tournament.maxTeams || '∞'
              }`}
            />
            <InfoItem
              label="Spots left"
              value={`${Math.max(
                0,
                (tournament.maxTeams || 0) - tournament.teams.length,
              )}`}
            />
          </View>

          {/* Optional Close Info */}
          {tournament.registrationEndsAt && (
            <View style={styles.infoRow}>
              <InfoItem
                label="Closes on"
                value={formatDate(tournament.registrationEndsAt)}
              />
              <InfoItem
                label="Max players"
                value={tournament.maxPlayersPerTeam || '—'}
              />
            </View>
          )}

          {/* Progress */}
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${
                    (tournament.teams.length / (tournament.maxTeams || 1)) * 100
                  }%`,
                },
              ]}
            />
          </View>

          {/* ACTIONS */}
          {isOrganiser && tournament.status === 'DRAFT' && (
            <ActionBtn
              label="Open Registration"
              loading={actionLoading}
              onPress={() => handleAction('open')}
            />
          )}

          {isOrganiser && tournament.status === 'REGISTRATION_OPEN' && (
            <ActionBtn
              label="Close Registration"
              warning
              loading={actionLoading}
              onPress={() => handleAction('close')}
            />
          )}

          {tournament.teamContext?.canJoin && (
            <ActionBtn
              label="Join Tournament"
              loading={actionLoading}
              onPress={async () => {
                try {
                  await API.post(`/api/tournament/${tournament._id}/join`);
                  nav.replace('TeamTournamentDetail', {
                    tournamentId: tournament._id,
                  });
                } catch (e) {
                  Alert.alert('Error', e.response?.data?.message);
                }
              }}
            />
          )}

          {tournament.teamContext &&
            !tournament.teamContext.canJoin &&
            tournament.teamContext.reason && (
              <Text style={styles.reasonText}>
                {tournament.teamContext.reason.replace(/_/g, ' ')}
              </Text>
            )}
        </View>

        {/* FIXTURES GENERATION */}
        {isOrganiser && tournament.status === 'REGISTRATION_CLOSED' && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Fixtures</Text>

            <ActionBtn
              label="Generate Fixtures"
              onPress={async () => {
                setActionLoading(true);
                try {
                  await API.post(
                    `/api/tournament/${tournament._id}/generate-fixtures`,
                  );
                  Alert.alert('Success', 'Fixtures generated successfully');
                  await load();
                } catch (err) {
                  Alert.alert(
                    'Error',
                    err.response?.data?.message ||
                      'Failed to generate fixtures',
                  );
                } finally {
                  setActionLoading(false);
                }
              }}
              loading={actionLoading}
            />
          </View>
        )}

        {/* WINNER DISPLAY (for COMPLETED tournaments) */}
        {tournament.status === 'COMPLETED' && tournament.winner && (
          <View style={[styles.card, styles.winnerCard]}>
            <Text style={styles.winnerTitle}>🏆 Tournament Winner</Text>
            <Text style={styles.winnerTeam}>{tournament.winner.teamName}</Text>

            {tournament.completedAt && (
              <Text style={styles.completedDate}>
                Completed:{' '}
                {new Date(tournament.completedAt).toLocaleDateString()}
              </Text>
            )}
          </View>
        )}

        {/* TOURNAMENT MANAGEMENT */}
        {isOrganiser &&
          ['FIXTURES_GENERATED', 'LIVE', 'COMPLETED'].includes(
            tournament.status,
          ) && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Management</Text>

              <ActionBtn
                label="View Fixtures & Matches"
                onPress={() =>
                  nav.to('OrganiserTournamentMatches', {
                    tournamentId: tournament._id,
                    tournamentName: tournament.name,
                  })
                }
              />

              {tournament.format === 'LEAGUE' && (
                <ActionBtn
                  label="View Standings"
                  onPress={() =>
                    nav.to('TournamentStandings', {
                      tournamentId: tournament._id,
                      tournamentName: tournament.name,
                    })
                  }
                />
              )}

              {tournament.status === 'FIXTURES_GENERATED' && (
                <ActionBtn
                  label="Start Tournament"
                  onPress={async () => {
                    setActionLoading(true);
                    try {
                      await API.post(`/api/tournament/${tournament._id}/start`);
                      Alert.alert('Success', 'Tournament started');
                      await load();
                    } catch (err) {
                      Alert.alert(
                        'Error',
                        err.response?.data?.message ||
                          'Failed to start tournament',
                      );
                    } finally {
                      setActionLoading(false);
                    }
                  }}
                  loading={actionLoading}
                />
              )}
            </View>
          )}

        {/* END TOURNAMENT (for LIVE tournaments) */}
        {isOrganiser && tournament.status === 'LIVE' && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Tournament Control</Text>

            <ActionBtn
              label="🏁 End Tournament"
              onPress={async () => {
                Alert.alert(
                  'End Tournament?',
                  'This will complete the tournament and declare a winner. This action cannot be undone.',
                  [
                    {text: 'Cancel', style: 'cancel'},
                    {
                      text: 'End Tournament',
                      style: 'destructive',
                      onPress: async () => {
                        setActionLoading(true);
                        try {
                          const res = await API.post(
                            `/api/tournament/${tournament._id}/end`,
                          );

                          Alert.alert(
                            'Tournament Ended!',
                            res.data.tournament.winner
                              ? `🏆 Winner: ${res.data.tournament.winner.teamName}`
                              : 'Tournament completed successfully',
                            [
                              {
                                text: 'OK',
                                onPress: () => load(),
                              },
                            ],
                          );
                        } catch (err) {
                          Alert.alert(
                            'Cannot End Tournament',
                            err.response?.data?.message ||
                              'Failed to end tournament',
                          );
                        } finally {
                          setActionLoading(false);
                        }
                      },
                    },
                  ],
                );
              }}
              warning
              loading={actionLoading}
            />
          </View>
        )}

        {/* TEAMS */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Teams</Text>

          {tournament.teams.length === 0 && (
            <Text style={styles.emptyText}>No teams registered yet</Text>
          )}

          {tournament.teams.map(t => (
            <View key={t.team._id} style={styles.teamItem}>
              {t.team.teamLogoUrl ? (
                <Image
                  source={{uri: t.team.teamLogoUrl}}
                  style={styles.teamLogo}
                />
              ) : (
                <View style={styles.teamLogoFallback}>
                  <Text style={styles.teamLogoText}>
                    {t.team.teamName.charAt(0)}
                  </Text>
                </View>
              )}

              <Text style={styles.teamNameModern}>{t.team.teamName}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </MainLayout>
  );
}

const formatDate = d => new Date(d).toLocaleDateString();

const InfoRow = ({label, value}) => (
  <View style={styles.row}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value}</Text>
  </View>
);

const InfoItem = ({label, value}) => (
  <View style={styles.infoItem}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);
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

function ActionBtn({label, onPress, warning, loading}) {
  return (
    <TouchableOpacity
      style={[
        styles.btn,
        warning && {backgroundColor: '#F97316'},
        loading && {opacity: 0.6},
      ]}
      disabled={loading}
      onPress={onPress}>
      <Text style={styles.btnText}>{loading ? 'Please wait...' : label}</Text>
    </TouchableOpacity>
  );
}

// const styles = StyleSheet.create({
//   center: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },

//   container: {
//     paddingBottom: 40,
//   },

//   heroCard: {
//     marginHorizontal: 20,
//     marginTop: 16,
//     marginBottom: 24,
//     padding: 20,
//     borderRadius: 24,
//     backgroundColor: '#EEF2FF',
//   },

//   heroTopRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//   },

//   heroTitle: {
//     fontSize: 24,
//     fontWeight: '800',
//     color: '#111827',
//     flex: 1,
//   },

//   heroMeta: {
//     marginTop: 10,
//     fontSize: 14,
//     color: '#6B7280',
//   },

//   heroInfoRow: {
//     flexDirection: 'row',
//     marginTop: 20,
//     gap: 12,
//   },

//   heroInfoBox: {
//     flex: 1,
//     backgroundColor: '#FFFFFF',
//     padding: 14,
//     borderRadius: 14,
//   },

//   heroLabel: {
//     fontSize: 12,
//     color: '#6B7280',
//   },

//   heroValue: {
//     fontSize: 14,
//     fontWeight: '700',
//     color: '#111827',
//     marginTop: 4,
//   },

//   title: {
//     fontSize: 22,
//     fontWeight: '700',
//     color: '#0F172A',
//   },

//   card: {
//     backgroundColor: '#FFFFFF',
//     marginHorizontal: 20,
//     marginBottom: 20,
//     padding: 20,
//     borderRadius: 20,
//     shadowColor: '#000',
//     shadowOpacity: 0.06,
//     shadowRadius: 12,
//     elevation: 3,
//   },
//   cardHeader: {
//     marginBottom: 16,
//   },

//   cardTitle: {
//     fontSize: 18,
//     fontWeight: '800',
//     color: '#111827',
//   },

//   sectionTitle: {
//     fontSize: 16,
//     fontWeight: '600',
//     marginBottom: 12,
//     color: '#1E293B',
//   },

//   row: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginBottom: 10,
//   },

//   label: {
//     color: '#64748B',
//     fontSize: 14,
//   },

//   value: {
//     fontSize: 14,
//     fontWeight: '500',
//     color: '#0F172A',
//   },

//   emptyText: {
//     color: '#94A3B8',
//     fontSize: 14,
//   },

//   reasonText: {
//     color: '#F97316',
//     fontSize: 14,
//     marginTop: 8,
//     fontWeight: '600',
//   },

//  teamItem: {
//   flexDirection: 'row',
//   alignItems: 'center',
//   paddingVertical: 12,
//   borderBottomWidth: 1,
//   borderBottomColor: '#F1F5F9',
// },

// teamLogo: {
//   width: 44,
//   height: 44,
//   borderRadius: 22,
//   marginRight: 14,
// },

// teamLogoFallback: {
//   width: 44,
//   height: 44,
//   borderRadius: 22,
//   backgroundColor: '#E5E7EB',
//   alignItems: 'center',
//   justifyContent: 'center',
//   marginRight: 14,
// },

// teamLogoText: {
//   fontSize: 18,
//   fontWeight: '800',
//   color: '#111827',
// },

// teamNameModern: {
//   fontSize: 16,
//   fontWeight: '700',
//   color: '#111827',
// },

//   badge: {
//     paddingHorizontal: 10,
//     paddingVertical: 4,
//     borderRadius: 999,
//     backgroundColor: '#F8FAFC',
//     borderWidth: 1,
//     borderColor: '#E2E8F0',
//   },

//   badgeText: {
//     fontSize: 12,
//     fontWeight: '600',
//     textTransform: 'capitalize',
//   },

//   btn: {
//     backgroundColor: '#2563EB',
//     paddingVertical: 16,
//     borderRadius: 18,
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginTop: 12,
//   },

//   btnText: {
//     color: '#FFFFFF',
//     fontSize: 16,
//     fontWeight: '600',
//   },

//   winnerCard: {
//     backgroundColor: '#FEF9C3',
//     borderWidth: 2,
//     borderColor: '#FACC15',
//   },

//   winnerTitle: {
//     fontSize: 18,
//     fontWeight: '800',
//     color: '#854D0E',
//     textAlign: 'center',
//     marginBottom: 8,
//   },

//   winnerTeam: {
//     fontSize: 24,
//     fontWeight: '900',
//     color: '#0F172A',
//     textAlign: 'center',
//     marginBottom: 8,
//   },

//   completedDate: {
//     fontSize: 14,
//     color: '#64748B',
//     textAlign: 'center',
//     fontStyle: 'italic',
//   },
//   bigStat: {
//     fontSize: 22,
//     fontWeight: '800',
//     color: '#111827',
//   },

//   subStat: {
//     fontSize: 14,
//     color: '#6B7280',
//     marginTop: 4,
//   },

//   progressBarBg: {
//     height: 6,
//     backgroundColor: '#E5E7EB',
//     borderRadius: 4,
//     marginTop: 14,
//   },

//   progressBarFill: {
//     height: 6,
//     backgroundColor: '#2563EB',
//     borderRadius: 4,
//   },
//   infoRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginBottom: 18,
//   },

//   infoItem: {
//     flex: 1,
//   },

//   infoLabel: {
//     fontSize: 13,
//     color: '#6B7280',
//     marginBottom: 4,
//   },

//   infoValue: {
//     fontSize: 18,
//     fontWeight: '800',
//     color: '#111827',
//   },
// });


const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  container: {
    paddingBottom: vs(40),
  },

  heroCard: {
    marginHorizontal: s(20),
    marginTop: vs(16),
    marginBottom: vs(24),
    padding: s(20),
    borderRadius: ms(24),
    backgroundColor: '#EEF2FF',
  },

  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  heroTitle: {
    fontSize: ms(24),
    fontWeight: '800',
    color: '#111827',
    flex: 1,
  },

  heroMeta: {
    marginTop: vs(10),
    fontSize: rf(14),
    color: '#6B7280',
  },

  heroInfoRow: {
    flexDirection: 'row',
    marginTop: vs(20),
    gap: s(12),
  },

  heroInfoBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: s(14),
    borderRadius: ms(14),
  },

  heroLabel: {
    fontSize: rf(12),
    color: '#6B7280',
  },

  heroValue: {
    fontSize: rf(14),
    fontWeight: '700',
    color: '#111827',
    marginTop: vs(4),
  },

  title: {
    fontSize: ms(22),
    fontWeight: '700',
    color: '#0F172A',
  },

  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: s(20),
    marginBottom: vs(20),
    padding: s(20),
    borderRadius: ms(20),
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },

  cardHeader: {
    marginBottom: vs(16),
  },

  cardTitle: {
    fontSize: rf(18),
    fontWeight: '800',
    color: '#111827',
  },

  sectionTitle: {
    fontSize: rf(16),
    fontWeight: '600',
    marginBottom: vs(12),
    color: '#1E293B',
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: vs(10),
  },

  label: {
    color: '#64748B',
    fontSize: rf(14),
  },

  value: {
    fontSize: rf(14),
    fontWeight: '500',
    color: '#0F172A',
  },

  emptyText: {
    color: '#94A3B8',
    fontSize: rf(14),
  },

  reasonText: {
    color: '#F97316',
    fontSize: rf(14),
    marginTop: vs(8),
    fontWeight: '600',
  },

  teamItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: vs(12),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },

  teamLogo: {
    width: s(44),
    height: s(44),
    borderRadius: s(22),
    marginRight: s(14),
  },

  teamLogoFallback: {
    width: s(44),
    height: s(44),
    borderRadius: s(22),
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: s(14),
  },

  teamLogoText: {
    fontSize: ms(18),
    fontWeight: '800',
    color: '#111827',
  },

  teamNameModern: {
    fontSize: rf(16),
    fontWeight: '700',
    color: '#111827',
  },

  badge: {
    paddingHorizontal: s(10),
    paddingVertical: vs(4),
    borderRadius: ms(999),
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  badgeText: {
    fontSize: rf(12),
    fontWeight: '600',
    textTransform: 'capitalize',
  },

  btn: {
    backgroundColor: '#2563EB',
    paddingVertical: vs(16),
    borderRadius: ms(18),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: vs(12),
  },

  btnText: {
    color: '#FFFFFF',
    fontSize: rf(16),
    fontWeight: '600',
  },

  winnerCard: {
    backgroundColor: '#FEF9C3',
    borderWidth: 2,
    borderColor: '#FACC15',
  },

  winnerTitle: {
    fontSize: rf(18),
    fontWeight: '800',
    color: '#854D0E',
    textAlign: 'center',
    marginBottom: vs(8),
  },

  winnerTeam: {
    fontSize: ms(24),
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: vs(8),
  },

  completedDate: {
    fontSize: rf(14),
    color: '#64748B',
    textAlign: 'center',
    fontStyle: 'italic',
  },

  bigStat: {
    fontSize: ms(22),
    fontWeight: '800',
    color: '#111827',
  },

  subStat: {
    fontSize: rf(14),
    color: '#6B7280',
    marginTop: vs(4),
  },

  progressBarBg: {
    height: vs(6),
    backgroundColor: '#E5E7EB',
    borderRadius: ms(4),
    marginTop: vs(14),
  },

  progressBarFill: {
    height: vs(6),
    backgroundColor: '#2563EB',
    borderRadius: ms(4),
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: vs(18),
  },

  infoItem: {
    flex: 1,
  },

  infoLabel: {
    fontSize: rf(13),
    color: '#6B7280',
    marginBottom: vs(4),
  },

  infoValue: {
    fontSize: rf(18),
    fontWeight: '800',
    color: '#111827',
  },
});