import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

export default function RoleSelector({ role, setRole }) {
 const roles = [
  { id: "player", label: "Player", icon: "👟" },
  { id: "organiser", label: "Organiser", icon: "📋" }, // FIXED
  { id: "team", label: "Team", icon: "👥" },
];


  return (
    <View style={styles.container}>
      {roles.map((r) => {
        const isActive = role === r.id;

        return (
          <TouchableOpacity
            key={r.id}
            onPress={() => setRole(r.id)}
            style={[
              styles.button,
              {
                borderColor: isActive ? "#1C5CFF" : "#E2E8F0",
                backgroundColor: isActive ? "#1C5CFF" : "#FFF",
              },
            ]}
          >
            <Text style={[styles.icon, { color: isActive ? "#FFF" : "#475569" }]}>
              {r.icon}
            </Text>
            <Text style={[styles.label, { color: isActive ? "#FFF" : "#475569" }]}>
              {r.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    fontSize: 24,
  },
  label: {
    marginTop: 6,
    fontWeight: "600",
    fontSize: 14,
  },
});
