import React, {useEffect, useState, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  ScrollView,
} from 'react-native';
import API from '../../api/api';
import MainLayout from '../../components/MainLayout';
import useNavigationHelper from '../../navigation/Navigationhelper';
import AppRefreshView from '../../components/AppRefreshView';
import {useAuth} from '../../context/AuthContext';
import {s, vs, ms, rf} from '../../utils/responsive';

export default function OrganiserDashboardScreen() {
  const nav = useNavigationHelper();
  const {user} = useAuth();
  const isMounted = useRef(true);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tournaments, setTournaments] = useState([]);
  const [matches, setMatches] = useState([]);
  const [profileComplete, setProfileComplete] = useState(true);

  useEffect(() => {
    loadDashboard();
    return () => {isMounted.current = false;};
  }, []);

  const loadDashboard = async () => {
    try {
     const [tRes, mRes, profileRes] = await Promise.all([
      API.get('/api/organiser/tournaments').catch(err => {
        if (err.response?.status === 404) return {data: []}; // ✅ no profile yet = empty
        throw err;
      }),
      API.get('/api/organiser/getMatches').catch(err => {
        if (err.response?.status === 404) return {data: []};
        throw err;
      }),
      API.get('/api/organiser/profile/status').catch(err => {
        if (err.response?.status === 404) return {data: {complete: false}}; // ✅ treat as incomplete
        throw err;
      }),
    ]);

    if (!isMounted.current) return;

      // Priority order: LIVE > FIXTURES_GENERATED > REGISTRATION_OPEN > REGISTRATION_CLOSED > DRAFT > COMPLETED
      const PRIORITY = {
        LIVE: 0,
        FIXTURES_GENERATED: 1,
        REGISTRATION_OPEN: 2,
        REGISTRATION_CLOSED: 3,
        DRAFT: 4,
        COMPLETED: 5,
      };
      const sortedTournaments = (tRes.data || []).sort((a, b) => {
        const pa = PRIORITY[a.status] ?? 6;
        const pb = PRIORITY[b.status] ?? 6;
        if (pa !== pb) return pa - pb;
        // Within same status: most recent first
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      setTournaments(sortedTournaments);
      setMatches((mRes.data || []).filter(m => m.createdByRole === 'organiser'));
      setProfileComplete(profileRes.data.complete);
    } catch (err) {
      if (isMounted.current) {
        Alert.alert('Error', err.response?.data?.message || 'Failed to load dashboard');
      }
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  const handleAction = async url => {
    try {
      await API.post(url);
      loadDashboard();
    } catch (err) {
      if (isMounted.current) {
        Alert.alert('Error', err.response?.data?.message || 'Action failed');
      }
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  // Derived stats
  const activeTournaments = tournaments.filter(t =>
    ['REGISTRATION_OPEN', 'FIXTURES_GENERATED', 'LIVE'].includes(t.status),
  ).length;
  const totalTeams = tournaments.reduce((acc, t) => acc + (t.teams?.length || 0), 0);
  const matchesToday = matches.filter(m => {
    const d = new Date(m.scheduledAt);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  });
  const liveMatches = matches.filter(m => m.status === 'LIVE');
  const upcomingToday = matches.filter(m => {
    const d = new Date(m.scheduledAt);
    const today = new Date();
    return d.toDateString() === today.toDateString() && m.status !== 'COMPLETED';
  });

  // Organiser initials
  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'OG';

  return (
    <AppRefreshView
      refreshing={refreshing}
      onRefresh={() => loadDashboard(true)}
      style={{flex: 1}}>
      <MainLayout title="Dashboard">
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}>

          {/* ── PROFILE INCOMPLETE BANNER ── */}
          {!profileComplete && (
            <TouchableOpacity
              style={styles.profileBanner}
              onPress={() => nav.toProfile('OrganiserProfile')}
              activeOpacity={0.85}>
              <View style={styles.profileBannerLeft}>
                <Text style={styles.profileBannerIcon}>⚠️</Text>
                <View>
                  <Text style={styles.profileBannerTitle}>Complete your profile</Text>
                  <Text style={styles.profileBannerSub}>Required to create tournaments</Text>
                </View>
              </View>
              <Text style={styles.profileBannerArrow}>→</Text>
            </TouchableOpacity>
          )}

          {/* ── STAT CARDS ROW 1 ── */}
          <View style={styles.statRow}>
            {/* Active tournaments — green large card */}
            <TouchableOpacity
              style={[styles.statCard, styles.statCardGreen]}
              onPress={() => nav.toTournament('MyTournaments')}
              activeOpacity={0.85}>
              <Text style={styles.statCardLabelLight}>Active tournaments</Text>
              <Text style={styles.statCardValueLarge}>{activeTournaments}</Text>
            </TouchableOpacity>

            {/* Matches today — white card */}
            <TouchableOpacity
              style={[styles.statCard, styles.statCardWhite]}
              activeOpacity={0.85}>
              <Text style={styles.statCardLabelDark}>Matches today</Text>
              <Text style={styles.statCardValueDark}>{matchesToday.length}</Text>
            </TouchableOpacity>
          </View>

          {/* ── STAT CARDS ROW 2 ── */}
          <View style={styles.statRow}>
            <View style={[styles.statCard, styles.statCardWhite]}>
              <View style={styles.statCardTopRow}>
                <Text style={styles.statCardLabelDark}>Registered teams</Text>
                <Text style={styles.statIcon}>🛡</Text>
              </View>
              <Text style={styles.statCardValueDark}>{totalTeams}</Text>
              <Text style={styles.statCardMeta}>across all tournaments</Text>
            </View>

            <View style={[styles.statCard, styles.statCardWhite]}>
              <View style={styles.statCardTopRow}>
                <Text style={styles.statCardLabelDark}>Tournaments</Text>
                <Text style={styles.statIcon}>🏆</Text>
              </View>
              <Text style={styles.statCardValueDark}>{tournaments.length}</Text>
              <Text style={styles.statCardMeta}>
                {tournaments.filter(t => t.status === 'DRAFT').length} drafts
              </Text>
            </View>
          </View>

          {/* ── LIVE MATCH BANNER ── */}
          {liveMatches.length > 0 && (
            <TouchableOpacity
              style={styles.liveBanner}
              onPress={() => nav.toMatch('MatchConsole', {matchId: liveMatches[0]._id})}
              activeOpacity={0.9}>
              <View style={styles.liveBannerTop}>
                <View style={styles.livePillSmall}>
                  <View style={styles.liveDotSmall} />
                  <Text style={styles.livePillText}>Live now</Text>
                </View>
                <View style={styles.liveDivider} />
              </View>
              <View style={styles.liveBannerBody}>
                <View>
                  <Text style={styles.liveMatchTitle}>
                    {liveMatches[0].homeTeam?.teamName} vs {liveMatches[0].awayTeam?.teamName}
                  </Text>
                  <Text style={styles.liveMatchMeta}>
                    {liveMatches[0].tournamentName || 'Friendly'} · {liveMatches[0].venue || 'Venue'}
                  </Text>
                </View>
                <Text style={styles.liveScore}>
                  {liveMatches[0].score?.home ?? 0} - {liveMatches[0].score?.away ?? 0}
                </Text>
              </View>
            </TouchableOpacity>
          )}

          {/* ── TODAY'S SCHEDULE ── */}
          {upcomingToday.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Today's schedule</Text>
                <TouchableOpacity onPress={() => nav.toTournament('MyTournaments')}>
                  <Text style={styles.viewAllLink}>View full schedule</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.scheduleCard}>
                {upcomingToday.slice(0, 4).map((m, i) => (
                  <TouchableOpacity
                    key={m._id}
                    style={[
                      styles.scheduleRow,
                      i === Math.min(upcomingToday.length, 4) - 1 && {borderBottomWidth: 0},
                    ]}
                    onPress={() => nav.toMatch('MatchDetail', {matchId: m._id})}
                    activeOpacity={0.7}>
                    <View style={styles.scheduleLeft}>
                      <Text style={styles.scheduleMatchName} numberOfLines={1}>
                        {m.tournamentName || 'Match'}{m.round ? ` · ${m.round}` : ''}
                      </Text>
                      <Text style={styles.scheduleTeams} numberOfLines={1}>
                        {m.homeTeam?.teamName} vs {m.awayTeam?.teamName}
                      </Text>
                    </View>
                    <Text style={styles.scheduleTime}>
                      Today · {new Date(m.scheduledAt).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* ── MY TOURNAMENTS ── */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>My tournaments</Text>
              <TouchableOpacity onPress={() => nav.toTournament('MyTournaments')}>
                <Text style={styles.viewAllLink}>Manage</Text>
              </TouchableOpacity>
            </View>

            {/* Create button always visible */}
            <TouchableOpacity
              style={[styles.createBtn, !profileComplete && styles.createBtnDisabled]}
              onPress={() => {
                if (!profileComplete) {
                  Alert.alert('Profile Incomplete', 'Please complete your profile first.');
                  return;
                }
                nav.toTournament('CreateTournament');
              }}
              activeOpacity={0.85}>
              <Text style={styles.createBtnPlus}>+</Text>
              <Text style={styles.createBtnText}>Create new tournament</Text>
            </TouchableOpacity>

            {tournaments.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyIcon}>🏟️</Text>
                <Text style={styles.emptyTitle}>No tournaments yet</Text>
                <Text style={styles.emptySubtitle}>Create your first to get started</Text>
              </View>
            ) : (
              <>
                {tournaments.slice(0, 6).map((item, index) => (
                  <TournamentCard
                    key={item._id}
                    item={item}
                    index={index}
                    onPress={() =>
                      nav.toTournament('TournamentDetail', {tournamentId: item._id})
                    }
                  />
                ))}
                {tournaments.length > 6 && (
                  <TouchableOpacity
                    style={styles.viewAllCard}
                    onPress={() => nav.toTournament('MyTournaments')}
                    activeOpacity={0.8}>
                    <Text style={styles.viewAllCardText}>
                      +{tournaments.length - 6} more tournaments
                    </Text>
                    <Text style={styles.viewAllCardArrow}>View all →</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>

        </ScrollView>
      </MainLayout>
    </AppRefreshView>
  );
}

/* ─── Sub-components ─── */

function TournamentCard({item, onPress, index}) {
  const statusConfig = {
    DRAFT:               {label: 'Draft',               color: '#64748B', bg: '#F1F5F9', accent: '#CBD5E1'},
    REGISTRATION_OPEN:   {label: 'Registration open',   color: '#1D4ED8', bg: '#EFF6FF', accent: '#2563EB'},
    REGISTRATION_CLOSED: {label: 'Reg. closed',         color: '#92400E', bg: '#FEF9C3', accent: '#F59E0B'},
    FIXTURES_GENERATED:  {label: 'Fixtures set',        color: '#1D4ED8', bg: '#DBEAFE', accent: '#3B82F6'},
    LIVE:                {label: 'Live',                 color: '#DC2626', bg: '#FEF2F2', accent: '#EF4444'},
    COMPLETED:           {label: 'Completed',            color: '#475569', bg: '#F1F5F9', accent: '#94A3B8'},
  };
  const sc = statusConfig[item.status] || statusConfig.DRAFT;
  const isLive = item.status === 'LIVE';

  return (
    <TouchableOpacity
      style={[styles.tCard, isLive && styles.tCardLive]}
      onPress={onPress}
      activeOpacity={0.85}>
      <View style={[styles.tCardAccent, {backgroundColor: sc.accent}]} />

      <View style={styles.tCardContent}>
        <View style={styles.tCardTop}>
          <View style={styles.tCardTitleRow}>
            {isLive && <View style={styles.tLiveDot} />}
            <Text style={[styles.tCardName, isLive && {color: '#DC2626'}]} numberOfLines={1}>
              {item.name}
            </Text>
          </View>
          <View style={[styles.tStatusPill, {backgroundColor: sc.bg}]}>
            <Text style={[styles.tStatusText, {color: sc.color}]}>{sc.label}</Text>
          </View>
        </View>

        <View style={styles.tCardMeta}>
          <View style={styles.tMetaItem}>
            <Text style={styles.tMetaIcon}>📅</Text>
            <Text style={styles.tMetaText}>{formatDate(item.startDate)}</Text>
          </View>
          <View style={styles.tMetaItem}>
            <Text style={styles.tMetaIcon}>👥</Text>
            <Text style={styles.tMetaText}>{item.teams?.length || 0} teams</Text>
          </View>
          <View style={styles.tMetaItem}>
            <Text style={styles.tMetaIcon}>📍</Text>
            <Text style={styles.tMetaText} numberOfLines={1}>
              {item.location || 'Venue TBA'}
            </Text>
          </View>
        </View>

        {item.status === 'REGISTRATION_OPEN' && item.maxTeams > 0 && (
          <View style={styles.tCardProgress}>
            <View style={styles.tProgressBg}>
              <View style={[
                styles.tProgressFill,
                {width: `${Math.min(100, ((item.teams?.length || 0) / item.maxTeams) * 100)}%`},
              ]} />
            </View>
            <Text style={styles.tProgressLabel}>
              {item.teams?.length || 0}/{item.maxTeams} spots
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

function formatDate(date) {
  if (!date) return 'To be scheduled';
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/* ─── Styles ─── */
const styles = StyleSheet.create({
  scroll: {backgroundColor: '#F0F4F8'},
  container: {
    paddingHorizontal: s(16),
    paddingTop: vs(16),
    paddingBottom: vs(48),
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F4F8',
  },
  loadingText: {
    marginTop: vs(10),
    color: '#94A3B8',
    fontSize: rf(14),
  },

  /* PROFILE BANNER */
  profileBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: ms(16),
    padding: s(14),
    marginBottom: vs(16),
  },
  profileBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(10),
  },
  profileBannerIcon: {fontSize: ms(20)},
  profileBannerTitle: {
    fontSize: rf(14),
    fontWeight: '700',
    color: '#92400E',
  },
  profileBannerSub: {
    fontSize: rf(12),
    color: '#B45309',
    marginTop: vs(2),
  },
  profileBannerArrow: {
    fontSize: ms(18),
    color: '#D97706',
    fontWeight: '700',
  },

  /* STAT CARDS */
  statRow: {
    flexDirection: 'row',
    gap: s(10),
    marginBottom: vs(10),
  },
  statCard: {
    flex: 1,
    borderRadius: ms(20),
    padding: s(16),
    minHeight: vs(100),
    justifyContent: 'space-between',
  },
  statCardGreen: {
    backgroundColor: '#2563EB',
    shadowColor: '#2563EB',
    shadowOffset: {width: 0, height: vs(4)},
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  statCardWhite: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: vs(2)},
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  statCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statCardLabelLight: {
    fontSize: rf(12),
    color: '#DBEAFE',
    fontWeight: '600',
  },
  statCardLabelDark: {
    fontSize: rf(12),
    color: '#94A3B8',
    fontWeight: '600',
  },
  statCardValueLarge: {
    fontSize: ms(44),
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: vs(52),
  },
  statCardValueDark: {
    fontSize: ms(30),
    fontWeight: '900',
    color: '#0F172A',
    marginTop: vs(4),
  },
  statCardMeta: {
    fontSize: rf(11),
    color: '#94A3B8',
    fontWeight: '500',
    marginTop: vs(2),
  },
  statIcon: {fontSize: ms(16)},

  /* LIVE BANNER */
  liveBanner: {
    backgroundColor: '#FEF9C3',
    borderRadius: ms(20),
    padding: s(16),
    marginBottom: vs(20),
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    shadowColor: '#F59E0B',
    shadowOffset: {width: 0, height: vs(3)},
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 3,
  },
  liveBannerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: vs(10),
    gap: s(10),
  },
  livePillSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(5),
  },
  liveDotSmall: {
    width: s(8),
    height: s(8),
    borderRadius: s(4),
    backgroundColor: '#1D4ED8',
  },
  livePillText: {
    fontSize: rf(12),
    fontWeight: '700',
    color: '#1E40AF',
  },
  liveDivider: {
    flex: 1,
    height: 1,
    backgroundColor: '#FDE68A',
  },
  liveBannerBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  liveMatchTitle: {
    fontSize: rf(16),
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: vs(3),
  },
  liveMatchMeta: {
    fontSize: rf(12),
    color: '#92400E',
    fontWeight: '500',
  },
  liveScore: {
    fontSize: ms(26),
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 1,
  },

  /* SECTION */
  section: {
    marginBottom: vs(8),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: vs(12),
  },
  sectionTitle: {
    fontSize: rf(18),
    fontWeight: '800',
    color: '#0F172A',
  },
  viewAllLink: {
    fontSize: rf(13),
    fontWeight: '600',
    color: '#64748B',
  },

  /* SCHEDULE */
  scheduleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: ms(18),
    paddingHorizontal: s(16),
    marginBottom: vs(20),
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  scheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: vs(14),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  scheduleLeft: {flex: 1, paddingRight: s(10)},
  scheduleMatchName: {
    fontSize: rf(14),
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: vs(3),
  },
  scheduleTeams: {
    fontSize: rf(12),
    color: '#64748B',
    fontWeight: '500',
  },
  scheduleTime: {
    fontSize: rf(12),
    color: '#94A3B8',
    fontWeight: '600',
  },

  /* CREATE BUTTON */
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: ms(16),
    padding: s(14),
    marginBottom: vs(12),
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    gap: s(10),
  },
  createBtnDisabled: {opacity: 0.5},
  createBtnPlus: {
    width: s(30),
    height: s(30),
    borderRadius: s(15),
    backgroundColor: '#EFF6FF',
    textAlign: 'center',
    lineHeight: vs(30),
    fontSize: ms(20),
    fontWeight: '700',
    color: '#2563EB',
    overflow: 'hidden',
  },
  createBtnText: {
    fontSize: rf(14),
    fontWeight: '700',
    color: '#2563EB',
  },

  /* TOURNAMENT CARDS */
  tCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: ms(18),
    marginBottom: vs(10),
    shadowColor: '#0F172A',
    shadowOffset: {width: 0, height: vs(2)},
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  tCardLive: {
    shadowColor: '#EF4444',
    shadowOpacity: 0.15,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  tCardAccent: {
    width: s(4),
    borderTopLeftRadius: ms(18),
    borderBottomLeftRadius: ms(18),
  },
  tCardContent: {
    flex: 1,
    padding: s(14),
  },
  tCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: vs(10),
  },
  tCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: s(8),
    gap: s(6),
  },
  tLiveDot: {
    width: s(7),
    height: s(7),
    borderRadius: s(4),
    backgroundColor: '#EF4444',
  },
  tCardName: {
    fontSize: rf(15),
    fontWeight: '800',
    color: '#0F172A',
    flex: 1,
  },
  tStatusPill: {
    paddingHorizontal: s(9),
    paddingVertical: vs(3),
    borderRadius: ms(20),
  },
  tStatusText: {
    fontSize: rf(10),
    fontWeight: '700',
  },
  tCardMeta: {
    flexDirection: 'row',
    gap: s(12),
    flexWrap: 'wrap',
  },
  tMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(3),
  },
  tMetaIcon: {fontSize: ms(10)},
  tMetaText: {
    fontSize: rf(11),
    color: '#64748B',
    fontWeight: '500',
  },
  tCardProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
    marginTop: vs(10),
  },
  tProgressBg: {
    flex: 1,
    height: vs(5),
    backgroundColor: '#EFF6FF',
    borderRadius: ms(4),
    overflow: 'hidden',
  },
  tProgressFill: {
    height: vs(5),
    backgroundColor: '#2563EB',
    borderRadius: ms(4),
  },
  tProgressLabel: {
    fontSize: rf(10),
    color: '#2563EB',
    fontWeight: '700',
    width: s(50),
  },

  /* VIEW ALL CARD */
  viewAllCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: ms(16),
    paddingHorizontal: s(16),
    paddingVertical: vs(14),
    marginBottom: vs(10),
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  viewAllCardText: {
    fontSize: rf(13),
    fontWeight: '600',
    color: '#1D4ED8',
  },
  viewAllCardArrow: {
    fontSize: rf(13),
    fontWeight: '700',
    color: '#2563EB',
  },

  /* EMPTY */
  emptyBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: ms(18),
    padding: s(28),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyIcon: {fontSize: ms(36), marginBottom: vs(10)},
  emptyTitle: {
    fontSize: rf(16),
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: vs(4),
  },
  emptySubtitle: {
    fontSize: rf(13),
    color: '#94A3B8',
    textAlign: 'center',
  },
});