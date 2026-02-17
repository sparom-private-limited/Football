import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native';
import API from '../api/api';
import {useNavigation, useIsFocused} from '@react-navigation/native';
import useNavigationHelper from '../navigation/Navigationhelper';

export default function PlayerProfileView() {
  const nav = useNavigationHelper();
  const navigation = useNavigation();

  const isFocused = useIsFocused();
  const [player, setPlayer] = useState(null);
  const [user, setUser] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    if (isFocused) fetchProfile();
  }, [isFocused]);

  useEffect(() => {
    if (isFocused) {
      navigation.setOptions({
        title: 'Profile',
        headerTitleAlign: 'center',
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 18,
        },
      });
    }
  }, [isFocused, navigation]);

  const fetchProfile = async () => {
    try {
      const res = await API.get('/api/player/me');
      if (res.data.player) {
        setPlayer(res.data.player);
        setUser(res.data.user);
      }
    } catch (err) {
      console.log('PROFILE VIEW ERROR:', err);
    }
  };

  if (!player) {
    return (
      <View style={styles.center}>
        <Text style={styles.info}>No profile found</Text>
        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => nav.toProfile('PlayerProfileEdit')}>
          <Text style={styles.createBtnText}>Create Profile</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* EDIT BUTTON FLOATING */}
      <TouchableOpacity
        style={styles.editBtn}
        onPress={() => nav.toProfile('PlayerProfileEdit')}>
        <Text style={styles.editBtnText}>Edit</Text>
      </TouchableOpacity>

      {/* PROFILE HEADER */}
      <View style={styles.headerCard}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => {
            if (player.profileImageUrl) {
              setPreviewImage(player.profileImageUrl);
            }
          }}>
          <Image source={{uri: player.profileImageUrl}} style={styles.image} />
        </TouchableOpacity>

        <Text style={styles.name}>{user?.name}</Text>

        <View style={styles.positionTag}>
          <Text style={styles.positionText}>{player.position}</Text>
        </View>

        <Text style={styles.freeAgent}>
          {player.teamId ? 'Signed Player' : 'Free Agent'}
        </Text>
      </View>

      {/* CONTACT INFO */}
      <Card title="Contact Information">
        <Row label="Mobile" value={user?.mobile} />
        <Row label="Email" value={user?.email || '—'} />
      </Card>

      {/* PLAYER ATTRIBUTES */}
      <Card title="Player Attributes">
        <Row label="Age" value={player.age} />
        <Row label="Jersey Number" value={player.jerseyNumber} />
        <Row label="Footed" value={player.footed} />
        <Row label="Height (cm)" value={player.height} />
        <Row label="Weight (kg)" value={player.weight} />
      </Card>

      {/* STATS */}
      <Card title="Performance Stats">
        <Row label="Matches Played" value={player.matchesPlayed} />
        <Row label="Goals" value={player.goals} />
        <Row label="Assists" value={player.assists} />
        <Row label="Clean Sheets" value={player.cleanSheets} />
        <Row label="Yellow Cards" value={player.yellowCards} />
        <Row label="Red Cards" value={player.redCards} />
      </Card>

      {/* TIMESTAMPS */}
      <Card title="Profile Metadata">
        <Row
          label="Created"
          value={new Date(player.createdAt).toDateString()}
        />
        <Row
          label="Last Updated"
          value={new Date(player.updatedAt).toDateString()}
        />
      </Card>
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
    </ScrollView>
  );
}

/* ROW COMPONENT */
function Row({label, value}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value || '—'}</Text>
    </View>
  );
}

/* CARD WRAPPER */
function Card({title, children}) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#F1F5F9',
  },

  /* EMPTY STATE */
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    fontSize: 16,
    marginBottom: 12,
  },
  createBtn: {
    backgroundColor: '#2563EB',
    padding: 12,
    borderRadius: 12,
  },
  createBtnText: {
    color: '#fff',
    fontWeight: '700',
  },

  /* HEADER CARD */
  headerCard: {
    alignItems: 'center',
    marginBottom: 20,
  },
  image: {
    height: 120,
    width: 120,
    borderRadius: 60,
    backgroundColor: '#CBD5E1',
    marginBottom: 12,
    elevation: 6,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
  },

  positionTag: {
    marginTop: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#1D4ED8',
  },
  positionText: {
    color: '#fff',
    fontWeight: '600',
  },

  freeAgent: {
    marginTop: 6,
    color: '#475569',
    fontSize: 14,
  },

  /* EDIT BUTTON FLOATING */
  editBtn: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: '#1D4ED8',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 10,
  },
  editBtnText: {
    color: '#fff',
    fontWeight: '700',
  },

  /* CARD */
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    color: '#0F172A',
    fontWeight: '700',
    marginBottom: 12,
  },

  /* ROW */
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  rowLabel: {
    color: '#475569',
    fontSize: 15,
  },
  rowValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
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
