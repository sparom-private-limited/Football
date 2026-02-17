import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';

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
    marginRight: 14,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden', // ✅ IMPORTANT
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selected: {
    borderWidth: 3,
    borderColor: '#FACC15',
  },
  image: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  initial: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 20,
  },
  name: {
    marginTop: 4,
    fontSize: 12,
    maxWidth: 70,
    textAlign: 'center',
  },
});
