import React, {useEffect, useState, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Animated,
} from 'react-native';
import {useIsFocused} from '@react-navigation/native';
import API from '../../api/api';
import MainLayout from '../../components/MainLayout';
import AppRefreshView from '../../components/AppRefreshView';
import useNavigationHelper from '../../navigation/Navigationhelper';
import {s, vs, ms, rf} from '../../utils/responsive';
import OnboardingOverlay from '../../components/OnboardingOverlay';
import {useOnboarding} from '../../hooks/useOnboarding';
import {TEAM_STEPS} from '../../constants/onboardingSteps';

// ─── DESIGN TOKENS ───────────────────────────
const C = {
  blue: '#1D4ED8',
  blueDark: '#1348D4',
  blueSoft: '#EFF6FF',
  blueMid: '#BFDBFE',
  blueText: '#1E3A8A',
  orange: '#D8741D',
  orangeSoft: '#FFF7ED',
  pageBg: '#F1F5F9',
  cardBg: '#FFFFFF',
  cardAlt: '#F8FAFC',
  textPrimary: '#0F172A',
  textSecond: '#475569',
  textMuted: '#94A3B8',
  textWhite: '#FFFFFF',
  border: '#E2E8F0',
  borderBlue: '#DBEAFE',
  red: '#DC2626',
  redSoft: '#FEF2F2',
  cyan: '#0284C7',
  cyanSoft: '#ECFEFF',
  green: '#10B981',
  greenSoft: '#ECFDF5',
};

const R = {
  sm: ms(8),
  md: ms(12),
  lg: ms(16),
  xl: ms(20),
  pill: ms(50),
};

// ─────────────────────────────────────────────
// HERO SECTION
// ─────────────────────────────────────────────
function HeroSection({team, nav}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        damping: 15,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        heroStyles.wrapper,
        {opacity: fadeAnim, transform: [{translateY: slideAnim}]},
      ]}>
      <Image
        source={{
          uri:
            team.coverImageUrl ||
            'https://images.unsplash.com/photo-1517927033932-b3d18e61fb3a',
        }}
        style={heroStyles.cover}
      />
      {/* Gradient overlay */}
      <View style={heroStyles.overlay} />
      <View style={heroStyles.overlayTop} />

      <View style={heroStyles.content}>
        {/* Logo */}
        <View style={heroStyles.logoRing}>
          {team.teamLogoUrl ? (
            <Image source={{uri: team.teamLogoUrl}} style={heroStyles.logo} />
          ) : (
            <View style={heroStyles.logoFallback}>
              <Text style={heroStyles.logoLetter}>
                {team.teamName?.[0] || 'T'}
              </Text>
            </View>
          )}
        </View>

        <Text style={heroStyles.teamName}>{team.teamName}</Text>

        <View style={heroStyles.metaRow}>
          <View style={heroStyles.metaPill}>
            <Text style={heroStyles.metaPillTxt}>
              ⚽ {team.players?.length || 0} Players
            </Text>
          </View>
          {team.location && (
            <View style={heroStyles.metaPill}>
              <Text style={heroStyles.metaPillTxt}>📍 {team.location}</Text>
            </View>
          )}
          {team.teamType && (
            <View style={heroStyles.metaPill}>
              <Text style={heroStyles.metaPillTxt}>{team.teamType}</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={heroStyles.profileBtn}
          onPress={() => nav.to('TeamProfile')}
          activeOpacity={0.85}>
          <Text style={heroStyles.profileBtnTxt}>View Team Profile →</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const heroStyles = StyleSheet.create({
  wrapper: {
    borderRadius: R.xl,
    overflow: 'hidden',
    marginBottom: vs(14),
    height: vs(240),
  },
  cover: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  overlayTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: vs(80),
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  content: {
    position: 'absolute',
    bottom: vs(16),
    left: s(16),
    right: s(16),
    alignItems: 'center',
  },
  logoRing: {
    width: s(70),
    height: s(70),
    borderRadius: s(35),
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.7)',
    overflow: 'hidden',
    marginBottom: vs(8),
    backgroundColor: '#000',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  logo: {width: '100%', height: '100%'},
  logoFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLetter: {fontSize: ms(26), fontWeight: '900', color: C.blue},
  teamName: {
    fontSize: ms(22),
    fontWeight: '900',
    color: C.textWhite,
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: vs(8),
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: s(6),
    marginBottom: vs(12),
  },
  metaPill: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: s(10),
    paddingVertical: vs(4),
    borderRadius: R.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  metaPillTxt: {fontSize: rf(11), color: C.textWhite, fontWeight: '700'},
  profileBtn: {
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.7)',
    paddingVertical: vs(9),
    paddingHorizontal: s(22),
    borderRadius: R.md,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  profileBtnTxt: {color: C.textWhite, fontWeight: '700', fontSize: rf(13)},
});

// ─────────────────────────────────────────────
// STAT STRIP  (wins / draws / losses)
// ─────────────────────────────────────────────
function StatStrip({team}) {
  const stats = [
    {label: 'Matches', value: team.matchesPlayed ?? 0},
    {label: 'Wins', value: team.wins ?? 0, accent: true},
    {label: 'Draws', value: team.draws ?? 0},
    {label: 'Losses', value: team.losses ?? 0},
    {label: 'Goals', value: team.goalsScored ?? 0, accent: true},
  ];

  return (
    <View style={stripStyles.container}>
      {stats.map((s, i) => (
        <View
          key={i}
          style={[
            stripStyles.cell,
            i < stats.length - 1 && stripStyles.cellBorder,
          ]}>
          <Text style={[stripStyles.val, s.accent && stripStyles.valAccent]}>
            {s.value}
          </Text>
          <Text style={stripStyles.lbl}>{s.label}</Text>
        </View>
      ))}
    </View>
  );
}

const stripStyles = StyleSheet.create({
  container: {
    backgroundColor: C.cardBg,
    borderRadius: R.lg,
    flexDirection: 'row',
    marginBottom: vs(12),
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: vs(14),
  },
  cellBorder: {
    borderRightWidth: 1,
    borderRightColor: C.border,
  },
  val: {
    fontSize: ms(20),
    fontWeight: '900',
    color: C.textPrimary,
    letterSpacing: -0.3,
  },
  valAccent: {color: C.blue},
  lbl: {
    fontSize: rf(10),
    color: C.textMuted,
    fontWeight: '600',
    marginTop: vs(2),
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
});

// ─────────────────────────────────────────────
// LIVE MATCH CARD
// ─────────────────────────────────────────────
function LiveMatchCard({match, onPress}) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  return (
    <TouchableOpacity
      style={liveStyles.card}
      onPress={onPress}
      activeOpacity={0.9}>
      {/* Top bar */}
      <View style={liveStyles.topBar}>
        <View style={liveStyles.liveTag}>
          <Animated.View style={[liveStyles.liveDot, {opacity: pulseAnim}]} />
          <Text style={liveStyles.liveTxt}>LIVE</Text>
        </View>
        <Text style={liveStyles.cta}>Open Console →</Text>
      </View>

      {/* Score row */}
      <View style={liveStyles.scoreRow}>
        <View style={liveStyles.teamCol}>
          {match.homeTeam?.teamLogoUrl ? (
            <Image
              source={{uri: match.homeTeam.teamLogoUrl}}
              style={liveStyles.miniLogo}
            />
          ) : (
            <View style={liveStyles.miniLogoFallback}>
              <Text style={liveStyles.miniLogoLetter}>
                {match.homeTeam?.teamName?.[0] || 'H'}
              </Text>
            </View>
          )}
          <Text style={liveStyles.teamName} numberOfLines={1}>
            {match.homeTeam?.teamName || 'Home'}
          </Text>
        </View>

        <View style={liveStyles.scoreWrap}>
          <Text style={liveStyles.score}>{match.score.home}</Text>
          <Text style={liveStyles.scoreSep}>:</Text>
          <Text style={liveStyles.score}>{match.score.away}</Text>
        </View>

        <View style={liveStyles.teamCol}>
          {match.awayTeam?.teamLogoUrl ? (
            <Image
              source={{uri: match.awayTeam.teamLogoUrl}}
              style={liveStyles.miniLogo}
            />
          ) : (
            <View style={liveStyles.miniLogoFallback}>
              <Text style={liveStyles.miniLogoLetter}>
                {match.awayTeam?.teamName?.[0] || 'A'}
              </Text>
            </View>
          )}
          <Text style={liveStyles.teamName} numberOfLines={1}>
            {match.awayTeam?.teamName || 'Away'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const liveStyles = StyleSheet.create({
  card: {
    backgroundColor: C.cyanSoft,
    borderRadius: R.lg,
    padding: s(16),
    marginBottom: vs(12),
    borderWidth: 1.5,
    borderColor: '#A5F3FC',
    elevation: 2,
    shadowColor: C.cyan,
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: vs(14),
  },
  liveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.red,
    paddingHorizontal: s(10),
    paddingVertical: vs(4),
    borderRadius: R.pill,
    gap: s(5),
  },
  liveDot: {
    width: s(7),
    height: s(7),
    borderRadius: s(4),
    backgroundColor: C.textWhite,
  },
  liveTxt: {
    color: C.textWhite,
    fontWeight: '900',
    fontSize: rf(11),
    letterSpacing: 1,
  },
  cta: {color: C.cyan, fontWeight: '700', fontSize: rf(13)},
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  teamCol: {alignItems: 'center', flex: 1},
  miniLogo: {
    width: s(42),
    height: s(42),
    borderRadius: s(21),
    marginBottom: vs(6),
  },
  miniLogoFallback: {
    width: s(42),
    height: s(42),
    borderRadius: s(21),
    backgroundColor: C.blueSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: vs(6),
    borderWidth: 1,
    borderColor: C.borderBlue,
  },
  miniLogoLetter: {fontWeight: '800', color: C.blue, fontSize: rf(14)},
  teamName: {
    fontSize: rf(12),
    fontWeight: '700',
    color: C.textPrimary,
    textAlign: 'center',
  },
  scoreWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.cardBg,
    paddingHorizontal: s(16),
    paddingVertical: vs(8),
    borderRadius: R.md,
    gap: s(8),
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  score: {
    fontSize: ms(28),
    fontWeight: '900',
    color: C.textPrimary,
    letterSpacing: -0.5,
  },
  scoreSep: {fontSize: ms(20), color: C.textMuted, fontWeight: '300'},
});

// ─────────────────────────────────────────────
// LAST MATCH CARD
// ─────────────────────────────────────────────
function LastMatchCard({match, onPress}) {
  const home = match.score.home;
  const away = match.score.away;
  const result = home > away ? 'W' : home < away ? 'L' : 'D';
  const resultColor =
    result === 'W' ? C.green : result === 'L' ? C.red : C.textMuted;
  const resultBg =
    result === 'W' ? C.greenSoft : result === 'L' ? C.redSoft : C.cardAlt;

  return (
    <TouchableOpacity
      style={lastStyles.card}
      onPress={onPress}
      activeOpacity={0.9}>
      <View style={lastStyles.header}>
        <Text style={lastStyles.title}>Last Match</Text>
        <View style={[lastStyles.resultBadge, {backgroundColor: resultBg}]}>
          <Text style={[lastStyles.resultTxt, {color: resultColor}]}>
            {result === 'W' ? 'Win' : result === 'L' ? 'Loss' : 'Draw'}
          </Text>
        </View>
      </View>

      <View style={lastStyles.scoreRow}>
        <View style={lastStyles.teamCol}>
          {match.homeTeam?.teamLogoUrl ? (
            <Image
              source={{uri: match.homeTeam.teamLogoUrl}}
              style={lastStyles.miniLogo}
            />
          ) : (
            <View style={lastStyles.miniLogoFallback}>
              <Text style={lastStyles.miniLetter}>
                {match.homeTeam?.teamName?.[0] || 'H'}
              </Text>
            </View>
          )}
          <Text style={lastStyles.teamName} numberOfLines={1}>
            {match.homeTeam?.teamName}
          </Text>
        </View>

        <View style={lastStyles.scoreWrap}>
          <Text style={lastStyles.score}>
            {home} : {away}
          </Text>
          <Text style={lastStyles.date}>
            {new Date(match.completedAt).toLocaleDateString()}
          </Text>
        </View>

        <View style={lastStyles.teamCol}>
          {match.awayTeam?.teamLogoUrl ? (
            <Image
              source={{uri: match.awayTeam.teamLogoUrl}}
              style={lastStyles.miniLogo}
            />
          ) : (
            <View style={lastStyles.miniLogoFallback}>
              <Text style={lastStyles.miniLetter}>
                {match.awayTeam?.teamName?.[0] || 'A'}
              </Text>
            </View>
          )}
          <Text style={lastStyles.teamName} numberOfLines={1}>
            {match.awayTeam?.teamName}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const lastStyles = StyleSheet.create({
  card: {
    backgroundColor: C.cardBg,
    borderRadius: R.lg,
    padding: s(16),
    marginBottom: vs(12),
    borderWidth: 1,
    borderColor: C.border,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: vs(14),
  },
  title: {fontSize: rf(15), fontWeight: '800', color: C.textPrimary},
  resultBadge: {
    paddingHorizontal: s(10),
    paddingVertical: vs(4),
    borderRadius: R.pill,
  },
  resultTxt: {fontSize: rf(12), fontWeight: '800'},
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  teamCol: {alignItems: 'center', flex: 1},
  miniLogo: {
    width: s(40),
    height: s(40),
    borderRadius: s(20),
    marginBottom: vs(6),
  },
  miniLogoFallback: {
    width: s(40),
    height: s(40),
    borderRadius: s(20),
    backgroundColor: C.blueSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: vs(6),
    borderWidth: 1,
    borderColor: C.borderBlue,
  },
  miniLetter: {fontWeight: '800', color: C.blue, fontSize: rf(13)},
  teamName: {
    fontSize: rf(11),
    fontWeight: '700',
    color: C.textPrimary,
    textAlign: 'center',
  },
  scoreWrap: {alignItems: 'center'},
  score: {
    fontSize: ms(24),
    fontWeight: '900',
    color: C.textPrimary,
    letterSpacing: -0.5,
  },
  date: {
    fontSize: rf(11),
    color: C.textMuted,
    marginTop: vs(3),
    fontWeight: '500',
  },
});

// ─────────────────────────────────────────────
// TOURNAMENTS CARD
// ─────────────────────────────────────────────
function TournamentsCard({tournaments, nav}) {
  return (
    <View style={tourStyles.container}>
      <View style={tourStyles.header}>
        <Text style={tourStyles.title}>My Tournaments</Text>
        <Text style={tourStyles.count}>{tournaments.length}</Text>
      </View>
      {tournaments.map(t => (
        <TouchableOpacity
          key={t.id}
          style={tourStyles.row}
          onPress={() =>
            nav.toTournament('TeamTournamentDetail', {tournamentId: t.id})
          }
          activeOpacity={0.85}>
          <View style={tourStyles.iconWrap}>
            <Text style={tourStyles.icon}>🏆</Text>
          </View>
          <View style={tourStyles.textCol}>
            <Text style={tourStyles.name}>{t.name}</Text>
            <Text style={tourStyles.meta}>
              {t.upcomingMatches} upcoming · {t.status.replace(/_/g, ' ')}
            </Text>
          </View>
          <Text style={tourStyles.arrow}>›</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const tourStyles = StyleSheet.create({
  container: {
    backgroundColor: C.cardBg,
    borderRadius: R.lg,
    padding: s(16),
    marginBottom: vs(12),
    borderWidth: 1,
    borderColor: C.border,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: vs(12),
  },
  title: {fontSize: rf(15), fontWeight: '800', color: C.textPrimary},
  count: {
    backgroundColor: C.blueSoft,
    paddingHorizontal: s(10),
    paddingVertical: vs(3),
    borderRadius: R.pill,
    fontSize: rf(12),
    fontWeight: '800',
    color: C.blue,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.cardAlt,
    borderRadius: R.md,
    padding: s(12),
    marginBottom: vs(8),
    gap: s(12),
    borderWidth: 1,
    borderColor: C.border,
  },
  iconWrap: {
    width: s(38),
    height: s(38),
    borderRadius: R.md,
    backgroundColor: C.orangeSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {fontSize: ms(16)},
  textCol: {flex: 1},
  name: {fontSize: rf(14), fontWeight: '700', color: C.textPrimary},
  meta: {
    fontSize: rf(11),
    color: C.textMuted,
    marginTop: vs(2),
    fontWeight: '500',
  },
  arrow: {fontSize: ms(20), color: C.textMuted},
});

// ─────────────────────────────────────────────
// QUICK ACTIONS CARD
// ─────────────────────────────────────────────
function QuickActionsCard({team, nav}) {
  const actions = [
    {
      emoji: '🏆',
      label: 'Join Tournament',
      onPress: () => nav.toTournament('JoinTournament'),
      style: 'orange',
    },
    {
      emoji: '＋',
      label: 'New Match',
      onPress: () => nav.toMatch('CreateMatch'),
      style: 'blue',
    },
    {
      emoji: '📋',
      label: 'Team Stats',
      onPress: () => nav.to('TeamStats', {teamId: team?._id}),
      style: 'light',
    },
    {
      emoji: '⚽',
      label: 'Lineup',
      onPress: () => nav.to('TeamLineup'),
      style: 'light',
    },
  ];

  return (
    <View style={qaStyles.container}>
      <Text style={qaStyles.title}>Quick actions</Text>
      <Text style={qaStyles.subtitle}>Jump to a section</Text>
      <View style={qaStyles.grid}>
        {actions.map((a, i) => (
          <ActionTile key={i} {...a} />
        ))}
      </View>
    </View>
  );
}

function ActionTile({emoji, label, onPress, style}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const onIn = () =>
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      damping: 10,
    }).start();
  const onOut = () =>
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      damping: 12,
    }).start();

  const bgColor =
    style === 'blue' ? C.blue : style === 'orange' ? C.orange : C.cardAlt;
  const textColor = style === 'light' ? C.textPrimary : C.textWhite;
  const iconBg =
    style === 'blue'
      ? 'rgba(255,255,255,0.2)'
      : style === 'orange'
      ? 'rgba(255,255,255,0.2)'
      : C.blueSoft;

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={onIn}
      onPressOut={onOut}
      activeOpacity={1}
      style={{width: '47%'}}>
      <Animated.View
        style={[
          qaStyles.tile,
          {backgroundColor: bgColor, transform: [{scale: scaleAnim}]},
        ]}>
        <View style={[qaStyles.iconWrap, {backgroundColor: iconBg}]}>
          <Text style={qaStyles.emoji}>{emoji}</Text>
        </View>
        <Text style={[qaStyles.label, {color: textColor}]}>{label}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

const qaStyles = StyleSheet.create({
  container: {
    backgroundColor: C.cardBg,
    borderRadius: R.lg,
    padding: s(16),
    marginBottom: vs(12),
    borderWidth: 1,
    borderColor: C.border,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  title: {fontSize: rf(15), fontWeight: '800', color: C.textPrimary},
  subtitle: {
    fontSize: rf(11),
    color: C.textMuted,
    marginTop: vs(2),
    marginBottom: vs(14),
  },
  grid: {flexDirection: 'row', flexWrap: 'wrap', gap: s(10)},
  tile: {
    borderRadius: R.lg,
    paddingVertical: vs(16),
    paddingHorizontal: s(14),
    alignItems: 'center',
    gap: vs(8),
    borderWidth: 1,
    borderColor: C.border,
  },
  iconWrap: {
    width: s(42),
    height: s(42),
    borderRadius: R.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {fontSize: ms(20)},
  label: {fontWeight: '700', fontSize: rf(13), textAlign: 'center'},
});

// ─────────────────────────────────────────────
// EMPTY STATE
// ─────────────────────────────────────────────
function EmptyState({nav}) {
  return (
    <View style={emptyStyles.container}>
      <View style={emptyStyles.iconWrap}>
        <Text style={emptyStyles.icon}>⚽</Text>
      </View>
      <Text style={emptyStyles.title}>Create Your Team</Text>
      <Text style={emptyStyles.subtitle}>
        Get started by creating your team profile to join tournaments and track
        matches.
      </Text>
      <TouchableOpacity
        style={emptyStyles.btn}
        onPress={() => nav.to('CreateTeam')}
        activeOpacity={0.85}>
        <Text style={emptyStyles.btnTxt}>Create Team →</Text>
      </TouchableOpacity>
    </View>
  );
}

const emptyStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: s(32),
  },
  iconWrap: {
    width: s(100),
    height: s(100),
    borderRadius: s(50),
    backgroundColor: C.blueSoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: vs(24),
    borderWidth: 2,
    borderColor: C.borderBlue,
    shadowColor: C.blue,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  icon: {fontSize: ms(44)},
  title: {
    fontSize: ms(22),
    fontWeight: '900',
    color: C.textPrimary,
    marginBottom: vs(12),
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: rf(14),
    color: C.textSecond,
    textAlign: 'center',
    marginBottom: vs(32),
    lineHeight: vs(22),
  },
  btn: {
    backgroundColor: C.blue,
    paddingVertical: vs(14),
    paddingHorizontal: s(32),
    borderRadius: R.md,
    minWidth: s(200),
    shadowColor: C.blue,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  btnTxt: {
    color: C.textWhite,
    fontSize: rf(15),
    fontWeight: '800',
    textAlign: 'center',
  },
});

// ─────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────
export default function TeamHome() {
  const nav = useNavigationHelper();
  const isFocused = useIsFocused();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liveMatch, setLiveMatch] = useState(null);
  const [lastMatch, setLastMatch] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [joinedTournaments, setJoinedTournaments] = useState([]);
  const {showGuide, finishGuide, resetGuide} = useOnboarding('team');

  useEffect(() => {
    if (isFocused) loadTeam();
  }, [isFocused]);

  const loadTeam = async () => {
    try {
      const teamRes = await API.get('/api/team/my-team');
      if (!teamRes.data) {
        setTeam(null);
        setLoading(false);
        return;
      }
      setTeam(teamRes.data);
      await Promise.all([loadMatches(), loadTournaments()]);
    } catch (err) {
      if (err.response?.status === 404) setTeam(null);
      else {
        console.error('Failed to load team:', err);
        setTeam(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadMatches = async () => {
    try {
      const matchRes = await API.get('/api/match/myMatch');
      const matches = matchRes.data.data || [];
      const live = matches.find(m => m.status === 'LIVE');
      setLiveMatch(live || null);
      const completed = matches
        .filter(m => m.status === 'COMPLETED')
        .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
      setLastMatch(completed[0] || null);
    } catch {
      setLiveMatch(null);
      setLastMatch(null);
    }
  };

  const loadTournaments = async () => {
    try {
      const res = await API.get('/api/team/joinedTournaments');
      setJoinedTournaments(Array.isArray(res.data) ? res.data : []);
    } catch {
      setJoinedTournaments([]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadTeam();
    } catch (e) {
      console.log('Refresh error', e);
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <MainLayout title="Team Home">
        <View style={screenStyles.center}>
          <ActivityIndicator size="large" color={C.blue} />
          <Text style={screenStyles.loadingTxt}>Loading team...</Text>
        </View>
      </MainLayout>
    );
  }

  if (!team) {
    return (
      <MainLayout title="Team Home">
        <EmptyState nav={nav} />
      </MainLayout>
    );
  }

  return (
    <>
      <AppRefreshView
        refreshing={refreshing}
        onRefresh={onRefresh}
        style={screenStyles.root}>
        <MainLayout title="Team Home">
          <ScrollView
            contentContainerStyle={screenStyles.scroll}
            showsVerticalScrollIndicator={false}>
            <HeroSection team={team} nav={nav} />
            <StatStrip team={team} />

            {liveMatch && (
              <LiveMatchCard
                match={liveMatch}
                onPress={() =>
                  nav.toMatch('MatchConsole', {matchId: liveMatch._id})
                }
              />
            )}

            {lastMatch && (
              <LastMatchCard
                match={lastMatch}
                onPress={() =>
                  nav.toMatch('MatchSummary', {matchId: lastMatch._id})
                }
              />
            )}

            {joinedTournaments.length > 0 && (
              <TournamentsCard tournaments={joinedTournaments} nav={nav} />
            )}

            <TouchableOpacity
              onPress={resetGuide}
              style={{padding: 10, backgroundColor: 'red', borderRadius: R.md, marginBottom: vs(10)}}>
              <Text style={{color: 'white', textAlign: 'center', fontWeight: '700'}}>Reset Guide (TEST)</Text>
            </TouchableOpacity>

            <QuickActionsCard team={team} nav={nav} />

            <View style={{height: vs(24)}} />
          </ScrollView>
        </MainLayout>
      </AppRefreshView>
      <OnboardingOverlay
        visible={showGuide}
        steps={TEAM_STEPS}
        onFinish={finishGuide}
      />
    </>
  );
}

const screenStyles = StyleSheet.create({
  root: {flex: 1, backgroundColor: C.pageBg},
  scroll: {padding: s(14), backgroundColor: C.pageBg, paddingBottom: vs(40)},
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: vs(10),
  },
  loadingTxt: {fontSize: rf(13), color: C.textSecond, fontWeight: '500'},
});