import React, { useEffect, useState, useRef } from 'react';
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
} from 'react-native';
import API from '../../api/api';
import MainLayout from '../../components/MainLayout';
import DateTimePicker from '@react-native-community/datetimepicker';
import {s, vs, ms, rf} from '../../utils/responsive';

const Label = ({ text }) => <Text style={styles.label}>{text}</Text>;

function useDebouncedEffect(effect, deps, delay) {
  useEffect(() => {
    const handler = setTimeout(() => {
      effect();
    }, delay);

    return () => clearTimeout(handler);
  }, [...deps, delay]);
}

export default function JoinTournamentScreen({ nav }) {
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
  const [tempDate, setTempDate] = useState(null);

  const handleReset = () => {
    setQuery('');
    setLocation('');
    setFromDate('');
    setPage(1);
    setHasMore(true);
    fetchData(1, false);
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

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

  const onDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }

    if (!selectedDate || event?.type === 'dismissed') return;

    setFromDate(formatLocalDate(selectedDate));
  };

  /* ---------------- FETCH ---------------- */

  const fetchData = async (pageNo = 1, append = false) => {
    try {
      pageNo === 1 ? setLoading(true) : setLoadingMore(true);

      const res = await API.get('/api/tournament/open/search', {
        params: {
          q: query,
          location,
          fromDate,
          page: pageNo,
          limit: 10,
        },
      });

      const { data, pagination } = res.data;

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

  /* ---------------- DEBOUNCED SEARCH ---------------- */

  useDebouncedEffect(
    () => {
      fetchData(1, false);
    },
    [query, location, fromDate],
    500,
  );

  /* ---------------- PAGINATION ---------------- */

  const loadMore = () => {
    if (loadingMore || !hasMore) return;
    fetchData(page + 1, true);
  };

  /* ---------------- PULL TO REFRESH ---------------- */

  const onRefresh = () => {
    setRefreshing(true);
    fetchData(1, false);
  };

  /* ---------------- OPTIMISTIC JOIN ---------------- */
const handleJoin = async tournamentId => {
  // optimistic UI
  setTournaments(prev =>
    prev.map(t =>
      t._id === tournamentId ? { ...t, joined: true } : t
    )
  );

  try {
    await API.post(`/api/tournament/${tournamentId}/join`);

    nav.to("TeamTournamentDetail", { tournamentId });
  } catch (err) {
    // rollback
    setTournaments(prev =>
      prev.map(t =>
        t._id === tournamentId ? { ...t, joined: false } : t
      )
    );

    Alert.alert(
      "Error",
      err.response?.data?.message || "Failed to join"
    );
  }
};


  return (
    <MainLayout title="Join Tournament" forceBack>
      <View style={styles.container}>
        {/* SEARCH */}
        <Label text="Search Tournament" />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Tournament name"
          style={styles.input}
        />

        {/* FILTERS */}
        <View style={styles.filterRow}>
          <View style={styles.filterItem}>
            <Label text="Location" />
            <TextInput
              value={location}
              onChangeText={setLocation}
              placeholder="City / Area"
              style={styles.input}
            />
          </View>

          <View style={styles.filterItem}>
            <Label text="Start After" />
            <TouchableOpacity style={styles.dateInput} onPress={openDatePicker}>
              <Text
                style={[styles.dateText, !fromDate && styles.placeholderText]}
              >
                {fromDate || 'Select start date'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.resetRow}>
          <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
            <Text style={styles.resetBtnText}>Reset Filters</Text>
          </TouchableOpacity>
        </View>

        {/* LIST */}
        {loading ? (
          <ActivityIndicator size="large" color="#2563EB" />
        ) : (
          <FlatList
            data={tournaments}
            keyExtractor={item => item._id}
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            refreshing={refreshing}
            onRefresh={onRefresh}
            ListFooterComponent={
              loadingMore ? (
                <ActivityIndicator
                  size="small"
                  color="#2563EB"
                  style={{ marginVertical: 16 }}
                />
              ) : null
            }
            renderItem={({ item }) => {
              const isDisabled = item.joined || item.isFull;

              return (
                <View style={[styles.card, isDisabled && styles.cardDisabled]}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.title}>{item.name}</Text>
                    {item.joined && (
                      <Text style={styles.joinedTag}>JOINED</Text>
                    )}
                  </View>

                  <Text style={styles.meta}>📍 {item.venue || 'N/A'}</Text>
                  <Text style={styles.meta}>
                    📅 {new Date(item.startDate).toDateString()}
                  </Text>

                  <Text style={styles.meta}>
                    👥 {item.teams.length}
                    {item.maxTeams ? ` / ${item.maxTeams} teams` : ' teams'}
                  </Text>

                  {!isDisabled && (
                    <TouchableOpacity
                      style={styles.joinBtn}
                      onPress={() => handleJoin(item._id)}
                    >
                      <Text style={styles.joinBtnText}>Join</Text>
                    </TouchableOpacity>
                  )}

                  {item.isFull && (
                    <Text style={styles.fullText}>Tournament Full</Text>
                  )}
                </View>
              );
            }}
          />
        )}
      </View>
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

// const styles = StyleSheet.create({
//   container: { padding: 16 },

//   label: {
//     fontSize: 13,
//     fontWeight: '600',
//     color: '#475569',
//     marginBottom: 6,
//   },

//   input: {
//     backgroundColor: '#F8FAFC',
//     borderRadius: 12,
//     borderWidth: 1,
//     borderColor: '#E2E8F0',
//     padding: 12,
//     marginBottom: 12,
//   },

//   filterRow: {
//     flexDirection: 'row',
//     gap: 12,
//   },

//   filterItem: {
//     flex: 1,
//   },

//   card: {
//     backgroundColor: '#FFFFFF',
//     padding: 16,
//     borderRadius: 14,
//     marginBottom: 12,
//     elevation: 2,
//   },

//   cardDisabled: {
//     opacity: 0.5,
//   },

//   cardHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//   },

//   title: {
//     fontSize: 16,
//     fontWeight: '700',
//     color: '#0F172A',
//   },

//   joinedTag: {
//     fontSize: 12,
//     fontWeight: '700',
//     color: '#16A34A',
//   },

//   meta: {
//     fontSize: 13,
//     color: '#64748B',
//     marginTop: 4,
//   },

//   joinBtn: {
//     marginTop: 10,
//     backgroundColor: '#2563EB',
//     paddingVertical: 8,
//     borderRadius: 10,
//     alignItems: 'center',
//   },

//   joinBtnText: {
//     color: '#FFFFFF',
//     fontWeight: '700',
//     fontSize: 14,
//   },

//   fullText: {
//     marginTop: 6,
//     color: '#DC2626',
//     fontSize: 12,
//     fontWeight: '600',
//   },
//   dateInput: {
//     backgroundColor: '#F8FAFC',
//     borderRadius: 12,
//     borderWidth: 1,
//     borderColor: '#E2E8F0',
//     padding: 12,
//     marginBottom: 12,
//   },

//   dateText: {
//     fontSize: 14,
//     color: '#0F172A',
//   },

//   placeholderText: {
//     color: '#94A3B8',
//   },
//   resetRow: {
//     alignItems: 'flex-end',
//     marginBottom: 8,
//   },

//   resetBtn: {
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: 8,
//     backgroundColor: '#F1F5F9',
//   },

//   resetBtnText: {
//     fontSize: 12,
//     fontWeight: '600',
//     color: '#2563EB',
//   },
// });


const styles = StyleSheet.create({
  container: { padding: s(16) },

  label: {
    fontSize: rf(13),
    fontWeight: '600',
    color: '#475569',
    marginBottom: vs(6),
  },

  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: ms(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: s(12),
    marginBottom: vs(12),
    fontSize: rf(14),
  },

  filterRow: {
    flexDirection: 'row',
    gap: s(12),
  },

  filterItem: {
    flex: 1,
  },

  card: {
    backgroundColor: '#FFFFFF',
    padding: s(16),
    borderRadius: ms(14),
    marginBottom: vs(12),
    elevation: 2,
  },

  cardDisabled: {
    opacity: 0.5,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  title: {
    fontSize: rf(16),
    fontWeight: '700',
    color: '#0F172A',
  },

  joinedTag: {
    fontSize: rf(12),
    fontWeight: '700',
    color: '#16A34A',
  },

  meta: {
    fontSize: rf(13),
    color: '#64748B',
    marginTop: vs(4),
  },

  joinBtn: {
    marginTop: vs(10),
    backgroundColor: '#2563EB',
    paddingVertical: vs(8),
    borderRadius: ms(10),
    alignItems: 'center',
  },

  joinBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: rf(14),
  },

  fullText: {
    marginTop: vs(6),
    color: '#DC2626',
    fontSize: rf(12),
    fontWeight: '600',
  },

  dateInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: ms(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: s(12),
    marginBottom: vs(12),
  },

  dateText: {
    fontSize: rf(14),
    color: '#0F172A',
  },

  placeholderText: {
    color: '#94A3B8',
  },

  resetRow: {
    alignItems: 'flex-end',
    marginBottom: vs(8),
  },

  resetBtn: {
    paddingHorizontal: s(12),
    paddingVertical: vs(6),
    borderRadius: ms(8),
    backgroundColor: '#F1F5F9',
  },

  resetBtnText: {
    fontSize: rf(12),
    fontWeight: '600',
    color: '#2563EB',
  },
});