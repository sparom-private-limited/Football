import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation, DrawerActions, useRoute } from "@react-navigation/native";
import { useAuth } from "../../context/AuthContext";
import { roleConfig } from "../../navigation/roleConfig";
import useNavigationHelper from "../../navigation/Navigationhelper";  


export default function Header({ title, rightAction, forceBack = false }) {
const nav = useNavigationHelper();
  const route = useRoute();
  const { user } = useAuth();

  const role = user?.role;
  const defaultRoute = roleConfig[role]?.defaultRoute;

  const isHome = route.name === defaultRoute;
  const canGoBack = nav.raw.canGoBack();

  const showBack = forceBack || (!isHome && canGoBack);

  const handleLeftPress = () => {
    if (showBack && canGoBack) {
      nav.back();
    } else {
      nav.raw.dispatch(DrawerActions.openDrawer());
    }
  };

  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={handleLeftPress} style={{ width: 32 }}>
        <Text style={styles.menuIcon}>
          {showBack ? "←" : "☰"}
        </Text>
      </TouchableOpacity>

      <Text style={styles.title}>{title}</Text>

      {rightAction ? (
        <TouchableOpacity onPress={rightAction.onPress}>
          <Text style={styles.action}>{rightAction.label}</Text>
        </TouchableOpacity>
      ) : (
        <View style={{ width: 32 }} />
      )}
    </View>
  );
}



const styles = StyleSheet.create({
  header: {
    height: 60,
    marginTop:15,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  menuIcon: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1E293B",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
  },
  action: {
    color: "#1C5CFF",
    fontWeight: "600",
  },
});
