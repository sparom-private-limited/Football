import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  LayoutAnimation,
} from 'react-native';
import Pitch from '../../components/lineup/Pitch';
import FormationSelector from '../../components/lineup/FormationSelector';
import PlayerRow from '../../components/lineup/PlayerRow';
import {FORMATIONS} from '../../components/lineup/FormationMap';
import API from '../../api/api';
import MainLayout from '../../components/MainLayout';

export default function TeamLineupScreen() {
  const [formation, setFormation] = useState('4-2-3-1');
  const [lineup, setLineup] = useState({});
  const [bench, setBench] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [openFormation, setOpenFormation] = useState(false);
  const [hasSavedLineup, setHasSavedLineup] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const mapFrontendLineupToPayload = (formation, lineup, bench) => ({
    formation,
    starting: Object.entries(lineup).map(([slotKey, player]) => ({
      slotKey,
      player: player ? player._id : null,
    })),
    bench: bench.map(p => p._id),
  });

  const loadLineupAndPlayers = useCallback(async () => {
    try {
      const teamRes = await API.get('/api/team/my-team');
      const teamPlayers = teamRes.data?.players || [];

      let lineupRes = null;
      try {
        lineupRes = await API.get('/api/team/lineup');
      } catch (err) {
        if (err.response?.status !== 404) {
          console.error('❌ Failed to fetch lineup:', err.response?.status);
        }
      }

      if (lineupRes?.data?.formation) {
        const {formation, starting} = lineupRes.data;

        setFormation(formation);

        const lineupMap = {};
        const startingIds = [];

        if (Array.isArray(starting)) {
          starting.forEach(s => {
            if (s.player && s.slotKey) {
              const playerData = teamPlayers.find(
                p => p._id === s.player._id || p._id === s.player,
              );

              if (playerData) {
                lineupMap[s.slotKey] = playerData;
                startingIds.push(playerData._id);
              }
            }
          });
        }

        setLineup(lineupMap);
        setBench(teamPlayers.filter(p => !startingIds.includes(p._id)));
        setHasSavedLineup(true);
        setIsEditing(false);
      } else {
        setFormation('4-2-3-1');
        setLineup({});
        setBench(teamPlayers);
        setHasSavedLineup(false);
        setIsEditing(false);
      }
    } catch (err) {
      console.error('❌ Failed to load lineup screen:', err);
      Alert.alert('Error', 'Failed to load lineup data');
    }
  }, []);

  useEffect(() => {
    loadLineupAndPlayers();
  }, [loadLineupAndPlayers]);

  const saveLineup = async () => {
    try {
      const payload = mapFrontendLineupToPayload(formation, lineup, bench);

      // console.log('💾 Saving lineup:', {
      //   formation: payload.formation,
      //   starting: payload.starting.length,
      //   bench: payload.bench.length,
      // });

      await API.post('/api/team/lineup', payload);

      Alert.alert('Success', 'Lineup saved successfully');
      setHasSavedLineup(true);
      setIsEditing(false);
    } catch (err) {
      console.error('❌ Save lineup error:', err);
      Alert.alert(
        'Error',
        err.response?.data?.message || 'Failed to save lineup',
      );
    }
  };

  const resetFormation = nextFormation => {
    if (!isEditing && hasSavedLineup) {
      Alert.alert('Edit Lineup', "Click 'Edit Lineup' to make changes");
      return;
    }

    Alert.alert(
      'Change Formation?',
      'Current lineup will reset and players return to bench.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            LayoutAnimation.configureNext(
              LayoutAnimation.Presets.easeInEaseOut,
            );

            // Move all current lineup players to bench
            setBench(prev => [
              ...prev,
              ...Object.values(lineup).filter(Boolean),
            ]);

            setLineup({});
            setSelectedPlayer(null);
            setFormation(nextFormation);
            setOpenFormation(false);
          },
        },
      ],
    );
  };

  const onSlotPress = slotKey => {
    if (!isEditing && hasSavedLineup) {
      Alert.alert('Edit Lineup', "Click 'Edit Lineup' to make changes");
      return;
    }

    const slotPlayer = lineup[slotKey];

    // Case 1: Clicking on filled slot with no selection → Remove player to bench
    if (!selectedPlayer && slotPlayer) {
      setLineup(prev => {
        const newLineup = {...prev};
        delete newLineup[slotKey];
        return newLineup;
      });
      setBench(prev => [...prev, slotPlayer]);
      return;
    }

    // Case 2: Clicking on slot with player selected → Place player
    if (selectedPlayer) {
      // Check if player already placed elsewhere
      const alreadyPlaced = Object.entries(lineup).find(
        ([key, p]) => p?._id === selectedPlayer._id,
      );

      if (alreadyPlaced) {
        // Remove from old position
        setLineup(prev => {
          const newLineup = {...prev};
          delete newLineup[alreadyPlaced[0]];
          newLineup[slotKey] = selectedPlayer;
          return newLineup;
        });
      } else {
        // Place new player
        setLineup(prev => ({
          ...prev,
          [slotKey]: selectedPlayer,
        }));
        setBench(prev => prev.filter(p => p._id !== selectedPlayer._id));
      }

      setSelectedPlayer(null);
    }
  };

  const startingXI = Object.values(lineup).filter(Boolean);

  return (
    <MainLayout>
      <ScrollView>
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerSubtitle}>Team Lineup</Text>
            <Text style={styles.headerTitle}>{formation} Formation</Text>
          </View>

          <TouchableOpacity
            style={[
              styles.saveBtn,
              hasSavedLineup && !isEditing && styles.editBtn,
            ]}
            onPress={async () => {
              if (hasSavedLineup && !isEditing) {
                setIsEditing(true);
                return;
              }
              await saveLineup();
            }}>
            <Text style={styles.saveBtnText}>
              {hasSavedLineup && !isEditing ? 'Edit Lineup' : 'Save Lineup'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* PITCH */}
        <View style={styles.pitchCard}>
          <View style={styles.pitchHeader}>
            <Text style={styles.pitchTitle}>On pitch view</Text>

            <View style={{position: 'relative'}}>
              <TouchableOpacity
                style={styles.formationBtn}
                onPress={() => {
                  if (!isEditing && hasSavedLineup) {
                    Alert.alert(
                      'Edit Lineup',
                      "Click 'Edit Lineup' to make changes",
                    );
                    return;
                  }

                  setOpenFormation(o => !o);
                }}>
                <Text style={styles.formationText}>{formation}</Text>
              </TouchableOpacity>

              {openFormation && (
                <View style={styles.formationDropdown}>
                  {Object.keys(FORMATIONS).map(f => (
                    <TouchableOpacity
                      key={f}
                      style={styles.formationItem}
                      onPress={() => resetFormation(f)}>
                      <Text style={styles.formationItemText}>{f}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>

          <View>
            <Pitch
              formation={formation}
              lineup={lineup}
              selectedPlayer={selectedPlayer}
              onSlotPress={onSlotPress}
            />
          </View>
        </View>

        {/* STARTING XI */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>STARTING XI</Text>
          <Text
            style={[
              styles.sectionCount,
              {
                color: startingXI.length === 11 ? '#16A34A' : '#F97316',
              },
            ]}>
            {startingXI.length} / 11
          </Text>
        </View>

        {startingXI.length === 0 && (
          <Text style={styles.emptyText}>
            Select players from bench to add to pitch
          </Text>
        )}

        {startingXI.map(player => (
          <PlayerRow
            key={player._id}
            player={player}
            selected={selectedPlayer?._id === player._id}
            onPress={() =>
              setSelectedPlayer(
                selectedPlayer?._id === player._id ? null : player,
              )
            }
          />
        ))}

        {/* BENCH */}
        <View style={styles.benchContainer}>
          <Text style={styles.sectionTitle}>BENCH ({bench.length})</Text>

          {bench.length === 0 && (
            <Text style={styles.emptyText}>All players are on the pitch</Text>
          )}

          {bench.map(player => (
            <PlayerRow
              key={player._id}
              player={player}
              selected={selectedPlayer?._id === player._id}
              onPress={() => {
                if (!isEditing && hasSavedLineup) {
                  Alert.alert(
                    'Edit Lineup',
                    "Click 'Edit Lineup' to make changes",
                  );
                  return;
                }

                setSelectedPlayer(
                  selectedPlayer?._id === player._id ? null : player,
                );
              }}
            />
          ))}
        </View>

        <View style={{height: 40}} />
      </ScrollView>
    </MainLayout>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  pitchCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 22,
    paddingVertical: 16,
    marginTop: 12,
    elevation: 4,
  },

  pitchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  pitchTitle: {
    fontWeight: '700',
    fontSize: 14,
    color: '#0F172A',
  },

  formationBtn: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  formationText: {
    fontWeight: '600',
    color: '#0369A1',
  },
  sectionTitle: {
    marginLeft: 16,
    marginTop: 20,
    fontWeight: '700',
    color: '#64748B',
    fontSize: 12,
  },
  emptyText: {
    marginLeft: 16,
    marginTop: 8,
    color: '#94A3B8',
    fontSize: 14,
    fontStyle: 'italic',
  },
  formationDropdown: {
    position: 'absolute',
    top: 40,
    right: 0,
    width: 140,
    backgroundColor: '#fff',
    borderRadius: 14,
    elevation: 8,
    zIndex: 999,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  formationItem: {
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  formationItemText: {
    fontWeight: '600',
    color: '#0F172A',
  },
  saveBtn: {
    backgroundColor: '#16A34A',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  editBtn: {
    backgroundColor: '#2563EB',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 24,
  },

  sectionCount: {
    fontSize: 13,
    fontWeight: '700',
  },

  benchContainer: {
    marginTop: 12,
    backgroundColor: '#F8FAFC',
    paddingTop: 12,
    paddingBottom: 8,
  },
});
