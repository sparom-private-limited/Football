import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

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
  marginTop: 16,
  marginBottom: 20,
},
  button: {
    backgroundColor: "#1D4ED8",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 22,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
 dropdown: {
  marginTop: 8,
  width: 160,
  backgroundColor: "#fff",
  borderRadius: 14,
  elevation: 6,
},
  item: {
    paddingVertical: 12,
    alignItems: "center",
  },
  itemText: {
    fontWeight: "500",
  },
});
