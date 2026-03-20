import React, {useEffect, useState, useRef} from 'react';
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
  Animated,
} from 'react-native';
import API from '../../api/api';
import MainLayout from '../../components/MainLayout';
import {useIsFocused} from '@react-navigation/native';
import useNavigationHelper from '../../navigation/Navigationhelper';
import {s, vs, ms, rf} from '../../utils/responsive';

// ─── DESIGN TOKENS ───────────────────────────
const C = {
  blue:        '#1D4ED8',
  blueDark:    '#1348D4',
  blueSoft:    '#EFF6FF',
  blueMid:     '#BFDBFE',
  pageBg:      '#F1F5F9',
  cardBg:      '#FFFFFF',
  cardAlt:     '#F8FAFC',
  textPrimary: '#0F172A',
  textSecond:  '#475569',
  textMuted:   '#94A3B8',
  textWhite:   '#FFFFFF',
  border:      '#E2E8F0',
  borderBlue:  '#DBEAFE',
  red:         '#DC2626',
  redSoft:     '#FEF2F2',
  green:       '#10B981',
  greenSoft:   '#ECFDF5',
};

const R = {
  sm: ms(8), md: ms(12), lg: ms(16), xl: ms(20), pill: ms(50),
};

// ─────────────────────────────────────────────
// HERO SECTION
// ─────────────────────────────────────────────
function HeroSection({team, nav, onPreview}) {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  {toValue: 1, duration: 450, useNativeDriver: true}),
      Animated.spring(slideAnim, {toValue: 0, damping: 15,   useNativeDriver: true}),
    ]).start();
  }, []);

  return (
    <Animated.View style={{opacity: fadeAnim, transform: [{translateY: slideAnim}]}}>
      {/* Cover image */}
      <TouchableOpacity
        activeOpacity={0.92}
        onPress={() => team.coverImageUrl && onPreview(team.coverImageUrl)}>
        {team.coverImageUrl ? (
          <Image source={{uri: team.coverImageUrl}} style={heroStyles.cover} />
        ) : (
          <View style={[heroStyles.cover, heroStyles.coverPlaceholder]}>
            <Text style={heroStyles.coverPlaceholderTxt}>No cover image</Text>
          </View>
        )}
        {/* Gradient overlay */}
        <View style={heroStyles.overlay} />
      </TouchableOpacity>

      {/* Edit button */}
      <TouchableOpacity
        style={heroStyles.editBtn}
        onPress={() => nav.to('EditTeam', {team})}
        activeOpacity={0.85}>
        <Text style={heroStyles.editTxt}>✏️ Edit</Text>
      </TouchableOpacity>

      {/* Logo floated over cover */}
      <TouchableOpacity
        style={heroStyles.logoWrap}
        activeOpacity={0.9}
        onPress={() => team.teamLogoUrl && onPreview(team.teamLogoUrl)}>
        {team.teamLogoUrl ? (
          <Image source={{uri: team.teamLogoUrl}} style={heroStyles.logo} />
        ) : (
          <View style={[heroStyles.logo, heroStyles.logoFallback]}>
            <Text style={heroStyles.logoLetter}>{team.teamName?.[0] || 'T'}</Text>
          </View>
        )}
       
      </TouchableOpacity>
    </Animated.View>
  );
}

const heroStyles = StyleSheet.create({
  cover: {
    width: '100%',
    height: vs(190),
  },
  coverPlaceholder: {
    backgroundColor: C.blueSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverPlaceholderTxt: {
    color: C.textMuted,
    fontSize: rf(13),
    fontWeight: '600',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
    height: vs(190),
  },
  editBtn: {
    position: 'absolute',
    top: vs(12), right: s(12),
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: s(14), paddingVertical: vs(6),
    borderRadius: R.md,
    flexDirection: 'row', alignItems: 'center', gap: s(4),
    shadowColor: '#000', shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.12, shadowRadius: 6, elevation: 3,
  },
  editTxt: {color: C.blue, fontWeight: '800', fontSize: rf(13)},
  logoWrap: {
    position: 'absolute',
    bottom: vs(-44), left: s(20),
    width: s(88), height: s(88),
    borderRadius: s(44),
    overflow: 'hidden',
    borderWidth: 3, borderColor: C.textWhite,
    backgroundColor: C.textWhite,
    shadowColor: '#000', shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2, shadowRadius: 10, elevation: 6,
  },
  logo:        {width: '100%', height: '100%'},
  logoFallback:{
    width: '100%', height: '100%',
    backgroundColor: C.blue,
    alignItems: 'center', justifyContent: 'center',
  },
  logoLetter:  {color: C.textWhite, fontSize: ms(30), fontWeight: '900'},
});

// ─────────────────────────────────────────────
// TEAM INFO CARD
// ─────────────────────────────────────────────
function TeamInfoCard({team}) {
  return (
    <View style={infoStyles.container}>
      {/* Name + type badge */}
      <View style={infoStyles.nameRow}>
        <Text style={infoStyles.teamName}>{team.teamName}</Text>
        {team.teamType && (
          <View style={infoStyles.typeBadge}>
            <Text style={infoStyles.typeTxt}>{team.teamType}</Text>
          </View>
        )}
      </View>

      {/* Meta row */}
      <View style={infoStyles.metaRow}>
        {team.location && (
          <View style={infoStyles.metaItem}>
            <Text style={infoStyles.metaIcon}>📍</Text>
            <Text style={infoStyles.metaTxt}>{team.location}</Text>
          </View>
        )}
        {team.foundedYear && (
          <View style={infoStyles.metaItem}>
            <Text style={infoStyles.metaIcon}>📅</Text>
            <Text style={infoStyles.metaTxt}>Founded {team.foundedYear}</Text>
          </View>
        )}
      </View>

      {/* Description */}
      {team.description ? (
        <Text style={infoStyles.desc}>{team.description}</Text>
      ) : (
        <Text style={infoStyles.descEmpty}>No description provided.</Text>
      )}

      {/* Stats strip */}
      <View style={infoStyles.statsRow}>
        <StatItem label="Matches" value={team.matchesPlayed ?? 0} />
        <View style={infoStyles.statDivider} />
        <StatItem label="Wins"    value={team.wins          ?? 0} accent />
        <View style={infoStyles.statDivider} />
        <StatItem label="Draws"   value={team.draws         ?? 0} />
        <View style={infoStyles.statDivider} />
        <StatItem label="Losses"  value={team.losses        ?? 0} />
      </View>
    </View>
  );
}

function StatItem({label, value, accent = false}) {
  return (
    <View style={infoStyles.statItem}>
      <Text style={[infoStyles.statVal, accent && infoStyles.statValAccent]}>{value}</Text>
      <Text style={infoStyles.statLbl}>{label}</Text>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  container: {
    backgroundColor: C.cardBg,
    marginHorizontal: s(16),
    marginTop: vs(52),
    marginBottom: vs(12),
    borderRadius: R.lg,
    padding: s(16),
    borderWidth: 1, borderColor: C.border,
    elevation: 2,
    shadowColor: '#000', shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06, shadowRadius: 8,
  },
  nameRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: vs(8), gap: s(8),
  },
  teamName: {
    fontSize: ms(22), fontWeight: '900',
    color: C.textPrimary, flex: 1, letterSpacing: -0.3,
  },
  typeBadge: {
    backgroundColor: C.blueSoft,
    paddingHorizontal: s(10), paddingVertical: vs(4),
    borderRadius: R.pill,
    borderWidth: 1, borderColor: C.borderBlue,
  },
  typeTxt: {fontSize: rf(11), color: C.blue, fontWeight: '800'},
  metaRow: {
    flexDirection: 'row', flexWrap: 'wrap',
    gap: s(14), marginBottom: vs(10),
  },
  metaItem: {flexDirection: 'row', alignItems: 'center', gap: s(4)},
  metaIcon: {fontSize: rf(12)},
  metaTxt:  {fontSize: rf(12), color: C.textSecond, fontWeight: '600'},
  desc: {
    fontSize: rf(13), color: C.textSecond,
    lineHeight: vs(20), marginBottom: vs(14),
  },
  descEmpty: {
    fontSize: rf(13), color: C.textMuted,
    fontStyle: 'italic', marginBottom: vs(14),
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: C.cardAlt,
    borderRadius: R.md,
    padding: vs(12),
    borderWidth: 1, borderColor: C.border,
  },
  statItem:      {flex: 1, alignItems: 'center'},
  statDivider:   {width: 1, backgroundColor: C.border},
  statVal:       {fontSize: ms(18), fontWeight: '900', color: C.textPrimary},
  statValAccent: {color: C.blue},
  statLbl:       {fontSize: rf(10), color: C.textMuted, fontWeight: '600', marginTop: vs(2), textTransform: 'uppercase', letterSpacing: 0.3},
});

// ─────────────────────────────────────────────
// PLAYER ROW
// ─────────────────────────────────────────────
function PlayerRow({player, onRemove}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const onIn  = () => Animated.spring(scaleAnim, {toValue: 0.98, useNativeDriver: true, damping: 10}).start();
  const onOut = () => Animated.spring(scaleAnim, {toValue: 1,    useNativeDriver: true, damping: 12}).start();

  const posColor = {
    GK: '#7C3AED', DEF: '#1D4ED8', MID: '#059669', FW: '#DC2626',
  }[player.position] || C.blue;

  return (
    <Animated.View style={[playerStyles.row, {transform: [{scale: scaleAnim}]}]}>
      <TouchableOpacity
        style={playerStyles.rowInner}
        onPressIn={onIn} onPressOut={onOut}
        activeOpacity={1}>

        {/* Avatar */}
        {player.profileImageUrl ? (
          <Image source={{uri: player.profileImageUrl}} style={playerStyles.avatar} />
        ) : (
          <View style={[playerStyles.avatar, playerStyles.avatarFallback, {borderColor: posColor}]}>
            <Text style={[playerStyles.avatarLetter, {color: posColor}]}>
              {player.name?.[0]?.toUpperCase() || 'P'}
            </Text>
          </View>
        )}

        {/* Info */}
        <View style={playerStyles.info}>
          <Text style={playerStyles.name}>{player.name}</Text>
          <View style={playerStyles.metaRow}>
            <View style={[playerStyles.posBadge, {backgroundColor: posColor + '15', borderColor: posColor + '40'}]}>
              <Text style={[playerStyles.posTxt, {color: posColor}]}>{player.position}</Text>
            </View>
            {player.jerseyNumber && (
              <Text style={playerStyles.jersey}>#{player.jerseyNumber}</Text>
            )}
            {player.isFreeAgent === false && (
              <View style={playerStyles.teamTag}>
                <Text style={playerStyles.teamTagTxt}>In Team</Text>
              </View>
            )}
          </View>
        </View>

        {/* Remove */}
        <TouchableOpacity
          style={playerStyles.removeBtn}
          onPress={() => onRemove(player._id)}
          activeOpacity={0.8}>
          <Text style={playerStyles.removeTxt}>Remove</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

const playerStyles = StyleSheet.create({
  row: {
    backgroundColor: C.cardAlt,
    borderRadius: R.md,
    marginBottom: vs(8),
    borderWidth: 1, borderColor: C.border,
    overflow: 'hidden',
  },
  rowInner: {
    flexDirection: 'row', alignItems: 'center',
    padding: s(12), gap: s(12),
  },
  avatar: {
    width: s(48), height: s(48), borderRadius: s(24),
  },
  avatarFallback: {
    backgroundColor: C.blueSoft,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2,
  },
  avatarLetter: {fontSize: ms(18), fontWeight: '900'},
  info:    {flex: 1},
  name:    {fontSize: rf(14), fontWeight: '800', color: C.textPrimary, marginBottom: vs(4)},
  metaRow: {flexDirection: 'row', alignItems: 'center', gap: s(6), flexWrap: 'wrap'},
  posBadge: {
    paddingHorizontal: s(8), paddingVertical: vs(2),
    borderRadius: R.pill, borderWidth: 1,
  },
  posTxt:  {fontSize: rf(10), fontWeight: '800', letterSpacing: 0.4},
  jersey:  {fontSize: rf(12), color: C.textMuted, fontWeight: '700'},
  teamTag: {
    backgroundColor: C.greenSoft,
    paddingHorizontal: s(7), paddingVertical: vs(2),
    borderRadius: R.pill,
    borderWidth: 1, borderColor: '#A7F3D0',
  },
  teamTagTxt: {fontSize: rf(10), color: C.green, fontWeight: '700'},
  removeBtn: {
    backgroundColor: C.redSoft,
    paddingHorizontal: s(10), paddingVertical: vs(6),
    borderRadius: R.md,
    borderWidth: 1, borderColor: '#FECACA',
  },
  removeTxt: {color: C.red, fontWeight: '800', fontSize: rf(12)},
});

// ─────────────────────────────────────────────
// SQUAD CARD
// ─────────────────────────────────────────────
function SquadCard({team, nav, onRemove}) {
  return (
    <View style={squadStyles.container}>
      <View style={squadStyles.header}>
        <View>
          <Text style={squadStyles.title}>Squad</Text>
          <Text style={squadStyles.subtitle}>{team.players?.length || 0} players registered</Text>
        </View>
        <TouchableOpacity
          style={squadStyles.addBtn}
          onPress={() => nav.to('AddPlayer')}
          activeOpacity={0.85}>
          <Text style={squadStyles.addTxt}>+ Add Player</Text>
        </TouchableOpacity>
      </View>

      {!team.players || team.players.length === 0 ? (
        <View style={squadStyles.empty}>
          <Text style={squadStyles.emptyIcon}>👥</Text>
          <Text style={squadStyles.emptyTxt}>No players added yet.</Text>
          <Text style={squadStyles.emptyHint}>Tap "Add Player" to build your squad.</Text>
        </View>
      ) : (
        team.players.map(p => (
          <PlayerRow key={p._id} player={p} onRemove={onRemove} />
        ))
      )}
    </View>
  );
}

const squadStyles = StyleSheet.create({
  container: {
    backgroundColor: C.cardBg,
    marginHorizontal: s(16),
    marginBottom: vs(12),
    borderRadius: R.lg,
    padding: s(16),
    borderWidth: 1, borderColor: C.border,
    elevation: 1,
    shadowColor: '#000', shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05, shadowRadius: 4,
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: vs(16),
  },
  title:    {fontSize: rf(16), fontWeight: '900', color: C.textPrimary, letterSpacing: -0.2},
  subtitle: {fontSize: rf(11), color: C.textMuted, marginTop: vs(2)},
  addBtn: {
    backgroundColor: C.blue,
    paddingHorizontal: s(14), paddingVertical: vs(8),
    borderRadius: R.md,
    shadowColor: C.blue, shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.25, shadowRadius: 6, elevation: 3,
  },
  addTxt: {color: C.textWhite, fontWeight: '800', fontSize: rf(13)},
  empty: {
    alignItems: 'center', paddingVertical: vs(24),
  },
  emptyIcon: {fontSize: ms(32), marginBottom: vs(8)},
  emptyTxt:  {fontSize: rf(14), fontWeight: '700', color: C.textPrimary, marginBottom: vs(4)},
  emptyHint: {fontSize: rf(12), color: C.textMuted},
});

// ─────────────────────────────────────────────
// IMAGE PREVIEW MODAL
// ─────────────────────────────────────────────
function PreviewModal({uri, onClose}) {
  return (
    <Modal visible={!!uri} transparent animationType="fade" onRequestClose={onClose}>
      <View style={modalStyles.overlay}>
        <TouchableOpacity style={modalStyles.closeBtn} onPress={onClose}>
          <Text style={modalStyles.closeTxt}>✕</Text>
        </TouchableOpacity>
        <Image source={{uri}} style={modalStyles.image} resizeMode="contain" />
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.96)',
    justifyContent: 'center', alignItems: 'center',
  },
  closeBtn: {
    position: 'absolute', top: vs(40), right: s(20), zIndex: 10,
    width: s(36), height: s(36), borderRadius: s(18),
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  closeTxt:  {color: C.textWhite, fontSize: ms(16), fontWeight: '700'},
  image:     {width: '100%', height: '80%'},
});

// ─────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────
export default function TeamProfileScreen() {
  const [team,         setTeam]         = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [previewImage, setPreviewImage] = useState(null);
  const isFocused = useIsFocused();
  const nav       = useNavigationHelper();

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
      'Are you sure you want to remove this player?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Remove', style: 'destructive',
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
        <View style={screenStyles.center}>
          <ActivityIndicator size="large" color={C.blue} />
          <Text style={screenStyles.loadingTxt}>Loading team profile...</Text>
        </View>
      </MainLayout>
    );
  }

  if (!team) {
    return (
      <MainLayout title="Team Profile">
        <View style={screenStyles.center}>
          <Text style={screenStyles.noTeamTxt}>No team found.</Text>
        </View>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <ScrollView
        style={screenStyles.root}
        contentContainerStyle={screenStyles.scroll}
        showsVerticalScrollIndicator={false}>

        <HeroSection
          team={team}
          nav={nav}
          onPreview={uri => setPreviewImage(uri)}
        />

        <TeamInfoCard team={team} />

        <SquadCard
          team={team}
          nav={nav}
          onRemove={handleRemove}
        />

        <View style={{height: vs(24)}} />
      </ScrollView>

      <PreviewModal
        uri={previewImage}
        onClose={() => setPreviewImage(null)}
      />
    </MainLayout>
  );
}

const screenStyles = StyleSheet.create({
  root:       {backgroundColor: C.pageBg},
  scroll:     {backgroundColor: C.pageBg, paddingBottom: vs(40)},
  center:     {flex: 1, justifyContent: 'center', alignItems: 'center', gap: vs(10)},
  loadingTxt: {fontSize: rf(13), color: C.textSecond, fontWeight: '500'},
  noTeamTxt:  {fontSize: rf(14), color: C.textMuted, fontWeight: '600'},
});