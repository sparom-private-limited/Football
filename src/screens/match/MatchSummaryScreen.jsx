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
        format: summary.match.format,
        matchType: summary.match.matchType,
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
        events: [
          ...summary.summary.goals.map(normalizeEvent),
          ...(summary.summary.penalties || []).map(normalizeEvent),
          ...summary.summary.cards.map(normalizeEvent),
          ...summary.summary.substitutions.map(normalizeEvent),
        ],
        inPlayPenalties: (summary.summary.penalties || []).map(normalizeEvent),
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
        side = String(e.team) === String(match.homeTeam._id) ? 'home' : 'away';
      } else {
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

  // Count goals for summary line
  const totalGoals = match.events.filter(e =>
    ['GOAL', 'PENALTY_GOAL', 'OWN_GOAL'].includes(e.type),
  ).length;

  function ListHeader() {
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

        {/* ─── HERO CARD (vertical stacked layout) ─── */}
        <View style={styles.heroCard}>
          {/* Top tags row */}
          <View style={styles.heroTagsRow}>
            <View style={styles.heroTag}>
              <Text style={styles.heroTagText}>
                {match.matchType || 'League match'}
              </Text>
            </View>
            <Text style={styles.heroStatusText}>
              {match.status === 'completed' ? 'Full time' : match.status}
            </Text>
          </View>

          {/* Home team row */}
          <View style={styles.heroTeamRow}>
            <View style={styles.heroTeamInfo}>
              {match.homeTeam.teamLogoUrl ? (
                <Image
                  source={{uri: match.homeTeam.teamLogoUrl}}
                  style={styles.heroLogo}
                />
              ) : (
                <View style={styles.heroLogoFallback}>
                  <Text style={styles.heroLogoText}>
                    {match.homeTeam.teamName[0]}
                  </Text>
                </View>
              )}
              <View style={styles.heroTeamTextWrap}>
                <Text style={styles.heroTeamName}>
                  {match.homeTeam.teamName}
                </Text>
                <Text style={styles.heroTeamSide}>Home</Text>
              </View>
            </View>
            <Text style={styles.heroScore}>{match.score.home}</Text>
          </View>

          {/* VS badge */}
          <View style={styles.vsBadgeWrap}>
            <View style={styles.vsBadge}>
              <Text style={styles.vsText}>vs</Text>
            </View>
          </View>

          {/* Away team row */}
          <View style={styles.heroTeamRow}>
            <View style={styles.heroTeamInfo}>
              {match.awayTeam.teamLogoUrl ? (
                <Image
                  source={{uri: match.awayTeam.teamLogoUrl}}
                  style={styles.heroLogo}
                />
              ) : (
                <View style={styles.heroLogoFallback}>
                  <Text style={styles.heroLogoText}>
                    {match.awayTeam.teamName[0]}
                  </Text>
                </View>
              )}
              <View style={styles.heroTeamTextWrap}>
                <Text style={styles.heroTeamName}>
                  {match.awayTeam.teamName}
                </Text>
                <Text style={styles.heroTeamSide}>Away</Text>
              </View>
            </View>
            <Text style={styles.heroScore}>{match.score.away}</Text>
          </View>

          {/* Winner pill + summary */}
          <View style={styles.heroFooter}>
            <View style={styles.winnerPill}>
              <Text style={styles.winnerPillText}>
                {isDraw && match.penaltyShootout?.isActive
                  ? `${match.penaltyShootout.winner} won on pens`
                  : isDraw
                  ? 'Match Drawn'
                  : `Winner: ${match.winner?.teamName}`}
              </Text>
            </View>
          </View>

          <Text style={styles.heroSummaryLine}>
            {totalGoals} goal{totalGoals !== 1 ? 's' : ''} · Timeline highlights
          </Text>
        </View>

        {/* ─── TABS ─── */}
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

        {/* ─── STATS TAB ─── */}
        {activeTab === 'Stats' && stats && (
          <View style={styles.statsContainer}>
            {/* Team header card */}
            <View style={styles.statsTeamCard}>
              <View style={styles.statsTeamSide}>
                {match.homeTeam.teamLogoUrl ? (
                  <Image source={{uri: match.homeTeam.teamLogoUrl}} style={styles.statsTeamLogo} />
                ) : (
                  <View style={styles.statsTeamLogoFallback}>
                    <Text style={styles.statsTeamLogoText}>{match.homeTeam.teamName[0]}</Text>
                  </View>
                )}
                <Text style={styles.statsTeamName} numberOfLines={1}>{match.homeTeam.teamName}</Text>
                <View style={styles.statsHomeBadge}>
                  <Text style={styles.statsHomeBadgeText}>HOME</Text>
                </View>
              </View>
              <View style={styles.statsTeamDivider}>
                <Text style={styles.statsVsText}>vs</Text>
              </View>
              <View style={[styles.statsTeamSide, {alignItems: 'flex-end'}]}>
                <View style={styles.statsAwayBadge}>
                  <Text style={styles.statsAwayBadgeText}>AWAY</Text>
                </View>
                <Text style={styles.statsTeamName} numberOfLines={1}>{match.awayTeam.teamName}</Text>
                {match.awayTeam.teamLogoUrl ? (
                  <Image source={{uri: match.awayTeam.teamLogoUrl}} style={styles.statsTeamLogo} />
                ) : (
                  <View style={styles.statsTeamLogoFallback}>
                    <Text style={styles.statsTeamLogoText}>{match.awayTeam.teamName[0]}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Stat rows */}
            <BigStat label="Goals" icon="⚽" left={stats.home.goals} right={stats.away.goals} />
            <BigStat label="Yellow Cards" icon="🟨" left={stats.home.yellow} right={stats.away.yellow} />
            <BigStat label="Red Cards" icon="🟥" left={stats.home.red} right={stats.away.red} />
            <BigStat label="Fouls" icon="💥" left={stats.home.fouls} right={stats.away.fouls} />
          </View>
        )}

        {/* ─── LINEUPS TAB ─── */}
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

        {/* ─── INFO TAB ─── */}
        {activeTab === 'Info' && (
          <View style={styles.infoContainer}>
            {/* Full-width info rows */}
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <View style={styles.infoIconWrap}>
                  <Text style={styles.infoIconEmoji}>📍</Text>
                </View>
                <View style={styles.infoTextWrap}>
                  <Text style={styles.infoLabel}>Venue</Text>
                  <Text style={styles.infoValue}>{match.venue || 'Not specified'}</Text>
                </View>
              </View>

              <View style={styles.infoSep} />

              <View style={styles.infoRow}>
                <View style={styles.infoIconWrap}>
                  <Text style={styles.infoIconEmoji}>⚽</Text>
                </View>
                <View style={styles.infoTextWrap}>
                  <Text style={styles.infoLabel}>Format</Text>
                  <Text style={styles.infoValue}>{match.format || 'Standard'}</Text>
                </View>
              </View>

              <View style={styles.infoSep} />

              <View style={styles.infoRow}>
                <View style={styles.infoIconWrap}>
                  <Text style={styles.infoIconEmoji}>🏆</Text>
                </View>
                <View style={styles.infoTextWrap}>
                  <Text style={styles.infoLabel}>Match Type</Text>
                  <Text style={styles.infoValue}>{match.matchType || 'Friendly'}</Text>
                </View>
              </View>

              <View style={styles.infoSep} />

              <View style={styles.infoRow}>
                <View style={styles.infoIconWrap}>
                  <Text style={styles.infoIconEmoji}>📅</Text>
                </View>
                <View style={styles.infoTextWrap}>
                  <Text style={styles.infoLabel}>Started At</Text>
                  <Text style={styles.infoValue}>
                    {match.startedAt
                      ? new Date(match.startedAt).toLocaleString()
                      : 'N/A'}
                  </Text>
                </View>
              </View>

              <View style={styles.infoSep} />

              <View style={styles.infoRow}>
                <View style={styles.infoIconWrap}>
                  <Text style={styles.infoIconEmoji}>⏱️</Text>
                </View>
                <View style={styles.infoTextWrap}>
                  <Text style={styles.infoLabel}>Completed At</Text>
                  <Text style={styles.infoValue}>
                    {match.completedAt
                      ? new Date(match.completedAt).toLocaleString()
                      : 'N/A'}
                  </Text>
                </View>
              </View>

              {match.status && (
                <>
                  <View style={styles.infoSep} />
                  <View style={styles.infoRow}>
                    <View style={styles.infoIconWrap}>
                      <Text style={styles.infoIconEmoji}>📋</Text>
                    </View>
                    <View style={styles.infoTextWrap}>
                      <Text style={styles.infoLabel}>Status</Text>
                      <View style={styles.infoStatusPill}>
                        <Text style={styles.infoStatusText}>
                          {match.status.charAt(0).toUpperCase() + match.status.slice(1)}
                        </Text>
                      </View>
                    </View>
                  </View>
                </>
              )}
            </View>
          </View>
        )}

        {/* ─── SHOOTOUT TAB ─── */}
        {activeTab === 'Shootout' && match.penaltyShootout && (
          <View style={styles.shootoutContainer}>
            {/* Score card */}
            <View style={styles.shootoutScoreCard}>
              <Text style={styles.shootoutLabel}>⚽  PENALTY</Text>
              <View style={styles.shootoutScoreRow}>
                <Text style={styles.shootoutTeamName} numberOfLines={1}>
                  {match.homeTeam.teamName}
                </Text>
                <Text style={styles.shootoutScore}>
                  {match.penaltyShootout.homeScore}  -  {match.penaltyShootout.awayScore}
                </Text>
                <Text style={styles.shootoutTeamName} numberOfLines={1}>
                  {match.awayTeam.teamName}
                </Text>
              </View>
              {match.penaltyShootout.winner && (
                <View style={styles.shootoutWinnerBanner}>
                  <Text style={styles.shootoutWinnerText}>
                    🏆  {match.penaltyShootout.winner} won on penalties
                  </Text>
                </View>
              )}
            </View>

            {/* Kicks History */}
            <Text style={styles.kicksTitle}>KICKS HISTORY</Text>

            {(() => {
              const rounds = {};
              (match.penaltyShootout.kicks || []).forEach(kick => {
                const r = kick.round || 1;
                if (!rounds[r]) rounds[r] = {home: null, away: null};
                const isHome =
                  kick.teamId === match.homeTeam._id?.toString() ||
                  kick.teamName === match.homeTeam.teamName;
                if (isHome) rounds[r].home = kick;
                else rounds[r].away = kick;
              });

              return Object.entries(rounds).map(([round, sides]) => (
                <View key={round}>
                  {/* Round label with divider line */}
                  <View style={styles.roundLabelRow}>
                    <View style={styles.roundLine} />
                    <Text style={styles.roundLabel}>Round {round}</Text>
                    <View style={styles.roundLine} />
                  </View>

                  {/* Side-by-side kick cards */}
                  <View style={styles.kickVsRow}>
                    {/* Home kick card */}
                    <View style={[styles.kickCard, styles.kickCardHome]}>
                      <View style={styles.kickCardTop}>
                        <View style={styles.kickTeamPill}>
                          <Text style={styles.kickTeamPillText}>
                            {match.homeTeam.teamName}
                          </Text>
                        </View>
                        {sides.home ? (
                          <Text style={styles.kickResultIcon}>
                            {sides.home.scored ? '✅' : '❌'}
                          </Text>
                        ) : (
                          <Text style={styles.kickResultDash}>—</Text>
                        )}
                      </View>
                      <Text style={styles.kickPlayerName}>
                        {sides.home?.player || 'No taker'}
                      </Text>
                      <Text style={styles.kickOutcomeText}>
                        {sides.home
                          ? sides.home.scored
                            ? 'Scored'
                            : 'Missed'
                          : '—'}
                      </Text>
                    </View>

                    {/* VS badge */}
                    <View style={styles.kickVsBadge}>
                      <Text style={styles.kickVsText}>vs</Text>
                    </View>

                    {/* Away kick card */}
                    <View style={[styles.kickCard, styles.kickCardAway]}>
                      <View style={styles.kickCardTop}>
                        <View style={[styles.kickTeamPill, styles.kickTeamPillAway]}>
                          <Text style={[styles.kickTeamPillText, styles.kickTeamPillTextAway]}>
                            {match.awayTeam.teamName}
                          </Text>
                        </View>
                        {sides.away ? (
                          <Text style={styles.kickResultIcon}>
                            {sides.away.scored ? '✅' : '❌'}
                          </Text>
                        ) : (
                          <Text style={styles.kickResultDash}>—</Text>
                        )}
                      </View>
                      <Text style={styles.kickPlayerName}>
                        {sides.away?.player || 'No taker'}
                      </Text>
                      <Text style={styles.kickOutcomeText}>
                        {sides.away
                          ? sides.away.scored
                            ? 'Scored'
                            : 'Missed'
                          : '—'}
                      </Text>
                    </View>
                  </View>
                </View>
              ));
            })()}
          </View>
        )}

        {/* ─── TIMELINE SECTION HEADER ─── */}
        {isTimeline && (
          <>
            <View style={styles.timelineSectionHeader}>
              <View>
                <Text style={styles.timelineSectionTitle}>Match events</Text>
                <Text style={styles.timelineSectionSub}>Compact timeline</Text>
              </View>
            </View>

            {/* Team color legend */}
            <View style={styles.teamLegendRow}>
              <View style={styles.teamLegendItem}>
                <View style={[styles.teamLegendDot, {backgroundColor: '#2563EB'}]} />
                <Text style={styles.teamLegendName}>{match.homeTeam.teamName}</Text>
                <View style={styles.teamLegendBadge}>
                  <Text style={styles.teamLegendBadgeText}>HOME</Text>
                </View>
              </View>
              <View style={styles.teamLegendItem}>
                <View style={[styles.teamLegendDot, {backgroundColor: '#F97316'}]} />
                <Text style={styles.teamLegendName}>{match.awayTeam.teamName}</Text>
                <View style={[styles.teamLegendBadge, {backgroundColor: '#FFF7ED'}]}>
                  <Text style={[styles.teamLegendBadgeText, {color: '#F97316'}]}>AWAY</Text>
                </View>
              </View>
            </View>
          </>
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
      ListHeaderComponent={<ListHeader />}
      renderItem={({item, index}) => (
        <TimelineCard
          event={item}
          homeTeamId={match.homeTeam._id}
          homeTeamName={match.homeTeam.teamName}
          awayTeamName={match.awayTeam.teamName}
          isLast={index === timelineData.length - 1}
        />
      )}
      ListEmptyComponent={
        isTimeline ? (
          <Text style={{padding: s(16), color: '#475569'}}>No events yet</Text>
        ) : null
      }
      contentContainerStyle={{paddingBottom: vs(30)}}
      style={styles.container}
    />
  );
}

/* ────────────── UI PARTS ────────────── */

function BigStat({label, icon, left, right}) {
  const max = Math.max(left, right, 1);
  const leftPct = (left / max) * 100;
  const rightPct = (right / max) * 100;
  const leftWins = left > right;
  const rightWins = right > left;
  const isDraw = left === right;

  return (
    <View style={styles.statRowCard}>
      {/* Left number */}
      <View style={[
        styles.statNumberBox,
        (leftWins || isDraw) && styles.statNumberBoxActive,
        leftWins && styles.statNumberBoxWinHome,
      ]}>
        <Text style={[
          styles.statNumber,
          (leftWins || isDraw) && styles.statNumberActive,
        ]}>
          {left}
        </Text>
      </View>

      {/* Center: bars + label */}
      <View style={styles.statCenter}>
        {/* Bars row */}
        <View style={styles.statBarsRow}>
          {/* Left bar (grows right-to-left) */}
          <View style={styles.statBarTrack}>
            <View style={[
              styles.statBarFillLeft,
              {width: `${leftPct}%`},
              leftWins && {backgroundColor: '#2563EB'},
              isDraw && {backgroundColor: '#64748B'},
            ]} />
          </View>
          {/* Right bar (grows left-to-right) */}
          <View style={styles.statBarTrack}>
            <View style={[
              styles.statBarFillRight,
              {width: `${rightPct}%`},
              rightWins && {backgroundColor: '#F97316'},
              isDraw && {backgroundColor: '#64748B'},
            ]} />
          </View>
        </View>
        {/* Label with icon */}
        <View style={styles.statLabelRow}>
          <Text style={styles.statIcon}>{icon}</Text>
          <Text style={styles.statLabel}>{label}</Text>
        </View>
      </View>

      {/* Right number */}
      <View style={[
        styles.statNumberBox,
        (rightWins || isDraw) && styles.statNumberBoxActive,
        rightWins && styles.statNumberBoxWinAway,
      ]}>
        <Text style={[
          styles.statNumber,
          (rightWins || isDraw) && styles.statNumberActive,
        ]}>
          {right}
        </Text>
      </View>
    </View>
  );
}

/* No separate InfoCard component needed — info is inline now */

function TimelineCard({event, homeTeamId, homeTeamName, awayTeamName, isLast}) {
  const isHome = String(event.team) === String(homeTeamId);
  const config = getEventConfig(event.type);

  // Team accent colors
  const TEAM_COLOR = isHome ? '#2563EB' : '#F97316';
  const TEAM_BG = isHome ? '#EFF6FF' : '#FFF7ED';
  const TEAM_BORDER = isHome ? '#BFDBFE' : '#FED7AA';

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

  // Build description line
  let description = '';
  if (event.assistPlayer) {
    description = `Assist: ${event.assistPlayer.name}`;
  } else if (event.type === 'SUBSTITUTION' && event.substitutedPlayer) {
    description = `Out: ${event.substitutedPlayer.name}`;
  } else if (event.reason) {
    description = event.reason;
  } else if (['GOAL', 'PENALTY_GOAL'].includes(event.type)) {
    description = 'Unassisted finish';
  }

  // ── HOME events: minute | dot | card (left-aligned)
  // ── AWAY events: card | dot | minute (right-aligned)

  return (
    <View style={[styles.tlCard, !isHome && styles.tlCardAway]}>
      {/* LEFT SIDE — home minute OR away content */}
      {isHome ? (
        <View style={styles.tlMinuteCol}>
          <Text style={styles.tlMinute}>{event.minute}'</Text>
        </View>
      ) : (
        <View style={[styles.tlContent, {backgroundColor: TEAM_BG, borderColor: TEAM_BORDER, borderWidth: 1}]}>
          <View style={styles.tlContentTop}>
            <View style={styles.tlEventLabelRow}>
              <Text style={styles.tlIcon}>{config.icon}</Text>
              <Text style={[styles.tlEventType, {color: config.color}]}>
                {eventLabel}
              </Text>
            </View>
            <View style={[styles.tlTeamPill, {backgroundColor: TEAM_COLOR}]}>
              <Text style={styles.tlTeamPillText}>{event.teamName}</Text>
            </View>
          </View>
          <Text style={styles.tlPlayerName}>
            {event.player?.name || 'Unknown Player'}
          </Text>
          {description ? (
            <Text style={styles.tlDesc}>{description}</Text>
          ) : null}
        </View>
      )}

      {/* CENTER — Timeline dot + line */}
      <View style={styles.tlLineCol}>
        <View style={[styles.tlDot, {backgroundColor: TEAM_COLOR}]} />
        {!isLast && (
          <View style={[styles.tlLine, {backgroundColor: TEAM_COLOR, opacity: 0.2}]} />
        )}
      </View>

      {/* RIGHT SIDE — home content OR away minute */}
      {isHome ? (
        <View style={[styles.tlContent, {backgroundColor: TEAM_BG, borderColor: TEAM_BORDER, borderWidth: 1}]}>
          <View style={styles.tlContentTop}>
            <View style={styles.tlEventLabelRow}>
              <Text style={styles.tlIcon}>{config.icon}</Text>
              <Text style={[styles.tlEventType, {color: config.color}]}>
                {eventLabel}
              </Text>
            </View>
            <View style={[styles.tlTeamPill, {backgroundColor: TEAM_COLOR}]}>
              <Text style={styles.tlTeamPillText}>{event.teamName}</Text>
            </View>
          </View>
          <Text style={styles.tlPlayerName}>
            {event.player?.name || 'Unknown Player'}
          </Text>
          {description ? (
            <Text style={styles.tlDesc}>{description}</Text>
          ) : null}
        </View>
      ) : (
        <View style={[styles.tlMinuteCol, {alignItems: 'flex-end'}]}>
          <Text style={styles.tlMinute}>{event.minute}'</Text>
        </View>
      )}
    </View>
  );
}

function getEventConfig(type) {
  switch (type) {
    case 'GOAL':
    case 'PENALTY_GOAL':
      return {icon: '⚽', color: '#16A34A'};
    case 'PENALTY_MISS':
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

/* ────────────── STYLES ────────────── */

const styles = StyleSheet.create({
  /* ===== SCREEN ===== */
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  /* ===== HEADER ===== */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: vs(12),
    paddingHorizontal: s(16),
  },
  backBtn: {
    width: s(44),
    height: vs(44),
    borderRadius: s(22),
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  back: {
    fontSize: ms(20),
    fontWeight: '700',
    color: '#0F172A',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: rf(17),
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSpacer: {
    width: s(44),
  },

  /* ===== HERO CARD (stacked layout) ===== */
  heroCard: {
    marginHorizontal: s(16),
    marginTop: vs(8),
    backgroundColor: '#2563EB',
    borderRadius: ms(24),
    paddingTop: vs(16),
    paddingBottom: vs(14),
    paddingHorizontal: s(18),
    overflow: 'hidden',
  },

  /* Tags row */
  heroTagsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: vs(16),
  },
  heroTag: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: ms(20),
    paddingHorizontal: s(14),
    paddingVertical: vs(5),
  },
  heroTagText: {
    color: '#FFFFFF',
    fontSize: rf(11),
    fontWeight: '700',
  },
  heroStatusText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: rf(12),
    fontWeight: '700',
  },

  /* Team rows */
  heroTeamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: vs(10),
  },
  heroTeamInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  heroLogo: {
    width: s(48),
    height: s(48),
    borderRadius: s(24),
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  heroLogoFallback: {
    width: s(48),
    height: s(48),
    borderRadius: s(24),
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroLogoText: {
    fontWeight: '800',
    color: '#FFFFFF',
    fontSize: rf(18),
  },
  heroTeamTextWrap: {
    marginLeft: s(12),
    flexShrink: 1,
  },
  heroTeamName: {
    fontSize: rf(16),
    fontWeight: '800',
    color: '#FFFFFF',
  },
  heroTeamSide: {
    fontSize: rf(11),
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
    marginTop: vs(2),
  },
  heroScore: {
    fontSize: ms(36),
    fontWeight: '900',
    color: '#FFFFFF',
    marginLeft: s(12),
  },

  /* VS badge */
  vsBadgeWrap: {
    alignItems: 'center',
    marginVertical: vs(-4),
    zIndex: 2,
  },
  vsBadge: {
    width: s(36),
    height: s(36),
    borderRadius: s(18),
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  vsText: {
    fontSize: rf(12),
    fontWeight: '800',
    color: '#2563EB',
  },

  /* Footer */
  heroFooter: {
    marginTop: vs(14),
    flexDirection: 'row',
    alignItems: 'center',
  },
  winnerPill: {
    backgroundColor: '#16A34A',
    borderRadius: ms(20),
    paddingHorizontal: s(14),
    paddingVertical: vs(6),
  },
  winnerPillText: {
    color: '#FFFFFF',
    fontSize: rf(11),
    fontWeight: '800',
  },
  heroSummaryLine: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: rf(11),
    fontWeight: '600',
    marginTop: vs(8),
  },

  /* ===== TABS ===== */
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: ms(14),
    marginHorizontal: s(16),
    marginVertical: vs(16),
    padding: s(4),
  },
  tab: {
    flex: 1,
    paddingVertical: vs(10),
    alignItems: 'center',
    borderRadius: ms(11),
  },
  activeTab: {
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  tabText: {
    fontWeight: '700',
    color: '#94A3B8',
    fontSize: rf(13),
  },
  activeTabText: {
    color: '#2563EB',
  },

  /* ===== STATS ===== */
  statsContainer: {
    paddingHorizontal: s(16),
  },

  /* Team header card */
  statsTeamCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: ms(18),
    padding: s(14),
    marginBottom: vs(12),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  statsTeamSide: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
  },
  statsTeamLogo: {
    width: s(34),
    height: s(34),
    borderRadius: s(17),
  },
  statsTeamLogoFallback: {
    width: s(34),
    height: s(34),
    borderRadius: s(17),
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsTeamLogoText: {
    fontSize: rf(13),
    fontWeight: '800',
    color: '#2563EB',
  },
  statsTeamName: {
    fontSize: rf(12),
    fontWeight: '800',
    color: '#0F172A',
    flexShrink: 1,
  },
  statsHomeBadge: {
    backgroundColor: '#EFF6FF',
    borderRadius: ms(6),
    paddingHorizontal: s(6),
    paddingVertical: vs(2),
  },
  statsHomeBadgeText: {
    fontSize: rf(8),
    fontWeight: '800',
    color: '#2563EB',
  },
  statsAwayBadge: {
    backgroundColor: '#FFF7ED',
    borderRadius: ms(6),
    paddingHorizontal: s(6),
    paddingVertical: vs(2),
  },
  statsAwayBadgeText: {
    fontSize: rf(8),
    fontWeight: '800',
    color: '#F97316',
  },
  statsTeamDivider: {
    width: s(32),
    height: s(32),
    borderRadius: s(16),
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: s(6),
  },
  statsVsText: {
    fontSize: rf(10),
    fontWeight: '800',
    color: '#94A3B8',
  },

  /* Individual stat row cards */
  statRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: ms(16),
    paddingVertical: vs(14),
    paddingHorizontal: s(10),
    marginBottom: vs(8),
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },

  /* Number boxes */
  statNumberBox: {
    width: s(44),
    height: s(44),
    borderRadius: ms(12),
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statNumberBoxActive: {
    backgroundColor: '#F1F5F9',
  },
  statNumberBoxWinHome: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
  },
  statNumberBoxWinAway: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1.5,
    borderColor: '#FED7AA',
  },
  statNumber: {
    fontSize: ms(18),
    fontWeight: '900',
    color: '#CBD5E1',
  },
  statNumberActive: {
    color: '#0F172A',
  },

  /* Center section */
  statCenter: {
    flex: 1,
    paddingHorizontal: s(10),
  },
  statLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: vs(6),
  },
  statIcon: {
    fontSize: ms(13),
    marginRight: s(4),
  },
  statLabel: {
    fontSize: rf(11),
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  /* Bars */
  statBarsRow: {
    flexDirection: 'row',
    gap: s(4),
  },
  statBarTrack: {
    flex: 1,
    height: vs(6),
    backgroundColor: '#F1F5F9',
    borderRadius: ms(3),
    overflow: 'hidden',
  },
  statBarFillLeft: {
    height: '100%',
    backgroundColor: '#CBD5E1',
    borderRadius: ms(3),
    alignSelf: 'flex-end',
  },
  statBarFillRight: {
    height: '100%',
    backgroundColor: '#CBD5E1',
    borderRadius: ms(3),
    alignSelf: 'flex-start',
  },

  /* ===== TIMELINE ===== */
  timelineSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: s(16),
    marginBottom: vs(8),
  },
  timelineSectionTitle: {
    fontSize: rf(18),
    fontWeight: '800',
    color: '#0F172A',
  },
  timelineSectionSub: {
    fontSize: rf(12),
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: vs(2),
  },

  /* Team legend */
  teamLegendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: s(16),
    marginBottom: vs(16),
    gap: s(10),
  },
  teamLegendItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  teamLegendDot: {
    width: s(10),
    height: s(10),
    borderRadius: s(5),
    marginRight: s(6),
  },
  teamLegendName: {
    fontSize: rf(12),
    fontWeight: '700',
    color: '#334155',
    flexShrink: 1,
    marginRight: s(4),
  },
  teamLegendBadge: {
    backgroundColor: '#EFF6FF',
    borderRadius: ms(6),
    paddingHorizontal: s(6),
    paddingVertical: vs(2),
  },
  teamLegendBadgeText: {
    fontSize: rf(9),
    fontWeight: '800',
    color: '#2563EB',
  },

  /* Timeline card — row container */
  tlCard: {
    flexDirection: 'row',
    marginHorizontal: s(16),
    minHeight: vs(80),
  },
  tlCardAway: {
    flexDirection: 'row',
  },

  /* Minute column */
  tlMinuteCol: {
    width: s(38),
    paddingTop: vs(12),
  },
  tlMinute: {
    fontSize: rf(14),
    fontWeight: '800',
    color: '#0F172A',
  },

  /* Dot + line column */
  tlLineCol: {
    width: s(28),
    alignItems: 'center',
  },
  tlDot: {
    width: s(14),
    height: s(14),
    borderRadius: s(7),
    marginTop: vs(12),
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  tlLine: {
    width: 2.5,
    flex: 1,
    marginTop: vs(4),
    borderRadius: 2,
  },

  /* Content card */
  tlContent: {
    flex: 1,
    borderRadius: ms(14),
    padding: s(12),
    marginBottom: vs(10),
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  tlContentTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: vs(4),
  },
  tlEventLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tlIcon: {
    fontSize: ms(14),
    marginRight: s(4),
  },
  tlEventType: {
    fontSize: rf(12),
    fontWeight: '800',
    textTransform: 'capitalize',
  },

  /* Team pill (replaces plain text) */
  tlTeamPill: {
    borderRadius: ms(8),
    paddingHorizontal: s(8),
    paddingVertical: vs(2),
  },
  tlTeamPillText: {
    fontSize: rf(9),
    fontWeight: '800',
    color: '#FFFFFF',
  },

  tlPlayerName: {
    fontSize: rf(15),
    fontWeight: '800',
    color: '#0F172A',
    marginTop: vs(2),
  },
  tlDesc: {
    fontSize: rf(12),
    fontWeight: '600',
    color: '#64748B',
    marginTop: vs(2),
  },

  /* ===== INFO ===== */
  infoContainer: {
    paddingHorizontal: s(16),
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: ms(20),
    padding: s(16),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: vs(12),
  },
  infoIconWrap: {
    width: s(42),
    height: s(42),
    borderRadius: s(12),
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: s(14),
  },
  infoIconEmoji: {
    fontSize: ms(20),
  },
  infoTextWrap: {
    flex: 1,
  },
  infoLabel: {
    fontSize: rf(11),
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: rf(14),
    fontWeight: '800',
    color: '#0F172A',
    marginTop: vs(2),
  },
  infoSep: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  infoStatusPill: {
    backgroundColor: '#DCFCE7',
    borderRadius: ms(8),
    paddingHorizontal: s(10),
    paddingVertical: vs(3),
    alignSelf: 'flex-start',
    marginTop: vs(4),
  },
  infoStatusText: {
    fontSize: rf(12),
    fontWeight: '700',
    color: '#16A34A',
  },

  /* ===== LINEUPS ===== */
  lineupsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: ms(20),
    padding: s(16),
    marginHorizontal: s(16),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  teamSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: s(10),
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
    fontSize: rf(13),
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

  /* ===== SHOOTOUT ===== */
  shootoutContainer: {
    paddingHorizontal: s(16),
  },
  shootoutScoreCard: {
    backgroundColor: '#1E293B',
    borderRadius: ms(20),
    padding: s(20),
    alignItems: 'center',
    marginBottom: vs(20),
  },
  shootoutLabel: {
    color: '#94A3B8',
    fontSize: rf(12),
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: vs(12),
  },
  shootoutScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  shootoutTeamName: {
    color: '#F1F5F9',
    fontSize: rf(13),
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  shootoutScore: {
    color: '#FFFFFF',
    fontSize: ms(32),
    fontWeight: '900',
    marginHorizontal: s(10),
  },
  shootoutWinnerBanner: {
    marginTop: vs(14),
    backgroundColor: '#F59E0B',
    borderRadius: ms(12),
    paddingHorizontal: s(20),
    paddingVertical: vs(8),
  },
  shootoutWinnerText: {
    color: '#1C1917',
    fontWeight: '800',
    fontSize: rf(13),
  },

  /* Kicks history */
  kicksTitle: {
    fontSize: rf(13),
    fontWeight: '800',
    color: '#334155',
    marginBottom: vs(12),
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },

  /* Round label with lines */
  roundLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: vs(12),
    marginTop: vs(4),
  },
  roundLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  roundLabel: {
    fontSize: rf(12),
    fontWeight: '700',
    color: '#64748B',
    marginHorizontal: s(12),
  },

  /* Side-by-side kick row */
  kickVsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: vs(14),
  },
  kickCard: {
    flex: 1,
    borderRadius: ms(14),
    padding: s(12),
    borderWidth: 1.5,
    minHeight: vs(90),
  },
  kickCardHome: {
    backgroundColor: '#FFFFFF',
    borderColor: '#BFDBFE',
  },
  kickCardAway: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FED7AA',
  },
  kickCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: vs(6),
  },
  kickTeamPill: {
    backgroundColor: '#2563EB',
    borderRadius: ms(6),
    paddingHorizontal: s(8),
    paddingVertical: vs(3),
  },
  kickTeamPillAway: {
    backgroundColor: '#F97316',
  },
  kickTeamPillText: {
    fontSize: rf(9),
    fontWeight: '800',
    color: '#FFFFFF',
  },
  kickTeamPillTextAway: {
    color: '#FFFFFF',
  },
  kickResultIcon: {
    fontSize: ms(18),
  },
  kickResultDash: {
    fontSize: rf(16),
    fontWeight: '700',
    color: '#CBD5E1',
  },
  kickPlayerName: {
    fontSize: rf(14),
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: vs(2),
  },
  kickOutcomeText: {
    fontSize: rf(11),
    fontWeight: '600',
    color: '#64748B',
  },

  /* VS badge between kick cards */
  kickVsBadge: {
    width: s(30),
    height: s(30),
    borderRadius: s(15),
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: s(6),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  kickVsText: {
    fontSize: rf(10),
    fontWeight: '800',
    color: '#64748B',
  },
});