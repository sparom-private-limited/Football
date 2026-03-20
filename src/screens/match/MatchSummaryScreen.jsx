import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import API from '../../api/api';
import {useRoute} from '@react-navigation/native';
import useNavigationHelper from '../../navigation/Navigationhelper';
import Pitch from '../../components/lineup/Pitch';
import {s, vs, ms, rf} from '../../utils/responsive';

export default function MatchSummaryScreen() {
  const {params} = useRoute();
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Stats');
  const nav = useNavigationHelper();
  const [lineups, setLineups] = useState(null);
  const [selectedLineupTeam, setSelectedLineupTeam] = useState(null);

  useEffect(() => {
    setLoading(true);
    setMatch(null);
    load();
  }, [params.matchId]);

  const load = async () => {
    try {
      const [summaryRes, lineupRes] = await Promise.all([
        API.get(`/api/match/${params.matchId}/summary`),
        API.get(`/api/match/${params.matchId}/lineups`),
      ]);

      const normalizeEvent = e => ({
        type: e.type,
        minute: e.minute,
        team: e.teamId || e.team || null,
        teamName: e.teamName || 'Unknown Team',
        player: e.player ? {name: e.player} : null,
        assistPlayer: e.assist ? {name: e.assist} : null,
        substitutedPlayer: e.in ? {name: e.in} : null,
        reason: e.reason || null,
      });

      const summary = summaryRes.data;

      setMatch({
        _id: summary.match.id,
        status: summary.match.status,
        venue: summary.match.venue,
        startedAt: summary.match.startedAt,
        completedAt: summary.match.completedAt,
        homeTeam: {
          _id: summary.teams.home.id,
          teamName: summary.teams.home.name,
          teamLogoUrl: summary.teams.home.logo,
        },
        awayTeam: {
          _id: summary.teams.away.id,
          teamName: summary.teams.away.name,
          teamLogoUrl: summary.teams.away.logo,
        },
        score: {
          home: summary.teams.home.score,
          away: summary.teams.away.score,
        },
        winner: summary.winner ? {teamName: summary.winner.teamName} : null,
        // ✅ All event types for timeline
        events: [
          ...summary.summary.goals.map(normalizeEvent),
          ...(summary.summary.penalties || []).map(normalizeEvent),
          ...summary.summary.cards.map(normalizeEvent),
          ...summary.summary.substitutions.map(normalizeEvent),
        ],
        // ✅ In-play penalties separate list
        inPlayPenalties: (summary.summary.penalties || []).map(normalizeEvent),
        // ✅ Shootout data
        penaltyShootout: summary.penaltyShootout || null,
      });

      setLineups(lineupRes.data);
    } catch (err) {
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const lineupMap = useMemo(() => {
    if (!lineups) return null;
    const mapSide = side => {
      if (!Array.isArray(lineups?.[side]?.starting)) return {};
      return Object.fromEntries(
        lineups[side].starting
          .filter(s => s && s.slotKey && s.player)
          .map(s => [s.slotKey, s.player]),
      );
    };
    return {home: mapSide('home'), away: mapSide('away')};
  }, [lineups]);

  const stats = useMemo(() => {
    if (!match) return null;
    const base = {
      home: {goals: 0, fouls: 0, yellow: 0, red: 0},
      away: {goals: 0, fouls: 0, yellow: 0, red: 0},
    };
    match.events.forEach(e => {
      let side;
      if (e.team) {
        // ✅ Use ID if available
        side = String(e.team) === String(match.homeTeam._id) ? 'home' : 'away';
      } else {
        // ✅ Fallback to teamName for cards
        side = e.teamName === match.homeTeam.teamName ? 'home' : 'away';
      }
      if (['GOAL', 'PENALTY_GOAL', 'OWN_GOAL'].includes(e.type))
        base[side].goals++;
      if (e.type === 'YELLOW') base[side].yellow++;
      if (e.type === 'RED') base[side].red++;
      if (e.type === 'FOUL') base[side].fouls++;
    });
    return base;
  }, [match]);

  const TABS = useMemo(() => {
    const base = ['Info', 'Stats', 'Lineups', 'Timeline'];
    if (match?.penaltyShootout?.isActive) base.push('Shootout');
    return base;
  }, [match?.penaltyShootout?.isActive]);

  if (loading) return <ActivityIndicator style={{marginTop: 40}} />;

  const isDraw = match.score.home === match.score.away;

  const isTimeline = activeTab === 'Timeline';
  const timelineData = isTimeline
    ? [...match.events].sort((a, b) => a.minute - b.minute)
    : [];

  // ✅ Everything above the scrollable content goes here
  function ListHeader({
    match,
    isDraw,
    TABS,
    activeTab,
    setActiveTab,
    stats,
    lineups,
    lineupMap,
    selectedLineupTeam,
    setSelectedLineupTeam,
    nav,
  }) {
    return (
      <View>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => nav.back()} style={styles.backBtn}>
            <Text style={styles.back}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Match Summary</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* HERO SCORE CARD */}
        <View style={styles.heroCard}>
          <Team team={match.homeTeam} />
          <View style={styles.scoreBox}>
            <Text style={styles.scoreText}>
              {match.score.home} : {match.score.away}
            </Text>
            <Text style={styles.statusText}>FULL TIME</Text>
          </View>
          <Team team={match.awayTeam} />
        </View>

        <Text style={styles.winner}>
          {isDraw && match.penaltyShootout?.isActive
            ? `${match.score.home}-${match.score.away} AET · ${match.penaltyShootout.winner} won ${match.penaltyShootout.homeScore}-${match.penaltyShootout.awayScore} on penalties`
            : isDraw
            ? 'Match Drawn'
            : `Winner: ${match.winner?.teamName}`}
        </Text>

        {/* TABS */}
        <View style={styles.tabs}>
          {TABS.map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab)}>
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab && styles.activeTabText,
                ]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* STATS TAB */}
        {activeTab === 'Stats' && stats && (
          <View style={styles.statsCard}>
            <BigStat
              label="Goals"
              left={stats.home.goals}
              right={stats.away.goals}
            />
            <BigStat
              label="Yellow Cards"
              left={stats.home.yellow}
              right={stats.away.yellow}
            />
            <BigStat
              label="Red Cards"
              left={stats.home.red}
              right={stats.away.red}
            />
            <BigStat
              label="Fouls"
              left={stats.home.fouls}
              right={stats.away.fouls}
            />
          </View>
        )}

        {/* LINEUPS TAB */}
        {activeTab === 'Lineups' && lineups && (
          <View style={styles.lineupsCard}>
            <View style={styles.teamSelector}>
              {['home', 'away'].map(side => (
                <TouchableOpacity
                  key={side}
                  style={[
                    styles.teamSelectBtn,
                    selectedLineupTeam === side && styles.teamSelectActive,
                  ]}
                  onPress={() => setSelectedLineupTeam(side)}>
                  <Text
                    style={[
                      styles.teamSelectText,
                      selectedLineupTeam === side &&
                        styles.teamSelectTextActive,
                    ]}>
                    {side === 'home'
                      ? match.homeTeam.teamName
                      : match.awayTeam.teamName}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {selectedLineupTeam && (
              <>
                {lineups[selectedLineupTeam]?.formation && (
                  <View style={styles.pitchWrapper}>
                    <Pitch
                      formation={lineups[selectedLineupTeam].formation}
                      lineup={lineupMap[selectedLineupTeam]}
                      readOnly
                    />
                  </View>
                )}
                <Text style={styles.benchTitle}>Bench</Text>
                {(lineups[selectedLineupTeam]?.bench || []).map(player => (
                  <View key={player._id} style={styles.benchItem}>
                    <Text style={styles.benchText}>{player.name}</Text>
                  </View>
                ))}
              </>
            )}
            {!selectedLineupTeam && (
              <Text style={styles.lineupHint}>
                Tap a team name to view lineup
              </Text>
            )}
          </View>
        )}

        {/* INFO TAB */}
        {activeTab === 'Info' && (
          <View style={styles.infoGrid}>
            <InfoCard label="Venue" value={match.venue || 'TBD'} icon="📍" />
            <InfoCard label="Format" value={match.format} icon="⚽" />
            <InfoCard label="Type" value={match.matchType} icon="🏆" />
            <InfoCard
              label="Completed At"
              value={new Date(match.completedAt).toLocaleString()}
              icon="⏱️"
            />
          </View>
        )}

        {/* SHOOTOUT TAB */}
        {activeTab === 'Shootout' && match.penaltyShootout && (
          <View style={styles.shootoutContainer}>
            <View style={styles.shootoutScoreCard}>
              <Text style={styles.shootoutTitle}>⚽ Penalty Shootout</Text>
              <View style={styles.shootoutScoreRow}>
                <Text style={styles.shootoutTeamName}>
                  {match.homeTeam.teamName}
                </Text>
                <Text style={styles.shootoutScore}>
                  {match.penaltyShootout.homeScore} -{' '}
                  {match.penaltyShootout.awayScore}
                </Text>
                <Text style={styles.shootoutTeamName}>
                  {match.awayTeam.teamName}
                </Text>
              </View>
              {match.penaltyShootout.winner && (
                <View style={styles.shootoutWinnerBanner}>
                  <Text style={styles.shootoutWinnerText}>
                    🏆 {match.penaltyShootout.winner} won on penalties
                  </Text>
                </View>
              )}
            </View>

            <Text style={styles.kicksTitle}>Kicks History</Text>
            {(() => {
              const rounds = {};
              (match.penaltyShootout.kicks || []).forEach(kick => {
                const r = kick.round || 1;
                if (!rounds[r]) rounds[r] = [];
                rounds[r].push(kick);
              });
              return Object.entries(rounds).map(([round, kicks]) => (
                <View key={round} style={styles.roundBlock}>
                  <Text style={styles.roundLabel}>Round {round}</Text>
                  {kicks.map((kick, i) => {
                    const isHome =
                      kick.teamId === match.homeTeam._id?.toString() ||
                      kick.teamName === match.homeTeam.teamName;
                    return (
                      <View
                        key={i}
                        style={[
                          styles.kickRow,
                          isHome ? styles.kickHome : styles.kickAway,
                        ]}>
                        <View style={styles.kickLeft}>
                          <Text style={styles.kickResult}>
                            {kick.scored ? '✅' : '❌'}
                          </Text>
                          <View>
                            <Text style={styles.kickPlayer}>
                              {kick.player || 'Unknown'}
                            </Text>
                            <Text style={styles.kickTeam}>{kick.teamName}</Text>
                          </View>
                        </View>
                        <Text style={styles.kickOutcome}>
                          {kick.scored ? 'Scored' : 'Missed'}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              ));
            })()}
          </View>
        )}
      </View>
    );
  }
  return (
    <FlatList
      data={timelineData}
      keyExtractor={(item, index) =>
        `${item.type}-${item.minute}-${item.player?.name || 'x'}-${index}`
      }
      ListHeaderComponent={
        // ✅ Pass all needed values as props — no hooks inside
        <ListHeader
          match={match}
          isDraw={isDraw}
          TABS={TABS}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          stats={stats}
          lineups={lineups}
          lineupMap={lineupMap}
          selectedLineupTeam={selectedLineupTeam}
          setSelectedLineupTeam={setSelectedLineupTeam}
          nav={nav}
        />
      }
      renderItem={({item}) => (
        <TimelineCard event={item} homeTeamId={match.homeTeam._id} />
      )}
      ListEmptyComponent={
        isTimeline ? (
          <Text style={{padding: 16, color: '#475569'}}>No events yet</Text>
        ) : null
      }
      contentContainerStyle={{paddingBottom: 30}}
      style={styles.container}
    />
  );
}

/* ---------- UI PARTS ---------- */

function Team({team}) {
  return (
    <View style={styles.team}>
      {team.teamLogoUrl ? (
        <Image source={{uri: team.teamLogoUrl}} style={styles.logo} />
      ) : (
        <View style={styles.logoFallback}>
          <Text style={styles.logoText}>{team.teamName[0]}</Text>
        </View>
      )}
      <Text style={styles.teamName}>{team.teamName}</Text>
    </View>
  );
}

function BigStat({label, left, right}) {
  return (
    <View style={styles.bigStatRow}>
      <Text style={styles.bigNumber}>{left}</Text>
      <Text style={styles.bigLabel}>{label}</Text>
      <Text style={styles.bigNumber}>{right}</Text>
    </View>
  );
}

function InfoCard({label, value, icon}) {
  return (
    <View style={styles.infoBigCard}>
      <Text style={styles.infoIcon}>{icon}</Text>
      <Text style={styles.infoBigLabel}>{label}</Text>
      <Text style={styles.infoBigValue}>{value}</Text>
    </View>
  );
}

function TimelineCard({event, homeTeamId}) {
  const isHome = String(event.team) === String(homeTeamId);
  const config = getEventConfig(event.type);

  const eventLabel =
    {
      GOAL: 'Goal',
      PENALTY_GOAL: 'Penalty Goal',
      PENALTY_MISS: 'Penalty Missed',
      OWN_GOAL: 'Own Goal',
      YELLOW: 'Yellow Card',
      RED: 'Red Card',
      SUBSTITUTION: 'Substitution',
    }[event.type] || event.type;

  return (
    <View style={[styles.timelineCard, {borderLeftColor: config.color}]}>
      {/* TOP ROW */}
      <View style={styles.timelineHeader}>
        <Text style={[styles.eventIcon, {color: config.color}]}>
          {config.icon}
        </Text>
        <Text style={styles.minuteBig}>{event.minute}'</Text>
      </View>

      {/* ✅ EVENT TYPE LABEL */}
      <Text style={[styles.eventTypeName, {color: config.color}]}>
        {eventLabel}
      </Text>

      {/* MAIN CONTENT */}
      <Text style={styles.playerName}>
        {event.player?.name || 'Unknown Player'}
      </Text>

      {/* ASSIST */}
      {event.assistPlayer && (
        <Text style={styles.assistText}>Assist: {event.assistPlayer.name}</Text>
      )}

      {/* REASON — for penalties */}
      {event.reason && (
        <Text style={styles.assistText}>Reason: {event.reason}</Text>
      )}

      {/* SUB */}
      {event.type === 'SUBSTITUTION' && (
        <Text style={styles.assistText}>
          ↘ OUT: {event.substitutedPlayer?.name}
        </Text>
      )}

      {/* TEAM SIDE */}
      <Text style={styles.teamSide}>{event.teamName}</Text>
    </View>
  );
}

function getEventConfig(type) {
  switch (type) {
    case 'GOAL':
    case 'PENALTY_GOAL':
      return {icon: '⚽', color: '#16A34A'};
    case 'PENALTY_MISS': // ✅ add this
      return {icon: '❌', color: '#DC2626'};
    case 'OWN_GOAL':
      return {icon: '🥅', color: '#DC2626'};
    case 'YELLOW':
      return {icon: '🟨', color: '#FACC15'};
    case 'RED':
      return {icon: '🟥', color: '#DC2626'};
    case 'SUBSTITUTION':
      return {icon: '🔄', color: '#2563EB'};
    default:
      return {icon: '•', color: '#64748B'};
  }
}

/* ---------- STYLES ---------- */

const styles = StyleSheet.create({
  /* ===== SCREEN ===== */

  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: s(16),
  },

  /* ===== HEADER ===== */

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: vs(15),
    marginBottom: vs(12),
  },

  backBtn: {
    width: s(50),
    height: vs(40),
    justifyContent: 'center',
  },

  back: {
    fontSize: ms(22),
    fontWeight: '700',
    color: '#0F172A',
  },

  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: rf(16),
    fontWeight: '800',
    color: '#0F172A',
  },

  headerSpacer: {
    width: s(50),
  },

  /* ===== HERO SCORE CARD ===== */

  heroCard: {
    backgroundColor: '#2563EB',
    borderRadius: ms(20),
    paddingVertical: vs(24),
    paddingHorizontal: s(20),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  team: {
    alignItems: 'center',
    width: s(90),
  },

  logo: {
    width: s(60),
    height: s(60),
    borderRadius: s(30),
  },

  logoFallback: {
    width: s(60),
    height: s(60),
    borderRadius: s(32),
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },

  logoText: {
    fontWeight: '800',
    color: '#111827',
    fontSize: rf(14),
  },

  teamName: {
    marginTop: vs(6),
    fontSize: rf(14),
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },

  scoreBox: {
    alignItems: 'center',
  },

  scoreText: {
    fontSize: ms(40),
    fontWeight: '900',
    color: '#FFFFFF',
  },

  statusText: {
    marginTop: vs(4),
    fontSize: rf(12),
    color: '#DBEAFE',
    fontWeight: '700',
  },

  winner: {
    textAlign: 'center',
    marginVertical: vs(10),
    fontWeight: '700',
    color: '#1D4ED8',
    fontSize: rf(14),
  },

  /* ===== TABS ===== */

  tabs: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    borderRadius: ms(12),
    marginVertical: vs(12),
  },

  tab: {
    flex: 1,
    paddingVertical: vs(10),
    alignItems: 'center',
  },

  activeTab: {
    backgroundColor: '#FFFFFF',
    borderRadius: ms(12),
  },

  tabText: {
    fontWeight: '700',
    color: '#475569',
    fontSize: rf(13),
  },

  activeTabText: {
    color: '#2563EB',
  },

  /* ===== STATS ===== */

  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: ms(20),
    paddingVertical: vs(20),
    paddingHorizontal: s(16),
  },

  bigStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: vs(14),
  },

  bigNumber: {
    fontSize: ms(26),
    fontWeight: '900',
    color: '#0F172A',
  },

  bigLabel: {
    fontSize: rf(16),
    fontWeight: '700',
    color: '#64748B',
  },

  /* ===== TIMELINE ===== */

  timelineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: ms(16),
    padding: s(12),
    marginBottom: vs(10),
    borderLeftWidth: 5,
    elevation: 2,
  },
  eventTypeName: {
    fontSize: rf(11),
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: vs(4),
  },

  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: vs(6),
  },

  eventIcon: {
    fontSize: ms(20),
    marginRight: s(8),
  },

  minuteBig: {
    fontSize: rf(16),
    fontWeight: '900',
    color: '#0F172A',
  },

  playerName: {
    fontSize: rf(15),
    fontWeight: '800',
    color: '#0F172A',
  },

  assistText: {
    marginTop: vs(4),
    fontSize: rf(12),
    fontWeight: '600',
    color: '#475569',
  },

  teamSide: {
    marginTop: vs(6),
    fontSize: rf(11),
    fontWeight: '700',
    color: '#64748B',
  },

  /* ===== INFO ===== */

  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  infoBigCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: ms(20),
    padding: s(18),
    marginBottom: vs(14),
    elevation: 2,
  },

  infoIcon: {
    fontSize: ms(26),
    marginBottom: vs(10),
  },

  infoBigLabel: {
    fontSize: rf(14),
    fontWeight: '700',
    color: '#64748B',
  },

  infoBigValue: {
    marginTop: vs(6),
    fontSize: rf(16),
    fontWeight: '800',
    color: '#0F172A',
  },

  lineupsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: ms(20),
    padding: s(16),
  },

  lineupTeamTitle: {
    marginVertical: vs(10),
    fontSize: rf(15),
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },

  /* ===== LINEUPS ===== */

  teamSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: s(12),
    marginBottom: vs(14),
  },

  teamSelectBtn: {
    flex: 1,
    paddingVertical: vs(12),
    borderRadius: ms(14),
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },

  teamSelectActive: {
    backgroundColor: '#2563EB',
  },

  teamSelectText: {
    fontSize: rf(14),
    fontWeight: '800',
    color: '#334155',
  },

  teamSelectTextActive: {
    color: '#FFFFFF',
  },

  pitchWrapper: {
    borderRadius: ms(18),
    overflow: 'hidden',
    backgroundColor: '#0F5132',
    padding: s(6),
    marginBottom: vs(14),
  },

  benchTitle: {
    fontSize: rf(13),
    fontWeight: '800',
    color: '#64748B',
    marginBottom: vs(8),
  },

  benchItem: {
    backgroundColor: '#F8FAFC',
    borderRadius: ms(12),
    paddingVertical: vs(10),
    paddingHorizontal: s(14),
    marginBottom: vs(8),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  benchText: {
    fontSize: rf(14),
    fontWeight: '700',
    color: '#0F172A',
  },

  lineupHint: {
    textAlign: 'center',
    marginTop: vs(20),
    fontSize: rf(13),
    fontWeight: '600',
    color: '#64748B',
  },
  // Shootout styles
  shootoutContainer: {
    padding: s(16),
  },
  shootoutScoreCard: {
    backgroundColor: '#1E3A5F',
    borderRadius: s(12),
    padding: s(16),
    alignItems: 'center',
    marginBottom: vs(16),
  },
  shootoutTitle: {
    color: '#94A3B8',
    fontSize: rf(12),
    marginBottom: vs(8),
    letterSpacing: 1,
  },
  shootoutScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  shootoutTeamName: {
    color: '#F1F5F9',
    fontSize: rf(13),
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  shootoutScore: {
    color: '#FFFFFF',
    fontSize: rf(28),
    fontWeight: '800',
    marginHorizontal: s(12),
  },
  shootoutWinnerBanner: {
    marginTop: vs(10),
    backgroundColor: '#F59E0B',
    borderRadius: s(8),
    paddingHorizontal: s(16),
    paddingVertical: vs(6),
  },
  shootoutWinnerText: {
    color: '#1C1917',
    fontWeight: '700',
    fontSize: rf(13),
  },
  kicksTitle: {
    fontSize: rf(13),
    fontWeight: '700',
    color: '#334155',
    marginBottom: vs(8),
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  roundBlock: {
    marginBottom: vs(12),
  },
  roundLabel: {
    fontSize: rf(12),
    fontWeight: '600',
    color: '#64748B',
    marginBottom: vs(4),
    paddingLeft: s(4),
  },
  kickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: s(10),
    borderRadius: s(8),
    marginBottom: vs(4),
  },
  kickHome: {
    backgroundColor: '#EFF6FF',
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
  },
  kickAway: {
    backgroundColor: '#FFF7ED',
    borderLeftWidth: 3,
    borderLeftColor: '#F97316',
  },
  kickLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(10),
  },
  kickResult: {
    fontSize: rf(18),
  },
  kickPlayer: {
    fontSize: rf(13),
    fontWeight: '600',
    color: '#1E293B',
  },
  kickTeam: {
    fontSize: rf(11),
    color: '#64748B',
  },
  kickOutcome: {
    fontSize: rf(12),
    fontWeight: '600',
    color: '#475569',
  },
});
