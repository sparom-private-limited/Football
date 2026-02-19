import React from "react";
import { View, StyleSheet, TouchableOpacity, Image, Dimensions } from "react-native";
import { FORMATIONS } from "./FormationMap";
import LinearGradient from "react-native-linear-gradient";
import { s, vs, ms, rf } from "../../utils/responsive";

const { width } = Dimensions.get("window");
const PITCH_HEIGHT = width * 1.25; // responsive

export default function Pitch({
  formation,
  lineup,
  selectedPlayer,
  onSlotPress,
}) {
  const positions = FORMATIONS[formation] || [];

  return (
    <View style={styles.pitchWrapper}>
     <LinearGradient
        colors={["#1F7A3A", "#166534"]}
        style={styles.pitch}
      >

         <View style={styles.grassOverlay} />

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
      </LinearGradient>
    </View>
  );
}


const styles = StyleSheet.create({
  pitchWrapper: {
    alignItems: "center",
    marginVertical: vs(16),
  },

  pitch: {
    height: PITCH_HEIGHT,
    width: "92%",
    borderRadius: ms(28),
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 12,
  },

  grassOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.03)",
  },

  /* FIELD MARKINGS */

  midLine: {
    position: "absolute",
    top: "50%",
    left: 0,
    right: 0,
    height: vs(2),
    backgroundColor: "rgba(255,255,255,0.4)",
  },

  centerCircle: {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: s(110),
    height: s(110),
    marginLeft: s(-55),
    marginTop: s(-55),
    borderRadius: s(55),
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.4)",
  },

  topBox: {
    position: "absolute",
    top: 0,
    left: "25%",
    width: "50%",
    height: vs(90),
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.4)",
  },

  bottomBox: {
    position: "absolute",
    bottom: 0,
    left: "25%",
    width: "50%",
    height: vs(90),
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.4)",
  },

  /* PLAYER SLOT */

  slot: {
    position: "absolute",
    width: s(68),
    height: s(68),
    marginLeft: s(-34),
    marginTop: s(-34),
    borderRadius: s(34),
    borderWidth: 2,
    backgroundColor: "rgba(15,23,42,0.3)",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
  },

  avatar: {
    width: s(60),
    height: s(60),
    borderRadius: s(30),
  },

  emptyDot: {
    width: s(12),
    height: s(12),
    borderRadius: s(6),
    backgroundColor: "rgba(255,255,255,0.7)",
  },
});
