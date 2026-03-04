import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
} from 'react-native';
import API from '../../api/api';
import MainLayout from '../../components/MainLayout';
import DateTimePicker from '@react-native-community/datetimepicker';
import {s, vs, ms, rf} from '../../utils/responsive';
import useNavigationHelper from '../../navigation/Navigationhelper';

function useDebouncedEffect(effect, deps, delay) {
  useEffect(() => {
    const handler = setTimeout(() => effect(), delay);
    return () => clearTimeout(handler);
  }, [...deps, delay]);
}

export default function JoinTournamentScreen() {
  const nav = useNavigationHelper();
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [fromDate, setFromDate] = useState('');

  const [tournaments, setTournaments] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const hasActiveFilters = query || location || fromDate;

  const handleReset = () => {
    setQuery('');
    setLocation('');
    setFromDate('');
    setPage(1);
    setHasMore(true);
    fetchData(1, false);
  };

  const openDatePicker = () => {
    if (showDatePicker) return;
    setShowDatePicker(true);
  };

  const formatLocalDate = date => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const formatDisplayDate = dateStr => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const onDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (!selectedDate || event?.type === 'dismissed') return;
    setFromDate(formatLocalDate(selectedDate));
  };

  /* ── FETCH ── */
  const fetchData = async (pageNo = 1, append = false) => {
    try {
      pageNo === 1 ? setLoading(true) : setLoadingMore(true);

      const res = await API.get('/api/tournament/open/search', {
        params: {q: query, location, fromDate, page: pageNo, limit: 10},
      });

      const {data, pagination} = res.data;
      setTournaments(prev => (append ? [...prev, ...data] : data));
      setHasMore(pagination.hasMore);
      setPage(pageNo);
    } catch (e) {
      if (!append) setTournaments([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  useDebouncedEffect(() => fetchData(1, false), [query, location, fromDate], 500);

  const loadMore = () => {
    if (loadingMore || !hasMore) return;
    fetchData(page + 1, true);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData(1, false);
  };

  /* ── JOIN ── */
  const handleJoin = async tournamentId => {
    try {
      await API.post(`/api/tournament/${tournamentId}/join`);
      setTournaments(prev =>
        prev.map(t => (t._id === tournamentId ? {...t, joined: true} : t)),
      );
      Alert.alert('Joined! 🎉', 'You have successfully joined the tournament.', [
        {text: 'View Tournament', onPress: () => nav.toTournament('TeamTournamentDetail', {tournamentId})},
        {text: 'Stay Here', style: 'cancel'},
      ]);
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to join';
      if (err.response?.status === 400 && message.includes('already')) {
        nav.toTournament('TeamTournamentDetail', {tournamentId});
        return;
      }
      Alert.alert('Error', message);
    }
  };

  /* ── RENDER CARD ── */
  const renderItem = ({item}) => {
    const isDisabled = item.joined || item.isFull;
    const spotsLeft = item.maxTeams ? item.maxTeams - item.teams.length : null;
    const fillPct = item.maxTeams
      ? Math.min(100, (item.teams.length / item.maxTeams) * 100)
      : 0;

    const statusConfig = {
      REGISTRATION_OPEN:   {label: 'Registration open',   color: '#16A34A', bg: '#F0FDF4'},
      REGISTRATION_CLOSED: {label: 'Registration closed', color: '#92400E', bg: '#FEF9C3'},
      DRAFT:               {label: 'Draft',               color: '#475569', bg: '#F1F5F9'},
      FIXTURES_GENERATED:  {label: 'Fixtures set',        color: '#1D4ED8', bg: '#EFF6FF'},
    };
    const sc = statusConfig[item.status] || statusConfig.REGISTRATION_OPEN;

    // Early bird: registration open and less than 30% filled
    const isEarlyBird = item.status === 'REGISTRATION_OPEN' && fillPct < 30 && !item.joined;

    return (
      <View style={[styles.card, isDisabled && !item.joined && styles.cardMuted]}>
        {/* Card header */}
        <View style={styles.cardTop}>
          <Text style={styles.cardName} numberOfLines={2}>{item.name}</Text>
          <View style={styles.cardBadgeCol}>
            {item.joined ? (
              <View style={styles.joinedBadge}>
                <Text style={styles.joinedBadgeText}>✓ Joined</Text>
              </View>
            ) : isEarlyBird ? (
              <View style={styles.earlyBirdBadge}>
                <Text style={styles.earlyBirdText}>Early bird</Text>
              </View>
            ) : (
              <View style={[styles.statusBadge, {backgroundColor: sc.bg}]}>
                <Text style={[styles.statusBadgeText, {color: sc.color}]}>{sc.label}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Meta info */}
        <View style={styles.metaList}>
          <MetaRow icon="📍" text={`${item.venue || 'N/A'}`} />
          <MetaRow
            icon="📅"
            text={`${item.startDate
              ? `${item.status === 'REGISTRATION_OPEN' ? '' : 'Starts '}${new Date(item.startDate).toLocaleDateString('en-GB', {day: 'numeric', month: 'short', year: 'numeric'})}`
              : 'Date TBA'}`}
          />
          <MetaRow
            icon="👥"
            text={`${item.teams.length}${item.maxTeams ? ` / ${item.maxTeams} teams joined` : ' teams'}`}
          />
        </View>

        {/* Tags row */}
        {(item.format || item.category || item.surface) && (
          <View style={styles.tagsRow}>
            {item.format && <Tag label={item.format} />}
            {item.surface && <Tag label={item.surface} />}
            {item.category && <Tag label={item.category} />}
          </View>
        )}

        {/* Progress bar for open tournaments */}
        {item.status === 'REGISTRATION_OPEN' && item.maxTeams > 0 && (
          <View style={styles.progressWrap}>
            <View style={styles.progressBg}>
              <View style={[
                styles.progressFill,
                {width: `${fillPct}%`, backgroundColor: fillPct > 80 ? '#EF4444' : '#2563EB'},
              ]} />
            </View>
            <Text style={styles.progressLabel}>
              {spotsLeft > 0 ? `${spotsLeft} spots left` : 'Full'}
            </Text>
          </View>
        )}

        {/* CTA */}
        {item.joined ? (
          <TouchableOpacity
            style={styles.viewBtn}
            onPress={() => nav.toTournament('TeamTournamentDetail', {tournamentId: item._id})}>
            <Text style={styles.viewBtnText}>View Tournament →</Text>
          </TouchableOpacity>
        ) : item.isFull ? (
          <View style={styles.fullBtn}>
            <Text style={styles.fullBtnText}>Full</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.joinBtn}
            onPress={() => handleJoin(item._id)}
            activeOpacity={0.85}>
            <Text style={styles.joinBtnText}>Join</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <MainLayout title="Join Tournament" forceBack>
      <FlatList
        data={tournaments}
        keyExtractor={item => item._id}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        refreshing={refreshing}
        onRefresh={onRefresh}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* ── SEARCH BAR ── */}
            <View style={styles.searchBar}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search tournament"
                placeholderTextColor="#94A3B8"
                style={styles.searchInput}
              />
              {query.length > 0 && (
                <TouchableOpacity onPress={() => setQuery('')}>
                  <Text style={styles.searchClear}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* ── FILTER CHIPS ── */}
            <View style={styles.filtersRow}>
              {/* Location chip */}
              <View style={[styles.filterChip, location && styles.filterChipActive]}>
                <TextInput
                  value={location}
                  onChangeText={setLocation}
                  placeholder="Location"
                  placeholderTextColor={location ? '#1D4ED8' : '#94A3B8'}
                  style={[styles.filterChipInput, location && {color: '#1D4ED8'}]}
                />
              </View>

              {/* Date chip */}
              <TouchableOpacity
                style={[styles.filterChip, fromDate && styles.filterChipActive]}
                onPress={openDatePicker}>
                <Text style={[styles.filterChipText, fromDate && styles.filterChipTextActive]}>
                  {fromDate ? formatDisplayDate(fromDate) : 'Start after'}
                </Text>
              </TouchableOpacity>

              {/* Reset */}
              {hasActiveFilters && (
                <TouchableOpacity style={styles.resetChip} onPress={handleReset}>
                  <Text style={styles.resetChipText}>Reset filters</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* ── RESULTS HEADER ── */}
            {!loading && (
              <View style={styles.resultsHeader}>
                <Text style={styles.resultsTitle}>Available tournaments</Text>
                <Text style={styles.resultsCount}>
                  {tournaments.length} result{tournaments.length !== 1 ? 's' : ''}
                </Text>
              </View>
            )}

            {/* ── LOADING ── */}
            {loading && (
              <View style={styles.loadingWrap}>
                <ActivityIndicator size="large" color="#2563EB" />
                <Text style={styles.loadingText}>Finding tournaments...</Text>
              </View>
            )}
          </>
        }
        renderItem={loading ? null : renderItem}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyIcon}>🏟️</Text>
              <Text style={styles.emptyTitle}>No tournaments found</Text>
              <Text style={styles.emptySubtitle}>
                Try adjusting your search or filters
              </Text>
              {hasActiveFilters && (
                <TouchableOpacity style={styles.emptyResetBtn} onPress={handleReset}>
                  <Text style={styles.emptyResetText}>Clear filters</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : null
        }
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator size="small" color="#2563EB" style={{marginVertical: vs(16)}} />
          ) : null
        }
      />

      {showDatePicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={fromDate ? new Date(fromDate) : today}
          mode="date"
          minimumDate={today}
          display="calendar"
          onChange={onDateChange}
        />
      )}
    </MainLayout>
  );
}

/* ── Sub-components ── */

function MetaRow({icon, text}) {
  return (
    <View style={styles.metaRow}>
      <Text style={styles.metaIcon}>{icon}</Text>
      <Text style={styles.metaText}>{text}</Text>
    </View>
  );
}

function Tag({label}) {
  return (
    <View style={styles.tag}>
      <Text style={styles.tagText}>{label}</Text>
    </View>
  );
}

/* ── Styles ── */
const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: s(16),
    paddingTop: vs(14),
    paddingBottom: vs(40),
    backgroundColor: '#F8FAFC',
  },

  /* SEARCH */
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: ms(16),
    paddingHorizontal: s(14),
    paddingVertical: vs(2),
    marginBottom: vs(12),
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: {width: 0, height: vs(2)},
    elevation: 2,
    borderWidth: 1,
    borderColor: '#EEF2FF',
  },
  searchIcon: {fontSize: ms(16), marginRight: s(8)},
  searchInput: {
    flex: 1,
    fontSize: rf(15),
    color: '#0F172A',
    paddingVertical: vs(12),
    fontWeight: '500',
  },
  searchClear: {
    fontSize: ms(14),
    color: '#94A3B8',
    paddingLeft: s(6),
  },

  /* FILTER CHIPS */
  filtersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: s(8),
    marginBottom: vs(16),
    alignItems: 'center',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: ms(20),
    paddingHorizontal: s(14),
    paddingVertical: vs(8),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  filterChipInput: {
    fontSize: rf(13),
    color: '#64748B',
    fontWeight: '600',
    minWidth: s(60),
    padding: 0,
    margin: 0,
  },
  filterChipText: {
    fontSize: rf(13),
    color: '#64748B',
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#1D4ED8',
  },
  resetChip: {
    paddingHorizontal: s(12),
    paddingVertical: vs(8),
  },
  resetChipText: {
    fontSize: rf(13),
    fontWeight: '600',
    color: '#2563EB',
  },

  /* RESULTS HEADER */
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: vs(14),
  },
  resultsTitle: {
    fontSize: rf(18),
    fontWeight: '800',
    color: '#0F172A',
  },
  resultsCount: {
    fontSize: rf(13),
    color: '#94A3B8',
    fontWeight: '500',
  },

  /* LOADING */
  loadingWrap: {
    alignItems: 'center',
    paddingTop: vs(48),
    gap: vs(12),
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: rf(14),
    fontWeight: '500',
  },

  /* CARD */
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: ms(20),
    padding: s(18),
    marginBottom: vs(12),
    shadowColor: '#1E3A8A',
    shadowOffset: {width: 0, height: vs(3)},
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#EEF2FF',
  },
  cardMuted: {
    opacity: 0.6,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: vs(12),
    gap: s(10),
  },
  cardName: {
    fontSize: rf(17),
    fontWeight: '800',
    color: '#0F172A',
    flex: 1,
    lineHeight: vs(22),
  },
  cardBadgeCol: {
    alignItems: 'flex-end',
  },

  /* BADGES */
  statusBadge: {
    paddingHorizontal: s(10),
    paddingVertical: vs(4),
    borderRadius: ms(20),
  },
  statusBadgeText: {
    fontSize: rf(11),
    fontWeight: '700',
  },
  joinedBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: s(10),
    paddingVertical: vs(4),
    borderRadius: ms(20),
  },
  joinedBadgeText: {
    fontSize: rf(11),
    fontWeight: '700',
    color: '#16A34A',
  },
  earlyBirdBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: s(10),
    paddingVertical: vs(4),
    borderRadius: ms(20),
  },
  earlyBirdText: {
    fontSize: rf(11),
    fontWeight: '700',
    color: '#D97706',
  },

  /* META */
  metaList: {
    gap: vs(6),
    marginBottom: vs(10),
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(6),
  },
  metaIcon: {fontSize: ms(13)},
  metaText: {
    fontSize: rf(13),
    color: '#475569',
    fontWeight: '500',
    flex: 1,
  },

  /* TAGS */
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: s(6),
    marginBottom: vs(12),
  },
  tag: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: s(10),
    paddingVertical: vs(3),
    borderRadius: ms(20),
  },
  tagText: {
    fontSize: rf(11),
    color: '#64748B',
    fontWeight: '600',
  },

  /* PROGRESS */
  progressWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(10),
    marginBottom: vs(12),
  },
  progressBg: {
    flex: 1,
    height: vs(6),
    backgroundColor: '#EEF2FF',
    borderRadius: ms(4),
    overflow: 'hidden',
  },
  progressFill: {
    height: vs(6),
    borderRadius: ms(4),
  },
  progressLabel: {
    fontSize: rf(11),
    color: '#64748B',
    fontWeight: '600',
    width: s(56),
    textAlign: 'right',
  },

  /* BUTTONS */
  joinBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: vs(14),
    borderRadius: ms(14),
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOffset: {width: 0, height: vs(3)},
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
  },
  joinBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: rf(15),
    letterSpacing: 0.3,
  },
  viewBtn: {
    backgroundColor: '#EFF6FF',
    paddingVertical: vs(13),
    borderRadius: ms(14),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  viewBtnText: {
    color: '#1D4ED8',
    fontWeight: '700',
    fontSize: rf(14),
  },
  fullBtn: {
    backgroundColor: '#F1F5F9',
    paddingVertical: vs(13),
    borderRadius: ms(14),
    alignItems: 'center',
  },
  fullBtnText: {
    color: '#94A3B8',
    fontWeight: '700',
    fontSize: rf(14),
  },

  /* EMPTY */
  emptyWrap: {
    alignItems: 'center',
    paddingTop: vs(48),
    paddingHorizontal: s(32),
  },
  emptyIcon: {fontSize: ms(48), marginBottom: vs(12)},
  emptyTitle: {
    fontSize: rf(18),
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: vs(6),
  },
  emptySubtitle: {
    fontSize: rf(13),
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: vs(20),
    marginBottom: vs(16),
  },
  emptyResetBtn: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: s(20),
    paddingVertical: vs(10),
    borderRadius: ms(12),
  },
  emptyResetText: {
    color: '#2563EB',
    fontWeight: '700',
    fontSize: rf(13),
  },
});