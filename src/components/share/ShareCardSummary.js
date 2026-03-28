import React from 'react';
import {View, Text, Image, StyleSheet} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {s, vs, ms, rf} from '../../utils/responsive';

/**
 * ShareCardSummary
 *
 * A comprehensive match summary graphic combining score, key stats,
 * and goal scorers — designed to be captured and shared.
 *
 * Props:
 *  - match: { homeTeam, awayTeam, score, winner, venue, matchType, status, completedAt, events, penaltyShootout }
 *  - stats: { home: { goals, yellow, red, fouls }, away: { goals, yellow, red, fouls } }
 */
export default function ShareCardSummary({match, stats}) {
  const isDraw = match.score.home === match.score.away;

  const winnerText = isDraw
    ? match.penaltyShootout?.winner
      ? `${match.penaltyShootout.winner} won on penalties`
      : 'Match Drawn'
    : `Winner: ${match.winner?.teamName}`;

  // Extract goal events sorted by minute
  const goals = (match.events || [])
    .filter(e => ['GOAL', 'PENALTY_GOAL', 'OWN_GOAL'].includes(e.type))
    .sort((a, b) => a.minute - b.minute)
    .slice(0, 6);

  const homeGoals = goals.filter(
    g => String(g.team) === String(match.homeTeam._id),
  );
  const awayGoals = goals.filter(
    g => String(g.team) !== String(match.homeTeam._id),
  );

  const quickStats = [
    {label: 'YC', icon: '🟨', home: stats.home.yellow, away: stats.away.yellow},
    {label: 'RC', icon: '🟥', home: stats.home.red, away: stats.away.red},
  ];

  return (
    <View style={styles.outerWrap}>
      <View style={styles.cardOuter}>
        {/* ─── BLUE GRADIENT HEADER ─── */}
        <LinearGradient
          colors={['#1E40AF', '#2563EB', '#3B82F6']}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={styles.headerGradient}>
          {/* Top tags */}
          <View style={styles.topBar}>
            <View style={styles.tagPill}>
              <Text style={styles.tagText}>
                {match.matchType || 'Match'}
              </Text>
            </View>
            <Text style={styles.statusBadge}>FULL TIME</Text>
          </View>

          {/* Score section */}
          <View style={styles.scoreSection}>
            {/* Home team */}
            <View style={styles.teamCol}>
              {match.homeTeam.teamLogoUrl ? (
                <View style={styles.logoCircle}>
                  <Image
                    source={{uri: match.homeTeam.teamLogoUrl}}
                    style={styles.teamLogoImg}
                    resizeMode="cover"
                  />
                </View>
              ) : (
                <View style={styles.logoFallback}>
                  <Text style={styles.logoFallbackText}>
                    {match.homeTeam.teamName[0]}
                  </Text>
                </View>
              )}
              <Text style={styles.teamName} numberOfLines={2}>
                {match.homeTeam.teamName}
              </Text>
              <Text style={styles.sideLabel}>HOME</Text>
            </View>

            {/* Score */}
            <View style={styles.scoreCol}>
              <Text style={styles.scoreText}>
                {match.score.home}:{match.score.away}
              </Text>
              {match.penaltyShootout?.isActive && (
                <Text style={styles.penText}>
                  ({match.penaltyShootout.homeScore}-
                  {match.penaltyShootout.awayScore} pens)
                </Text>
              )}
            </View>

            {/* Away team */}
            <View style={styles.teamCol}>
              {match.awayTeam.teamLogoUrl ? (
                <View style={styles.logoCircle}>
                  <Image
                    source={{uri: match.awayTeam.teamLogoUrl}}
                    style={styles.teamLogoImg}
                    resizeMode="cover"
                  />
                </View>
              ) : (
                <View style={styles.logoFallback}>
                  <Text style={styles.logoFallbackText}>
                    {match.awayTeam.teamName[0]}
                  </Text>
                </View>
              )}
              <Text style={styles.teamName} numberOfLines={2}>
                {match.awayTeam.teamName}
              </Text>
              <Text style={styles.sideLabel}>AWAY</Text>
            </View>
          </View>

          {/* Winner pill */}
          <View style={styles.winnerRow}>
            <View style={styles.winnerPill}>
              <Text style={styles.winnerText}>{winnerText}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* ─── WHITE BODY ─── */}
        <View style={styles.body}>
          {/* Goal scorers */}
          {goals.length > 0 && (
            <View style={styles.goalSection}>
              <View style={styles.goalHeader}>
                <View style={styles.goalIconCircle}>
                  <Text style={styles.goalIconText}>⚽</Text>
                </View>
                <Text style={styles.goalSectionTitle}>GOAL SCORERS</Text>
              </View>

              <View style={styles.goalColumns}>
                {/* Home goals */}
                <View style={styles.goalCol}>
                  {homeGoals.length > 0 ? (
                    homeGoals.map((g, i) => (
                      <View key={`h-${i}`} style={styles.goalItem}>
                        <Text style={styles.goalPlayer}>
                          {g.player?.name || 'Unknown'}
                        </Text>
                        <Text style={styles.goalMinute}>
                          {g.minute}'{' '}
                          {g.type === 'PENALTY_GOAL'
                            ? '(P)'
                            : g.type === 'OWN_GOAL'
                            ? '(OG)'
                            : ''}
                        </Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.noGoalText}>—</Text>
                  )}
                </View>

                <View style={styles.goalDivider} />

                {/* Away goals */}
                <View style={[styles.goalCol, {alignItems: 'flex-end'}]}>
                  {awayGoals.length > 0 ? (
                    awayGoals.map((g, i) => (
                      <View
                        key={`a-${i}`}
                        style={[styles.goalItem, {alignItems: 'flex-end'}]}>
                        <Text style={styles.goalPlayer}>
                          {g.player?.name || 'Unknown'}
                        </Text>
                        <Text style={styles.goalMinute}>
                          {g.minute}'{' '}
                          {g.type === 'PENALTY_GOAL'
                            ? '(P)'
                            : g.type === 'OWN_GOAL'
                            ? '(OG)'
                            : ''}
                        </Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.noGoalText}>—</Text>
                  )}
                </View>
              </View>
            </View>
          )}

          {/* Quick stats */}
          <View style={styles.quickStatsRow}>
            {quickStats.map(qs => (
              <View key={qs.label} style={styles.quickStatItem}>
                <Text style={styles.qsNum}>{qs.home}</Text>
                <View style={styles.qsCenter}>
                  <Text style={styles.qsIcon}>{qs.icon}</Text>
                  <Text style={styles.qsLabel}>{qs.label}</Text>
                </View>
                <Text style={styles.qsNum}>{qs.away}</Text>
              </View>
            ))}
          </View>

          {/* Info row */}
          <View style={styles.infoRow}>
            {match.venue ? (
              <Text style={styles.infoText}>📍 {match.venue}</Text>
            ) : null}
            {match.completedAt ? (
              <Text style={styles.infoText}>
                {new Date(match.completedAt).toLocaleDateString('en-US', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </Text>
            ) : null}
          </View>

          {/* Footer branding */}
          <View style={styles.footerDivider} />
          <Text style={styles.footerBrand}>FTBL-XI</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerWrap: {
    width: 380,
    padding: s(10),
    backgroundColor: '#F0F4F8',
  },
  cardOuter: {
    borderRadius: ms(24),
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.12,
    shadowRadius: 10,
  },

  /* ─── Blue header ─── */
  headerGradient: {
    paddingTop: vs(22),
    paddingBottom: vs(22),
    paddingHorizontal: s(20),
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: vs(22),
  },
  tagPill: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: ms(20),
    paddingHorizontal: s(14),
    paddingVertical: vs(5),
  },
  tagText: {
    color: '#FFFFFF',
    fontSize: rf(11),
    fontWeight: '700',
  },
  statusBadge: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: rf(11),
    fontWeight: '800',
    letterSpacing: 1.5,
  },

  /* Score section */
  scoreSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: vs(20),
  },
  teamCol: {
    alignItems: 'center',
    flex: 1,
  },
  logoCircle: {
    width: s(64),
    height: s(64),
    borderRadius: s(32),
    overflow: 'hidden',
    marginBottom: vs(8),
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  teamLogoImg: {
    width: '100%',
    height: '100%',
  },
  logoFallback: {
    width: s(64),
    height: s(64),
    borderRadius: s(32),
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: vs(8),
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  logoFallbackText: {
    fontSize: rf(26),
    fontWeight: '900',
    color: '#FFFFFF',
  },
  teamName: {
    fontSize: rf(14),
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: vs(2),
  },
  sideLabel: {
    fontSize: rf(9),
    fontWeight: '700',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 1.5,
  },
  scoreCol: {
    alignItems: 'center',
    paddingHorizontal: s(4),
  },
  scoreText: {
    fontSize: ms(48),
    fontWeight: '900',
    color: '#FFFFFF',
  },
  penText: {
    fontSize: rf(11),
    fontWeight: '700',
    color: 'rgba(255,255,255,0.55)',
    marginTop: vs(2),
  },

  /* Winner */
  winnerRow: {
    alignItems: 'center',
  },
  winnerPill: {
    backgroundColor: '#16A34A',
    borderRadius: ms(22),
    paddingHorizontal: s(22),
    paddingVertical: vs(8),
  },
  winnerText: {
    color: '#FFFFFF',
    fontSize: rf(13),
    fontWeight: '800',
  },

  /* ─── White body ─── */
  body: {
    padding: s(18),
    paddingTop: vs(20),
  },

  /* Goal scorers */
  goalSection: {
    backgroundColor: '#F1F5F9',
    borderRadius: ms(18),
    padding: s(16),
    marginBottom: vs(16),
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: vs(14),
    gap: s(8),
  },
  goalIconCircle: {
    width: s(26),
    height: s(26),
    borderRadius: s(13),
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalIconText: {
    fontSize: ms(13),
  },
  goalSectionTitle: {
    fontSize: rf(12),
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 1.5,
  },
  goalColumns: {
    flexDirection: 'row',
  },
  goalCol: {
    flex: 1,
  },
  goalDivider: {
    width: 1,
    backgroundColor: '#CBD5E1',
    marginHorizontal: s(14),
  },
  goalItem: {
    marginBottom: vs(10),
  },
  goalPlayer: {
    fontSize: rf(15),
    fontWeight: '800',
    color: '#0F172A',
  },
  goalMinute: {
    fontSize: rf(12),
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: vs(1),
  },
  noGoalText: {
    fontSize: rf(14),
    fontWeight: '600',
    color: '#CBD5E1',
  },

  /* Quick stats */
  quickStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: vs(16),
    gap: s(8),
  },
  quickStatItem: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: ms(16),
    paddingVertical: vs(14),
    paddingHorizontal: s(10),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  qsNum: {
    fontSize: ms(20),
    fontWeight: '900',
    color: '#0F172A',
    width: s(26),
    textAlign: 'center',
  },
  qsCenter: {
    alignItems: 'center',
  },
  qsIcon: {
    fontSize: ms(16),
  },
  qsLabel: {
    fontSize: rf(9),
    fontWeight: '800',
    color: '#94A3B8',
    marginTop: vs(2),
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  /* Info */
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: s(16),
    marginBottom: vs(16),
  },
  infoText: {
    color: '#94A3B8',
    fontSize: rf(12),
    fontWeight: '600',
  },

  /* Footer */
  footerDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginBottom: vs(12),
  },
  footerBrand: {
    textAlign: 'center',
    color: '#CBD5E1',
    fontSize: rf(14),
    fontWeight: '900',
    letterSpacing: 4,
  },
});