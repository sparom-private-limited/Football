


import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import SocketManager from "../services/SocketManager";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔁 Bootstrap (restore only)
  useEffect(() => {
    const bootstrap = async () => {
      const storedUser = await AsyncStorage.getItem("user");
      const storedToken = await AsyncStorage.getItem("token");

      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
      }
      setLoading(false);
    };

    bootstrap();
  }, []);

  // 🔌 Socket lifecycle tied to auth state
  useEffect(() => {
    if (user && token) {
      SocketManager.connect(token);
    } else {
      SocketManager.disconnect();
    }
  }, [user, token]);

  // ✅ Login
  const login = async (tokenFromApi, userData) => {
    await AsyncStorage.setItem("token", tokenFromApi);
    await AsyncStorage.setItem("user", JSON.stringify(userData));

    setToken(tokenFromApi); // 🔑 in-memory source of truth
    setUser(userData);
  };

  // ✅ Logout
  const logout = async () => {
    await AsyncStorage.multiRemove(["token", "user"]);
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);