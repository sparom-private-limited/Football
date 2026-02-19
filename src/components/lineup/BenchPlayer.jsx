import React from "react";
import { TouchableOpacity, Text, StyleSheet, Image, View } from "react-native";
import { s, vs, ms, rf } from "../../utils/responsive";

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
    width: s(78),
    alignItems: "center",
    marginRight: s(14),
  },
  avatarWrap: {
    width: s(64),
    height: s(64),
    borderRadius: s(32),
    backgroundColor: "#1D4ED8",
    alignItems: "center",
    justifyContent: "center",
  },
  selected: {
    borderWidth: 3,
    borderColor: "#FACC15",
  },
  avatar: {
    width: s(56),
    height: s(56),
    borderRadius: s(28),
    marginBottom: vs(4),
  },
  initial: {
    color: "#fff",
    fontSize: ms(22),
    fontWeight: "700",
  },
  name: {
    marginTop: vs(6),
    fontSize: rf(11),
    textAlign: "center",
    color: "#0F172A",
  },
});
