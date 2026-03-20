import React, {useEffect, useState, useRef} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Animated,
} from 'react-native';
import API from '../../api/api';
import MainLayout from '../../components/MainLayout';
import useNavigationHelper from '../../navigation/Navigationhelper';
import {s, vs, ms, rf} from '../../utils/responsive';

// ─── DESIGN TOKENS ───────────────────────────
const C = {
  blue:        '#2563EB',
  blueDark:    '#1D4ED8',
  blueSoft:    '#EFF6FF',
  borderBlue:  '#DBEAFE',
  pageBg:      '#F1F5F9',
  cardBg:      '#FFFFFF',
  cardAlt:     '#F8FAFC',
  textPrimary: '#0F172A',
  textSecond:  '#475569',
  textMuted:   '#94A3B8',
  textWhite:   '#FFFFFF',
  border:      '#E2E8F0',
  green:       '#22C55E',
  greenSoft:   '#F0FDF4',
  orange:      '#F97316',
  orangeSoft:  '#FFF7ED',
  red:         '#DC2626',
  redSoft:     '#FEF2F2',
  gray:        '#64748B',
  graySoft:    '#F1F5F9',
};

const R = {
  sm: ms(8), md: ms(12), lg: ms(16), xl: ms(20), pill: ms(50),
};

// ─── STATUS CONFIG ────────────────────────────
const STATUS_CONFIG = {
  DRAFT:               {label: 'Draft',               color: C.gray,   bg: C.graySoft,   emoji: '📝'},
  REGISTRATION_OPEN:   {label: 'Registration Open',   color: C.green,  bg: C.greenSoft,  emoji: '✅'},
  REGISTRATION_CLOSED: {label: 'Registration Closed', color: C.orange, bg: C.orangeSoft, emoji: '🔒'},
  FIXTURES_GENERATED:  {label: 'Fixtures Ready',      color: C.blue,   bg: C.blueSoft,   emoji: '📋'},
  LIVE:                {label: 'Live',                 color: C.red,    bg: C.redSoft,    emoji: '🔴'},
  COMPLETED:           {label: 'Completed',            color: C.gray,   bg: C.graySoft,   emoji: '🏁'},
};

// ─────────────────────────────────────────────
// STATUS BADGE
// ─────────────────────────────────────────────
function StatusBadge({status}) {
  const cfg = STATUS_CONFIG[status] || {label: status.replaceAll('_', ' '), color: C.gray, bg: C.graySoft, emoji: '•'};
  return (
    <View style={[badgeStyles.wrap, {backgroundColor: cfg.bg, borderColor: cfg.color + '30'}]}>
      <Text style={badgeStyles.emoji}>{cfg.emoji}</Text>
      <Text style={[badgeStyles.txt, {color: cfg.color}]}>{cfg.label}</Text>
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: s(10), paddingVertical: vs(4),
    borderRadius: R.pill, borderWidth: 1, gap: s(4),
  },
  emoji: {fontSize: rf(10)},
  txt:   {fontSize: rf(11), fontWeight: '800', letterSpacing: 0.2},
});

// ─────────────────────────────────────────────
// TOURNAMENT CARD
// ─────────────────────────────────────────────
function TournamentCard({item, onPress, index}) {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  {toValue: 1, duration: 350, delay: index * 60, useNativeDriver: true}),
      Animated.spring(slideAnim, {toValue: 0, damping: 14,   delay: index * 60, useNativeDriver: true}),
    ]).start();
  }, []);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const onIn  = () => Animated.spring(scaleAnim, {toValue: 0.97, useNativeDriver: true, damping: 10}).start();
  const onOut = () => Animated.spring(scaleAnim, {toValue: 1,    useNativeDriver: true, damping: 12}).start();

  const teamsJoined = item.teams?.length || 0;
  const maxTeams    = item.maxTeams || 0;
  const progress    = maxTeams > 0 ? Math.min((teamsJoined / maxTeams) * 100, 100) : 0;
  const cfg         = STATUS_CONFIG[item.status] || {};
  const isLive      = item.status === 'LIVE';
  const isOpen      = item.status === 'REGISTRATION_OPEN';

  return (
    <Animated.View style={{opacity: fadeAnim, transform: [{translateY: slideAnim}, {scale: scaleAnim}]}}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={onPress}
        onPressIn={onIn}
        onPressOut={onOut}>
        <View style={[cardStyles.card, isLive && cardStyles.cardLive]}>
          {/* Left accent bar */}
          <View style={[cardStyles.accentBar, {backgroundColor: cfg.color || C.blue}]} />

          <View style={cardStyles.inner}>
            {/* Header */}
            <View style={cardStyles.header}>
              <Text style={cardStyles.name} numberOfLines={1}>{item.name}</Text>
              <StatusBadge status={item.status} />
            </View>

            {/* Meta */}
            <View style={cardStyles.metaRow}>
              <View style={cardStyles.metaItem}>
                <Text style={cardStyles.metaIcon}>🏟️</Text>
                <Text style={cardStyles.metaTxt}>{item.format || 'League'}</Text>
              </View>
              <View style={cardStyles.metaDot} />
              <View style={cardStyles.metaItem}>
                <Text style={cardStyles.metaIcon}>🎯</Text>
                <Text style={cardStyles.metaTxt}>{item.category || 'Open'}</Text>
              </View>
              <View style={cardStyles.metaDot} />
              <View style={cardStyles.metaItem}>
                <Text style={cardStyles.metaIcon}>📅</Text>
                <Text style={cardStyles.metaTxt}>{new Date(item.createdAt).toLocaleDateString()}</Text>
              </View>
            </View>

            {/* Stats strip */}
            <View style={cardStyles.statsStrip}>
              <View style={cardStyles.statCell}>
                <Text style={cardStyles.statVal}>{teamsJoined}{maxTeams > 0 ? `/${maxTeams}` : ''}</Text>
                <Text style={cardStyles.statLbl}>Teams</Text>
              </View>
              <View style={cardStyles.statDivider} />
              <View style={cardStyles.statCell}>
                <Text style={[cardStyles.statVal, {color: cfg.color || C.blue}]}>
                  {item.status.replaceAll('_', ' ')}
                </Text>
                <Text style={cardStyles.statLbl}>Status</Text>
              </View>
              <View style={cardStyles.statDivider} />
              <View style={cardStyles.statCell}>
                <Text style={cardStyles.statVal}>{item.fixtures?.length || 0}</Text>
                <Text style={cardStyles.statLbl}>Fixtures</Text>
              </View>
            </View>

            {/* Progress bar — only when registration open */}
            {isOpen && maxTeams > 0 && (
              <View style={cardStyles.progressWrap}>
                <View style={cardStyles.progressRow}>
                  <Text style={cardStyles.progressLbl}>Registration progress</Text>
                  <Text style={cardStyles.progressPct}>{Math.round(progress)}%</Text>
                </View>
                <View style={cardStyles.progressBg}>
                  <View style={[cardStyles.progressFill, {width: `${progress}%`}]} />
                </View>
              </View>
            )}

            {/* Arrow */}
            <View style={cardStyles.footer}>
              <Text style={cardStyles.viewTxt}>View details</Text>
              <Text style={cardStyles.arrow}>→</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: C.cardBg,
    marginHorizontal: s(16),
    marginBottom: vs(12),
    borderRadius: R.lg,
    borderWidth: 1, borderColor: C.border,
    overflow: 'hidden', flexDirection: 'row',
    elevation: 2,
    shadowColor: '#000', shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06, shadowRadius: 8,
  },
  cardLive: {
    borderColor: '#FECACA',
    shadowColor: C.red,
    shadowOpacity: 0.12,
  },
  accentBar: {width: s(4)},
  inner:     {flex: 1, padding: s(16)},
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: vs(8), gap: s(8),
  },
  name: {
    fontSize: rf(16), fontWeight: '900',
    color: C.textPrimary, flex: 1, letterSpacing: -0.2,
  },
  metaRow: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: vs(12), flexWrap: 'wrap', gap: s(4),
  },
  metaItem: {flexDirection: 'row', alignItems: 'center', gap: s(3)},
  metaIcon: {fontSize: rf(11)},
  metaTxt:  {fontSize: rf(12), color: C.textSecond, fontWeight: '500'},
  metaDot:  {width: s(3), height: s(3), borderRadius: s(2), backgroundColor: C.textMuted},
  statsStrip: {
    flexDirection: 'row',
    backgroundColor: C.cardAlt,
    borderRadius: R.md,
    marginBottom: vs(10),
    borderWidth: 1, borderColor: C.border,
    overflow: 'hidden',
  },
  statCell:    {flex: 1, alignItems: 'center', paddingVertical: vs(8)},
  statDivider: {width: 1, backgroundColor: C.border},
  statVal:     {fontSize: rf(14), fontWeight: '900', color: C.textPrimary, letterSpacing: -0.2},
  statLbl:     {fontSize: rf(9), color: C.textMuted, fontWeight: '600', marginTop: vs(2), textTransform: 'uppercase', letterSpacing: 0.3},
  progressWrap:  {marginBottom: vs(10)},
  progressRow:   {flexDirection: 'row', justifyContent: 'space-between', marginBottom: vs(4)},
  progressLbl:   {fontSize: rf(11), color: C.textMuted, fontWeight: '600'},
  progressPct:   {fontSize: rf(11), color: C.blue, fontWeight: '800'},
  progressBg:    {height: vs(5), backgroundColor: C.border, borderRadius: R.pill},
  progressFill:  {height: vs(5), backgroundColor: C.blue, borderRadius: R.pill},
  footer: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'flex-end', gap: s(4),
  },
  viewTxt: {fontSize: rf(12), color: C.blue, fontWeight: '700'},
  arrow:   {fontSize: rf(14), color: C.blue},
});

// ─────────────────────────────────────────────
// EMPTY STATE
// ─────────────────────────────────────────────
function EmptyState({onPress}) {
  return (
    <View style={emptyStyles.container}>
      <View style={emptyStyles.iconWrap}>
        <Text style={emptyStyles.icon}>🏆</Text>
      </View>
      <Text style={emptyStyles.title}>No Tournaments Yet</Text>
      <Text style={emptyStyles.subtitle}>
        Create your first tournament and start managing fixtures, teams and standings.
      </Text>
      <TouchableOpacity style={emptyStyles.btn} onPress={onPress} activeOpacity={0.85}>
        <Text style={emptyStyles.btnTxt}>Create Tournament →</Text>
      </TouchableOpacity>
    </View>
  );
}

const emptyStyles = StyleSheet.create({
  container: {
    flex: 1, justifyContent: 'center',
    alignItems: 'center', padding: s(32),
  },
  iconWrap: {
    width: s(100), height: s(100), borderRadius: s(50),
    backgroundColor: C.blueSoft,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: vs(24),
    borderWidth: 2, borderColor: C.borderBlue,
    shadowColor: C.blue, shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.12, shadowRadius: 12, elevation: 4,
  },
  icon:     {fontSize: ms(44)},
  title:    {fontSize: ms(20), fontWeight: '900', color: C.textPrimary, marginBottom: vs(10), textAlign: 'center', letterSpacing: -0.3},
  subtitle: {fontSize: rf(14), color: C.textSecond, textAlign: 'center', marginBottom: vs(32), lineHeight: vs(22)},
  btn: {
    backgroundColor: C.blue,
    paddingVertical: vs(14), paddingHorizontal: s(32),
    borderRadius: R.md,
    shadowColor: C.blue, shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  btnTxt: {color: C.textWhite, fontSize: rf(15), fontWeight: '800'},
});

// ─────────────────────────────────────────────
// HEADER SUMMARY BAR
// ─────────────────────────────────────────────
function SummaryBar({tournaments}) {
  const live      = tournaments.filter(t => t.status === 'LIVE').length;
  const open      = tournaments.filter(t => t.status === 'REGISTRATION_OPEN').length;
  const completed = tournaments.filter(t => t.status === 'COMPLETED').length;

  return (
    <View style={summaryStyles.container}>
      <View style={summaryStyles.cell}>
        <Text style={summaryStyles.val}>{tournaments.length}</Text>
        <Text style={summaryStyles.lbl}>Total</Text>
      </View>
      <View style={summaryStyles.divider} />
      <View style={summaryStyles.cell}>
        <Text style={[summaryStyles.val, {color: C.red}]}>{live}</Text>
        <Text style={summaryStyles.lbl}>Live</Text>
      </View>
      <View style={summaryStyles.divider} />
      <View style={summaryStyles.cell}>
        <Text style={[summaryStyles.val, {color: C.green}]}>{open}</Text>
        <Text style={summaryStyles.lbl}>Open</Text>
      </View>
      <View style={summaryStyles.divider} />
      <View style={summaryStyles.cell}>
        <Text style={[summaryStyles.val, {color: C.gray}]}>{completed}</Text>
        <Text style={summaryStyles.lbl}>Done</Text>
      </View>
    </View>
  );
}

const summaryStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: C.cardBg,
    marginHorizontal: s(16), marginTop: vs(12), marginBottom: vs(4),
    borderRadius: R.lg,
    borderWidth: 1, borderColor: C.border,
    overflow: 'hidden',
    elevation: 1,
    shadowColor: '#000', shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.04, shadowRadius: 4,
  },
  cell:    {flex: 1, alignItems: 'center', paddingVertical: vs(12)},
  divider: {width: 1, backgroundColor: C.border},
  val:     {fontSize: ms(18), fontWeight: '900', color: C.textPrimary, letterSpacing: -0.3},
  lbl:     {fontSize: rf(10), color: C.textMuted, fontWeight: '600', marginTop: vs(2), textTransform: 'uppercase', letterSpacing: 0.3},
});

// ─────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────
export default function MyTournamentsScreen() {
  const nav             = useNavigationHelper();
  const [tournaments,   setTournaments]   = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const res    = await API.get('/api/organiser/tournaments');
      const sorted = (res.data || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setTournaments(sorted);
    } catch {
      Alert.alert('Error', 'Failed to load tournaments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleAction = async (id, action) => {
    if (actionLoading) return;
    setActionLoading(true);
    try {
      await API.post(`/api/tournament/${id}/${action}`);
      await load();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <MainLayout title="My Tournaments" forceBack>
        <View style={screenStyles.center}>
          <ActivityIndicator size="large" color={C.blue} />
          <Text style={screenStyles.loadingTxt}>Loading tournaments...</Text>
        </View>
      </MainLayout>
    );
  }

  if (tournaments.length === 0) {
    return (
      <MainLayout title="My Tournaments" forceBack>
        <EmptyState onPress={() => nav.to('CreateTournament')} />
      </MainLayout>
    );
  }

  return (
    <MainLayout title="My Tournaments" forceBack>
      <View style={screenStyles.root}>
        <FlatList
          data={tournaments}
          keyExtractor={item => item._id}
          ListHeaderComponent={<SummaryBar tournaments={tournaments} />}
          renderItem={({item, index}) => (
            <TournamentCard
              item={item}
              index={index}
              onPress={() => nav.to('TournamentDetail', {tournamentId: item._id})}
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={async () => { if (!loading) await load(); }}
              colors={[C.blue]}
              tintColor={C.blue}
            />
          }
          contentContainerStyle={screenStyles.list}
          showsVerticalScrollIndicator={false}
        />

        {/* FAB */}
        <TouchableOpacity
          style={screenStyles.fab}
          onPress={() => nav.to('CreateTournament')}
          activeOpacity={0.85}>
          <Text style={screenStyles.fabTxt}>+ Create Tournament</Text>
        </TouchableOpacity>
      </View>
    </MainLayout>
  );
}

const screenStyles = StyleSheet.create({
  root:       {flex: 1, backgroundColor: C.pageBg},
  list:       {paddingTop: vs(4), paddingBottom: vs(100)},
  center:     {flex: 1, justifyContent: 'center', alignItems: 'center', gap: vs(10)},
  loadingTxt: {fontSize: rf(13), color: C.textSecond, fontWeight: '500'},
  fab: {
    position: 'absolute',
    bottom: vs(24), left: s(16), right: s(16),
    backgroundColor: C.blue,
    paddingVertical: vs(16),
    borderRadius: R.xl,
    alignItems: 'center',
    shadowColor: C.blue,
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  fabTxt: {color: C.textWhite, fontSize: rf(15), fontWeight: '800', letterSpacing: 0.2},
});