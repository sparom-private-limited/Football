import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";

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
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 20,
    elevation: 2,
  },

  right: {
    width: 44,
    alignItems: "center",
    justifyContent: "center",
  },

 left: {
  width: 44,
  alignItems: "center",
},

jerseyBadge: {
  minWidth: 28,
  height: 28,
  borderRadius: 14,
  backgroundColor: "#F1F5F9", // light gray badge
  alignItems: "center",
  justifyContent: "center",
},

jerseyText: {
  fontSize: 14,
  fontWeight: "800",
  color: "#0F172A", // dark text (VISIBLE)
},

  center: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },

  avatarWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#1E293B",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginRight: 12,
  },

  avatar: {
    width: "100%",
    height: "100%",
  },

  initial: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  info: {
    flex: 1,
  },

  name: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },

  position: {
    marginTop: 2,
    fontSize: 13,
    color: "#9CA3AF",
  },
});
