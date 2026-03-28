import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import {FORMATIONS} from './FormationMap';
import LinearGradient from 'react-native-linear-gradient';
import {s, vs, ms, rf} from '../../utils/responsive';

const {width} = Dimensions.get('window');
const PITCH_HEIGHT = width * 1.25;

// ✅ Slot and avatar sizes — reduced from s(68) to s(44)
const SLOT_SIZE = s(50);
const AVATAR_SIZE = s(50);
const HALF_SLOT = SLOT_SIZE / 2;
const BADGE_SIZE = s(20);

export default function Pitch({
  formation,
  lineup,
  selectedPlayer,
  onSlotPress,
  readOnly = false,
}) {
  const positions = FORMATIONS[formation] || [];

  return (
    <View style={styles.pitchWrapper}>
      <LinearGradient colors={['#1F7A3A', '#166534']} style={styles.pitch}>
        <View style={styles.grassOverlay} />

        {/* Mid line */}
        <View style={styles.midLine} />

        {/* Center circle */}
        <View style={styles.centerCircle} />

        {/* Penalty boxes */}
        <View style={styles.topBox} />
        <View style={styles.bottomBox} />

        {positions.map(pos => {
          const player = lineup[pos.key];
          const isSelected =
            selectedPlayer && player && selectedPlayer._id === player._id;

          return (
            <TouchableOpacity
              key={pos.key}
              activeOpacity={readOnly ? 1 : 0.85}
              disabled={readOnly}
              style={[
                styles.slot,
                {
                  top: pos.top,
                  left: pos.left,
                  marginLeft: -SLOT_SIZE / 2,
                  marginTop: -SLOT_SIZE / 2 - vs(8),
                },
              ]}
              onPress={() => !readOnly && onSlotPress?.(pos.key)}>
              {player ? (
                <View style={styles.playerSlot}>
                  {/* Avatar with ring + badge together */}
                  <View style={styles.avatarWrap}>
                    <View
                      style={[
                        styles.avatarRing,
                        isSelected && styles.avatarRingSelected,
                      ]}>
                      {player.profileImageUrl ? (
                        <Image
                          source={{uri: player.profileImageUrl}}
                          style={styles.avatarImg}
                        />
                      ) : (
                        <View style={styles.avatarFallback}>
                          <Text style={styles.avatarInitial}>
                            {player.name?.[0] || '?'}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Jersey badge — positioned relative to avatarWrap */}
                    <View style={styles.jerseyBadge}>
                      <Text style={styles.jerseyNum}>
                        {player.jerseyNumber ?? '--'}
                      </Text>
                    </View>
                  </View>

                  {/* Player name */}
                  <Text style={styles.playerName} numberOfLines={1}>
                    {player.name?.split(' ')[0] || '?'}
                  </Text>
                </View>
              ) : (
                <View style={styles.emptySlot}>
                  <View style={styles.emptyDot} />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  pitchWrapper: {
    alignItems: 'center',
    marginVertical: vs(8), // ✅ reduced from vs(16)
  },

  pitch: {
    height: PITCH_HEIGHT,
    width: '92%',
    borderRadius: ms(28),
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowOffset: {width: 0, height: 8},
    shadowRadius: 12,
  },

  grassOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },

  midLine: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: vs(1.5),
    backgroundColor: 'rgba(255,255,255,0.4)',
  },

  centerCircle: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: s(90), // ✅ reduced from s(110)
    height: s(90),
    marginLeft: s(-45),
    marginTop: s(-45),
    borderRadius: s(45),
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
  },

  topBox: {
    position: 'absolute',
    top: 0,
    left: '25%',
    width: '50%',
    height: vs(80), // ✅ reduced from vs(90)
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
  },

  bottomBox: {
    position: 'absolute',
    bottom: 0,
    left: '25%',
    width: '50%',
    height: vs(80), // ✅ reduced from vs(90)
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
  },

  // ✅ Base slot — sizes overridden inline per slot
  slot: {
    position: 'absolute',
    width: SLOT_SIZE + s(14),
    alignItems: 'center',
  },
  playerSlot: {
    alignItems: 'center',
    position: 'relative',
  },
  avatarRing: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.6)',
    overflow: 'hidden',
    backgroundColor: 'rgba(15,23,42,0.3)',
  },
  avatarRingSelected: {
    borderColor: '#60A5FA',
    borderWidth: 2.5,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7C3AED',
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontSize: rf(16),
    fontWeight: '800',
  },
  avatarWrap: {
    position: 'relative',
  },
  jerseyBadge: {
    position: 'absolute',
    bottom: 0,
    right: -2,
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: BADGE_SIZE / 2,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    zIndex: 10,
  },

  jerseyNum: {
    fontSize: rf(8),
    fontWeight: '900',
    color: '#0F172A',
  },
  playerName: {
    fontSize: rf(9),
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: vs(2),
    width: SLOT_SIZE + s(14),
  },
  emptySlot: {
    width: SLOT_SIZE,
    height: SLOT_SIZE,
    borderRadius: SLOT_SIZE / 2,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.5)',
    backgroundColor: 'rgba(15,23,42,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyDot: {
    width: s(8),
    height: s(8),
    borderRadius: s(4),
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
});
