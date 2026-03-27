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
                  width: SLOT_SIZE,
                  height: SLOT_SIZE,
                  marginLeft: -HALF_SLOT,
                  marginTop: -HALF_SLOT,
                  borderRadius: HALF_SLOT,

                  // ✅ No border when player assigned — clean look
                  // Subtle border only for empty slots or selected
                  borderWidth: player ? 0 : 1.5,
                  borderColor: isSelected
                    ? '#60A5FA'
                    : player
                    ? 'transparent'
                    : 'rgba(255,255,255,0.5)',

                  backgroundColor: player
                    ? 'transparent' // ✅ no dark bg behind avatar
                    : 'rgba(15,23,42,0.3)',
                },
              ]}
              onPress={() => !readOnly && onSlotPress?.(pos.key)}>
              {player ? (
                player.profileImageUrl ? (
                  <Image
                    source={{uri: player.profileImageUrl}}
                    style={[
                      styles.avatar,
                      {
                        width: AVATAR_SIZE,
                        height: AVATAR_SIZE,
                        borderRadius: AVATAR_SIZE / 2,
                      },
                    ]}
                  />
                ) : (
                  <View
                    style={[
                      styles.avatar,
                      {
                        width: AVATAR_SIZE,
                        height: AVATAR_SIZE,
                        borderRadius: AVATAR_SIZE / 2,
                        backgroundColor: '#334155',
                        alignItems: 'center',
                        justifyContent: 'center',
                      },
                    ]}>
                    <Text
                      style={{
                        color: '#fff',
                        fontSize: rf(14),
                        fontWeight: '700',
                      }}>
                      {player.name?.[0] || '?'}
                    </Text>
                  </View>
                )
              ) : (
                <View style={styles.emptyDot} />
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
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: {width: 0, height: 3},
    shadowRadius: 4,
  },

  avatar: {
    // width/height/borderRadius set inline
  },

  emptyDot: {
    width: s(10),
    height: s(10),
    borderRadius: s(5),
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
});
