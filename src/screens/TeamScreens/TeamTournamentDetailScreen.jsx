import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import {useRoute} from '@react-navigation/native';
import API from '../../api/api';
import MainLayout from '../../components/MainLayout';
import useNavigationHelper from '../../navigation/Navigationhelper';
import {s, vs, ms, rf} from '../../utils/responsive';

export default function TeamTournamentDetailScreen() {
  const route = useRoute();
  const nav = useNavigationHelper();
  const {tournamentId} = route.params || {};

  const [tournament, setTournament] = useState(null);
  const [teamContext, setTeamContext] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (tournamentId) load();
  }, [tournamentId]);

  const load = async () => {
    try {
      const [tRes, mRes] = await Promise.all([
        API.get(`/api/tournament/${tournamentId}/teamView`),
        API.get(`/api/match/byTournament/${tournamentId}`),
      ]);
      setTournament(tRes.data.tournament);
      setTeamContext(tRes.data.teamContext);
      setMatches(Array.isArray(mRes.data) ? mRes.data : []);
    } catch (err) {
      console.error('Tournament load failed', err.response?.data || err.message);
      setTournament(null);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    setJoining(true);
    try {
      await API.post(`/api/tournament/${tournamentId}/join`);
      await load();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to join');
    } finally {
      setJoining(false);
    }
  };

  if (!tournamentId) {
    return (
      <MainLayout title="Tournament" forceBack>
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>⚠️</Text>
          <Text style={styles.emptyTitle}>Invalid tournament</Text>
        </View>
      </MainLayout>
    );
  }

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
          <Text style={styles.emptyTitle}>Tournament not found</Text>
        </View>
      </MainLayout>
    );
  }

  const isCompleted = tournament.status === 'COMPLETED';
  const isLive = tournament.status === 'LIVE';
  const totalTeams = tournament.teams?.length || 0;
  const maxTeams = tournament.maxTeams || 0;
  const fillPct = maxTeams > 0 ? Math.min(100, (totalTeams / maxTeams) * 100) : 0;

  const myMatches = matches.filter(
    m => m.status !== 'CANCELLED' && m.status !== 'REJECTED',
  );
  const completedMatches = myMatches.filter(m => m.status === 'COMPLETED');
  const upcomingMatches = myMatches.filter(m =>
    ['PENDING', 'ACCEPTED'].includes(m.status),
  );
  const liveMatch = myMatches.find(m => m.status === 'LIVE');

  return (
    <MainLayout title={tournament.name} forceBack>
      <FlatList
        data={myMatches}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* ── HERO CARD ── */}
            <View style={styles.heroCard}>
              <View style={styles.heroCircle1} />
              <View style={styles.heroCircle2} />

              <View style={styles.heroTopRow}>
                <StatusBadge status={tournament.status} />
              </View>

              <Text style={styles.heroName}>{tournament.name}</Text>
              <Text style={styles.heroMeta}>
                {tournament.venue || 'Venue TBA'} · {tournament.format || 'Open'}
              </Text>

              {/* Date range */}
              <Text style={styles.heroDates}>
                {formatDate(tournament.startDate)} – {formatDate(tournament.endDate)}
              </Text>

              {/* Stats row */}
              <View style={styles.heroStatsRow}>
                <HeroStat label="Teams" value={`${totalTeams}${maxTeams ? `/${maxTeams}` : ''}`} />
                <View style={styles.heroStatDivider} />
                <HeroStat label="Matches" value={`${myMatches.length}`} />
                <View style={styles.heroStatDivider} />
                <HeroStat label="Format" value={tournament.format || '—'} />
              </View>
            </View>

            {/* ── JOIN BANNER ── */}
            {teamContext?.canJoin && (
              <TouchableOpacity
                style={styles.joinBanner}
                onPress={handleJoin}
                disabled={joining}
                activeOpacity={0.85}>
                <View>
                  <Text style={styles.joinBannerTitle}>Ready to compete?</Text>
                  <Text style={styles.joinBannerSub}>Join this tournament with your team</Text>
                </View>
                <View style={styles.joinBannerBtn}>
                  {joining ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.joinBannerBtnText}>Join →</Text>
                  )}
                </View>
              </TouchableOpacity>
            )}

            {/* ── LIVE MATCH CALLOUT ── */}
            {liveMatch && (
              <TouchableOpacity
                style={styles.liveCallout}
                onPress={() => nav.toMatch('MatchConsole', {matchId: liveMatch._id})}
                activeOpacity={0.88}>
                <View style={styles.liveCalloutLeft}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveCalloutLabel}>Live now</Text>
                </View>
                <Text style={styles.liveCalloutMatch} numberOfLines={1}>
                  {liveMatch.homeTeam?.teamName} vs {liveMatch.awayTeam?.teamName}
                </Text>
                <Text style={styles.liveCalloutScore}>
                  {liveMatch.score?.home ?? 0} – {liveMatch.score?.away ?? 0}
                </Text>
              </TouchableOpacity>
            )}

            {/* ── QUICK STATS ── */}
            {myMatches.length > 0 && (
              <View style={styles.quickStatsRow}>
                <QuickStat
                  icon="✅"
                  value={completedMatches.length}
                  label="Played"
                  color="#2563EB"
                />
                <QuickStat
                  icon="📅"
                  value={upcomingMatches.length}
                  label="Upcoming"
                  color="#F59E0B"
                />
                <QuickStat
                  icon="🔴"
                  value={liveMatch ? 1 : 0}
                  label="Live"
                  color="#EF4444"
                />
              </View>
            )}

            {/* ── SECTION HEADER ── */}
            {myMatches.length > 0 && (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Fixtures</Text>
                <Text style={styles.sectionCount}>{myMatches.length} matches</Text>
              </View>
            )}
          </>
        }
        renderItem={({item}) => <MatchCard item={item} nav={nav} />}
        ListEmptyComponent={
          <View style={styles.emptyMatches}>
            <Text style={styles.emptyMatchIcon}>📋</Text>
            <Text style={styles.emptyMatchTitle}>No fixtures yet</Text>
            <Text style={styles.emptyMatchSub}>
              Fixtures will appear here once the organiser generates them
            </Text>
          </View>
        }
      />
    </MainLayout>
  );
}

/* ─── Match Card ─── */
function MatchCard({item, nav}) {
  const isCompleted = item.status === 'COMPLETED';
  const isLive = item.status === 'LIVE';
  const canEditLineup = item.permissions?.canEditLineup;

  const handlePress = () => {
    if (isCompleted) nav.toMatch('MatchSummary', {matchId: item._id});
    else if (isLive) nav.toMatch('MatchConsole', {matchId: item._id});
    else nav.toMatch('MatchDetail', {matchId: item._id});
  };

  const statusColor = {
    LIVE: '#EF4444',
    COMPLETED: '#2563EB',
    ACCEPTED: '#16A34A',
    PENDING: '#F59E0B',
  };
  const statusLabel = {
    LIVE: '● Live',
    COMPLETED: 'Full time',
    ACCEPTED: 'Confirmed',
    PENDING: 'Scheduled',
  };

  return (
    <TouchableOpacity
      style={[styles.matchCard, isLive && styles.matchCardLive]}
      onPress={handlePress}
      activeOpacity={0.85}>
      {/* Status strip */}
      <View style={[styles.matchAccent, {
        backgroundColor: statusColor[item.status] || '#94A3B8',
      }]} />

      <View style={styles.matchCardContent}>
        {/* Teams + Score */}
        <View style={styles.matchTeamsRow}>
          <View style={styles.matchTeamBlock}>
            <View style={styles.matchTeamLogo}>
              <Text style={styles.matchTeamLogoText}>
                {item.homeTeam?.teamName?.[0]?.toUpperCase() || 'H'}
              </Text>
            </View>
            <Text style={styles.matchTeamName} numberOfLines={1}>
              {item.homeTeam?.teamName || 'Home'}
            </Text>
          </View>

          <View style={styles.matchCenter}>
            {isCompleted || isLive ? (
              <View style={styles.scoreBox}>
                <Text style={styles.scoreText}>
                  {item.score?.home ?? 0}
                </Text>
                <Text style={styles.scoreSep}>:</Text>
                <Text style={styles.scoreText}>
                  {item.score?.away ?? 0}
                </Text>
              </View>
            ) : (
              <View style={styles.vsBox}>
                <Text style={styles.vsText}>VS</Text>
              </View>
            )}
            <View style={[
              styles.matchStatusPill,
              {backgroundColor: (statusColor[item.status] || '#94A3B8') + '18'},
            ]}>
              <Text style={[
                styles.matchStatusText,
                {color: statusColor[item.status] || '#94A3B8'},
              ]}>
                {statusLabel[item.status] || item.status}
              </Text>
            </View>
          </View>

          <View style={[styles.matchTeamBlock, {alignItems: 'flex-end'}]}>
            <View style={styles.matchTeamLogo}>
              <Text style={styles.matchTeamLogoText}>
                {item.awayTeam?.teamName?.[0]?.toUpperCase() || 'A'}
              </Text>
            </View>
            <Text style={[styles.matchTeamName, {textAlign: 'right'}]} numberOfLines={1}>
              {item.awayTeam?.teamName || 'Away'}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.matchFooter}>
          <Text style={styles.matchDate}>
            📅 {item.scheduledAt
              ? new Date(item.scheduledAt).toLocaleDateString('en-GB', {
                  weekday: 'short', day: 'numeric', month: 'short',
                  hour: '2-digit', minute: '2-digit',
                })
              : 'Date TBA'}
          </Text>

          {canEditLineup && (
            <TouchableOpacity
              style={styles.lineupBtn}
              onPress={() => nav.toMatch('MatchLineup', {matchId: item._id})}>
              <Text style={styles.lineupBtnText}>+ Lineup</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

/* ─── Small components ─── */
function StatusBadge({status}) {
  const map = {
    DRAFT:               {bg: '#1E293B', dot: '#94A3B8', label: 'Draft'},
    REGISTRATION_OPEN:   {bg: '#14532D', dot: '#22C55E', label: 'Registration Open'},
    REGISTRATION_CLOSED: {bg: '#431407', dot: '#F97316', label: 'Reg. Closed'},
    FIXTURES_GENERATED:  {bg: '#1E3A8A', dot: '#60A5FA', label: 'Fixtures Set'},
    LIVE:                {bg: '#7F1D1D', dot: '#F87171', label: '● Live'},
    COMPLETED:           {bg: '#064E3B', dot: '#34D399', label: 'Completed'},
  };
  const c = map[status] || map.DRAFT;
  return (
    <View style={[styles.statusBadge, {backgroundColor: c.bg}]}>
      <View style={[styles.statusDot, {backgroundColor: c.dot}]} />
      <Text style={styles.statusBadgeText}>{c.label}</Text>
    </View>
  );
}

function HeroStat({label, value}) {
  return (
    <View style={styles.heroStat}>
      <Text style={styles.heroStatValue}>{value}</Text>
      <Text style={styles.heroStatLabel}>{label}</Text>
    </View>
  );
}

function QuickStat({icon, value, label, color}) {
  return (
    <View style={styles.quickStat}>
      <Text style={styles.quickStatIcon}>{icon}</Text>
      <Text style={[styles.quickStatValue, {color}]}>{value}</Text>
      <Text style={styles.quickStatLabel}>{label}</Text>
    </View>
  );
}

const formatDate = d =>
  d ? new Date(d).toLocaleDateString('en-GB', {day: 'numeric', month: 'short', year: 'numeric'}) : 'TBA';

/* ─── Styles ─── */
const styles = StyleSheet.create({
  listContent: {
    paddingBottom: vs(40),
    backgroundColor: '#F8FAFC',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    gap: vs(10),
  },
  loadingText: {color: '#94A3B8', fontSize: rf(14)},
  emptyIcon: {fontSize: ms(44)},
  emptyTitle: {fontSize: rf(16), fontWeight: '700', color: '#1E293B'},

  /* HERO */
  heroCard: {
    margin: s(16),
    marginBottom: vs(12),
    backgroundColor: '#2563EB',
    borderRadius: ms(24),
    padding: s(22),
    overflow: 'hidden',
    position: 'relative',
  },
  heroCircle1: {
    position: 'absolute',
    width: s(180),
    height: s(180),
    borderRadius: s(90),
    backgroundColor: '#ffffff12',
    right: -s(30),
    top: -s(50),
  },
  heroCircle2: {
    position: 'absolute',
    width: s(100),
    height: s(100),
    borderRadius: s(50),
    backgroundColor: '#ffffff08',
    right: s(30),
    bottom: -s(20),
  },
  heroTopRow: {
    marginBottom: vs(12),
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: s(10),
    paddingVertical: vs(4),
    borderRadius: ms(20),
    gap: s(5),
  },
  statusDot: {
    width: s(7),
    height: s(7),
    borderRadius: s(4),
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: rf(11),
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  heroName: {
    fontSize: ms(22),
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: vs(28),
    marginBottom: vs(6),
  },
  heroMeta: {
    color: '#BFDBFE',
    fontSize: rf(13),
    fontWeight: '500',
    marginBottom: vs(2),
  },
  heroDates: {
    color: '#93C5FD',
    fontSize: rf(12),
    fontWeight: '500',
    marginBottom: vs(18),
  },
  heroStatsRow: {
    flexDirection: 'row',
    backgroundColor: '#1D4ED8',
    borderRadius: ms(16),
    paddingVertical: vs(12),
    paddingHorizontal: s(6),
  },
  heroStat: {
    flex: 1,
    alignItems: 'center',
  },
  heroStatValue: {
    fontSize: ms(18),
    fontWeight: '900',
    color: '#FFFFFF',
  },
  heroStatLabel: {
    fontSize: rf(10),
    color: '#93C5FD',
    fontWeight: '600',
    marginTop: vs(2),
  },
  heroStatDivider: {
    width: 1,
    backgroundColor: '#3B82F6',
    marginVertical: vs(4),
  },

  /* JOIN BANNER */
  joinBanner: {
    marginHorizontal: s(16),
    marginBottom: vs(12),
    backgroundColor: '#F0FDF4',
    borderRadius: ms(18),
    padding: s(16),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  joinBannerTitle: {
    fontSize: rf(15),
    fontWeight: '800',
    color: '#14532D',
  },
  joinBannerSub: {
    fontSize: rf(12),
    color: '#16A34A',
    marginTop: vs(2),
  },
  joinBannerBtn: {
    backgroundColor: '#16A34A',
    paddingHorizontal: s(18),
    paddingVertical: vs(10),
    borderRadius: ms(12),
  },
  joinBannerBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: rf(14),
  },

  /* LIVE CALLOUT */
  liveCallout: {
    marginHorizontal: s(16),
    marginBottom: vs(12),
    backgroundColor: '#FEF2F2',
    borderRadius: ms(16),
    padding: s(14),
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(10),
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  liveCalloutLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(5),
  },
  liveDot: {
    width: s(8),
    height: s(8),
    borderRadius: s(4),
    backgroundColor: '#EF4444',
  },
  liveCalloutLabel: {
    fontSize: rf(11),
    fontWeight: '700',
    color: '#EF4444',
  },
  liveCalloutMatch: {
    flex: 1,
    fontSize: rf(13),
    fontWeight: '700',
    color: '#0F172A',
  },
  liveCalloutScore: {
    fontSize: rf(16),
    fontWeight: '900',
    color: '#0F172A',
  },

  /* QUICK STATS */
  quickStatsRow: {
    flexDirection: 'row',
    marginHorizontal: s(16),
    marginBottom: vs(16),
    gap: s(10),
  },
  quickStat: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: ms(16),
    paddingVertical: vs(14),
    alignItems: 'center',
    gap: vs(3),
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#EEF2FF',
  },
  quickStatIcon: {fontSize: ms(18)},
  quickStatValue: {
    fontSize: ms(20),
    fontWeight: '900',
  },
  quickStatLabel: {
    fontSize: rf(10),
    color: '#94A3B8',
    fontWeight: '600',
  },

  /* SECTION HEADER */
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: s(16),
    marginBottom: vs(10),
  },
  sectionTitle: {
    fontSize: rf(18),
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionCount: {
    fontSize: rf(12),
    color: '#94A3B8',
    fontWeight: '500',
  },

  /* MATCH CARD */
  matchCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: s(16),
    marginBottom: vs(10),
    borderRadius: ms(18),
    overflow: 'hidden',
    flexDirection: 'row',
    shadowColor: '#1E3A8A',
    shadowOffset: {width: 0, height: vs(2)},
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#EEF2FF',
  },
  matchCardLive: {
    borderColor: '#FECACA',
    shadowColor: '#EF4444',
    shadowOpacity: 0.12,
  },
  matchAccent: {
    width: s(4),
  },
  matchCardContent: {
    flex: 1,
    padding: s(14),
  },
  matchTeamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: vs(12),
    gap: s(6),
  },
  matchTeamBlock: {
    flex: 1,
    alignItems: 'flex-start',
    gap: vs(5),
  },
  matchTeamLogo: {
    width: s(40),
    height: s(40),
    borderRadius: s(20),
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#DBEAFE',
  },
  matchTeamLogoText: {
    fontSize: ms(16),
    fontWeight: '900',
    color: '#2563EB',
  },
  matchTeamName: {
    fontSize: rf(12),
    fontWeight: '700',
    color: '#0F172A',
    maxWidth: s(80),
  },
  matchCenter: {
    alignItems: 'center',
    gap: vs(6),
    minWidth: s(64),
  },
  scoreBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(4),
  },
  scoreText: {
    fontSize: ms(24),
    fontWeight: '900',
    color: '#0F172A',
    minWidth: s(24),
    textAlign: 'center',
  },
  scoreSep: {
    fontSize: ms(18),
    color: '#CBD5E1',
    fontWeight: '700',
  },
  vsBox: {
    width: s(38),
    height: s(38),
    borderRadius: s(19),
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  vsText: {
    fontSize: rf(11),
    fontWeight: '900',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  matchStatusPill: {
    paddingHorizontal: s(8),
    paddingVertical: vs(3),
    borderRadius: ms(20),
  },
  matchStatusText: {
    fontSize: rf(10),
    fontWeight: '700',
  },
  matchFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: vs(10),
  },
  matchDate: {
    fontSize: rf(11),
    color: '#94A3B8',
    fontWeight: '500',
    flex: 1,
  },
  lineupBtn: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: s(12),
    paddingVertical: vs(5),
    borderRadius: ms(10),
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  lineupBtnText: {
    color: '#2563EB',
    fontSize: rf(11),
    fontWeight: '700',
  },

  /* EMPTY MATCHES */
  emptyMatches: {
    alignItems: 'center',
    paddingTop: vs(40),
    paddingHorizontal: s(32),
  },
  emptyMatchIcon: {fontSize: ms(44), marginBottom: vs(12)},
  emptyMatchTitle: {
    fontSize: rf(17),
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: vs(6),
  },
  emptyMatchSub: {
    fontSize: rf(13),
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: vs(20),
  },
});