import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import {useRoute} from '@react-navigation/native';
import API from '../../api/api';
import MainLayout from '../../components/MainLayout';
import useNavigationHelper from '../../navigation/Navigationhelper';
import {s, vs, ms, rf} from '../../utils/responsive';

const RESULT_STYLE = {
  W: {bg: '#DCFCE7', color: '#16A34A'},
  D: {bg: '#FEF9C3', color: '#D97706'},
  L: {bg: '#FEE2E2', color: '#DC2626'},
};

export default function TeamStatsScreen() {
  const {params} = useRoute();
  const nav = useNavigationHelper();
  const {teamId, tournamentId} = params || {};
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    if (!teamId) {
      Alert.alert('Error', 'Team ID missing');
      setLoading(false);
      return;
    }
    try {
      const res = await API.get(`/api/team/${teamId}/stats`, {
        params: {tournamentId},
      });
      setStats(res.data);
    } catch (err) {
      Alert.alert(
        'Error',
        err.response?.data?.message || 'Failed to load team stats',
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <MainLayout title="Team Stats" forceBack>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Loading stats...</Text>
        </View>
      </MainLayout>
    );
  }

  if (!stats) {
    return (
      <MainLayout title="Team Stats" forceBack>
        <View style={styles.center}>
          <Text style={styles.bigEmoji}>📊</Text>
          <Text style={styles.emptyTitle}>No stats available</Text>
        </View>
      </MainLayout>
    );
  }

  const {team = {}, record = {}, form = [], players = [], matches = []} = stats;

  const topScorer = [...players].sort((a, b) => b.goals - a.goals)[0];
  const topAssist = [...players].sort((a, b) => b.assists - a.assists)[0];

  return (
    <MainLayout title={team.teamName || 'Team Stats'} forceBack>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}>
        {/* ── HERO ── */}
        <View style={styles.hero}>
          {/* BG circles */}
          <View style={styles.hc1} />
          <View style={styles.hc2} />

          {/* Logo */}
          <View style={styles.heroLogoWrap}>
            {team.teamLogoUrl ? (
              <Image source={{uri: team.teamLogoUrl}} style={styles.heroLogo} />
            ) : (
              <View style={styles.heroLogoFallback}>
                <Text style={styles.heroLogoTxt}>
                  {team.teamName?.[0]?.toUpperCase() || 'T'}
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.heroName}>{team.teamName || 'Team'}</Text>
          {team.location ? (
            <Text style={styles.heroSub}>📍 {team.location}</Text>
          ) : null}

          {/* Position badge */}
          {record.position && (
            <View style={styles.posBadge}>
              <Text style={styles.posBadgeTxt}>
                #{record.position} in standings
              </Text>
            </View>
          )}

          {/* Key stats strip */}
          <View style={styles.heroStrip}>
            <HeroStat v={record.totalPoints ?? 0} l="Points" c="#60A5FA" />
            <View style={styles.hDiv} />
            <HeroStat v={record.played ?? 0} l="Played" c="#FFFFFF" />
            <View style={styles.hDiv} />
            <HeroStat v={record.wins ?? 0} l="Wins" c="#34D399" />
            <View style={styles.hDiv} />
            <HeroStat
              v={`${record.goalsFor ?? 0}:${record.goalsAgainst ?? 0}`}
              l="Goals"
              c="#FBBF24"
            />
          </View>
        </View>

        {/* ── FORM GUIDE ── */}
        {form.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Recent Form</Text>
            <View style={styles.formRow}>
              {form.map((r, i) => {
                const rs = RESULT_STYLE[r] || {bg: '#F1F5F9', color: '#94A3B8'};
                return (
                  <View
                    key={i}
                    style={[styles.formPill, {backgroundColor: rs.bg}]}>
                    <Text style={[styles.formPillTxt, {color: rs.color}]}>
                      {r}
                    </Text>
                  </View>
                );
              })}
              <Text style={styles.formLabel}>Last {form.length} matches</Text>
            </View>
          </View>
        )}

        {/* ── RECORD CARD ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Season Record</Text>
          <View style={styles.recordGrid}>
            <RecordTile label="Wins" value={record.wins ?? 0} color="#16A34A" />
            <RecordTile
              label="Draws"
              value={record.draws ?? 0}
              color="#D97706"
            />
            <RecordTile
              label="Losses"
              value={record.losses ?? 0}
              color="#DC2626"
            />
            <RecordTile
              label="Goals For"
              value={record.goalsFor ?? 0}
              color="#2563EB"
            />
            <RecordTile
              label="Goals Against"
              value={record.goalsAgainst ?? 0}
              color="#64748B"
            />
            <RecordTile
              label="Goal Diff"
              value={
                (record.goalDifference ?? 0) > 0
                  ? `+${record.goalDifference}`
                  : record.goalDifference ?? 0
              }
              color={(record.goalDifference ?? 0) >= 0 ? '#16A34A' : '#DC2626'}
            />
            <RecordTile
              label="Clean Sheets"
              value={record.cleanSheets ?? 0}
              color="#0EA5E9"
            />
            <RecordTile
              label="Points"
              value={record.totalPoints ?? 0}
              color="#6366F1"
            />
          </View>
        </View>

        {/* ── TOP PERFORMERS ── */}
        {(topScorer || topAssist) && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Top Performers</Text>
            <View style={styles.performersRow}>
              {topScorer && topScorer.goals > 0 && (
                <View style={styles.performerCard}>
                  <Text style={styles.performerEmoji}>⚽</Text>
                  <Text style={styles.performerVal}>{topScorer.goals}</Text>
                  <Text style={styles.performerName} numberOfLines={1}>
                    {topScorer.playerName}
                  </Text>
                  <Text style={styles.performerLbl}>Top Scorer</Text>
                </View>
              )}
              {topAssist && topAssist.assists > 0 && (
                <View style={styles.performerCard}>
                  <Text style={styles.performerEmoji}>🎯</Text>
                  <Text style={styles.performerVal}>{topAssist.assists}</Text>
                  <Text style={styles.performerName} numberOfLines={1}>
                    {topAssist.playerName}
                  </Text>
                  <Text style={styles.performerLbl}>Top Assists</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* ── PLAYER STATS TABLE ── */}
        {players.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHead}>
              <Text style={styles.cardTitle}>Player Stats</Text>
              <Text style={styles.cardSub}>{players.length} players</Text>
            </View>

            {/* Header row */}
            <View style={styles.tableHead}>
              <Text style={[styles.tableH, {flex: 1}]}>Player</Text>
              <Text style={styles.tableH}>MP</Text>
              <Text style={styles.tableH}>G</Text>
              <Text style={styles.tableH}>A</Text>
              <Text style={styles.tableH}>YC</Text>
              <Text style={styles.tableH}>RC</Text>
            </View>

            {players.map((p, i) => (
              <View
                key={p.playerId || i}
                style={[styles.tableRow, i % 2 === 0 && styles.tableRowAlt]}>
                <View style={[styles.tableCell, {flex: 1}]}>
                  <View style={styles.playerDot} />
                  <Text style={styles.playerName} numberOfLines={1}>
                    {p.playerName || 'Unknown'}
                  </Text>
                </View>
                <TableCell value={p.matchesPlayed ?? 0} />
                <TableCell
                  value={p.goals ?? 0}
                  highlight={p.goals > 0}
                  color="#2563EB"
                />
                <TableCell
                  value={p.assists ?? 0}
                  highlight={p.assists > 0}
                  color="#8B5CF6"
                />
                <TableCell
                  value={p.yellowCards ?? 0}
                  highlight={p.yellowCards > 0}
                  color="#EAB308"
                />
                <TableCell
                  value={p.redCards ?? 0}
                  highlight={p.redCards > 0}
                  color="#DC2626"
                />
              </View>
            ))}
          </View>
        )}

        {/* ── MATCH HISTORY ── */}
        {matches.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHead}>
              <Text style={styles.cardTitle}>Match History</Text>
              <Text style={styles.cardSub}>{matches.length} matches</Text>
            </View>

            {matches.map((m, i) => {
              const rs = RESULT_STYLE[m.result] || {
                bg: '#F1F5F9',
                color: '#94A3B8',
              };
              return (
                <TouchableOpacity
                  key={m._id || i}
                  style={styles.matchRow}
                  activeOpacity={0.75}
                  onPress={() => {
                    nav.toMatch('MatchSummary', {matchId: m._id});
                  }}
                  >
                  {/* Result pill */}
                  <View style={[styles.resPill, {backgroundColor: rs.bg}]}>
                    <Text style={[styles.resPillTxt, {color: rs.color}]}>
                      {m.result}
                    </Text>
                  </View>

                  {/* Match info */}
                  <View style={styles.matchInfo}>
                    <Text style={styles.matchOpp} numberOfLines={1}>
                      vs {m.opponentName || 'Opponent'}
                    </Text>
                    <Text style={styles.matchDate}>
                      {m.scheduledAt
                        ? new Date(m.scheduledAt).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                          })
                        : ''}
                      {m.round ? ` · Round ${m.round}` : ''}
                    </Text>
                  </View>

                  {/* Score */}
                  <View style={styles.scoreBox}>
                    <Text style={styles.scoreTxt}>
                      {m.myGoals} - {m.oppGoals}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </MainLayout>
  );
}

/* ── Sub Components ── */

function HeroStat({v, l, c}) {
  return (
    <View style={styles.hStat}>
      <Text style={[styles.hStatV, {color: c}]}>{v}</Text>
      <Text style={styles.hStatL}>{l}</Text>
    </View>
  );
}

function RecordTile({label, value, color}) {
  return (
    <View style={styles.recordTile}>
      <Text style={[styles.recordTileVal, {color}]}>{value}</Text>
      <Text style={styles.recordTileLbl}>{label}</Text>
    </View>
  );
}

function TableCell({value, highlight, color}) {
  return (
    <View style={styles.tableCell}>
      {highlight ? (
        <View style={[styles.cellBadge, {backgroundColor: color + '15'}]}>
          <Text style={[styles.cellBadgeTxt, {color}]}>{value}</Text>
        </View>
      ) : (
        <Text style={styles.cellTxt}>{value}</Text>
      )}
    </View>
  );
}

/* ── Styles ── */

const styles = StyleSheet.create({
  scroll: {paddingBottom: vs(48), backgroundColor: '#F8FAFC'},
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: vs(10),
    backgroundColor: '#F8FAFC',
  },
  loadingText: {color: '#94A3B8', fontSize: rf(14)},
  bigEmoji: {fontSize: ms(44)},
  emptyTitle: {fontSize: rf(18), fontWeight: '800', color: '#0F172A'},

  /* HERO */
  hero: {
    margin: s(16),
    marginBottom: vs(12),
    backgroundColor: '#1D4ED8',
    borderRadius: ms(24),
    padding: s(24),
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
  },
  hc1: {
    position: 'absolute',
    width: s(200),
    height: s(200),
    borderRadius: s(100),
    backgroundColor: '#2563EB30',
    right: -s(60),
    top: -s(60),
  },
  hc2: {
    position: 'absolute',
    width: s(150),
    height: s(150),
    borderRadius: s(75),
    backgroundColor: '#3B82F620',
    left: -s(40),
    bottom: -s(40),
  },

  heroLogoWrap: {marginBottom: vs(12)},
  heroLogo: {
    width: s(80),
    height: s(80),
    borderRadius: s(40),
    borderWidth: 3,
    borderColor: '#60A5FA',
  },
  heroLogoFallback: {
    width: s(80),
    height: s(80),
    borderRadius: s(40),
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#60A5FA',
  },
  heroLogoTxt: {fontSize: ms(32), fontWeight: '900', color: '#FFFFFF'},

  heroName: {fontSize: ms(22), fontWeight: '900', color: '#FFFFFF'},
  heroSub: {
    fontSize: rf(13),
    color: '#BFDBFE',
    fontWeight: '500',
    marginTop: vs(2),
    marginBottom: vs(8),
  },

  posBadge: {
    backgroundColor: '#1E40AF',
    paddingHorizontal: s(14),
    paddingVertical: vs(4),
    borderRadius: ms(20),
    marginBottom: vs(16),
  },
  posBadgeTxt: {color: '#BFDBFE', fontSize: rf(12), fontWeight: '700'},

  heroStrip: {
    flexDirection: 'row',
    backgroundColor: '#1E40AF',
    borderRadius: ms(16),
    paddingVertical: vs(12),
    width: '100%',
    marginTop: vs(4),
  },
  hStat: {flex: 1, alignItems: 'center'},
  hStatV: {fontSize: ms(18), fontWeight: '900'},
  hStatL: {
    fontSize: rf(9),
    color: '#93C5FD',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginTop: vs(2),
  },
  hDiv: {width: 1, backgroundColor: '#2563EB', marginVertical: vs(4)},

  /* CARD */
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: s(16),
    marginBottom: vs(12),
    padding: s(18),
    borderRadius: ms(20),
    borderWidth: 1,
    borderColor: '#EFF6FF',
    shadowColor: '#1E3A8A',
    shadowOpacity: 0.06,
    shadowOffset: {width: 0, height: vs(3)},
    shadowRadius: 10,
    elevation: 3,
  },
  cardHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: vs(14),
  },
  cardTitle: {
    fontSize: rf(16),
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: vs(14),
  },
  cardSub: {fontSize: rf(12), color: '#94A3B8'},

  /* FORM */
  formRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
    flexWrap: 'wrap',
  },
  formPill: {
    width: s(36),
    height: s(36),
    borderRadius: s(18),
    alignItems: 'center',
    justifyContent: 'center',
  },
  formPillTxt: {fontSize: rf(14), fontWeight: '900'},
  formLabel: {
    fontSize: rf(12),
    color: '#94A3B8',
    fontWeight: '600',
    marginLeft: s(4),
  },

  /* RECORD GRID */
  recordGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: s(10)},
  recordTile: {
    width: '22%',
    flexGrow: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: ms(12),
    padding: s(12),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFF6FF',
  },
  recordTileVal: {fontSize: ms(22), fontWeight: '900'},
  recordTileLbl: {
    fontSize: rf(9),
    color: '#94A3B8',
    fontWeight: '600',
    textTransform: 'uppercase',
    textAlign: 'center',
    marginTop: vs(2),
  },

  /* TOP PERFORMERS */
  performersRow: {flexDirection: 'row', gap: s(12)},
  performerCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: ms(16),
    padding: s(16),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFF6FF',
  },
  performerEmoji: {fontSize: ms(28), marginBottom: vs(6)},
  performerVal: {fontSize: ms(32), fontWeight: '900', color: '#2563EB'},
  performerName: {
    fontSize: rf(13),
    fontWeight: '700',
    color: '#0F172A',
    marginTop: vs(4),
  },
  performerLbl: {
    fontSize: rf(11),
    color: '#94A3B8',
    fontWeight: '600',
    marginTop: vs(2),
  },

  /* PLAYER TABLE */
  tableHead: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: vs(8),
    paddingHorizontal: s(4),
    backgroundColor: '#F8FAFC',
    borderRadius: ms(10),
    marginBottom: vs(4),
  },
  tableH: {
    width: s(32),
    textAlign: 'center',
    fontSize: rf(10),
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: vs(10),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tableRowAlt: {backgroundColor: '#FAFAFA'},
  tableCell: {width: s(32), alignItems: 'center', justifyContent: 'center'},
  playerDot: {
    width: s(6),
    height: s(6),
    borderRadius: s(3),
    backgroundColor: '#2563EB',
    marginRight: s(8),
  },
  playerName: {fontSize: rf(13), fontWeight: '700', color: '#0F172A', flex: 1},
  cellBadge: {
    paddingHorizontal: s(6),
    paddingVertical: vs(2),
    borderRadius: ms(8),
  },
  cellBadgeTxt: {fontSize: rf(11), fontWeight: '800'},
  cellTxt: {fontSize: rf(13), color: '#94A3B8', fontWeight: '600'},

  /* MATCH HISTORY */
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: vs(11),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: s(10),
  },
  resPill: {
    width: s(32),
    height: s(32),
    borderRadius: s(16),
    alignItems: 'center',
    justifyContent: 'center',
  },
  resPillTxt: {fontSize: rf(12), fontWeight: '900'},
  matchInfo: {flex: 1},
  matchOpp: {fontSize: rf(13), fontWeight: '700', color: '#0F172A'},
  matchDate: {
    fontSize: rf(10),
    color: '#94A3B8',
    fontWeight: '500',
    marginTop: vs(1),
  },
  scoreBox: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: s(10),
    paddingVertical: vs(4),
    borderRadius: ms(8),
  },
  scoreTxt: {fontSize: rf(13), fontWeight: '800', color: '#2563EB'},
});
