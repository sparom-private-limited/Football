import React from "react";
import { View, StyleSheet } from "react-native";
import Header from "../components/Header/Header";


export default function MainLayout({ children, title="", rightAction }) {
  

  return (
    <View style={styles.container}>
      <Header title={title} rightAction={rightAction} />
      <View style={styles.content}>{children}</View>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
    
  },
});
