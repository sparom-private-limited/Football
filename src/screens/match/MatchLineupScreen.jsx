import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  LayoutAnimation,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';

import Pitch from '../../components/lineup/Pitch';
import PlayerRow from '../../components/lineup/PlayerRow';
import { FORMATIONS } from '../../components/lineup/FormationMap';
import API from '../../api/api';
import { submitMatchLineup, getMatchLineups } from '../../api/match.api';
import useNavigationHelper from '../../navigation/Navigationhelper';
import MainLayout from '../../components/MainLayout';
import { s, vs, ms, rf } from '../../utils/responsive';

export default function MatchLineupScreen() {
  const route = useRoute();
const nav = useNavigationHelper();
  const matchId = route.params?.matchId;

  const [loading, setLoading] = useState(true);
  const [formation, setFormation] = useState('4-2-3-1');
  const [lineup, setLineup] = useState({});
  const [bench, setBench] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [isLocked, setIsLocked] = useState(false);

  /* ------------------ LOAD DATA ------------------ */
    const startingXI = React.useMemo(() => {
    const seen = new Set();

    return Object.values(lineup)
      .filter(Boolean)
      .filter(player => {
        if (seen.has(player._id)) return false;
        seen.add(player._id);
        return true;
      });
  }, [lineup]);

  const loadLineup = async () => {
    try {
      setLoading(true);

      const [teamRes, savedLineupRes, matchLineupsRes, matchRes] =
        await Promise.all([
          API.get('/api/team/my-team'),
          API.get('/api/team/lineup'),
          getMatchLineups(matchId),
          API.get(`/api/match/${matchId}`),
        ]);

      const team = teamRes.data;
      const teamPlayers = team.players || [];
      const match = matchRes.data;
      const resolvePlayer = (playerId, players) =>
        players.find(p => p._id === playerId) || null;

      const mySide =
        team._id === match.homeTeam?._id
          ? 'home'
          : team._id === match.awayTeam?._id
          ? 'away'
          : null;

      if (!mySide) {
        Alert.alert('Error', 'You are not part of this match');
        nav.back();
        return;
      }

      const matchLineup = matchLineupsRes.data?.[mySide] || null;
      const savedLineup = savedLineupRes.data || null;

      const hasMatchLineup =
        matchLineup && (matchLineup.formation || matchLineup.submittedAt);

      const sourceLineup = hasMatchLineup ? matchLineup : savedLineup;

      if (sourceLineup) {
        setFormation(sourceLineup.formation);

        const map = {};
        sourceLineup.starting.forEach(s => {
          if (!s.player) return;

          const playerObj =
            typeof s.player === 'object'
              ? s.player
              : resolvePlayer(s.player.toString(), teamPlayers);

          if (playerObj) {
            map[s.slotKey] = playerObj;
          }
        });

        const usedIds = Object.values(map).map(p => p._id);

        setLineup(map);
        setBench(teamPlayers.filter(p => !usedIds.includes(p._id)));
      } else {
        setLineup({});
        setBench(teamPlayers);
      }
    } catch (err) {
      console.error('Match lineup load failed:', err);
      Alert.alert('Error', 'Failed to load lineup');
      nav.back();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLineup();
  }, []);

  /* ------------------ HELPERS ------------------ */
  const mapPayload = () => ({
    formation,
    starting: Object.entries(lineup).map(([slotKey, player]) => ({
      slotKey,
      player: player ? player._id : null,
    })),
    bench: bench.map(p => p._id),
  });

  /* ------------------ ACTIONS ------------------ */
  const onSave = async () => {
    try {
      await submitMatchLineup(matchId, mapPayload());
      Alert.alert('Success', 'Lineup submitted');
      nav.back();
    } catch (err) {
      Alert.alert(
        'Error',
        err.response?.data?.message || 'Failed to submit lineup',
      );
    }
  };

  const onSlotPress = slotKey => {
    if (isLocked) return;

    const slotPlayer = lineup[slotKey];

    if (!selectedPlayer && slotPlayer) {
      setLineup(prev => ({ ...prev, [slotKey]: null }));
      setBench(prev => [...prev, slotPlayer]);
      return;
    }

    if (selectedPlayer) {
      setLineup(prev => {
        const next = { ...prev };

        // remove player from any previous slot
        Object.keys(next).forEach(k => {
          if (next[k]?._id === selectedPlayer._id) {
            next[k] = null;
          }
        });

        next[slotKey] = selectedPlayer;
        return next;
      });

      setBench(prev => prev.filter(p => p._id !== selectedPlayer._id));
      setSelectedPlayer(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }


  return (
    < MainLayout title="Match Lineup">
    <View style={styles.container}>
      <Text style={styles.title}>Match Lineup</Text>

      {isLocked && (
        <Text style={styles.lockedText}>Lineup is locked for this match</Text>
      )}

      <View style={styles.pitchCard}>
        <Pitch
          formation={formation}
          lineup={lineup}
          selectedPlayer={selectedPlayer}
          onSlotPress={onSlotPress}
        />
      </View>

      <Text style={styles.section}>Starting XI</Text>
      {startingXI.map(player => (
        <PlayerRow
          key={player._id}
          player={player}
          selected={selectedPlayer?._id === player._id}
          onPress={() =>
            !isLocked &&
            setSelectedPlayer(
              selectedPlayer?._id === player._id ? null : player,
            )
          }
        />
      ))}

      <Text style={styles.section}>Bench</Text>
      {bench.map(player => (
        <PlayerRow
          key={player._id}
          player={player}
          selected={selectedPlayer?._id === player._id}
          onPress={() =>
            !isLocked &&
            setSelectedPlayer(
              selectedPlayer?._id === player._id ? null : player,
            )
          }
        />
      ))}

      {!isLocked && (
        <TouchableOpacity style={styles.saveBtn} onPress={onSave}>
          <Text style={styles.saveText}>Submit Lineup</Text>
        </TouchableOpacity>
      )}
    </View>
    </MainLayout>
  );
}

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     padding: 16,
//     backgroundColor: '#F8FAFC',
//   },
//   center: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   title: {
//     fontSize: 20,
//     fontWeight: '700',
//     marginBottom: 10,
//   },
//   lockedText: {
//     color: '#DC2626',
//     fontWeight: '600',
//     marginBottom: 8,
//   },
//   pitchCard: {
//     backgroundColor: '#fff',
//     borderRadius: 12,
//     padding: 10,
//     marginBottom: 12,
//     elevation: 2,
//   },
//   section: {
//     fontSize: 16,
//     fontWeight: '600',
//     marginVertical: 8,
//   },
//   saveBtn: {
//     backgroundColor: '#2563EB',
//     padding: 14,
//     borderRadius: 10,
//     alignItems: 'center',
//     marginTop: 12,
//   },
//   saveText: {
//     color: '#fff',
//     fontWeight: '700',
//     fontSize: 16,
//   },
// });


const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: s(16),
    backgroundColor: '#F8FAFC',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: ms(20),
    fontWeight: '700',
    marginBottom: vs(10),
  },
  lockedText: {
    color: '#DC2626',
    fontWeight: '600',
    marginBottom: vs(8),
    fontSize: rf(14),
  },
  pitchCard: {
    backgroundColor: '#fff',
    borderRadius: ms(12),
    padding: s(10),
    marginBottom: vs(12),
    elevation: 2,
  },
  section: {
    fontSize: rf(16),
    fontWeight: '600',
    marginVertical: vs(8),
  },
  saveBtn: {
    backgroundColor: '#2563EB',
    padding: s(14),
    borderRadius: ms(10),
    alignItems: 'center',
    marginTop: vs(12),
  },
  saveText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: rf(16),
  },
});