// src/screens/TeamHomeScreen.jsx
import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import API from '../../api/api';
import MainLayout from '../../components/MainLayout';
import {useIsFocused, useNavigation} from '@react-navigation/native';
import useNavigationHelper from '../../navigation/Navigationhelper';

export default function TeamProfileScreen() {
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const isFocused = useIsFocused();
  const nav = useNavigationHelper();
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    if (isFocused) loadTeam();
  }, [isFocused]);

  const loadTeam = async () => {
    setLoading(true);
    try {
      const res = await API.get('/api/team/my-team');

      setTeam(res.data);
    } catch {
      setTeam(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async playerId => {
    Alert.alert(
      'Remove player',
      'Are you sure you want to remove this player from the team?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await API.post('/api/team/remove-player', {playerId});
              Alert.alert('Success', 'Player removed');
              loadTeam();
            } catch (err) {
              Alert.alert('Error', err.response?.data?.message || 'Failed');
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <MainLayout title="Team Profile">
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1D4ED8" />
        </View>
      </MainLayout>
    );
  }

  if (!team) {
    return (
      <MainLayout title="Team Profile">
        <Text>No team found</Text>
      </MainLayout>
    );
  }

  // Team exists
  return (
    <MainLayout>
      <ScrollView style={styles.wrapper}>
        <View style={styles.coverWrapper}>
          {/* COVER IMAGE */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => {
              if (team.coverImageUrl) {
                setPreviewImage(team.coverImageUrl);
              }
            }}>
            {team.coverImageUrl ? (
              <Image
                source={{uri: team.coverImageUrl}}
                style={styles.coverImage}
              />
            ) : (
              <View style={[styles.coverImage, styles.coverPlaceholder]} />
            )}
          </TouchableOpacity>

          {/* TEAM LOGO */}
          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.logoWrapper}
            onPress={() => {
              if (team.teamLogoUrl) {
                setPreviewImage(team.teamLogoUrl);
              }
            }}>
            {team.teamLogoUrl ? (
              <Image source={{uri: team.teamLogoUrl}} style={styles.logo} />
            ) : (
              <View style={[styles.logo, styles.logoPlaceholder]}>
                <Text style={{color: '#fff', fontWeight: '700'}}>
                  {team.teamName?.[0] || 'T'}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* EDIT BUTTON */}
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => nav.to('EditTeam', {team})}>
            <Text style={styles.editText}>Edit</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.teamInfo}>
          <Text style={styles.teamName}>{team.teamName}</Text>
          <Text style={styles.location}>{team.location}</Text>
          <Text style={styles.founded}>Founded: {team.foundedYear || '—'}</Text>
          <Text style={styles.desc}>
            {team.description || 'No description provided.'}
          </Text>
        </View>
        <View style={styles.card}>
          {/* CARD HEADER */}
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>
              Squad ({team.players?.length || 0})
            </Text>

            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => nav.to('AddPlayer')}>
              <Text style={styles.addBtnText}>+ Add</Text>
            </TouchableOpacity>
          </View>

          {/* CARD BODY */}
          {!team.players || team.players.length === 0 ? (
            <Text style={styles.noPlayers}>No players added yet.</Text>
          ) : (
            team.players.map(p => (
              <View key={p._id} style={styles.playerRow}>
                <Image
                  source={{uri: p.profileImageUrl}}
                  style={styles.playerImg}
                />

                <View style={{marginLeft: 12}}>
                  <Text style={styles.playerName}>{p.name}</Text>
                  <Text style={styles.playerPos}>{p.position}</Text>
                </View>

                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => handleRemove(p._id)}>
                  <Text style={styles.removeText}>Remove</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>
      <Modal
        visible={!!previewImage}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewImage(null)}>
        <View style={styles.previewOverlay}>
          <TouchableOpacity
            style={styles.previewClose}
            onPress={() => setPreviewImage(null)}>
            <Text style={styles.previewCloseText}>✕</Text>
          </TouchableOpacity>

          <Image
            source={{uri: previewImage}}
            style={styles.previewImage}
            resizeMode="contain"
          />
        </View>
      </Modal>
    </MainLayout>
  );
}

const styles = StyleSheet.create({
  wrapper: {backgroundColor: '#F1F5F9'},

  center: {flex: 1, justifyContent: 'center', alignItems: 'center'},

  emptyContainer: {padding: 40, alignItems: 'center'},
  emptyTitle: {fontSize: 24, fontWeight: '700', color: '#0F172A'},
  emptySubtitle: {
    textAlign: 'center',
    color: '#475569',
    marginTop: 8,
    marginBottom: 24,
  },
  primaryBtn: {
    backgroundColor: '#1D4ED8',
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 12,
  },
  primaryBtnText: {color: '#fff', fontWeight: '700'},

  coverWrapper: {position: 'relative', height: 180, marginBottom: 50},
  coverImage: {width: '100%', height: '100%'},
  coverPlaceholder: {backgroundColor: '#E2E8F0'},

  logoWrapper: {
    position: 'absolute',
    bottom: -40,
    left: 20,
    width: 100,
    height: 100,
    borderRadius: 60,
    overflow: 'hidden',
    elevation: 6,
    backgroundColor: '#fff',
  },
  logo: {width: '100%', height: '100%'},
  logoPlaceholder: {
    backgroundColor: '#1D4ED8',
    alignItems: 'center',
    justifyContent: 'center',
  },

  editBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#1D4ED8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  editText: {color: '#fff', fontWeight: '700'},

  teamInfo: {paddingHorizontal: 20, paddingTop: 12},
  teamName: {fontSize: 26, fontWeight: '700', color: '#0F172A'},
  location: {color: '#475569', marginTop: 6},
  founded: {color: '#475569', marginTop: 2},
  desc: {color: '#334155', marginTop: 10, lineHeight: 20},

  card: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 14,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    color: '#0F172A',
  },

  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderColor: '#E6EEF8',
  },
  playerImg: {width: 48, height: 48, borderRadius: 28},
  playerName: {fontSize: 16, fontWeight: '600', color: '#0F172A'},
  playerPos: {color: '#475569', marginTop: 2},

  removeBtn: {
    marginLeft: 'auto',
    backgroundColor: '#DC2626',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  removeText: {color: '#fff', fontWeight: '700'},

  fab: {
    position: 'absolute',
    right: 20,
    bottom: 28,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1D4ED8',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
  },
  fabText: {color: '#fff', fontSize: 28, marginTop: -2},
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  addBtn: {
    backgroundColor: '#1D4ED8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },

  addBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  previewOverlay: {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.95)',
  justifyContent: 'center',
  alignItems: 'center',
},

previewImage: {
  width: '100%',
  height: '80%',
},

previewClose: {
  position: 'absolute',
  top: 40,
  right: 20,
  zIndex: 10,
},

previewCloseText: {
  color: '#fff',
  fontSize: 26,
  fontWeight: '700',
},

});
