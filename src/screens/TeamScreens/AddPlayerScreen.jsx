// src/screens/AddPlayerScreen.jsx
import React, {useEffect, useState, useCallback, useRef} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import MainLayout from '../../components/MainLayout';
import API from '../../api/api';
import useNavigationHelper from '../../navigation/Navigationhelper';
import {s, vs, ms, rf} from '../../utils/responsive';

export default function AddPlayerScreen() {
  const [query, setQuery] = useState('');
  const [positionFilter, setPositionFilter] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addingId, setAddingId] = useState(null);
  const nav = useNavigationHelper();

  // ✅ Debounce timer ref
  const debounceTimer = useRef(null);

  // Load all players on mount
  useEffect(() => {
    search('');
  }, []);

  // ✅ Live search — triggers on every keystroke with 300ms debounce
  useEffect(() => {
    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Set new debounced search
    debounceTimer.current = setTimeout(() => {
      search(query);
    }, 300);

    // Cleanup on unmount
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [query, positionFilter]);

  const search = async (q) => {
    setLoading(true);
    try {
      const res = await API.get('/api/player/search', {
        params: {name: q, position: positionFilter},
      });

      const players = res.data.data || [];
      setResults(players.filter(p => p.isFreeAgent !== false));
    } catch (err) {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const addPlayer = async playerId => {
    setAddingId(playerId);
    try {
      await API.post('/api/team/add-player', {playerId});
      Alert.alert('Success', 'Player added to team');
      nav.to('MainTabs', {screen: 'TeamHome'});
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to add player');
    } finally {
      setAddingId(null);
    }
  };

  const handleQueryChange = useCallback((text) => {
    setQuery(text);
  }, []);

  const renderItem = useCallback(({item}) => (
    <View style={styles.playerCard}>
      {item.profileImageUrl ? (
        <Image
          source={{uri: item.profileImageUrl}}
          style={styles.playerImg}
        />
      ) : (
        <View style={styles.playerImgFallback}>
          <Text style={styles.playerImgFallbackTxt}>
            {(item.userId?.name || item.name || '?')[0]?.toUpperCase()}
          </Text>
        </View>
      )}
      <View style={{flex: 1, marginLeft: 12}}>
        <Text style={styles.playerName}>
          {item.userId?.name || item.name || '—'}
        </Text>
        <Text style={styles.playerMeta}>
          {item.position} • {item.age || '—'} yrs • {item.footed || '—'}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.addBtn}
        onPress={() => addPlayer(item._id)}
        disabled={addingId === item._id}>
        <Text style={styles.addText}>
          {addingId === item._id ? 'Adding...' : 'Add'}
        </Text>
      </TouchableOpacity>
    </View>
  ), [addingId]);

  return (
    <MainLayout title="Add Player" scroll={false}>
      <FlatList
        data={results}
        keyExtractor={i => i._id}
        ListHeaderComponent={
          <View>
            <Text style={styles.title}>Add Player</Text>

            {/* Search input */}
            <View style={styles.searchRow}>
              <View style={styles.searchIconWrap}>
                <Text style={styles.searchIcon}>🔍</Text>
              </View>
              <TextInput
                placeholder="Search by name..."
                placeholderTextColor="#94A3B8"
                style={styles.searchInput}
                value={query}
                onChangeText={handleQueryChange}
                returnKeyType="search"
                autoCorrect={false}
              />
              {query.length > 0 && (
                <TouchableOpacity
                  style={styles.clearBtn}
                  onPress={() => setQuery('')}>
                  <Text style={styles.clearTxt}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Position filter chips */}
            <View style={styles.filterRow}>
              {['', 'GK', 'DEF', 'MID', 'FW'].map(pos => (
                <TouchableOpacity
                  key={pos}
                  style={[
                    styles.filterChip,
                    positionFilter === pos && styles.filterChipActive,
                  ]}
                  onPress={() => setPositionFilter(pos)}>
                  <Text
                    style={[
                      styles.filterChipTxt,
                      positionFilter === pos && styles.filterChipTxtActive,
                    ]}>
                    {pos || 'All'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Results count */}
            {!loading && (
              <Text style={styles.resultCount}>
                {results.length} player{results.length !== 1 ? 's' : ''} found
              </Text>
            )}

            {loading && (
              <ActivityIndicator style={{marginTop: 16, marginBottom: 8}} color="#1D4ED8" />
            )}
          </View>
        }
        renderItem={renderItem}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyIcon}>👤</Text>
              <Text style={styles.emptyTitle}>No players found</Text>
              <Text style={styles.emptySub}>
                {query ? `No results for "${query}"` : 'No free agents available'}
              </Text>
            </View>
          ) : null
        }
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      />
    </MainLayout>
  );
}

const styles = StyleSheet.create({
  container: {padding: s(16), backgroundColor: '#F1F5F9', flexGrow: 1},
  title: {fontSize: ms(22), fontWeight: '800', marginBottom: vs(14), color: '#0F172A'},

  // ✅ Search bar with icon
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: ms(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: s(12),
    marginBottom: vs(12),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  searchIconWrap: {marginRight: s(8)},
  searchIcon: {fontSize: ms(16)},
  searchInput: {
    flex: 1,
    paddingVertical: vs(13),
    color: '#0F172A',
    fontSize: rf(15),
    fontWeight: '500',
  },
  clearBtn: {
    width: s(28),
    height: s(28),
    borderRadius: s(14),
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearTxt: {fontSize: rf(12), color: '#64748B', fontWeight: '700'},

  // ✅ Position filter chips
  filterRow: {
    flexDirection: 'row',
    gap: s(8),
    marginBottom: vs(14),
  },
  filterChip: {
    paddingHorizontal: s(14),
    paddingVertical: vs(7),
    borderRadius: ms(20),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: '#1D4ED8',
    borderColor: '#1D4ED8',
  },
  filterChipTxt: {
    fontSize: rf(12),
    fontWeight: '700',
    color: '#475569',
  },
  filterChipTxtActive: {
    color: '#FFFFFF',
  },

  resultCount: {
    fontSize: rf(12),
    color: '#94A3B8',
    fontWeight: '600',
    marginBottom: vs(10),
  },

  // Player card
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: s(14),
    borderRadius: ms(14),
    marginBottom: vs(10),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  playerImg: {width: s(50), height: s(50), borderRadius: s(25)},
  playerImgFallback: {
    width: s(50),
    height: s(50),
    borderRadius: s(25),
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#DBEAFE',
  },
  playerImgFallbackTxt: {
    fontSize: rf(18),
    fontWeight: '800',
    color: '#2563EB',
  },
  playerName: {fontSize: rf(15), fontWeight: '700', color: '#0F172A'},
  playerMeta: {color: '#64748B', marginTop: vs(3), fontSize: rf(12), fontWeight: '500'},
  addBtn: {
    backgroundColor: '#10B981',
    paddingHorizontal: s(14),
    paddingVertical: vs(8),
    borderRadius: ms(10),
  },
  addText: {color: '#fff', fontWeight: '700', fontSize: rf(13)},

  // Empty state
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: vs(40),
  },
  emptyIcon: {fontSize: ms(40), marginBottom: vs(10)},
  emptyTitle: {fontSize: rf(16), fontWeight: '800', color: '#0F172A', marginBottom: vs(4)},
  emptySub: {fontSize: rf(13), color: '#94A3B8', textAlign: 'center'},
});