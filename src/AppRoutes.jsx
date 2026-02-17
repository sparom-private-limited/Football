import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";

import LoginPage from "../src/modules/auth/pages/LoginPage";
import SignupPage from "../src/modules/auth/pages/SignupPage";
import HomePage from "../src/screens/HomeScreen";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from AsyncStorage on app start
  useEffect(() => {
    const loadUser = async () => {
      const stored = await AsyncStorage.getItem("user");
      if (stored) setUser(JSON.parse(stored));
      setLoading(false);
    };
    loadUser();
  }, []);

  if (loading) return null; // Or splash screen

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        
        {/* If no user → show login */}
        {!user ? (
          <>
            <Stack.Screen name="Login" component={LoginPage} />
            <Stack.Screen name="Signup" component={SignupPage} />
          </>
        ) : (
          <>
            {/* Logged-in user goes to home */}
            <Stack.Screen name="Home" component={HomePage} />
          </>
        )}

      </Stack.Navigator>
    </NavigationContainer>
  );
}
