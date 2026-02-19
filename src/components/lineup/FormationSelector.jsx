import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { s, vs, ms, rf } from "../../utils/responsive";

export default function FormationSelector({
  value,
  open,
  onToggle,
  onSelect,
  formations,
}) {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={onToggle}>
        <Text style={styles.buttonText}>{value}</Text>
      </TouchableOpacity>

      {open && (
        <View style={styles.dropdown}>
          {formations.map(f => (
            <TouchableOpacity
              key={f}
              style={styles.item}
              onPress={() => onSelect(f)}
            >
              <Text style={styles.itemText}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginTop: vs(16),
    marginBottom: vs(20),
  },
  button: {
    backgroundColor: "#1D4ED8",
    paddingHorizontal: s(24),
    paddingVertical: vs(12),
    borderRadius: ms(22),
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: rf(14),
  },
  dropdown: {
    marginTop: vs(8),
    width: s(160),
    backgroundColor: "#fff",
    borderRadius: ms(14),
    elevation: 6,
  },
  item: {
    paddingVertical: vs(12),
    alignItems: "center",
  },
  itemText: {
    fontWeight: "500",
    fontSize: rf(14),
  },
});
