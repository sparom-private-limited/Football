import React from "react";
import { TouchableOpacity, View, Text, StyleSheet, Image } from "react-native";
import { s, vs, ms, rf } from "../../utils/responsive";

export default function PlayerSlot({ player, highlighted, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      <View
        style={[
          styles.slot,
          highlighted && styles.highlighted,
          player && styles.filled,
        ]}
      >
        {player && (
          <>
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
          </>
        )}
      </View>

      {player && (
        <Text style={styles.name} numberOfLines={1}>
          {player.name}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  slot: {
    width: s(58),
    height: s(58),
    borderRadius: s(29),
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#CBD5E1",
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  highlighted: {
    borderColor: "#2563EB",
    backgroundColor: "rgba(37,99,235,0.15)",
  },
  filled: {
    borderWidth: 0,
    backgroundColor: "#1D4ED8",
  },
  avatar: {
    width: s(58),
    height: s(58),
    borderRadius: s(29),
  },
  initial: {
    color: "#fff",
    fontSize: ms(18),
    fontWeight: "700",
  },
  name: {
    marginTop: vs(4),
    width: s(70),
    fontSize: rf(10),
    textAlign: "center",
    color: "#F8FAFC",
  },
});
