import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

import API from '../../api/api';
import { createMatch } from '../../api/match.api';
import useNavigationHelper from '../../navigation/Navigationhelper';
import MainLayout from '../../components/MainLayout';
import { s, vs, ms, rf } from '../../utils/responsive';

export default function CreateMatchScreen() {
  const nav = useNavigationHelper();

  const [loading, setLoading]         = useState(false);
  const [opponent, setOpponent]       = useState(null);
  const [homeOrAway, setHomeOrAway]   = useState('HOME');
  const [matchType, setMatchType]     = useState('Friendly');
  const [format, setFormat]           = useState('5v5');
  const [venue, setVenue]             = useState('');
  const [notes, setNotes]             = useState('');
  const [date, setDate]               = useState(new Date());
  const [showDate, setShowDate]       = useState(false);
  const [showTime, setShowTime]       = useState(false);
  const [query, setQuery]             = useState('');
  const [results, setResults]         = useState([]);
  const [searching, setSearching]     = useState(false);
  const [showSearch, setShowSearch]   = useState(false);

  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    const delay = setTimeout(searchTeams, 400);
    return () => clearTimeout(delay);
  }, [query]);

  const searchTeams = async () => {
    try {
      setSearching(true);
      const res = await API.get(`/api/team/search?q=${query}`);
      setResults(res.data);
    } catch { setResults([]); }
    finally { setSearching(false); }
  };

  const submit = async () => {
    if (!opponent?._id) { Alert.alert('Validation', 'Please select an opponent team'); return; }
    if (!homeOrAway)    { Alert.alert('Validation', 'Please select Home or Away'); return; }
    setLoading(true);
    try {
      const res = await createMatch({
        opponentTeamId: opponent._id,
        scheduledAt: date,
        venue, format, matchType, homeOrAway, notes,
      });
      if (!res?.data?.match?._id) throw new Error('Invalid match response');
      Alert.alert('Match Request Sent', 'Waiting for opponent to accept', [
        { text: 'OK', onPress: () => nav.to('MyMatches') },
      ]);
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || e.message || 'Failed to create match');
    } finally { setLoading(false); }
  };

  const formattedDate = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <MainLayout title="Create Match">
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

        {/* ── CARD 1 : Opponent & side ── */}
        <SectionCard title="Opponent & side" subtitle="Choose who you are playing and where" badge="Step 1">

          <FieldLabel>Opponent team</FieldLabel>
          <TouchableOpacity
            style={styles.selector}
            onPress={() => setShowSearch(prev => !prev)}
          >
            <Text style={[styles.selectorText, !opponent && styles.placeholderText]}>
              {opponent ? opponent.teamName : 'Select opponent team'}
            </Text>
            <Text style={styles.selectorChevron}>›</Text>
          </TouchableOpacity>
          <Text style={styles.hintText}>Pick from recent opponents or search any club.</Text>

          {/* Search dropdown */}
          {showSearch && (
            <View style={styles.searchDropdown}>
              <TextInput
                placeholder="Search team name..."
                placeholderTextColor="#94A3B8"
                value={query}
                onChangeText={setQuery}
                style={styles.searchInput}
                autoFocus
              />
              {searching && <ActivityIndicator style={{ marginTop: 10 }} color="#1D4ED8" />}
              <View style={{ maxHeight: 200 }}>
                {results.length > 0
                  ? results.map(item => (
                      <TouchableOpacity
                        key={item._id}
                        style={styles.teamItem}
                        onPress={() => {
                          setOpponent(item);
                          setShowSearch(false);
                          setQuery('');
                          setResults([]);
                        }}
                      >
                        <Text style={styles.teamName}>{item.teamName}</Text>
                        {item.location && <Text style={styles.teamLocation}>{item.location}</Text>}
                      </TouchableOpacity>
                    ))
                  : query.length >= 2 && !searching
                    ? <Text style={styles.emptyText}>No teams found</Text>
                    : null
                }
              </View>
            </View>
          )}

          <FieldLabel style={{ marginTop: 16 }}>Home or away</FieldLabel>
          <View style={styles.pillRow}>
            {['HOME', 'AWAY'].map(v => (
              <Pill key={v} label={v} active={homeOrAway === v} onPress={() => setHomeOrAway(v)} />
            ))}
          </View>

          <FieldLabel style={{ marginTop: 16 }}>Match type</FieldLabel>
          <View style={styles.pillRow}>
            {['Friendly', 'Tournament', 'Practice'].map(v => (
              <Pill key={v} label={v} active={matchType === v} onPress={() => setMatchType(v)} />
            ))}
          </View>

        </SectionCard>

        {/* ── CARD 2 : Match details ── */}
        <SectionCard title="Match details" subtitle="Kick-off, format and competition" badge="Step 2">

          <FieldLabel>Format</FieldLabel>
          <View style={styles.pillRow}>
            {['5v5', '7v7', '9v9', '11v11'].map(v => (
              <Pill key={v} label={v} active={format === v} onPress={() => setFormat(v)} />
            ))}
          </View>

          <FieldLabel style={{ marginTop: 16 }}>Date & time</FieldLabel>
          <View style={styles.dateTimeRow}>
            <TouchableOpacity
              style={styles.dateTimeBox}
              onPress={() => { setShowTime(false); setShowDate(true); }}
            >
              <View style={styles.dateTimeInner}>
                <View style={styles.dateTimeTextCol}>
                  <Text style={styles.dateTimeValue}>{formattedDate}</Text>
                  <Text style={styles.dateTimeHint}>Tap to pick date</Text>
                </View>
                <Text style={styles.dateTimeIcon}>📅</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dateTimeBox}
              onPress={() => { setShowDate(false); setShowTime(true); }}
            >
              <View style={styles.dateTimeInner}>
                <View style={styles.dateTimeTextCol}>
                  <Text style={styles.dateTimeValue}>{formattedTime}</Text>
                  <Text style={styles.dateTimeHint}>Kick-off time</Text>
                </View>
                <Text style={styles.dateTimeIcon}>🕐</Text>
              </View>
            </TouchableOpacity>
          </View>

          <FieldLabel style={{ marginTop: 16 }}>Venue</FieldLabel>
          <View style={styles.iconInputWrapper}>
            <TextInput
              placeholder="Add ground or turf name"
              placeholderTextColor="#94A3B8"
              value={venue}
              onChangeText={setVenue}
              style={styles.iconInput}
            />
            <Text style={styles.inputIcon}>📍</Text>
          </View>

        </SectionCard>

        {/* ── CARD 3 : Notes & extras ── */}
        <SectionCard title="Notes & extras" subtitle="Share details with both teams" badge="Optional">
          <FieldLabel>Match notes</FieldLabel>
          <TextInput
            placeholder={'Kit colours, rules, arrival time, parking, referee info...'}
            placeholderTextColor="#94A3B8"
            value={notes}
            onChangeText={setNotes}
            style={styles.notesInput}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </SectionCard>

        {/* ── SUBMIT ── */}
        <TouchableOpacity
          style={[styles.submitBtn, loading && { opacity: 0.6 }]}
          disabled={loading}
          onPress={submit}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.submitText}>Send Match Request</Text>
          }
        </TouchableOpacity>

        {/* Pickers */}
        {showDate && (
          <DateTimePicker
            value={date}
            mode="date"
            onChange={(_, d) => {
              setShowDate(false);
              if (d) {
                const u = new Date(date);
                u.setFullYear(d.getFullYear(), d.getMonth(), d.getDate());
                setDate(u);
              }
            }}
          />
        )}
        {showTime && (
          <DateTimePicker
            value={date}
            mode="time"
            onChange={(_, d) => {
              setShowTime(false);
              if (d) {
                const u = new Date(date);
                u.setHours(d.getHours(), d.getMinutes());
                setDate(u);
              }
            }}
          />
        )}

      </ScrollView>
    </MainLayout>
  );
}

/* ─── Reusable components ─── */

function SectionCard({ title, subtitle, badge, children }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{title}</Text>
          {subtitle ? <Text style={styles.cardSubtitle}>{subtitle}</Text> : null}
        </View>
        {badge ? (
          <View style={styles.badgePill}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ) : null}
      </View>
      {children}
    </View>
  );
}

function FieldLabel({ children, style }) {
  return <Text style={[styles.fieldLabel, style]}>{children}</Text>;
}

function Pill({ label, active, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.pill, active && styles.pillActive]}
      onPress={onPress}
    >
      <Text style={[styles.pillText, active && styles.pillTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

/* ─── Styles ─── */

// const styles = StyleSheet.create({

//   scroll: { flex: 1, backgroundColor: '#F1F5F9' },
//   container: { padding: 16, paddingBottom: 40 },

//   /* Card */
//   card: {
//     backgroundColor: '#fff',
//     borderRadius: 16,
//     padding: 16,
//     marginBottom: 14,
//   },
//   cardHeader: {
//     flexDirection: 'row',
//     alignItems: 'flex-start',
//     marginBottom: 14,
//   },
//   cardTitle: {
//     fontSize: 17,
//     fontWeight: '700',
//     color: '#0F172A',
//   },
//   cardSubtitle: {
//     fontSize: 12,
//     color: '#64748B',
//     marginTop: 2,
//   },
//   badgePill: {
//     backgroundColor: '#F1F5F9',
//     borderRadius: 20,
//     paddingHorizontal: 10,
//     paddingVertical: 4,
//     marginLeft: 8,
//     alignSelf: 'flex-start',
//   },
//   badgeText: {
//     fontSize: 11,
//     color: '#64748B',
//     fontWeight: '600',
//   },

//   /* Field label */
//   fieldLabel: {
//     fontSize: 13,
//     color: '#64748B',
//     fontWeight: '500',
//     marginBottom: 8,
//   },

//   /* Opponent selector */
//   selector: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     borderWidth: 1,
//     borderColor: '#E2E8F0',
//     borderRadius: 10,
//     paddingVertical: 14,
//     paddingHorizontal: 14,
//   },
//   selectorText: { fontSize: 15, color: '#0F172A', fontWeight: '500', flex: 1 },
//   placeholderText: { color: '#94A3B8' },
//   selectorChevron: { fontSize: 22, color: '#94A3B8' },
//   hintText: { fontSize: 12, color: '#94A3B8', marginTop: 6 },

//   /* Search */
//   searchDropdown: { marginTop: 10 },
//   searchInput: {
//     borderWidth: 1,
//     borderColor: '#E2E8F0',
//     borderRadius: 10,
//     padding: 12,
//     color: '#0F172A',
//     backgroundColor: '#F8FAFC',
//   },
//   teamItem: { paddingVertical: 12, borderBottomWidth: 1, borderColor: '#E2E8F0' },
//   teamName: { fontWeight: '600', color: '#0F172A' },
//   teamLocation: { fontSize: 12, color: '#64748B', marginTop: 2 },
//   emptyText: { textAlign: 'center', marginTop: 20, color: '#64748B' },

//   /* Pills */
//   pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
//   pill: {
//     paddingVertical: 8,
//     paddingHorizontal: 16,
//     borderRadius: 20,
//     borderWidth: 1,
//     borderColor: '#CBD5E1',
//     backgroundColor: '#fff',
//   },
//   pillActive: {
//     backgroundColor: '#1D4ED8',
//     borderColor: '#1D4ED8',
//   },
//   pillText: { fontSize: 14, fontWeight: '600', color: '#334155' },
//   pillTextActive: { color: '#fff' },

//   /* Date & Time */
//   dateTimeRow: { flexDirection: 'row', gap: 10 },
//   dateTimeBox: {
//     flex: 1,
//     borderWidth: 1,
//     borderColor: '#E2E8F0',
//     borderRadius: 10,
//     padding: 12,
//   },
//   dateTimeInner: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//   },
//   dateTimeTextCol: { flex: 1 },
//   dateTimeValue: { fontSize: 15, fontWeight: '600', color: '#0F172A' },
//   dateTimeHint: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
//   dateTimeIcon: { fontSize: 18, marginLeft: 6 },

//   /* Venue */
//   iconInputWrapper: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     borderWidth: 1,
//     borderColor: '#E2E8F0',
//     borderRadius: 10,
//     paddingHorizontal: 12,
//   },
//   iconInput: {
//     flex: 1,
//     paddingVertical: 13,
//     color: '#0F172A',
//     fontSize: 14,
//   },
//   inputIcon: { fontSize: 18, marginLeft: 6 },

//   /* Notes */
//   notesInput: {
//     borderWidth: 1,
//     borderColor: '#E2E8F0',
//     borderRadius: 10,
//     padding: 12,
//     color: '#0F172A',
//     fontSize: 14,
//     minHeight: 100,
//     backgroundColor: '#FAFAFA',
//   },

//   /* Submit */
//   submitBtn: {
//     marginTop: 8,
//     backgroundColor: '#1D4ED8',
//     paddingVertical: 16,
//     borderRadius: 14,
//     alignItems: 'center',
//   },
//   submitText: {
//     color: '#fff',
//     fontWeight: '800',
//     fontSize: 16,
//   },
// });


const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#F1F5F9' },
  container: { padding: s(16), paddingBottom: vs(40) },

  /* Card */
  card: {
    backgroundColor: '#fff',
    borderRadius: ms(16),
    padding: s(16),
    marginBottom: vs(14),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: vs(14),
  },
  cardTitle: {
    fontSize: rf(17),
    fontWeight: '700',
    color: '#0F172A',
  },
  cardSubtitle: {
    fontSize: rf(12),
    color: '#64748B',
    marginTop: vs(2),
  },
  badgePill: {
    backgroundColor: '#F1F5F9',
    borderRadius: ms(20),
    paddingHorizontal: s(10),
    paddingVertical: vs(4),
    marginLeft: s(8),
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: rf(11),
    color: '#64748B',
    fontWeight: '600',
  },

  /* Field label */
  fieldLabel: {
    fontSize: rf(13),
    color: '#64748B',
    fontWeight: '500',
    marginBottom: vs(8),
  },

  /* Opponent selector */
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: ms(10),
    paddingVertical: vs(14),
    paddingHorizontal: s(14),
  },
  selectorText: { fontSize: rf(15), color: '#0F172A', fontWeight: '500', flex: 1 },
  placeholderText: { color: '#94A3B8' },
  selectorChevron: { fontSize: ms(22), color: '#94A3B8' },
  hintText: { fontSize: rf(12), color: '#94A3B8', marginTop: vs(6) },

  /* Search */
  searchDropdown: { marginTop: vs(10) },
  searchInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: ms(10),
    padding: s(12),
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
    fontSize: rf(14),
  },
  teamItem: { paddingVertical: vs(12), borderBottomWidth: 1, borderColor: '#E2E8F0' },
  teamName: { fontWeight: '600', color: '#0F172A', fontSize: rf(14) },
  teamLocation: { fontSize: rf(12), color: '#64748B', marginTop: vs(2) },
  emptyText: { textAlign: 'center', marginTop: vs(20), color: '#64748B', fontSize: rf(14) },

  /* Pills */
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: s(8) },
  pill: {
    paddingVertical: vs(8),
    paddingHorizontal: s(16),
    borderRadius: ms(20),
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#fff',
  },
  pillActive: {
    backgroundColor: '#1D4ED8',
    borderColor: '#1D4ED8',
  },
  pillText: { fontSize: rf(14), fontWeight: '600', color: '#334155' },
  pillTextActive: { color: '#fff' },

  /* Date & Time */
  dateTimeRow: { flexDirection: 'row', gap: s(10) },
  dateTimeBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: ms(10),
    padding: s(12),
  },
  dateTimeInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateTimeTextCol: { flex: 1 },
  dateTimeValue: { fontSize: rf(15), fontWeight: '600', color: '#0F172A' },
  dateTimeHint: { fontSize: rf(11), color: '#94A3B8', marginTop: vs(2) },
  dateTimeIcon: { fontSize: ms(18), marginLeft: s(6) },

  /* Venue */
  iconInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: ms(10),
    paddingHorizontal: s(12),
  },
  iconInput: {
    flex: 1,
    paddingVertical: vs(13),
    color: '#0F172A',
    fontSize: rf(14),
  },
  inputIcon: { fontSize: ms(18), marginLeft: s(6) },

  /* Notes */
  notesInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: ms(10),
    padding: s(12),
    color: '#0F172A',
    fontSize: rf(14),
    minHeight: vs(100),
    backgroundColor: '#FAFAFA',
  },

  /* Submit */
  submitBtn: {
    marginTop: vs(8),
    backgroundColor: '#1D4ED8',
    paddingVertical: vs(16),
    borderRadius: ms(14),
    alignItems: 'center',
  },
  submitText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: rf(16),
  },
});