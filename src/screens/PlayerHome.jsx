import React, {useEffect, useState, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  Animated,
  StatusBar,
} from 'react-native';
import API from '../api/api';
import MainLayout from '../components/MainLayout';
import useNavigationHelper from '../navigation/Navigationhelper';
import AppRefreshView from '../components/AppRefreshView';
import {useIsFocused} from '@react-navigation/native';
import {s, vs, ms, rf} from '../utils/responsive';

// ─────────────────────────────────────────────
// DESIGN TOKENS  (original blue/white palette)
// ─────────────────────────────────────────────
const C = {
  pageBg: '#F1F5F9',
  blue: '#2563EB',
  blueDark: '#1D4ED8',
  blueDeep: '#1E40AF',
  blueSoft: '#EFF6FF',
  blueMid: '#BFDBFE',
  blueText: '#1E3A8A',
  heroBg: '#1E40AF',
  cardBg: '#FFFFFF',
  cardAlt: '#F8FAFC',
  textPrimary: '#0F172A',
  textSecond: '#475569',
  textMuted: '#94A3B8',
  textWhite: '#FFFFFF',
  textWhiteSub: '#BFDBFE',
  amber: '#F59E0B',
  green: '#10B981',
  greenBg: '#ECFDF5',
  warnBg: '#FFF7ED',
  warnBorder: '#F97316',
  warnText: '#9A3412',
  border: '#E2E8F0',
  borderBlue: '#DBEAFE',
};

const R = {
  sm: ms(8),
  md: ms(12),
  lg: ms(16),
  xl: ms(20),
  pill: ms(50),
};

// ─────────────────────────────────────────────
// HERO CARD  — modern card floating on page bg
// ─────────────────────────────────────────────
function HeroCard({player, user}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        damping: 16,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        heroStyles.card,
        {opacity: fadeAnim, transform: [{translateY: slideAnim}]},
      ]}>
      <View style={heroStyles.topStrip} />
      <View style={heroStyles.body}>
        {/* Avatar */}
        <View style={heroStyles.avatarWrap}>
          {player?.profileImageUrl ? ( // ✅ correct field
            <Image
              source={{uri: player.profileImageUrl}}
              style={heroStyles.avatar}
              onError={e =>
                console.log('Hero image error:', e.nativeEvent.error)
              }
            />
          ) : (
            <View style={heroStyles.avatarFallback}>
              <Text style={heroStyles.avatarLetter}>
                {user?.name?.[0]?.toUpperCase() || 'P'}
              </Text>
            </View>
          )}
          {player?.position && (
            <View style={heroStyles.posBadge}>
              <Text style={heroStyles.posText}>{player.position}</Text>
            </View>
          )}
        </View>

        {/* Info */}
        <View style={heroStyles.infoCol}>
          <Text style={heroStyles.name} numberOfLines={1}>
            {user?.name || 'Player'}
          </Text>

          {/* Status */}
          <View style={heroStyles.statusRow}>
            <View
              style={[
                heroStyles.statusDot,
                player?.teamId ? heroStyles.dotGreen : heroStyles.dotAmber,
              ]}
            />
            <Text style={heroStyles.statusTxt}>
              {player?.teamId ? 'Team Player' : 'Free Agent'}
            </Text>
            {player?.footed && ( // ✅ was preferredFoot → now footed
              <Text style={heroStyles.footTxt}> · {player.footed}-footed</Text>
            )}
          </View>

          {/* Attr pills — your model has no pace/finishing/pressing
              so show goals/assists/matches instead */}
          <View style={heroStyles.pillsRow}>
            <View style={heroStyles.pill}>
              <Text style={heroStyles.pillLbl}>GOL</Text>
              <Text style={heroStyles.pillVal}>{player?.goals ?? 0}</Text>
            </View>
            <View style={heroStyles.pill}>
              <Text style={heroStyles.pillLbl}>AST</Text>
              <Text style={heroStyles.pillVal}>{player?.assists ?? 0}</Text>
            </View>
            <View style={heroStyles.pill}>
              <Text style={heroStyles.pillLbl}>MP</Text>
              <Text style={heroStyles.pillVal}>
                {player?.matchesPlayed ?? 0}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

const heroStyles = StyleSheet.create({
  card: {
    backgroundColor: C.cardBg,
    marginHorizontal: s(16),
    marginTop: vs(14),
    marginBottom: vs(4),
    borderRadius: R.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.borderBlue,
    shadowColor: C.blue,
    shadowOffset: {width: 0, height: vs(4)},
    shadowOpacity: 0.12,
    shadowRadius: ms(12),
    elevation: 5,
  },
  topStrip: {
    height: vs(5),
    backgroundColor: C.blue,
  },

  body: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: s(18),
    gap: s(16),
  },
  avatarWrap: {
    alignItems: 'center',
    gap: vs(8),
  },
  avatar: {
    width: s(74),
    height: s(74),
    borderRadius: s(37),
  },
  avatarFallback: {
    width: s(74),
    height: s(74),
    borderRadius: s(37),
    backgroundColor: C.blue,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: C.borderBlue,
  },
  avatarLetter: {color: C.textWhite, fontSize: ms(28), fontWeight: '900'},
  posBadge: {
    backgroundColor: C.blue,
    paddingHorizontal: s(10),
    paddingVertical: vs(3),
    borderRadius: R.pill,
  },
  posText: {
    color: C.textWhite,
    fontSize: rf(11),
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  infoCol: {flex: 1, paddingTop: vs(2)},
  name: {
    fontSize: ms(20),
    fontWeight: '900',
    color: C.textPrimary,
    letterSpacing: -0.3,
    marginBottom: vs(5),
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: vs(6),
    gap: s(5),
  },
  statusDot: {
    width: s(7),
    height: s(7),
    borderRadius: s(4),
  },
  dotGreen: {backgroundColor: C.green},
  dotAmber: {backgroundColor: C.amber},
  statusTxt: {fontSize: rf(12), color: C.textSecond, fontWeight: '600'},
  footTxt: {fontSize: rf(12), color: C.textMuted},
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(4),
    marginBottom: vs(10),
  },
  ratingStar: {fontSize: rf(13), color: C.amber},
  ratingVal: {fontSize: rf(12), color: C.textSecond, fontWeight: '700'},
  pillsRow: {flexDirection: 'row', gap: s(6)},
  pill: {
    alignItems: 'center',
    backgroundColor: C.blueSoft,
    borderRadius: R.sm,
    paddingHorizontal: s(10),
    paddingVertical: vs(4),
    borderWidth: 1,
    borderColor: C.borderBlue,
    minWidth: s(44),
  },
  pillLbl: {
    fontSize: rf(9),
    color: C.blue,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  pillVal: {
    fontSize: rf(13),
    fontWeight: '900',
    color: C.textPrimary,
    marginTop: vs(1),
  },
});

// ─────────────────────────────────────────────
// INCOMPLETE WARNING
// ─────────────────────────────────────────────
function IncompleteWarning({onPress}) {
  return (
    <View style={warnStyles.container}>
      <View style={warnStyles.iconWrap}>
        <Text style={warnStyles.icon}>⚠️</Text>
      </View>
      <View style={warnStyles.textWrap}>
        <Text style={warnStyles.title}>Complete your profile</Text>
        <Text style={warnStyles.body}>
          Add details to join teams and tournaments.
        </Text>
      </View>
      <TouchableOpacity
        style={warnStyles.btn}
        onPress={onPress}
        activeOpacity={0.8}>
        <Text style={warnStyles.btnTxt}>Fix →</Text>
      </TouchableOpacity>
    </View>
  );
}

const warnStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.warnBg,
    borderWidth: 1,
    borderColor: '#FDBA74',
    borderRadius: R.lg,
    marginHorizontal: s(16),
    marginBottom: vs(10),
    padding: s(14),
    gap: s(10),
    borderLeftWidth: 4,
    borderLeftColor: C.warnBorder,
  },
  iconWrap: {
    width: s(36),
    height: s(36),
    borderRadius: R.md,
    backgroundColor: '#FED7AA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {fontSize: ms(16)},
  textWrap: {flex: 1},
  title: {fontSize: rf(13), fontWeight: '800', color: C.warnText},
  body: {
    fontSize: rf(11),
    color: '#C2410C',
    marginTop: vs(2),
    lineHeight: vs(16),
  },
  btn: {
    backgroundColor: C.warnBorder,
    paddingHorizontal: s(14),
    paddingVertical: vs(8),
    borderRadius: R.md,
  },
  btnTxt: {color: '#fff', fontWeight: '800', fontSize: rf(12)},
});

// ─────────────────────────────────────────────
// SEASON CARD
// ─────────────────────────────────────────────
function SeasonCard({player, onViewStats}) {
  return (
    <View style={seasonStyles.container}>
      <View style={seasonStyles.accentBar} />
      <View style={seasonStyles.inner}>
        <View style={seasonStyles.left}>
          <View style={seasonStyles.iconWrap}>
            <Text style={seasonStyles.icon}>📈</Text>
          </View>
          <View>
            <Text style={seasonStyles.title}>This season</Text>
            <View style={seasonStyles.statsRow}>
              <Text style={seasonStyles.statNum}>
                {player?.matchesPlayed ?? 0}
              </Text>
              <Text style={seasonStyles.statLbl}> matches</Text>
              <Text style={seasonStyles.sep}>·</Text>
              <Text style={[seasonStyles.statNum, seasonStyles.statAccent]}>
                {player?.goals ?? 0}
              </Text>
              <Text style={seasonStyles.statLbl}> goals</Text>
              <Text style={seasonStyles.sep}>·</Text>
              <Text style={seasonStyles.statNum}>{player?.assists ?? 0}</Text>
              <Text style={seasonStyles.statLbl}> assists</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity
          style={seasonStyles.btn}
          onPress={onViewStats}
          activeOpacity={0.8}>
          <Text style={seasonStyles.btnTxt}>View stats →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const seasonStyles = StyleSheet.create({
  container: {
    backgroundColor: C.cardBg,
    marginHorizontal: s(16),
    marginBottom: vs(10),
    borderRadius: R.lg,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
    flexDirection: 'row',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  accentBar: {width: s(4), backgroundColor: C.blue},
  inner: {
    flex: 1,
    padding: s(14),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: {flexDirection: 'row', alignItems: 'center', gap: s(12), flex: 1},
  iconWrap: {
    width: s(40),
    height: s(40),
    borderRadius: R.md,
    backgroundColor: C.blueSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {fontSize: ms(18)},
  title: {
    fontSize: rf(13),
    fontWeight: '800',
    color: C.textPrimary,
    marginBottom: vs(4),
  },
  statsRow: {flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap'},
  statNum: {fontSize: rf(14), fontWeight: '900', color: C.textPrimary},
  statAccent: {color: C.blue},
  statLbl: {fontSize: rf(12), color: C.textSecond},
  sep: {fontSize: rf(12), color: C.textMuted, marginHorizontal: s(4)},
  btn: {
    backgroundColor: C.blueSoft,
    paddingHorizontal: s(12),
    paddingVertical: vs(8),
    borderRadius: R.md,
    borderWidth: 1,
    borderColor: C.borderBlue,
  },
  btnTxt: {fontSize: rf(12), fontWeight: '700', color: C.blue},
});

// ─────────────────────────────────────────────
// STAT CELL
// ─────────────────────────────────────────────
function StatCell({label, value, accent = false}) {
  const scaleAnim = useRef(new Animated.Value(0.88)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        damping: 11,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 380,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        statCellStyles.cell,
        accent && statCellStyles.cellAccent,
        {transform: [{scale: scaleAnim}], opacity: opacityAnim},
      ]}>
      {accent && <View style={statCellStyles.topBar} />}
      <Text style={[statCellStyles.val, accent && statCellStyles.valAccent]}>
        {value}
      </Text>
      <Text style={statCellStyles.lbl}>{label}</Text>
    </Animated.View>
  );
}

const statCellStyles = StyleSheet.create({
  cell: {
    width: '30.5%',
    backgroundColor: C.cardAlt,
    borderRadius: R.md,
    padding: s(12),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
  },
  cellAccent: {backgroundColor: C.blueSoft, borderColor: C.borderBlue},
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: vs(3),
    backgroundColor: C.blue,
  },
  val: {
    fontSize: ms(24),
    fontWeight: '900',
    color: C.textPrimary,
    letterSpacing: -0.5,
  },
  valAccent: {color: C.blue},
  lbl: {
    fontSize: rf(10),
    color: C.textSecond,
    marginTop: vs(3),
    textAlign: 'center',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
});

// ─────────────────────────────────────────────
// KEY NUMBERS CARD
// ─────────────────────────────────────────────
function KeyNumbersCard({player}) {
  return (
    <View style={keyStyles.container}>
      <View style={keyStyles.header}>
        <View>
          <Text style={keyStyles.title}>Key numbers</Text>
          <Text style={keyStyles.subtitle}>All competitions</Text>
        </View>
        <View style={keyStyles.per90}>
          <Text style={keyStyles.per90Txt}>Per 90</Text>
        </View>
      </View>
      <View style={keyStyles.grid}>
        <StatCell label="Goals" value={player?.goals ?? 0} accent />
        <StatCell label="Assists" value={player?.assists ?? 0} accent />
        <StatCell label="Matches" value={player?.matchesPlayed ?? 0} />
        <StatCell label="Shots on target" value={player?.shotsOnTarget ?? 0} />
        <StatCell label="Clean sheets" value={player?.cleanSheets ?? 0} />
        <StatCell label="Yellow cards" value={player?.yellowCards ?? 0} />
      </View>
      <View style={keyStyles.tagRow}>
        <View style={keyStyles.tagBlue}>
          <Text style={keyStyles.tagBlueTxt}>
            {player?.teamId ? '⚡ Team Player' : '🆓 Free Agent'}
          </Text>
        </View>
        {player?.position && (
          <View style={keyStyles.tagGreen}>
            <Text style={keyStyles.tagGreenTxt}>
              🎯 {player.position} specialist
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const keyStyles = StyleSheet.create({
  container: {
    backgroundColor: C.cardBg,
    marginHorizontal: s(16),
    marginBottom: vs(10),
    padding: s(16),
    borderRadius: R.lg,
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
    alignItems: 'flex-start',
    marginBottom: vs(14),
  },
  title: {
    fontSize: rf(16),
    fontWeight: '900',
    color: C.textPrimary,
    letterSpacing: -0.2,
  },
  subtitle: {fontSize: rf(11), color: C.textMuted, marginTop: vs(2)},
  per90: {
    backgroundColor: C.cardAlt,
    paddingHorizontal: s(10),
    paddingVertical: vs(5),
    borderRadius: R.sm,
    borderWidth: 1,
    borderColor: C.border,
  },
  per90Txt: {fontSize: rf(11), fontWeight: '700', color: C.textSecond},
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: s(8),
    marginBottom: vs(14),
  },
  tagRow: {flexDirection: 'row', flexWrap: 'wrap', gap: s(8)},
  tagBlue: {
    backgroundColor: C.blueSoft,
    paddingHorizontal: s(12),
    paddingVertical: vs(6),
    borderRadius: R.pill,
    borderWidth: 1,
    borderColor: C.borderBlue,
  },
  tagBlueTxt: {fontSize: rf(12), color: C.blue, fontWeight: '700'},
  tagGreen: {
    backgroundColor: C.greenBg,
    paddingHorizontal: s(12),
    paddingVertical: vs(6),
    borderRadius: R.pill,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  tagGreenTxt: {fontSize: rf(12), color: '#065F46', fontWeight: '700'},
});

// ─────────────────────────────────────────────
// ACTION CARD
// ─────────────────────────────────────────────
function ActionCard({emoji, label, onPress, primary = false}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const onPressIn = () =>
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      damping: 10,
    }).start();
  const onPressOut = () =>
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      damping: 12,
    }).start();

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      activeOpacity={1}
      style={actionStyles.wrap}>
      <Animated.View
        style={[
          actionStyles.card,
          primary && actionStyles.cardPrimary,
          {transform: [{scale: scaleAnim}]},
        ]}>
        <View
          style={[
            actionStyles.iconWrap,
            primary && actionStyles.iconWrapPrimary,
          ]}>
          <Text style={actionStyles.emoji}>{emoji}</Text>
        </View>
        <Text
          style={[actionStyles.label, primary && actionStyles.labelPrimary]}>
          {label}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

const actionStyles = StyleSheet.create({
  wrap: {width: '47%'},
  card: {
    backgroundColor: C.cardAlt,
    borderRadius: R.lg,
    paddingVertical: vs(16),
    paddingHorizontal: s(14),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
    gap: vs(8),
  },
  cardPrimary: {backgroundColor: C.blue, borderColor: C.blue},
  iconWrap: {
    width: s(44),
    height: s(44),
    borderRadius: R.md,
    backgroundColor: C.blueSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapPrimary: {backgroundColor: 'rgba(255,255,255,0.2)'},
  emoji: {fontSize: ms(22)},
  label: {
    fontWeight: '700',
    color: C.textPrimary,
    fontSize: rf(13),
    textAlign: 'center',
  },
  labelPrimary: {color: C.textWhite},
});

// ─────────────────────────────────────────────
// QUICK ACTIONS CARD
// ─────────────────────────────────────────────
function QuickActionsCard({player, nav}) {
  return (
    <View style={quickStyles.container}>
      <View style={quickStyles.header}>
        <Text style={quickStyles.title}>Quick actions</Text>
        <Text style={quickStyles.subtitle}>Jump to a section</Text>
      </View>
      <View style={quickStyles.grid}>
        <ActionCard
          emoji="⚽"
          label="My Matches"
          onPress={() => nav.toMatch('MyMatches')}
          primary
        />
        <ActionCard
          emoji="📊"
          label="My Stats"
          onPress={() => nav.toProfile('PlayerStats', {playerId: player?._id})}
        />
        <ActionCard
          emoji="✏️"
          label="Edit Profile"
          onPress={() => nav.toProfile('PlayerProfileEdit')}
        />
        <ActionCard
          emoji="🏆"
          label="Tournaments"
          onPress={() => nav.toTournament('JoinTournament')}
        />
      </View>
    </View>
  );
}

const quickStyles = StyleSheet.create({
  container: {
    backgroundColor: C.cardBg,
    marginHorizontal: s(16),
    marginBottom: vs(10),
    padding: s(16),
    borderRadius: R.lg,
    borderWidth: 1,
    borderColor: C.border,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  header: {marginBottom: vs(14)},
  title: {
    fontSize: rf(16),
    fontWeight: '900',
    color: C.textPrimary,
    letterSpacing: -0.2,
  },
  subtitle: {fontSize: rf(11), color: C.textMuted, marginTop: vs(2)},
  grid: {flexDirection: 'row', flexWrap: 'wrap', gap: s(10)},
});

// ─────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────
export default function PlayerHome() {
  const nav = useNavigationHelper();
  const isFocused = useIsFocused();
  const [loading, setLoading] = useState(true);
  const [isProfileCompleted, setIsProfileCompleted] = useState(false);
  const [player, setPlayer] = useState(null);
  const [user, setUser] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (isFocused) fetchPlayerDetails();
  }, [isFocused]);

  const fetchPlayerDetails = async () => {
    try {
      const res = await API.get('/api/player/me');
      setIsProfileCompleted(res.data.isProfileCompleted);
      setUser(res.data.user);
      setPlayer(res.data.player);
    } catch (err) {
      console.log('PLAYER HOME ERROR:', err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchPlayerDetails();
    } catch (e) {
      console.log('Refresh error', e);
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <MainLayout title="Player Profile">
        <View style={screenStyles.center}>
          <ActivityIndicator size="large" color={C.blue} />
          <Text style={screenStyles.loadingTxt}>Loading your profile…</Text>
        </View>
      </MainLayout>
    );
  }

  return (
    <AppRefreshView
      refreshing={refreshing}
      onRefresh={onRefresh}
      style={screenStyles.root}>
      <MainLayout title="Player Profile">
        <ScrollView
          contentContainerStyle={screenStyles.scroll}
          showsVerticalScrollIndicator={false}>
          <HeroCard player={player} user={user} />
          <View style={screenStyles.body}>
            {!isProfileCompleted && (
              <IncompleteWarning
                onPress={() => nav.toProfile('PlayerProfileEdit')}
              />
            )}
            <SeasonCard
              player={player}
              onViewStats={() =>
                nav.toProfile('PlayerStats', {playerId: player?._id})
              }
            />
            <KeyNumbersCard player={player} />
            <QuickActionsCard player={player} nav={nav} />
            <View style={{height: vs(24)}} />
          </View>
        </ScrollView>
      </MainLayout>
    </AppRefreshView>
  );
}

const screenStyles = StyleSheet.create({
  root: {flex: 1, backgroundColor: C.pageBg},
  scroll: {backgroundColor: C.pageBg, paddingBottom: vs(40)},
  body: {paddingTop: vs(14)},
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: C.pageBg,
    gap: vs(10),
  },
  loadingTxt: {fontSize: rf(13), color: C.textSecond, fontWeight: '500'},
});
