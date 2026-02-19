import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { s, vs, ms, rf } from "../../utils/responsive";

export default function PlayerListRow({ player, onPress, rightIcon }) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={styles.card}
    >
      {/* LEFT COLUMN (fixed width) */}
     <View style={styles.left}>
  <View style={styles.jerseyBadge}>
    <Text style={styles.jerseyText}>
      {player.jerseyNumber ?? "--"}
    </Text>
  </View>
</View>
      {/* CENTER COLUMN (flex) */}
      <View style={styles.center}>
        <View style={styles.avatarWrap}>
          {player.profileImageUrl ? (
            <Image
              source={{ uri: player.profileImageUrl }}
              style={styles.avatar}
            />
          ) : (
            <Text style={styles.initial}>{player.name?.[0]}</Text>
          )}
        </View>

        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {player.name}
          </Text>
          <Text style={styles.position}>{player.position}</Text>
        </View>
      </View>

      {/* RIGHT COLUMN (same width as left) */}
      <View style={styles.right}>
        {rightIcon}
      </View>
    </TouchableOpacity>
  );
}


const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginHorizontal: s(16),
    marginTop: vs(12),
    paddingVertical: vs(14),
    borderRadius: ms(20),
    elevation: 2,
  },

  right: {
    width: s(44),
    alignItems: "center",
    justifyContent: "center",
  },

  left: {
    width: s(44),
    alignItems: "center",
  },

  jerseyBadge: {
    minWidth: s(28),
    height: s(28),
    borderRadius: s(14),
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },

  jerseyText: {
    fontSize: rf(14),
    fontWeight: "800",
    color: "#0F172A",
  },

  center: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },

  avatarWrap: {
    width: s(42),
    height: s(42),
    borderRadius: s(21),
    backgroundColor: "#1E293B",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginRight: s(12),
  },

  avatar: {
    width: "100%",
    height: "100%",
  },

  initial: {
    color: "#fff",
    fontSize: rf(16),
    fontWeight: "700",
  },

  info: {
    flex: 1,
  },

  name: {
    fontSize: rf(16),
    fontWeight: "700",
    color: "#0F172A",
  },

  position: {
    marginTop: vs(2),
    fontSize: rf(13),
    color: "#9CA3AF",
  },
});
