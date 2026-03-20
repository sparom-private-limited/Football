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
  Animated,
} from 'react-native';
import {useRoute, useIsFocused} from '@react-navigation/native';
import API from '../../api/api';
import MainLayout from '../../components/MainLayout';
import {useAuth} from '../../context/AuthContext';
import useNavigationHelper from '../../navigation/Navigationhelper';
import {s, vs, ms, rf} from '../../utils/responsive';

const TABS = ['Summary', 'Fixtures', 'Standings', 'Stats'];

export default function TournamentDetailScreen() {
  const {params} = useRoute();
  const nav = useNavigationHelper();
  const {tournamentId} = params;

  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('Summary');
  const isFocused = useIsFocused();
  const {user} = useAuth();
  const [fixtures, setFixtures] = useState([]);
  const [standings, setStandings] = useState([]);
  const [tournamentStats, setTournamentStats] = useState(null);

  const load = async () => {
    try {
      let res;
      if (user.role === 'team') {
        res = await API.get(`/api/tournament/${tournamentId}/teamView`);
      } else {
        res = await API.get(`/api/tournament/${tournamentId}`);
      }
      const statsRes = await API.get(
        `/api/tournament/${tournamentId}/stats`,
      ).catch(() => ({data: null}));
      setTournamentStats(statsRes.data);

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

      setTournament({...tournamentData, teamContext});

      // ✅ fetch fixtures and standings in parallel
      const [matchRes, standingsRes] = await Promise.all([
        API.get(`/api/tournament/${tournamentId}/matches`).catch(() => ({
          data: [],
        })),
        // ✅ only fetch standings for LEAGUE
        tournamentData.format === 'LEAGUE'
          ? API.get(`/api/tournament/${tournamentId}/standings`).catch(() => ({
              data: [],
            }))
          : Promise.resolve({data: []}),
      ]);

      console.log('STANDINGS:', JSON.stringify(standingsRes.data, null, 2));
      setFixtures(matchRes.data || []);
      setStandings(standingsRes.data || []);
    } catch (err) {
      Alert.alert('Error', 'Failed to load tournament', [
        {text: 'OK', onPress: () => nav.back()},
      ]);
      setTournament(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isFocused) load();
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
      <MainLayout title="Tournament" forceBack>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Loading tournament...</Text>
        </View>
      </MainLayout>
    );
  }

  if (!tournament) {
    return (
      <MainLayout title="Tournament" forceBack>
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>🏟️</Text>
          <Text style={styles.emptyText}>Tournament not available</Text>
        </View>
      </MainLayout>
    );
  }

  const isOrganiser = user.role === 'organiser';
  const isCompleted = tournament.status === 'COMPLETED';
  const isLive = tournament.status === 'LIVE';
  const spotsLeft = Math.max(
    0,
    (tournament.maxTeams || 0) - tournament.teams.length,
  );
  const fillPct = Math.min(
    100,
    (tournament.teams.length / (tournament.maxTeams || 1)) * 100,
  );

  return (
    <MainLayout title="Tournament Details" forceBack>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}>
        {/* ── HERO CARD ── */}
        <View style={styles.heroCard}>
          {/* Background decoration circles */}
          <View style={styles.heroCircle1} />
          <View style={styles.heroCircle2} />

          <View style={styles.heroTopRow}>
            <View style={styles.heroLeft}>
              <StatusBadge status={tournament.status} />
              <Text style={styles.heroTitle}>{tournament.name}</Text>
              <Text style={styles.heroSub}>
                {tournament.venue || 'Venue TBA'} ·{' '}
                {formatDate(tournament.startDate)} –{' '}
                {formatDate(tournament.endDate)}
              </Text>
            </View>
          </View>

          {/* Tags row */}
          <View style={styles.heroTagsRow}>
            <HeroTag label={tournament.format} />
            <HeroTag label={tournament.category || 'Open'} />
            <HeroTag label={`${tournament.matchDuration || 40} min matches`} />
          </View>

          {/* Winner pill (if completed) */}
          {isCompleted && tournament.winner && (
            <View style={styles.winnerPill}>
              <Text style={styles.winnerPillIcon}>🏆</Text>
              <Text style={styles.winnerPillText}>
                Winner: {tournament.winner.teamName}
              </Text>
            </View>
          )}

          {/* Live pill */}
          {isLive && (
            <View style={styles.livePill}>
              <View style={styles.liveDot} />
              <Text style={styles.livePillText}>Live Now</Text>
            </View>
          )}
        </View>

        {/* ── TAB BAR ── */}
        <View style={styles.tabBarWrapper}>
          <View style={styles.tabBar}>
            {TABS.map(tab => (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.tabBtn,
                  activeTab === tab && styles.tabBtnActive,
                ]}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.8}>
                <Text
                  style={[
                    styles.tabText,
                    activeTab === tab && styles.tabTextActive,
                  ]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── SUMMARY TAB ── */}
        {activeTab === 'Summary' && (
          <>
            {/* Snapshot card */}
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardTitle}>Tournament snapshot</Text>
                <View style={styles.teamCountPill}>
                  <Text style={styles.teamCountText}>
                    {tournament.teams.length} teams joined
                  </Text>
                </View>
              </View>

              <View style={styles.statGrid}>
                <StatBox label="Format" value={tournament.format} />
                <StatBox
                  label="Match duration"
                  value={`${tournament.matchDuration || 40} mins`}
                />
                <StatBox
                  label="Entry fee"
                  value={
                    tournament.entryFee ? `₹${tournament.entryFee}` : 'Free'
                  }
                />
                <StatBox
                  label="Prize pool"
                  value={
                    tournament.prizePool
                      ? `₹${tournament.prizePool}`
                      : 'Coming soon'
                  }
                />
              </View>
            </View>

            {/* Registration card */}
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardTitle}>Registration</Text>
                {tournament.registrationEndsAt && (
                  <Text style={styles.cardSubtitle}>
                    Closes {formatDate(tournament.registrationEndsAt)}
                  </Text>
                )}
              </View>

              <View style={styles.statGrid}>
                <StatBox
                  label="Teams"
                  value={`${tournament.teams.length} / ${
                    tournament.maxTeams || '∞'
                  }`}
                />
                <StatBox
                  label="Spots left"
                  value={`${spotsLeft}`}
                  accent={spotsLeft < 3}
                />
                <StatBox
                  label="Max per team"
                  value={`${tournament.maxPlayersPerTeam || '—'}`}
                />
                <StatBox
                  label="Category"
                  value={tournament.category || 'Open'}
                />
              </View>

              {/* Progress bar */}
              <View style={styles.progressWrap}>
                <View style={styles.progressBg}>
                  <View style={[styles.progressFill, {width: `${fillPct}%`}]} />
                </View>
                <Text style={styles.progressLabel}>
                  {Math.round(fillPct)}% full
                </Text>
              </View>

              {/* Actions */}
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
                  <View style={styles.reasonBox}>
                    <Text style={styles.reasonText}>
                      ⚠ {tournament.teamContext.reason.replace(/_/g, ' ')}
                    </Text>
                  </View>
                )}
            </View>

            {/* Stage timeline card (only for completed/live) */}
            {(isCompleted || isLive) && tournament.stages?.length > 0 && (
              <View style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardTitle}>Tournament snapshot</Text>
                  <Text style={styles.cardSubtitle}>
                    Stages and key results
                  </Text>
                </View>
                {tournament.stages.map((stage, i) => (
                  <StageRow
                    key={i}
                    stage={stage}
                    index={i}
                    isLast={i === tournament.stages.length - 1}
                  />
                ))}
              </View>
            )}

            {/* Winner card */}
            {isCompleted && tournament.winner && (
              <View style={styles.winnerCard}>
                <View style={styles.winnerCardInner}>
                  {tournament.winner.teamLogoUrl ? (
                    <Image
                      source={{uri: tournament.winner.teamLogoUrl}}
                      style={styles.winnerLogo}
                    />
                  ) : (
                    <View style={styles.winnerLogoFallback}>
                      <Text style={styles.winnerLogoText}>
                        {tournament.winner.teamName?.[0]}
                      </Text>
                    </View>
                  )}
                  <View style={styles.winnerInfo}>
                    <Text style={styles.winnerLabel}>Tournament winner</Text>
                    <Text style={styles.winnerName}>
                      {tournament.winner.teamName}
                    </Text>
                  </View>
                  <View style={styles.championBadge}>
                    <Text style={styles.championText}>Champion</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.viewBracketBtn}
                  onPress={() =>
                    nav.to('OrganiserTournamentMatches', {
                      tournamentId: tournament._id,
                      tournamentName: tournament.name,
                    })
                  }
                  activeOpacity={0.85}>
                  <Text style={styles.viewBracketText}>View full bracket</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Organiser: Fixtures generation */}
            {isOrganiser && tournament.status === 'REGISTRATION_CLOSED' && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Generate Fixtures</Text>
                <ActionBtn
                  label="Generate Fixtures"
                  loading={actionLoading}
                  onPress={async () => {
                    setActionLoading(true);
                    try {
                      await API.post(
                        `/api/tournament/${tournament._id}/generate-fixtures`,
                      );
                      Alert.alert('Success', 'Fixtures generated!');
                      await load();
                    } catch (err) {
                      Alert.alert(
                        'Error',
                        err.response?.data?.message || 'Failed',
                      );
                    } finally {
                      setActionLoading(false);
                    }
                  }}
                />
              </View>
            )}

            {/* Organiser Management */}
            {isOrganiser &&
              ['FIXTURES_GENERATED', 'LIVE', 'COMPLETED'].includes(
                tournament.status,
              ) && (
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Management</Text>

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
                      loading={actionLoading}
                      onPress={async () => {
                        setActionLoading(true);
                        try {
                          await API.post(
                            `/api/tournament/${tournament._id}/start`,
                          );
                          Alert.alert('Success', 'Tournament started');
                          await load();
                        } catch (err) {
                          Alert.alert(
                            'Error',
                            err.response?.data?.message || 'Failed',
                          );
                        } finally {
                          setActionLoading(false);
                        }
                      }}
                    />
                  )}
                  {tournament.status === 'LIVE' && (
                    <ActionBtn
                      label="🏁 End Tournament"
                      warning
                      loading={actionLoading}
                      onPress={() => {
                        Alert.alert(
                          'End Tournament?',
                          'This will declare a winner. Cannot be undone.',
                          [
                            {text: 'Cancel', style: 'cancel'},
                            {
                              text: 'End Tournament',
                              style: 'destructive',
                              onPress: async () => {
                                setActionLoading(true);
                                try {
                                  const r = await API.post(
                                    `/api/tournament/${tournament._id}/end`,
                                  );
                                  Alert.alert(
                                    'Tournament Ended!',
                                    r.data.tournament.winner
                                      ? `🏆 Winner: ${r.data.tournament.winner.teamName}`
                                      : 'Completed',
                                    [{text: 'OK', onPress: () => load()}],
                                  );
                                } catch (err) {
                                  Alert.alert(
                                    'Error',
                                    err.response?.data?.message || 'Failed',
                                  );
                                } finally {
                                  setActionLoading(false);
                                }
                              },
                            },
                          ],
                        );
                      }}
                    />
                  )}
                </View>
              )}

            {/* Teams list */}
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardTitle}>Teams</Text>
                <Text style={styles.cardSubtitle}>
                  {tournament.teams.length} registered
                </Text>
              </View>
              {tournament.teams.length === 0 ? (
                <View style={styles.noTeamsBox}>
                  <Text style={styles.noTeamsIcon}>🏟️</Text>
                  <Text style={styles.noTeamsText}>
                    No teams registered yet
                  </Text>
                </View>
              ) : (
                tournament.teams.map((t, i) => (
                  <View
                    key={t.team._id}
                    style={[
                      styles.teamRow,
                      i === tournament.teams.length - 1 && {
                        borderBottomWidth: 0,
                      },
                    ]}>
                    <Text style={styles.teamRank}>#{i + 1}</Text>
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
                    <Text style={styles.teamName}>{t.team.teamName}</Text>
                    <View style={styles.teamJoinedBadge}>
                      <Text style={styles.teamJoinedText}>Joined</Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          </>
        )}

        {/* ── FIXTURES TAB ── */}
        {activeTab === 'Fixtures' && (
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitle}>Final fixtures</Text>
              <TouchableOpacity
                onPress={() =>
                  nav.to('OrganiserTournamentMatches', {
                    tournamentId: tournament._id,
                    tournamentName: tournament.name,
                  })
                }>
                <Text style={styles.tapLink}>Tap to see full bracket</Text>
              </TouchableOpacity>
            </View>

            {fixtures.length === 0 ? (
              <View style={styles.noTeamsBox}>
                <Text style={styles.noTeamsIcon}>📋</Text>
                <Text style={styles.noTeamsText}>
                  No fixtures available yet
                </Text>
              </View>
            ) : (
              fixtures.map((match, i) => (
                <FixtureRow key={match._id || i} match={match} />
              ))
            )}
          </View>
        )}

        {/* ── STANDINGS TAB ── */}
        {activeTab === 'Standings' && (
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitle}>Standings</Text>
            </View>

            {tournament.format === 'KNOCKOUT' ? (
              // ✅ Knockout — show bracket link instead
              <View style={styles.noTeamsBox}>
                <Text style={styles.noTeamsIcon}>🏆</Text>
                <Text style={styles.noTeamsText}>
                  Knockout tournaments use a bracket format
                </Text>
                {['FIXTURES_GENERATED', 'LIVE', 'COMPLETED'].includes(
                  tournament.status,
                ) && (
                  <TouchableOpacity
                    style={styles.viewBracketBtn}
                    onPress={() =>
                      nav.to('OrganiserTournamentMatches', {
                        tournamentId: tournament._id,
                        tournamentName: tournament.name,
                      })
                    }>
                    <Text style={styles.viewBracketText}>View Bracket</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : standings.length === 0 ? (
              // ✅ League but no data yet
              <View style={styles.noTeamsBox}>
                <Text style={styles.noTeamsIcon}>📊</Text>
                <Text style={styles.noTeamsText}>
                  Standings will appear once matches are played
                </Text>
              </View>
            ) : (
              // ✅ League with data — navigate to full standings
              <TouchableOpacity
                style={styles.viewBracketBtn}
                onPress={() =>
                  nav.to('TournamentStandings', {
                    tournamentId: tournament._id,
                    tournamentName: tournament.name,
                  })
                }>
                <Text style={styles.viewBracketText}>
                  View Full Standings Table
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ── STATS TAB ── */}
        {activeTab === 'Stats' && (
          <View>
            {!tournamentStats ? (
              <View style={styles.card}>
                <View style={styles.noTeamsBox}>
                  <Text style={styles.noTeamsIcon}>📊</Text>
                  <Text style={styles.noTeamsText}>
                    Stats will appear once matches are played
                  </Text>
                </View>
              </View>
            ) : (
              <>
                {/* Overview */}
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Tournament Overview</Text>
                  <View style={styles.statGrid}>
                    <StatBox
                      label="Matches Played"
                      value={tournamentStats.overview.totalMatches}
                    />
                    <StatBox
                      label="Total Goals"
                      value={tournamentStats.overview.totalGoals}
                    />
                    <StatBox
                      label="Avg Goals/Match"
                      value={tournamentStats.overview.avgGoalsPerMatch.toFixed(
                        1,
                      )}
                    />
                    <StatBox
                      label="Clean Sheets"
                      value={tournamentStats.overview.cleanSheets}
                    />
                    <StatBox
                      label="Yellow Cards"
                      value={tournamentStats.overview.totalYellowCards}
                    />
                    <StatBox
                      label="Red Cards"
                      value={tournamentStats.overview.totalRedCards}
                    />
                  </View>
                </View>

                {/* Top Scorers */}
                {tournamentStats.topScorers?.length > 0 && (
                  <View style={styles.card}>
                    <View style={styles.cardHeaderRow}>
                      <Text style={styles.cardTitle}>⚽ Top Scorers</Text>
                    </View>
                    {tournamentStats.topScorers.slice(0, 5).map((player, i) => (
                      <PlayerStatRow
                        key={player.playerId}
                        position={i + 1}
                        name={player.playerName}
                        team={player.teamName}
                        statValue={player.goals}
                        statLabel="goals"
                        isTop={i === 0}
                      />
                    ))}
                  </View>
                )}

                {/* Top Assists */}
                {tournamentStats.topAssists?.length > 0 && (
                  <View style={styles.card}>
                    <View style={styles.cardHeaderRow}>
                      <Text style={styles.cardTitle}>🎯 Top Assists</Text>
                    </View>
                    {tournamentStats.topAssists.slice(0, 5).map((player, i) => (
                      <PlayerStatRow
                        key={player.playerId}
                        position={i + 1}
                        name={player.playerName}
                        team={player.teamName}
                        statValue={player.assists}
                        statLabel="assists"
                        isTop={i === 0}
                      />
                    ))}
                  </View>
                )}

                {/* Most Bookings */}
                {tournamentStats.mostYellowCards?.length > 0 && (
                  <View style={styles.card}>
                    <View style={styles.cardHeaderRow}>
                      <Text style={styles.cardTitle}>🟨 Most Bookings</Text>
                    </View>
                    {tournamentStats.mostYellowCards
                      .slice(0, 5)
                      .map((player, i) => (
                        <PlayerStatRow
                          key={player.playerId}
                          position={i + 1}
                          name={player.playerName}
                          team={player.teamName}
                          statValue={player.yellowCards}
                          statLabel="yellow cards"
                          isTop={false}
                        />
                      ))}
                  </View>
                )}

                {/* Recent Results */}
                {tournamentStats.recentResults?.length > 0 && (
                  <View style={styles.card}>
                    <Text style={styles.cardTitle}>🕐 Recent Results</Text>
                    {tournamentStats.recentResults.map((match, i) => (
                      <View
                        key={match._id}
                        style={[
                          styles.fixtureRow,
                          i === tournamentStats.recentResults.length - 1 && {
                            borderBottomWidth: 0,
                          },
                        ]}>
                        <View style={styles.fixtureTeamCol}>
                          <Text
                            style={styles.fixtureTeamName}
                            numberOfLines={1}>
                            {match.homeTeam?.teamName}
                          </Text>
                        </View>
                        <View style={styles.fixtureScoreCol}>
                          <Text style={styles.fixtureScore}>
                            {match.score?.home ?? 0} - {match.score?.away ?? 0}
                          </Text>
                        </View>
                        <View style={styles.fixtureTeamCol}>
                          <Text
                            style={styles.fixtureTeamName}
                            numberOfLines={1}>
                            {match.awayTeam?.teamName}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </>
            )}
          </View>
        )}
      </ScrollView>
    </MainLayout>
  );
}

/* ─── Small components ─── */

function HeroTag({label}) {
  return (
    <View style={styles.heroTag}>
      <Text style={styles.heroTagText}>{label}</Text>
    </View>
  );
}

function StatusBadge({status}) {
  const map = {
    DRAFT: {bg: '#1E293B', dot: '#94A3B8', label: 'Draft'},
    REGISTRATION_OPEN: {
      bg: '#14532D',
      dot: '#22C55E',
      label: 'Registration Open',
    },
    REGISTRATION_CLOSED: {bg: '#431407', dot: '#F97316', label: 'Reg. Closed'},
    FIXTURES_GENERATED: {bg: '#1E3A8A', dot: '#60A5FA', label: 'Fixtures Set'},
    LIVE: {bg: '#7F1D1D', dot: '#F87171', label: 'Live'},
    COMPLETED: {bg: '#064E3B', dot: '#34D399', label: 'Completed'},
  };
  const c = map[status] || map.DRAFT;
  return (
    <View style={[styles.statusBadge, {backgroundColor: c.bg}]}>
      <View style={[styles.statusDot, {backgroundColor: c.dot}]} />
      <Text style={styles.statusText}>{c.label}</Text>
    </View>
  );
}

function StatBox({label, value, accent}) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, accent && {color: '#EF4444'}]}>
        {value}
      </Text>
    </View>
  );
}

function StageRow({stage, index, isLast}) {
  const dotColors = ['#3B82F6', '#F59E0B', '#22C55E', '#8B5CF6'];
  const dot = dotColors[index % dotColors.length];
  return (
    <View style={styles.stageRow}>
      <View style={styles.stageLineCol}>
        <View style={[styles.stageDot, {backgroundColor: dot}]} />
        {!isLast && (
          <View style={[styles.stageLine, {backgroundColor: dot + '40'}]} />
        )}
      </View>
      <View style={styles.stageInfo}>
        <Text style={styles.stageName}>{stage.name}</Text>
        <Text style={styles.stageMeta}>{stage.meta}</Text>
      </View>
    </View>
  );
}

function FixtureRow({match}) {
  const isCompleted = match.status === 'COMPLETED';

  return (
    <View style={styles.fixtureRow}>
      {/* Home Team */}
      <View style={styles.fixtureTeamCol}>
        {match.homeTeam?.teamLogoUrl ? (
          <Image
            source={{uri: match.homeTeam.teamLogoUrl}}
            style={styles.fixtureTeamLogo}
          />
        ) : (
          <View style={styles.fixtureTeamLogoFallback}>
            <Text style={styles.fixtureTeamLogoText}>
              {match.homeTeam?.teamName?.[0]}
            </Text>
          </View>
        )}
        <Text style={styles.fixtureTeamName} numberOfLines={1}>
          {match.homeTeam?.teamName || 'Home'}
        </Text>
      </View>

      {/* Score / VS */}
      <View style={styles.fixtureScoreCol}>
        {isCompleted ? (
          <Text style={styles.fixtureScore}>
            {match.score?.home ?? 0} - {match.score?.away ?? 0}
          </Text>
        ) : (
          <Text style={styles.fixtureVs}>VS</Text>
        )}
        <Text style={styles.fixtureRound}>Round {match.round}</Text>
        <Text style={styles.fixtureMeta}>
          {match.scheduledAt
            ? new Date(match.scheduledAt).toLocaleDateString()
            : ''}
        </Text>
      </View>

      {/* Away Team */}
      <View style={styles.fixtureTeamCol}>
        {match.awayTeam?.teamLogoUrl ? (
          <Image
            source={{uri: match.awayTeam.teamLogoUrl}}
            style={styles.fixtureTeamLogo}
          />
        ) : (
          <View style={styles.fixtureTeamLogoFallback}>
            <Text style={styles.fixtureTeamLogoText}>
              {match.awayTeam?.teamName?.[0]}
            </Text>
          </View>
        )}
        <Text style={styles.fixtureTeamName} numberOfLines={1}>
          {match.awayTeam?.teamName || 'Away'}
        </Text>
      </View>
    </View>
  );
}

function ActionBtn({label, onPress, warning, loading}) {
  return (
    <TouchableOpacity
      style={[
        styles.btn,
        warning && styles.btnWarning,
        loading && styles.btnDisabled,
      ]}
      disabled={loading}
      onPress={onPress}
      activeOpacity={0.85}>
      {loading ? (
        <ActivityIndicator size="small" color="#fff" />
      ) : (
        <Text style={styles.btnText}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

function PlayerStatRow({position, name, team, statValue, statLabel, isTop}) {
  return (
    <View style={styles.playerStatRow}>
      <Text style={[styles.playerStatPos, isTop && {color: '#F59E0B'}]}>
        {isTop ? '🏆' : `#${position}`}
      </Text>
      <View style={styles.playerStatInfo}>
        <Text style={styles.playerStatName}>{name}</Text>
        <Text style={styles.playerStatTeam}>{team}</Text>
      </View>
      <View style={styles.playerStatValue}>
        <Text style={styles.playerStatNum}>{statValue}</Text>
        <Text style={styles.playerStatLabel}>{statLabel}</Text>
      </View>
    </View>
  );
}

const formatDate = d =>
  new Date(d).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

/* ─── Styles ─── */
const styles = StyleSheet.create({
  scroll: {
    paddingBottom: vs(48),
    backgroundColor: '#F8FAFC',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: vs(10),
    color: '#94A3B8',
    fontSize: rf(14),
  },
  emptyIcon: {fontSize: ms(48), marginBottom: vs(10)},
  emptyText: {color: '#94A3B8', fontSize: rf(16)},

  /* ── HERO ── */
  heroCard: {
    marginHorizontal: s(16),
    marginTop: vs(16),
    marginBottom: vs(10),
    padding: s(22),
    borderRadius: ms(24),
    backgroundColor: '#2563EB',
    overflow: 'hidden',
    position: 'relative',
  },
  heroCircle1: {
    position: 'absolute',
    width: s(180),
    height: s(180),
    borderRadius: s(90),
    backgroundColor: '#ffffff14',
    right: -s(40),
    top: -s(40),
  },
  heroCircle2: {
    position: 'absolute',
    width: s(120),
    height: s(120),
    borderRadius: s(60),
    backgroundColor: '#ffffff0a',
    right: s(20),
    bottom: -s(20),
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: vs(14),
  },
  heroLeft: {
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: s(10),
    paddingVertical: vs(4),
    borderRadius: ms(20),
    marginBottom: vs(10),
    gap: s(5),
  },
  statusDot: {
    width: s(7),
    height: s(7),
    borderRadius: s(4),
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: rf(11),
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  heroTitle: {
    fontSize: ms(24),
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: vs(30),
    marginBottom: vs(6),
  },
  heroSub: {
    color: '#BFDBFE',
    fontSize: rf(12),
    fontWeight: '500',
  },
  heroTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: s(8),
    marginTop: vs(4),
  },
  heroTag: {
    backgroundColor: '#1E40AF',
    paddingHorizontal: s(12),
    paddingVertical: vs(5),
    borderRadius: ms(20),
  },
  heroTagText: {
    color: '#93C5FD',
    fontSize: rf(11),
    fontWeight: '700',
  },
  winnerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    backgroundColor: '#F59E0B',
    paddingHorizontal: s(14),
    paddingVertical: vs(8),
    borderRadius: ms(20),
    marginTop: vs(14),
    gap: s(6),
  },
  winnerPillIcon: {fontSize: ms(14)},
  winnerPillText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: rf(13),
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    backgroundColor: '#DC2626',
    paddingHorizontal: s(14),
    paddingVertical: vs(8),
    borderRadius: ms(20),
    marginTop: vs(14),
    gap: s(6),
  },
  liveDot: {
    width: s(7),
    height: s(7),
    borderRadius: s(4),
    backgroundColor: '#FCA5A5',
  },
  livePillText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: rf(13),
  },

  /* ── TAB BAR ── */
  tabBarWrapper: {
    paddingHorizontal: s(16),
    paddingVertical: vs(10),
    backgroundColor: '#F8FAFC',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: ms(14),
    padding: vs(3),
  },
  tabBtn: {
    flex: 1,
    paddingVertical: vs(10),
    alignItems: 'center',
    borderRadius: ms(11),
  },
  tabBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: rf(13),
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#2563EB',
    fontWeight: '800',
  },

  /* ── CARDS ── */
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: s(16),
    marginBottom: vs(14),
    padding: s(15),
    borderRadius: ms(20),
    shadowColor: '#1E3A8A',
    shadowOpacity: 0.06,
    shadowOffset: {width: 0, height: vs(3)},
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#EEF2FF',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: vs(16),
  },
  cardTitle: {
    fontSize: rf(16),
    fontWeight: '800',
    color: '#0F172A',
  },
  cardSubtitle: {
    fontSize: rf(12),
    color: '#94A3B8',
    fontWeight: '500',
  },

  /* ── STAT GRID ── */
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: s(10),
    marginBottom: vs(4),
  },
  statBox: {
    flex: 1,
    minWidth: s(120),
    backgroundColor: '#F8FAFC',
    padding: s(14),
    borderRadius: ms(14),
    borderWidth: 1,
    borderColor: '#EEF2FF',
  },
  statLabel: {
    fontSize: rf(11),
    color: '#94A3B8',
    fontWeight: '600',
    marginBottom: vs(5),
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: ms(18),
    fontWeight: '900',
    color: '#0F172A',
  },
  teamCountPill: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: s(10),
    paddingVertical: vs(4),
    borderRadius: ms(20),
  },
  teamCountText: {
    color: '#2563EB',
    fontSize: rf(11),
    fontWeight: '700',
  },

  /* ── PROGRESS ── */
  progressWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(10),
    marginTop: vs(14),
    marginBottom: vs(4),
  },
  progressBg: {
    flex: 1,
    height: vs(7),
    backgroundColor: '#E2E8F0',
    borderRadius: ms(4),
    overflow: 'hidden',
  },
  progressFill: {
    height: vs(7),
    backgroundColor: '#2563EB',
    borderRadius: ms(4),
  },
  progressLabel: {
    fontSize: rf(11),
    color: '#94A3B8',
    fontWeight: '600',
    width: s(40),
  },

  /* ── REASON BOX ── */
  reasonBox: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: ms(12),
    padding: s(12),
    marginTop: vs(12),
  },
  reasonText: {
    color: '#C2410C',
    fontSize: rf(13),
    fontWeight: '600',
  },

  /* ── STAGE TIMELINE ── */
  stageRow: {
    flexDirection: 'row',
    marginBottom: vs(4),
    minHeight: vs(44),
  },
  stageLineCol: {
    width: s(24),
    alignItems: 'center',
  },
  stageDot: {
    width: s(12),
    height: s(12),
    borderRadius: s(6),
    marginTop: vs(4),
  },
  stageLine: {
    flex: 1,
    width: s(2),
    marginTop: vs(4),
    marginBottom: -vs(4),
  },
  stageInfo: {
    flex: 1,
    paddingLeft: s(10),
    paddingBottom: vs(12),
  },
  stageName: {
    fontSize: rf(14),
    fontWeight: '800',
    color: '#0F172A',
  },
  stageMeta: {
    fontSize: rf(12),
    color: '#94A3B8',
    marginTop: vs(2),
  },

  /* ── FIXTURES ── */
  fixtureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: vs(10),
    paddingHorizontal: s(4), // ✅ reduce horizontal padding
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  fixtureMain: {
    flex: 1,
  },
  fixtureTeam: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: vs(4),
  },
  fixtureTeamName: {
    fontSize: rf(14),
    fontWeight: '700',
    color: '#0F172A',
  },
  fixtureScore: {
    fontSize: rf(16),
    fontWeight: '900',
    color: '#0F172A',
  },
  fixtureMeta: {
    fontSize: rf(11),
    color: '#94A3B8',
    marginTop: vs(2),
  },
  fixtureStagePill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: s(8),
    paddingVertical: vs(4),
    borderRadius: ms(8),
  },
  fixtureStageText: {
    fontSize: rf(11),
    fontWeight: '700',
    color: '#64748B',
  },
  tapLink: {
    fontSize: rf(12),
    color: '#2563EB',
    fontWeight: '600',
  },

  /* ── TEAMS ── */
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: vs(12),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: s(12),
  },
  teamRank: {
    fontSize: rf(12),
    fontWeight: '700',
    color: '#CBD5E1',
    width: s(22),
    textAlign: 'center',
  },
  teamLogo: {
    width: s(40),
    height: s(40),
    borderRadius: s(20),
    borderWidth: 1.5,
    borderColor: '#EEF2FF',
  },
  teamLogoFallback: {
    width: s(40),
    height: s(40),
    borderRadius: s(20),
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#DBEAFE',
  },
  teamLogoText: {
    fontSize: ms(16),
    fontWeight: '900',
    color: '#2563EB',
  },
  teamName: {
    flex: 1,
    fontSize: rf(14),
    fontWeight: '700',
    color: '#0F172A',
  },
  teamJoinedBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: s(8),
    paddingVertical: vs(3),
    borderRadius: ms(10),
  },
  teamJoinedText: {
    fontSize: rf(10),
    fontWeight: '700',
    color: '#166534',
  },
  noTeamsBox: {
    alignItems: 'center',
    paddingVertical: vs(24),
  },
  noTeamsIcon: {fontSize: ms(32), marginBottom: vs(8)},
  noTeamsText: {color: '#94A3B8', fontSize: rf(13), textAlign: 'center'},

  /* ── WINNER CARD ── */
  winnerCard: {
    marginHorizontal: s(16),
    marginBottom: vs(14),
    borderRadius: ms(22),
    backgroundColor: '#FEFCE8',
    borderWidth: 2,
    borderColor: '#FDE68A',
    overflow: 'hidden',
  },
  winnerCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: s(18),
    gap: s(14),
  },
  winnerLogo: {
    width: s(52),
    height: s(52),
    borderRadius: s(26),
    borderWidth: 3,
    borderColor: '#F59E0B',
  },
  winnerLogoFallback: {
    width: s(52),
    height: s(52),
    borderRadius: s(26),
    backgroundColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#F59E0B',
  },
  winnerLogoText: {
    fontSize: ms(20),
    fontWeight: '900',
    color: '#92400E',
  },
  winnerInfo: {flex: 1},
  winnerLabel: {
    fontSize: rf(11),
    color: '#D97706',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: vs(2),
  },
  winnerName: {
    fontSize: ms(20),
    fontWeight: '900',
    color: '#1E3A8A',
  },
  championBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: s(10),
    paddingVertical: vs(5),
    borderRadius: ms(10),
  },
  championText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: rf(11),
  },
  viewBracketBtn: {
    backgroundColor: '#2563EB',
    marginHorizontal: s(25),
    marginBottom: vs(16),
    paddingVertical: vs(16),
    paddingHorizontal: vs(20),
    borderRadius: ms(16),
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOffset: {width: 0, height: vs(4)},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  viewBracketText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: rf(16),
    letterSpacing: 0.3,
  },

  /* ── BUTTONS ── */
  btn: {
    backgroundColor: '#2563EB',
    paddingVertical: vs(15),
    borderRadius: ms(16),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: vs(12),
    shadowColor: '#2563EB',
    shadowOffset: {width: 0, height: vs(3)},
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  btnWarning: {
    backgroundColor: '#F97316',
    shadowColor: '#F97316',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: rf(15),
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  fixtureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: vs(12),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  fixtureTeamCol: {
    flex: 1,
    alignItems: 'center',
    gap: vs(4),
  },
  fixtureTeamLogo: {
    width: s(44),
    height: s(44),
    borderRadius: s(22),
  },
  fixtureTeamLogoFallback: {
    width: s(44),
    height: s(44),
    borderRadius: s(22),
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fixtureTeamLogoText: {
    fontSize: rf(16),
    fontWeight: '700',
    color: '#475569',
  },
  fixtureTeamName: {
    fontSize: rf(12),
    fontWeight: '600',
    color: '#1E293B',
    textAlign: 'center',
  },
  fixtureScoreCol: {
    alignItems: 'center',
    paddingHorizontal: s(10),
    paddingHorizontal: s(4), // ✅ reduce padding
    minWidth: s(60),
  },
  fixtureScore: {
    fontSize: rf(20),
    fontWeight: '800',
    color: '#1E293B',
  },
  fixtureVs: {
    fontSize: rf(16),
    fontWeight: '700',
    color: '#94A3B8',
  },
  fixtureRound: {
    fontSize: rf(10),
    color: '#94A3B8',
    marginTop: vs(2),
  },
  fixtureMeta: {
    fontSize: rf(10),
    color: '#94A3B8',
    marginTop: vs(2),
  },

  playerStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: vs(10),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: s(12),
  },
  playerStatPos: {
    width: s(30),
    fontSize: rf(13),
    fontWeight: '800',
    color: '#94A3B8',
    textAlign: 'center',
  },
  playerStatInfo: {flex: 1},
  playerStatName: {
    fontSize: rf(14),
    fontWeight: '700',
    color: '#0F172A',
  },
  playerStatTeam: {
    fontSize: rf(11),
    color: '#94A3B8',
    marginTop: vs(2),
  },
  playerStatValue: {alignItems: 'center'},
  playerStatNum: {
    fontSize: ms(20),
    fontWeight: '900',
    color: '#2563EB',
  },
  playerStatLabel: {
    fontSize: rf(10),
    color: '#94A3B8',
    fontWeight: '600',
  },
});
