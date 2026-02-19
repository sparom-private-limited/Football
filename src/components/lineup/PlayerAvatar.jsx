import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { s, vs, ms, rf } from '../../utils/responsive';

export default function PlayerAvatar({ player, selected, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.wrapper}>
      <View style={[styles.avatar, selected && styles.selected]}>
        {player.profileImageUrl ? (
          <Image
            source={{ uri: player.profileImageUrl }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <Text style={styles.initial}>{player.name.charAt(0)}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    marginRight: s(14),
  },
  avatar: {
    width: s(64),
    height: s(64),
    borderRadius: s(32),
    overflow: 'hidden',
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selected: {
    borderWidth: 3,
    borderColor: '#FACC15',
  },
  image: {
    width: s(64),
    height: s(64),
    borderRadius: s(32),
  },
  initial: {
    color: '#fff',
    fontWeight: '700',
    fontSize: ms(20),
  },
  name: {
    marginTop: vs(4),
    fontSize: rf(12),
    maxWidth: s(70),
    textAlign: 'center',
  },
});
