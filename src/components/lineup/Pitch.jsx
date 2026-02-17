import React from "react";
import { View, StyleSheet, TouchableOpacity, Image } from "react-native";
import { FORMATIONS } from "./FormationMap";

export default function Pitch({
  formation,
  lineup,
  selectedPlayer,
  onSlotPress,
}) {
  const positions = FORMATIONS[formation] || [];

  return (
    <View style={styles.pitchWrapper}>
      <View style={styles.pitch}>

        {/* Mid line */}
        <View style={styles.midLine} />

        {/* Center circle */}
        <View style={styles.centerCircle} />

        {/* Penalty boxes */}
        <View style={styles.topBox} />
        <View style={styles.bottomBox} />

        {positions.map((pos) => {
          const player = lineup[pos.key];

          return (
            <TouchableOpacity
              key={pos.key}
              activeOpacity={0.85}
              style={[
                styles.slot,
                {
                  top: pos.top,
                  left: pos.left,
                  borderColor: player
                    ? "#fff"
                    : selectedPlayer
                    ? "#60A5FA"
                    : "rgba(255,255,255,0.6)",
                },
              ]}
              onPress={() => onSlotPress(pos.key)}
            >
              {player ? (
                <Image
                  source={{ uri: player.profileImageUrl }}
                  style={styles.avatar}
                />
              ) : (
                <View style={styles.emptyDot} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pitchWrapper: {
    alignItems: "center",
    marginVertical: 16,
  },

  pitch: {
    height: 430,
    width: "92%",
    borderRadius: 26,
    backgroundColor: "#166534",
    overflow: "hidden",
    elevation: 6,
  },

  /* FIELD MARKINGS */

  midLine: {
    position: "absolute",
    top: "50%",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.5)",
  },

  centerCircle: {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: 90,
    height: 90,
    marginLeft: -45,
    marginTop: -45,
    borderRadius: 45,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
  },

  topBox: {
    position: "absolute",
    top: -10,
    left: "25%",
    width: "50%",
    height: 70,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
  },

  bottomBox: {
    position: "absolute",
    bottom: -10,
    left: "25%",
    width: "50%",
    height: 70,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
  },

  /* PLAYER SLOT */

  slot: {
    position: "absolute",
    width: 64,
    height: 64,
    marginLeft: -32,
    marginTop: -32,
    borderRadius: 32,
    borderWidth: 1,
    backgroundColor: "rgba(15,23,42,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },

  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
  },

  emptyDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "rgba(255,255,255,0.6)",
  },
});
