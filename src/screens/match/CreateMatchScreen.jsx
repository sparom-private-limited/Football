import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';

import API from '../../api/api';
import { createMatch } from '../../api/match.api';
import useNavigationHelper from '../../navigation/Navigationhelper';
import Header from '../../components/Header/Header';


export default function CreateMatchScreen() {
  const nav = useNavigationHelper();

  const [loading, setLoading] = useState(false);

  const [opponent, setOpponent] = useState(null);
  const [homeOrAway, setHomeOrAway] = useState(null);
  const [matchType, setMatchType] = useState('Friendly');
  const [format, setFormat] = useState('5v5');
  const [venue, setVenue] = useState('');

  const [date, setDate] = useState(new Date());
  const [showDate, setShowDate] = useState(false);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const delay = setTimeout(searchTeams, 400);
    return () => clearTimeout(delay);
  }, [query]);

  const searchTeams = async () => {
    try {
      setSearching(true);
      const res = await API.get(`/api/team/search?q=${query}`);
      setResults(res.data);
      console.log('Search query:', query);
      console.log('Search results:', results);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const submit = async () => {
    if (!opponent?._id) {
      Alert.alert('Validation', 'Please select an opponent team');
      return;
    }

    if (!homeOrAway) {
      Alert.alert('Validation', 'Please select Home or Away');
      return;
    }

    setLoading(true);
    try {
      const res = await createMatch({
        opponentTeamId: opponent._id,
        scheduledAt: date,
        venue,
        format,
        matchType,
        homeOrAway,
      });

      if (!res?.data?.match?._id) {
        throw new Error('Invalid match response');
      }

      Alert.alert('Match Request Sent', 'Waiting for opponent to accept', [
        {
          text: 'OK',
          onPress: () => nav.to('MyMatches'),
        },
      ]);
    } catch (e) {
      Alert.alert(
        'Error',
        e.response?.data?.message || e.message || 'Failed to create match',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Opponent */}
      <Card title="Opponent Team">
        <TouchableOpacity
          style={styles.selector}
          onPress={() => setShowSearch(prev => !prev)}
        >
          <Text style={styles.selectorText}>
            {opponent ? opponent.teamName : 'Select Opponent Team'}
          </Text>
        </TouchableOpacity>

        {showSearch && (
          <View style={{ marginTop: 12 }}>
            <TextInput
              placeholder="Search team name..."
              placeholderTextColor="#94A3B8"
              value={query}
              onChangeText={setQuery}
              style={styles.input}
              autoFocus
            />

            {searching && <ActivityIndicator style={{ marginTop: 10 }} />}

            <FlatList
              data={results}
              keyExtractor={item => item._id}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.teamItem}
                  onPress={() => {
                    setOpponent(item);
                    setShowSearch(false);
                    setQuery('');
                    setResults([]);
                  }}
                >
                  <Text style={styles.teamName}>{item.teamName}</Text>
                  {item.location && (
                    <Text style={styles.teamLocation}>{item.location}</Text>
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                query.length >= 2 && !searching ? (
                  <Text style={styles.emptyText}>No teams found</Text>
                ) : null
              }
              style={{ maxHeight: 200 }}
            />
          </View>
        )}
      </Card>

      {/* Home / Away */}
      <Card title="Home or Away">
        <View style={styles.row}>
          {['HOME', 'AWAY'].map(v => (
            <Toggle
              key={v}
              label={v}
              active={homeOrAway === v}
              onPress={() => setHomeOrAway(v)}
            />
          ))}
        </View>
      </Card>

      {/* Match Type */}
      <Card title="Match Type">
        <View style={styles.row}>
          {['Friendly', 'Tournament', 'Practice'].map(v => (
            <Toggle
              key={v}
              label={v}
              active={matchType === v}
              onPress={() => setMatchType(v)}
            />
          ))}
        </View>
      </Card>

      {/* Format */}
      <Card title="Format">
        <View style={styles.row}>
          {['5v5', '7v7', '11v11'].map(v => (
            <Toggle
              key={v}
              label={v}
              active={format === v}
              onPress={() => setFormat(v)}
            />
          ))}
        </View>
      </Card>

      {/* Date */}
      <Card title="Date & Time">
        <TouchableOpacity
          style={styles.selector}
          onPress={() => setShowDate(true)}
        >
          <Text style={styles.selectorText}>{date.toLocaleString()}</Text>
        </TouchableOpacity>
      </Card>

      {/* Venue */}
      <Card title="Venue">
        <TextInput
          placeholder="Enter venue"
          value={venue}
          onChangeText={setVenue}
          style={styles.input}
        />
      </Card>

      {/* Submit */}
      <TouchableOpacity
        style={[styles.submitBtn, loading && { opacity: 0.6 }]}
        disabled={loading}
        onPress={submit}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitText}>Send Match Request</Text>
        )}
      </TouchableOpacity>

      {showDate && (
        <DateTimePicker
          value={date}
          mode="datetime"
          onChange={(_, d) => {
            setShowDate(false);
            if (d) setDate(d);
          }}
        />
      )}
    </View>
  );
}

/* ---------- Reusable UI ---------- */

function Card({ title, children }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Toggle({ label, active, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.toggle, active && styles.toggleActive]}
      onPress={onPress}
    >
      <Text style={[styles.toggleText, active && { color: '#fff' }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

/* ---------- Styles ---------- */

const styles = StyleSheet.create({
  container: { padding: 16 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
  },

  cardTitle: {
    fontWeight: '700',
    marginBottom: 10,
    color: '#0F172A',
  },

  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },

  selector: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 12,
  },

  selectorText: { color: '#334155', fontWeight: '600' },

  input: {
  borderWidth: 1,
  borderColor: '#E2E8F0',
  borderRadius: 10,
  padding: 12,
  color: '#0F172A',          // 👈 REQUIRED
  backgroundColor: '#fff',  // 👈 IMPORTANT
},


  toggle: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },

  toggleActive: {
    backgroundColor: '#1D4ED8',
    borderColor: '#1D4ED8',
  },

  toggleText: { fontWeight: '700', color: '#334155' },

  submitBtn: {
    marginTop: 20,
    backgroundColor: '#1D4ED8',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },

  submitText: { color: '#fff', fontWeight: '800' },

  modal: { flex: 1, padding: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 10 },

  teamItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },

  teamName: { fontWeight: '600', color: '#0F172A' },
  searchBox: {
  backgroundColor: "#F8FAFC",
  borderRadius: 12,
  padding: 12,
  marginBottom: 16,
},

teamItem: {
  paddingVertical: 12,
  borderBottomWidth: 1,
  borderColor: "#E2E8F0",
},

teamName: {
  fontWeight: "600",
  color: "#0F172A",
},

teamLocation: {
  fontSize: 12,
  color: "#64748B",
  marginTop: 2,
},

emptyText: {
  textAlign: "center",
  marginTop: 20,
  color: "#64748B",
},

});
