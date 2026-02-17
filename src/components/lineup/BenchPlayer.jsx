import React from "react";
import { TouchableOpacity, Text, StyleSheet, Image, View } from "react-native";

export default function BenchPlayer({ player, selected, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={styles.container}
    >
      <View style={[styles.avatarWrap, selected && styles.selected]}>
        {player.profileImageUrl ? (
         <Image
  source={{ uri: player.profileImageUrl }}
  style={styles.avatar}
/>
        ) : (
          <Text style={styles.initial}>
            {player.name?.[0]}
          </Text>
        )}
      </View>

      <Text style={styles.name} numberOfLines={1}>
        {player.name}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 78,
    alignItems: "center",
    marginRight: 14,
  },
  avatarWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#1D4ED8",
    alignItems: "center",
    justifyContent: "center",
  },
  selected: {
    borderWidth: 3,
    borderColor: "#FACC15",
  },
 avatar: {
  width: 56,
  height: 56,
  borderRadius: 28,
  marginBottom: 4,
},

  initial: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
  },
  name: {
    marginTop: 6,
    fontSize: 11,
    textAlign: "center",
    color: "#0F172A",
  },
});
