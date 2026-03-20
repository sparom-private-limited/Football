import React, {createContext, useContext, useEffect, useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SocketManager from '../services/SocketManager';

const AuthContext = createContext();

export function AuthProvider({children}) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔁 Bootstrap (restore only)
  useEffect(() => {
    const bootstrap = async () => {
      const storedUser = await AsyncStorage.getItem('user');
      const storedToken = await AsyncStorage.getItem('token');

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

  const bootstrap = async () => {
  const storedUser = await AsyncStorage.getItem("user");
  const storedToken = await AsyncStorage.getItem("token");

  if (storedUser && storedToken) {
    const parsed = JSON.parse(storedUser);

    // ✅ If old cache has no profileImage field, force re-fetch
    if (parsed.profileImage === undefined) {
      await AsyncStorage.multiRemove(["token", "user"]);
      setLoading(false);
      return; // kicks user to login screen
    }

    setUser(parsed);
    setToken(storedToken);
  }
  setLoading(false);
};

  // ✅ Login
  const login = async (tokenFromApi, userData) => {
    const enrichedUser = {
      ...userData,
      profileImage: userData?.profileImage || userData?.profileImageUrl || null,
    };

    await AsyncStorage.setItem('token', tokenFromApi);
    await AsyncStorage.setItem('user', JSON.stringify(enrichedUser));
    setToken(tokenFromApi);
    setUser(enrichedUser);
  };

  // ✅ Logout
  const logout = async () => {
    await AsyncStorage.multiRemove(['token', 'user']);
    setToken(null);
    setUser(null);
  };

  const updateUser = async (updatedFields) => {
  const updatedUser = { ...user, ...updatedFields };
  await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
  setUser(updatedUser);
};

  return (
    <AuthContext.Provider value={{user, token, login, logout, loading, updateUser}}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
