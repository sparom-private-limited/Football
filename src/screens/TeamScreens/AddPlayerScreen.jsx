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
} from 'react-native';
import MainLayout from '../../components/MainLayout';
import API from '../../api/api';
import {useNavigation, useRoute} from '@react-navigation/native';
import useNavigationHelper from '../../navigation/Navigationhelper';

export default function AddPlayerScreen() {
  const [query, setQuery] = useState('');
  const [positionFilter, setPositionFilter] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addingId, setAddingId] = useState(null);
  const nav = useNavigationHelper();
  const route = useRoute();

  useEffect(() => {
    // initial load: show popular free agents or empty
    search('');
  }, []);

  const search = async (q = query) => {
    setLoading(true);
    try {
      const res = await API.get('/api/player/search', {
        params: {q, position: positionFilter},
      });
      // filter free agents just in case
      const freeAgents = res.data.filter(p => p.isFreeAgent !== false);
      setResults(freeAgents);
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
      nav.to('MainTabs', {
        screen: 'TeamHome',
      });
    } catch (err) {
      Alert.alert(
        'Error',
        err.response?.data?.message || 'Failed to add player',
      );
    } finally {
      setAddingId(null);
    }
  };

  const renderItem = ({item}) => (
    <View style={styles.playerCard}>
      <Image source={{uri: item.profileImageUrl}} style={styles.playerImg} />
      <View style={{flex: 1, marginLeft: 12}}>
        <Text style={styles.playerName}>{item.name}</Text>
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

  return (
    <MainLayout scroll={false}>
      <View style={styles.container}>
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
            <Text style={{color: '#fff', fontWeight: '700'}}>Search</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator style={{marginTop: 20}} color="#1D4ED8" />
        ) : (
          <FlatList
            data={results}
            keyExtractor={i => i._id}
            renderItem={renderItem}
            ListEmptyComponent={
              <Text style={{marginTop: 20, color: '#475569'}}>
                No free agents found
              </Text>
            }
            style={{marginTop: 12}}
            nestedScrollEnabled={true} // ✅ FIX
          />
        )}
      </View>
    </MainLayout>
  );
}

const styles = StyleSheet.create({
  container: {padding: 20, backgroundColor: '#fff', flex: 1},
  title: {fontSize: 22, fontWeight: '700', marginBottom: 12, color: '#0F172A'},

  row: {flexDirection: 'row', alignItems: 'center'},
  searchInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    color: '#0F172A', // 👈 text color (important)
    fontSize: 15,
  },

  searchBtn: {
    marginLeft: 10,
    backgroundColor: '#1D4ED8',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
  },

  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 1,
  },
  playerImg: {width: 56, height: 56, borderRadius: 30},
  playerName: {fontSize: 16, fontWeight: '700', color: '#0F172A'},
  playerMeta: {color: '#475569', marginTop: 4},
  addBtn: {
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addText: {color: '#fff', fontWeight: '700'},
});
