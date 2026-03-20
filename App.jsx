

import React, {useEffect} from 'react';
import {StatusBar} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';
import {AuthProvider} from './src/context/AuthContext';
import {useAuth} from './src/context/AuthContext';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import Entypo from 'react-native-vector-icons/Entypo';
import {
  requestNotificationPermission,
  getFCMToken,
  saveTokenToBackend,
  setupNotificationListeners,
} from './src/utils/notificationService';

Feather.loadFont();
Entypo.loadFont();
Ionicons.loadFont();
console.log('DEBUG:', __DEV__);

export const navigationRef = React.createRef();

function NotificationBootstrap() {
  const {user, loading, token} = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) return;

    let unsubscribe;

    async function initNotifications() {
      const granted = await requestNotificationPermission();
      if (!granted) return;

      const fcmToken = await getFCMToken();
      if (!fcmToken) return;

      await saveTokenToBackend(fcmToken, user._id, user.role, token); // 👈 pass token

      unsubscribe = setupNotificationListeners(navigationRef);
    }

    initNotifications();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user, loading]);

  return null;
}

export default function App() {
  
  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <SafeAreaProvider>
        <StatusBar translucent backgroundColor="transparent" />
        <AuthProvider>
          <NotificationBootstrap />
          <RootNavigator navigationRef={navigationRef} /> 
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
