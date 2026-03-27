import React, {useEffect, useState, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  ScrollView,
  Animated,
  Dimensions,
} from 'react-native';
import API from '../../api/api';
import MainLayout from '../../components/MainLayout';
import useNavigationHelper from '../../navigation/Navigationhelper';
import AppRefreshView from '../../components/AppRefreshView';
import {useAuth} from '../../context/AuthContext';
import {s, vs, ms, rf} from '../../utils/responsive';
import OnboardingOverlay from '../../components/OnboardingOverlay';
import {useOnboarding} from '../../hooks/useOnboarding';
import {ORGANISER_STEPS} from '../../constants/onboardingSteps';

const {width: SW} = Dimensions.get('window');

// ─── DESIGN TOKENS ───────────────────────────
const C = {
  pageBg: '#F0F4F8',
  blue: '#2563EB',
  blueDark: '#1D4ED8',
  blueDeep: '#1E40AF',
  blueSoft: '#EFF6FF',
  blueMid: '#BFDBFE',
  blueText: '#1E3A8A',
  cardBg: '#FFFFFF',
  cardAlt: '#F8FAFC',
  textPrimary: '#0F172A',
  textSecond: '#475569',
  textMuted: '#94A3B8',
  textWhite: '#FFFFFF',
  border: '#E2E8F0',
  borderBlue: '#DBEAFE',
  green: '#10B981',
  greenSoft: '#ECFDF5',
  greenDark: '#065F46',
  amber: '#F59E0B',
  amberSoft: '#FFFBEB',
  amberDark: '#92400E',
  red: '#DC2626',
  redSoft: '#FEF2F2',
};

const R = {sm: ms(8), md: ms(12), lg: ms(16), xl: ms(20), xxl: ms(24), pill: ms(50)};

// ─── ANIMATED FADE-IN WRAPPER ────────────────
function FadeSlide({delay = 0, children, style}) {
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fade, {toValue: 1, duration: 400, useNativeDriver: true}),
        Animated.spring(slide, {toValue: 0, damping: 16, useNativeDriver: true}),
      ]).start();
    }, delay);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View style={[style, {opacity: fade, transform: [{translateY: slide}]}]}>
      {children}
    </Animated.View>
  );
}

// ─────────────────────────────────────────────
// GREETING HERO
// ─────────────────────────────────────────────
function GreetingHero({user, activeTournaments, totalTeams, totalMatches}) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.name?.split(' ')[0] || 'Organiser';

  return (
    <View style={greetStyles.container}>
      <View style={greetStyles.topRow}>
        <View style={greetStyles.textCol}>
          <Text style={greetStyles.greeting}>{greeting},</Text>
          <Text style={greetStyles.name}>{firstName} 👋</Text>
          <Text style={greetStyles.subtitle}>Here's your tournament overview</Text>
        </View>
        <View style={greetStyles.avatarWrap}>
          <Text style={greetStyles.avatarTxt}>
            {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'OG'}
          </Text>
        </View>
      </View>

      {/* Mini stat row */}
      <View style={greetStyles.miniStats}>
        <View style={greetStyles.miniStat}>
          <Text style={greetStyles.miniVal}>{activeTournaments}</Text>
          <Text style={greetStyles.miniLbl}>Active</Text>
        </View>
        <View style={greetStyles.miniDivider} />
        <View style={greetStyles.miniStat}>
          <Text style={greetStyles.miniVal}>{totalTeams}</Text>
          <Text style={greetStyles.miniLbl}>Teams</Text>
        </View>
        <View style={greetStyles.miniDivider} />
        <View style={greetStyles.miniStat}>
          <Text style={greetStyles.miniVal}>{totalMatches}</Text>
          <Text style={greetStyles.miniLbl}>Matches</Text>
        </View>
      </View>
    </View>
  );
}

const greetStyles = StyleSheet.create({
  container: {
    backgroundColor: C.blueDeep,
    borderRadius: R.xxl,
    padding: s(20),
    marginBottom: vs(16),
    shadowColor: C.blue,
    shadowOffset: {width: 0, height: vs(8)},
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: vs(18),
  },
  textCol: {flex: 1},
  greeting: {fontSize: rf(13), color: C.blueMid, fontWeight: '600'},
  name: {fontSize: ms(24), fontWeight: '900', color: C.textWhite, letterSpacing: -0.5, marginTop: vs(2)},
  subtitle: {fontSize: rf(12), color: C.blueMid, fontWeight: '500', marginTop: vs(4)},
  avatarWrap: {
    width: s(48), height: s(48), borderRadius: s(24),
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarTxt: {color: C.textWhite, fontWeight: '900', fontSize: rf(16)},
  miniStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: R.lg,
    paddingVertical: vs(12),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  miniStat: {flex: 1, alignItems: 'center'},
  miniVal: {fontSize: ms(20), fontWeight: '900', color: C.textWhite},
  miniLbl: {fontSize: rf(10), color: C.blueMid, fontWeight: '600', marginTop: vs(2), textTransform: 'uppercase', letterSpacing: 0.5},
  miniDivider: {width: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginVertical: vs(4)},
});

// ─────────────────────────────────────────────
// PROFILE INCOMPLETE BANNER
// ─────────────────────────────────────────────
function ProfileBanner({onPress}) {
  return (
    <TouchableOpacity style={bannerStyles.container} onPress={onPress} activeOpacity={0.85}>
      <View style={bannerStyles.left}>
        <View style={bannerStyles.iconWrap}>
          <Text style={bannerStyles.icon}>⚠️</Text>
        </View>
        <View style={bannerStyles.textCol}>
          <Text style={bannerStyles.title}>Complete your profile</Text>
          <Text style={bannerStyles.sub}>Required to create tournaments</Text>
        </View>
      </View>
      <View style={bannerStyles.arrow}>
        <Text style={bannerStyles.arrowTxt}>→</Text>
      </View>
    </TouchableOpacity>
  );
}

const bannerStyles = StyleSheet.create({
  container: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: C.amberSoft, borderRadius: R.lg, padding: s(14),
    marginBottom: vs(16), borderWidth: 1, borderColor: '#FDE68A',
    borderLeftWidth: 4, borderLeftColor: C.amber,
  },
  left: {flexDirection: 'row', alignItems: 'center', gap: s(12), flex: 1},
  iconWrap: {
    width: s(36), height: s(36), borderRadius: R.md,
    backgroundColor: '#FED7AA', alignItems: 'center', justifyContent: 'center',
  },
  icon: {fontSize: ms(16)},
  textCol: {flex: 1},
  title: {fontSize: rf(13), fontWeight: '800', color: C.amberDark},
  sub: {fontSize: rf(11), color: '#B45309', marginTop: vs(1)},
  arrow: {
    width: s(32), height: s(32), borderRadius: s(16),
    backgroundColor: '#FDE68A', alignItems: 'center', justifyContent: 'center',
  },
  arrowTxt: {fontSize: ms(14), color: C.amberDark, fontWeight: '700'},
});

// ─────────────────────────────────────────────
// LIVE MATCH CARD (premium)
// ─────────────────────────────────────────────
function LiveMatchCard({match, onPress}) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {toValue: 0.3, duration: 800, useNativeDriver: true}),
        Animated.timing(pulseAnim, {toValue: 1, duration: 800, useNativeDriver: true}),
      ]),
    ).start();
  }, []);

  return (
    <TouchableOpacity style={liveStyles.card} onPress={onPress} activeOpacity={0.9}>
      <View style={liveStyles.topBar}>
        <View style={liveStyles.liveTag}>
          <Animated.View style={[liveStyles.liveDot, {opacity: pulseAnim}]} />
          <Text style={liveStyles.liveTxt}>LIVE NOW</Text>
        </View>
        <Text style={liveStyles.cta}>Open Console →</Text>
      </View>
      <View style={liveStyles.body}>
        <View style={liveStyles.teamCol}>
          <View style={liveStyles.teamBadge}>
            <Text style={liveStyles.teamInitial}>
              {match.homeTeam?.teamName?.[0] || 'H'}
            </Text>
          </View>
          <Text style={liveStyles.teamName} numberOfLines={1}>
            {match.homeTeam?.teamName || 'Home'}
          </Text>
        </View>
        <View style={liveStyles.scoreWrap}>
          <Text style={liveStyles.score}>
            {match.score?.home ?? 0} - {match.score?.away ?? 0}
          </Text>
          <Text style={liveStyles.matchInfo}>
            {match.tournamentName || 'Friendly'}
          </Text>
        </View>
        <View style={liveStyles.teamCol}>
          <View style={liveStyles.teamBadge}>
            <Text style={liveStyles.teamInitial}>
              {match.awayTeam?.teamName?.[0] || 'A'}
            </Text>
          </View>
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
    backgroundColor: C.cardBg, borderRadius: R.xl, padding: s(16),
    marginBottom: vs(14), borderWidth: 2, borderColor: '#FCA5A5',
    shadowColor: C.red, shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15, shadowRadius: 12, elevation: 5,
  },
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: vs(14),
  },
  liveTag: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.red, paddingHorizontal: s(10),
    paddingVertical: vs(4), borderRadius: R.pill, gap: s(5),
  },
  liveDot: {width: s(7), height: s(7), borderRadius: s(4), backgroundColor: C.textWhite},
  liveTxt: {color: C.textWhite, fontWeight: '900', fontSize: rf(10), letterSpacing: 1},
  cta: {color: C.blue, fontWeight: '700', fontSize: rf(12)},
  body: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  teamCol: {alignItems: 'center', flex: 1},
  teamBadge: {
    width: s(44), height: s(44), borderRadius: s(22),
    backgroundColor: C.blueSoft, alignItems: 'center', justifyContent: 'center',
    marginBottom: vs(6), borderWidth: 1.5, borderColor: C.borderBlue,
  },
  teamInitial: {fontWeight: '900', color: C.blue, fontSize: rf(16)},
  teamName: {fontSize: rf(11), fontWeight: '700', color: C.textPrimary, textAlign: 'center'},
  scoreWrap: {alignItems: 'center', paddingHorizontal: s(8)},
  score: {fontSize: ms(26), fontWeight: '900', color: C.textPrimary, letterSpacing: -0.5},
  matchInfo: {fontSize: rf(10), color: C.textMuted, marginTop: vs(3), fontWeight: '600'},
});

// ─────────────────────────────────────────────
// QUICK ACTIONS (horizontal row)
// ─────────────────────────────────────────────
function QuickActions({nav, profileComplete}) {
  const actions = [
    {emoji: '🏆', label: 'Create\nTournament', key: 'create', accent: true},
    {emoji: '⚽', label: 'New\nMatch', key: 'match'},
    {emoji: '📋', label: 'My\nTournaments', key: 'tournaments'},
    {emoji: '👤', label: 'Edit\nProfile', key: 'profile'},
  ];

  const handlePress = key => {
    if (key === 'create') {
      if (!profileComplete) {
        Alert.alert('Profile Incomplete', 'Please complete your profile first.');
        return;
      }
      nav.toTournament('CreateTournament');
    } else if (key === 'match') {
      nav.toMatch('CreateMatch');
    } else if (key === 'tournaments') {
      nav.toTournament('MyTournaments');
    } else if (key === 'profile') {
      nav.toProfile('OrganiserProfile');
    }
  };

  return (
    <View style={qaStyles.container}>
      <Text style={qaStyles.sectionTitle}>Quick actions</Text>
      <View style={qaStyles.row}>
        {actions.map((a, i) => (
          <TouchableOpacity
            key={i}
            style={[qaStyles.tile, a.accent && qaStyles.tileAccent]}
            onPress={() => handlePress(a.key)}
            activeOpacity={0.85}>
            <View style={[qaStyles.iconWrap, a.accent && qaStyles.iconWrapAccent]}>
              <Text style={qaStyles.emoji}>{a.emoji}</Text>
            </View>
            <Text style={[qaStyles.label, a.accent && qaStyles.labelAccent]}>
              {a.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const qaStyles = StyleSheet.create({
  container: {marginBottom: vs(16)},
  sectionTitle: {
    fontSize: rf(15), fontWeight: '900', color: C.textPrimary,
    letterSpacing: -0.2, marginBottom: vs(12),
  },
  row: {flexDirection: 'row', gap: s(8)},
  tile: {
    flex: 1, backgroundColor: C.cardBg, borderRadius: R.lg,
    paddingVertical: vs(14), alignItems: 'center', gap: vs(8),
    borderWidth: 1, borderColor: C.border,
    shadowColor: '#000', shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  tileAccent: {backgroundColor: C.blue, borderColor: C.blue},
  iconWrap: {
    width: s(38), height: s(38), borderRadius: R.md,
    backgroundColor: C.blueSoft, alignItems: 'center', justifyContent: 'center',
  },
  iconWrapAccent: {backgroundColor: 'rgba(255,255,255,0.2)'},
  emoji: {fontSize: ms(18)},
  label: {
    fontSize: rf(10), fontWeight: '700', color: C.textSecond,
    textAlign: 'center', lineHeight: rf(14),
  },
  labelAccent: {color: C.textWhite},
});

// ─────────────────────────────────────────────
// TODAY'S SCHEDULE
// ─────────────────────────────────────────────
function TodaySchedule({matches, nav}) {
  if (matches.length === 0) return null;

  return (
    <View style={schedStyles.container}>
      <View style={schedStyles.header}>
        <View style={schedStyles.headerLeft}>
          <View style={schedStyles.headerDot} />
          <Text style={schedStyles.title}>Today's schedule</Text>
        </View>
        <Text style={schedStyles.count}>{matches.length}</Text>
      </View>
      {matches.slice(0, 4).map((m, i) => (
        <TouchableOpacity
          key={m._id}
          style={[schedStyles.row, i === Math.min(matches.length, 4) - 1 && {borderBottomWidth: 0}]}
          onPress={() => nav.toMatch('MatchDetail', {matchId: m._id})}
          activeOpacity={0.7}>
          <View style={schedStyles.timeCol}>
            <Text style={schedStyles.time}>
              {new Date(m.scheduledAt).toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit'})}
            </Text>
          </View>
          <View style={schedStyles.dividerLine} />
          <View style={schedStyles.matchCol}>
            <Text style={schedStyles.matchTeams} numberOfLines={1}>
              {m.homeTeam?.teamName} vs {m.awayTeam?.teamName}
            </Text>
            <Text style={schedStyles.matchMeta} numberOfLines={1}>
              {m.tournamentName || 'Match'}{m.round ? ` · ${m.round}` : ''}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const schedStyles = StyleSheet.create({
  container: {
    backgroundColor: C.cardBg, borderRadius: R.xl, padding: s(16),
    marginBottom: vs(14), borderWidth: 1, borderColor: C.border,
    shadowColor: '#000', shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: vs(14),
  },
  headerLeft: {flexDirection: 'row', alignItems: 'center', gap: s(8)},
  headerDot: {width: s(8), height: s(8), borderRadius: s(4), backgroundColor: C.blue},
  title: {fontSize: rf(15), fontWeight: '800', color: C.textPrimary},
  count: {
    backgroundColor: C.blueSoft, paddingHorizontal: s(10), paddingVertical: vs(3),
    borderRadius: R.pill, fontSize: rf(12), fontWeight: '800', color: C.blue,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: vs(12),
    borderBottomWidth: 1, borderBottomColor: C.border, gap: s(12),
  },
  timeCol: {width: s(60)},
  time: {fontSize: rf(13), fontWeight: '800', color: C.blue},
  dividerLine: {width: 2, height: vs(28), backgroundColor: C.borderBlue, borderRadius: 1},
  matchCol: {flex: 1},
  matchTeams: {fontSize: rf(13), fontWeight: '700', color: C.textPrimary},
  matchMeta: {fontSize: rf(11), color: C.textMuted, fontWeight: '500', marginTop: vs(2)},
});

// ─────────────────────────────────────────────
// TOURNAMENT CARD (redesigned)
// ─────────────────────────────────────────────
const STATUS_CONFIG = {
  DRAFT: {label: 'Draft', color: '#64748B', bg: '#F1F5F9', accent: '#CBD5E1'},
  REGISTRATION_OPEN: {label: 'Registration open', color: C.blueDark, bg: C.blueSoft, accent: C.blue},
  REGISTRATION_CLOSED: {label: 'Reg. closed', color: C.amberDark, bg: '#FEF9C3', accent: C.amber},
  FIXTURES_GENERATED: {label: 'Fixtures set', color: C.blueDark, bg: '#DBEAFE', accent: '#3B82F6'},
  LIVE: {label: 'Live', color: C.red, bg: C.redSoft, accent: '#EF4444'},
  COMPLETED: {label: 'Completed', color: '#475569', bg: '#F1F5F9', accent: '#94A3B8'},
};

function TournamentCard({item, onPress}) {
  const sc = STATUS_CONFIG[item.status] || STATUS_CONFIG.DRAFT;
  const isLive = item.status === 'LIVE';

  return (
    <TouchableOpacity style={[tStyles.card, isLive && tStyles.cardLive]} onPress={onPress} activeOpacity={0.85}>
      <View style={[tStyles.accent, {backgroundColor: sc.accent}]} />
      <View style={tStyles.content}>
        <View style={tStyles.topRow}>
          <View style={tStyles.titleRow}>
            {isLive && <View style={tStyles.liveDot} />}
            <Text style={[tStyles.name, isLive && {color: C.red}]} numberOfLines={1}>
              {item.name}
            </Text>
          </View>
          <View style={[tStyles.statusPill, {backgroundColor: sc.bg}]}>
            <Text style={[tStyles.statusTxt, {color: sc.color}]}>{sc.label}</Text>
          </View>
        </View>

        <View style={tStyles.metaRow}>
          <View style={tStyles.metaItem}>
            <Text style={tStyles.metaIcon}>📅</Text>
            <Text style={tStyles.metaTxt}>{formatDate(item.startDate)}</Text>
          </View>
          <View style={tStyles.metaItem}>
            <Text style={tStyles.metaIcon}>👥</Text>
            <Text style={tStyles.metaTxt}>{item.teams?.length || 0} teams</Text>
          </View>
          {item.location && (
            <View style={tStyles.metaItem}>
              <Text style={tStyles.metaIcon}>📍</Text>
              <Text style={tStyles.metaTxt} numberOfLines={1}>{item.location}</Text>
            </View>
          )}
        </View>

        {item.status === 'REGISTRATION_OPEN' && item.maxTeams > 0 && (
          <View style={tStyles.progressRow}>
            <View style={tStyles.progressBg}>
              <View style={[tStyles.progressFill, {width: `${Math.min(100, ((item.teams?.length || 0) / item.maxTeams) * 100)}%`}]} />
            </View>
            <Text style={tStyles.progressLbl}>{item.teams?.length || 0}/{item.maxTeams}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const tStyles = StyleSheet.create({
  card: {
    backgroundColor: C.cardBg, borderRadius: R.lg, marginBottom: vs(10),
    flexDirection: 'row', overflow: 'hidden',
    shadowColor: '#0F172A', shadowOffset: {width: 0, height: vs(2)},
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    borderWidth: 1, borderColor: C.border,
  },
  cardLive: {borderColor: '#FCA5A5', shadowColor: C.red, shadowOpacity: 0.12},
  accent: {width: s(4)},
  content: {flex: 1, padding: s(14)},
  topRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: vs(10)},
  titleRow: {flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: s(8), gap: s(6)},
  liveDot: {width: s(7), height: s(7), borderRadius: s(4), backgroundColor: '#EF4444'},
  name: {fontSize: rf(15), fontWeight: '800', color: C.textPrimary, flex: 1},
  statusPill: {paddingHorizontal: s(9), paddingVertical: vs(3), borderRadius: R.pill},
  statusTxt: {fontSize: rf(10), fontWeight: '700'},
  metaRow: {flexDirection: 'row', gap: s(12), flexWrap: 'wrap'},
  metaItem: {flexDirection: 'row', alignItems: 'center', gap: s(3)},
  metaIcon: {fontSize: ms(10)},
  metaTxt: {fontSize: rf(11), color: '#64748B', fontWeight: '500'},
  progressRow: {flexDirection: 'row', alignItems: 'center', gap: s(8), marginTop: vs(10)},
  progressBg: {flex: 1, height: vs(5), backgroundColor: C.blueSoft, borderRadius: ms(4), overflow: 'hidden'},
  progressFill: {height: vs(5), backgroundColor: C.blue, borderRadius: ms(4)},
  progressLbl: {fontSize: rf(10), color: C.blue, fontWeight: '700', width: s(45)},
});

// ─────────────────────────────────────────────
// TOURNAMENTS SECTION
// ─────────────────────────────────────────────
function TournamentsSection({tournaments, nav, profileComplete}) {
  return (
    <View style={{marginBottom: vs(8)}}>
      <View style={secStyles.header}>
        <Text style={secStyles.title}>My tournaments</Text>
        {tournaments.length > 0 && (
          <TouchableOpacity onPress={() => nav.toTournament('MyTournaments')}>
            <Text style={secStyles.link}>View all →</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Create button */}
      <TouchableOpacity
        style={[secStyles.createBtn, !profileComplete && {opacity: 0.5}]}
        onPress={() => {
          if (!profileComplete) {
            Alert.alert('Profile Incomplete', 'Please complete your profile first.');
            return;
          }
          nav.toTournament('CreateTournament');
        }}
        activeOpacity={0.85}>
        <View style={secStyles.createIcon}>
          <Text style={secStyles.createPlus}>+</Text>
        </View>
        <View>
          <Text style={secStyles.createTxt}>Create new tournament</Text>
          <Text style={secStyles.createSub}>Set up brackets, invite teams</Text>
        </View>
      </TouchableOpacity>

      {tournaments.length === 0 ? (
        <View style={secStyles.emptyCard}>
          <Text style={secStyles.emptyIcon}>🏟️</Text>
          <Text style={secStyles.emptyTitle}>No tournaments yet</Text>
          <Text style={secStyles.emptySub}>Create your first tournament to get started</Text>
        </View>
      ) : (
        <>
          {tournaments.slice(0, 5).map(item => (
            <TournamentCard
              key={item._id}
              item={item}
              onPress={() => nav.toTournament('TournamentDetail', {tournamentId: item._id})}
            />
          ))}
          {tournaments.length > 5 && (
            <TouchableOpacity
              style={secStyles.moreBtn}
              onPress={() => nav.toTournament('MyTournaments')}
              activeOpacity={0.8}>
              <Text style={secStyles.moreTxt}>+{tournaments.length - 5} more tournaments</Text>
              <Text style={secStyles.moreArrow}>→</Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );
}

const secStyles = StyleSheet.create({
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: vs(12),
  },
  title: {fontSize: rf(17), fontWeight: '900', color: C.textPrimary, letterSpacing: -0.2},
  link: {fontSize: rf(12), fontWeight: '700', color: C.blue},
  createBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.cardBg, borderRadius: R.lg, padding: s(14),
    marginBottom: vs(12), borderWidth: 1.5, borderColor: C.borderBlue,
    borderStyle: 'dashed', gap: s(12),
  },
  createIcon: {
    width: s(40), height: s(40), borderRadius: R.md,
    backgroundColor: C.blueSoft, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: C.borderBlue,
  },
  createPlus: {fontSize: ms(20), fontWeight: '700', color: C.blue},
  createTxt: {fontSize: rf(14), fontWeight: '700', color: C.blue},
  createSub: {fontSize: rf(11), color: C.textMuted, fontWeight: '500', marginTop: vs(1)},
  emptyCard: {
    backgroundColor: C.cardBg, borderRadius: R.xl, padding: s(32),
    alignItems: 'center', borderWidth: 1, borderColor: C.border,
  },
  emptyIcon: {fontSize: ms(40), marginBottom: vs(12)},
  emptyTitle: {fontSize: rf(16), fontWeight: '800', color: C.textPrimary, marginBottom: vs(4)},
  emptySub: {fontSize: rf(13), color: C.textMuted, textAlign: 'center'},
  moreBtn: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: C.blueSoft, borderRadius: R.lg, paddingHorizontal: s(16),
    paddingVertical: vs(14), borderWidth: 1, borderColor: C.borderBlue,
  },
  moreTxt: {fontSize: rf(13), fontWeight: '600', color: C.blueDark},
  moreArrow: {fontSize: rf(14), fontWeight: '700', color: C.blue},
});

// ─────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────
export default function OrganiserDashboardScreen() {
  const nav = useNavigationHelper();
  const {user} = useAuth();
  const isMounted = useRef(true);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tournaments, setTournaments] = useState([]);
  const [matches, setMatches] = useState([]);
  const [profileComplete, setProfileComplete] = useState(true);
  const [stats, setStats] = useState(null);
  const {showGuide, finishGuide, resetGuide} = useOnboarding('organiser');

  useEffect(() => {
    loadDashboard();
    return () => { isMounted.current = false; };
  }, []);

  const loadDashboard = async () => {
    try {
      const [tRes, mRes, profileRes, statsRes] = await Promise.all([
        API.get('/api/organiser/tournaments').catch(err => {
          if (err.response?.status === 404) return {data: []};
          throw err;
        }),
        API.get('/api/organiser/getMatches').catch(err => {
          if (err.response?.status === 404) return {data: []};
          throw err;
        }),
        API.get('/api/organiser/profile/status').catch(err => {
          if (err.response?.status === 404) return {data: {complete: false}};
          throw err;
        }),
        API.get('/api/organiser/stats').catch(err => {
          return {data: null};
        }),
      ]);

      if (!isMounted.current) return;

      const PRIORITY = {
        LIVE: 0, FIXTURES_GENERATED: 1, REGISTRATION_OPEN: 2,
        REGISTRATION_CLOSED: 3, DRAFT: 4, COMPLETED: 5,
      };
      const sortedTournaments = (tRes.data || []).sort((a, b) => {
        const pa = PRIORITY[a.status] ?? 6;
        const pb = PRIORITY[b.status] ?? 6;
        if (pa !== pb) return pa - pb;
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      setTournaments(sortedTournaments);
      setMatches((mRes.data || []).filter(m => m.createdByRole === 'organiser'));
      setProfileComplete(profileRes.data.complete);
      setStats(statsRes.data);
    } catch (err) {
      if (isMounted.current) {
        Alert.alert('Error', err.response?.data?.message || 'Failed to load dashboard');
      }
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  if (loading && !refreshing) {
    return (
      <MainLayout title="Dashboard">
        <View style={screenStyles.center}>
          <ActivityIndicator size="large" color={C.blue} />
          <Text style={screenStyles.loadingTxt}>Loading dashboard…</Text>
        </View>
      </MainLayout>
    );
  }

  const activeTournaments = tournaments.filter(t =>
    ['REGISTRATION_OPEN', 'FIXTURES_GENERATED', 'LIVE'].includes(t.status),
  ).length;
  const totalTeams = tournaments.reduce((acc, t) => acc + (t.teams?.length || 0), 0);
  const liveMatches = matches.filter(m => m.status === 'LIVE');
  const upcomingToday = matches.filter(m => {
    const d = new Date(m.scheduledAt);
    const today = new Date();
    return d.toDateString() === today.toDateString() && m.status !== 'COMPLETED';
  });

  return (
    <>
      <AppRefreshView
        refreshing={refreshing}
        onRefresh={() => loadDashboard(true)}
        style={{flex: 1}}>
        <MainLayout title="Dashboard">
          <ScrollView
            style={screenStyles.scroll}
            contentContainerStyle={screenStyles.container}
            showsVerticalScrollIndicator={false}>

            {/* Greeting Hero */}
            <FadeSlide delay={0}>
              <GreetingHero
                user={user}
                activeTournaments={activeTournaments}
                totalTeams={totalTeams}
                totalMatches={matches.length}
              />
            </FadeSlide>

            {/* Profile banner */}
            {!profileComplete && (
              <FadeSlide delay={100}>
                <ProfileBanner onPress={() => nav.toProfile('OrganiserProfile')} />
              </FadeSlide>
            )}

            {/* Live match */}
            {liveMatches.length > 0 && (
              <FadeSlide delay={150}>
                <LiveMatchCard
                  match={liveMatches[0]}
                  onPress={() => nav.toMatch('MatchConsole', {matchId: liveMatches[0]._id})}
                />
              </FadeSlide>
            )}

            {/* Quick Actions */}
            <FadeSlide delay={200}>
              <QuickActions nav={nav} profileComplete={profileComplete} />
            </FadeSlide>

            {/* Today's schedule */}
            <FadeSlide delay={250}>
              <TodaySchedule matches={upcomingToday} nav={nav} />
            </FadeSlide>

            {/* Tournaments */}
            <FadeSlide delay={300}>
              <TournamentsSection
                tournaments={tournaments}
                nav={nav}
                profileComplete={profileComplete}
              />
            </FadeSlide>

            {/* Reset Guide (TEST) */}
            <TouchableOpacity
              onPress={resetGuide}
              style={screenStyles.resetBtn}>
              <Text style={screenStyles.resetTxt}>Reset Guide (TEST)</Text>
            </TouchableOpacity>

            <View style={{height: vs(24)}} />
          </ScrollView>
        </MainLayout>
      </AppRefreshView>
      <OnboardingOverlay
        visible={showGuide}
        steps={ORGANISER_STEPS}
        onFinish={finishGuide}
      />
    </>
  );
}

function formatDate(date) {
  if (!date) return 'TBD';
  return new Date(date).toLocaleDateString('en-IN', {day: 'numeric', month: 'short', year: 'numeric'});
}

const screenStyles = StyleSheet.create({
  scroll: {backgroundColor: C.pageBg},
  container: {paddingHorizontal: s(16), paddingTop: vs(14), paddingBottom: vs(48)},
  center: {flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.pageBg, gap: vs(10)},
  loadingTxt: {fontSize: rf(13), color: C.textSecond, fontWeight: '500'},
  resetBtn: {
    padding: 10, backgroundColor: '#DC2626', borderRadius: ms(12),
    marginBottom: vs(10), marginTop: vs(8),
  },
  resetTxt: {color: 'white', textAlign: 'center', fontWeight: '700'},
});