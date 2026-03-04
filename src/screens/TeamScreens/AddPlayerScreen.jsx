// src/screens/AddPlayerScreen.jsx
import React, {useEffect, useState} from 'react';
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
  ScrollView
} from 'react-native';
import MainLayout from '../../components/MainLayout';
import API from '../../api/api';
import {useNavigation, useRoute} from '@react-navigation/native';
import useNavigationHelper from '../../navigation/Navigationhelper';
import {s, vs, ms, rf} from '../../utils/responsive';

export default function AddPlayerScreen() {
  const [query, setQuery] = useState('');
  const [positionFilter, setPositionFilter] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addingId, setAddingId] = useState(null);
  const nav = useNavigationHelper();

  useEffect(() => {
    search('');
  }, []);

  const search = async (q = query) => {
    setLoading(true);
    try {
      const res = await API.get('/api/player/search', {
        params: { q, position: positionFilter },
      });

      // ✅ Handle paginated response
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
      await API.post('/api/team/add-player', { playerId });
      Alert.alert('Success', 'Player added to team');
      nav.to('MainTabs', { screen: 'TeamHome' });
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to add player');
    } finally {
      setAddingId(null);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.playerCard}>
      <Image
        source={{ uri: item.profileImageUrl }}
        style={styles.playerImg}
      />
      <View style={{ flex: 1, marginLeft: 12 }}>
        {/* ✅ safe fallback — works whether name is on player or userId */}
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
  );

  // ✅ Header replaces ScrollView — no nesting conflict
  const ListHeader = () => (
    <View>
      <Text style={styles.title}>Add Player</Text>
      <View style={styles.row}>
        <TextInput
          placeholder="Search by name"
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => search()}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.searchBtn} onPress={() => search()}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>Search</Text>
        </TouchableOpacity>
      </View>
      {loading && (
        <ActivityIndicator style={{ marginTop: 20 }} color="#1D4ED8" />
      )}
    </View>
  );

  return (
    // ✅ scroll={false} — FlatList handles all scrolling
    <MainLayout title="Add Player" scroll={false}>
      <FlatList
        data={loading ? [] : results}
        keyExtractor={i => i._id}
        ListHeaderComponent={ListHeader}
        renderItem={renderItem}
        ListEmptyComponent={
          !loading ? (
            <Text style={{ marginTop: 20, color: '#475569', paddingHorizontal: 16 }}>
              No free agents found
            </Text>
          ) : null
        }
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      />
    </MainLayout>
  );
}

const styles = StyleSheet.create({
  container: {padding: s(20), backgroundColor: '#fff', flex: 1},
  title: {fontSize: ms(22), fontWeight: '700', marginBottom: vs(12), color: '#0F172A'},

  row: {flexDirection: 'row', alignItems: 'center'},
  searchInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: vs(12),
    paddingHorizontal: s(14),
    borderRadius: ms(10),
    borderWidth: 1,
    borderColor: '#CBD5E1',
    color: '#0F172A',
    fontSize: rf(15),
  },

  searchBtn: {
    marginLeft: s(10),
    backgroundColor: '#1D4ED8',
    paddingHorizontal: s(14),
    paddingVertical: vs(12),
    borderRadius: ms(10),
  },

  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: s(12),
    borderRadius: ms(12),
    marginBottom: vs(10),
    elevation: 1,
  },
  playerImg: {width: s(56), height: s(56), borderRadius: ms(30)},
  playerName: {fontSize: rf(16), fontWeight: '700', color: '#0F172A'},
  playerMeta: {color: '#475569', marginTop: vs(4)},
  addBtn: {
    backgroundColor: '#10B981',
    paddingHorizontal: s(12),
    paddingVertical: vs(8),
    borderRadius: ms(8),
  },
  addText: {color: '#fff', fontWeight: '700', fontSize: rf(14)},
});
