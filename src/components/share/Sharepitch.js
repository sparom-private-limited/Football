import React from 'react';
import {View, Text, Image, StyleSheet, Dimensions} from 'react-native';
import {FORMATIONS} from '../lineup/FormationMap';
import LinearGradient from 'react-native-linear-gradient';
import {s, vs, ms, rf} from '../../utils/responsive';

const PITCH_WIDTH = 360;
const PITCH_HEIGHT = PITCH_WIDTH * 1.45;
const AVATAR_SIZE = s(52);
const BADGE_SIZE = s(22);

export default function SharePitch({formation, lineup}) {
  const positions = FORMATIONS[formation] || [];

  // Scale positions to our fixed card width
  const screenWidth = Dimensions.get('window').width;
  const scaleX = PITCH_WIDTH / screenWidth;
  const scaleY = PITCH_HEIGHT / (screenWidth * 1.25);

  return (
    <LinearGradient
      colors={['#22C55E', '#16A34A', '#15803D']}
      style={[styles.pitch, {width: PITCH_WIDTH, height: PITCH_HEIGHT}]}>
      {/* Pitch markings */}
      <View style={styles.midLine} />
      <View style={styles.centerCircle} />
      <View style={styles.topBox} />
      <View style={styles.bottomBox} />
      <View style={styles.topGoal} />
      <View style={styles.bottomGoal} />

      {/* Grass stripes */}
      {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
        <View
          key={`stripe-${i}`}
          style={[
            styles.grassStripe,
            {
              top: (PITCH_HEIGHT / 8) * i,
              height: PITCH_HEIGHT / 8,
              backgroundColor:
                i % 2 === 0
                  ? 'rgba(255,255,255,0.03)'
                  : 'rgba(0,0,0,0.03)',
            },
          ]}
        />
      ))}

      {/* Players */}
      {positions.map(pos => {
        const player = lineup[pos.key];
        if (!player) return null;

        // Scale position
        const top = pos.top * scaleY;
        const left = pos.left * scaleX;

        return (
          <View
            key={pos.key}
            style={[
              styles.playerWrap,
              {
                top: top - AVATAR_SIZE / 2 - vs(6),
                left: left - AVATAR_SIZE / 2,
              },
            ]}>
            {/* Avatar with ring */}
            <View style={styles.avatarRing}>
              {player.profileImageUrl ? (
                <Image
                  source={{uri: player.profileImageUrl}}
                  style={styles.avatarImg}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarInitial}>
                    {player.name?.[0] || '?'}
                  </Text>
                </View>
              )}
            </View>

            {/* Jersey number badge */}
            <View style={styles.jerseyBadge}>
              <Text style={styles.jerseyNum}>
                {player.jerseyNumber ?? '--'}
              </Text>
            </View>

            {/* Player name */}
            <Text style={styles.playerName} numberOfLines={1}>
              {player.name?.split(' ')[0] || '?'}
            </Text>
          </View>
        );
      })}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  pitch: {
    position: 'relative',
    overflow: 'hidden',
  },

  /* Grass stripes */
  grassStripe: {
    position: 'absolute',
    left: 0,
    right: 0,
  },

  /* Pitch markings */
  midLine: {
    position: 'absolute',
    top: '50%',
    left: '10%',
    right: '10%',
    height: 1.5,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  centerCircle: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: PITCH_WIDTH * 0.22,
    height: PITCH_WIDTH * 0.22,
    borderRadius: PITCH_WIDTH * 0.11,
    marginLeft: -(PITCH_WIDTH * 0.11),
    marginTop: -(PITCH_WIDTH * 0.11),
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  topBox: {
    position: 'absolute',
    top: 0,
    left: '22%',
    right: '22%',
    height: '16%',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
    borderTopWidth: 0,
  },
  bottomBox: {
    position: 'absolute',
    bottom: 0,
    left: '22%',
    right: '22%',
    height: '16%',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
    borderBottomWidth: 0,
  },
  topGoal: {
    position: 'absolute',
    top: 0,
    left: '35%',
    right: '35%',
    height: '6%',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
    borderTopWidth: 0,
  },
  bottomGoal: {
    position: 'absolute',
    bottom: 0,
    left: '35%',
    right: '35%',
    height: '6%',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
    borderBottomWidth: 0,
  },

  /* Player wrapper */
  playerWrap: {
    position: 'absolute',
    width: AVATAR_SIZE,
    alignItems: 'center',
    zIndex: 10,
  },

  /* Avatar with colored ring */
  avatarRing: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 3,
    borderColor: '#D946EF',
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.15)',
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
    fontSize: rf(18),
    fontWeight: '900',
    color: '#FFFFFF',
  },

  /* Jersey badge */
 jerseyBadge: {
    position: 'absolute',
    bottom: vs(14),
    right: -s(2),
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: BADGE_SIZE / 2,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  
  jerseyNum: {
    fontSize: rf(9),
    fontWeight: '900',
    color: '#0F172A',
  },

  /* Player name */
 playerName: {
    fontSize: rf(10),
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: vs(2),
    width: AVATAR_SIZE + s(16),
  },
});