import React, {useState} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {useAuth} from '../context/AuthContext';
import BackButtonHandler from '../components/BackButtonHandler';

// Auth
import LoginPage from '../modules/auth/pages/LoginPage';
import SignupPage from '../modules/auth/pages/SignupPage';

// Drawer
import AppDrawer from './AppDrawer';

// Splash
import SplashScreen from '../screens/SplashScreen';

const RootStack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{headerShown: false}}>
      <AuthStack.Screen name="Login" component={LoginPage} />
      <AuthStack.Screen name="Signup" component={SignupPage} />
    </AuthStack.Navigator>
  );
}

export default function RootNavigator({navigationRef}) {
  const {user, loading} = useAuth();
  const [splashDone, setSplashDone] = useState(false);

  // ✅ Determine initial route
  // Always show splash first — it will navigate after video ends
  return (
    <NavigationContainer ref={navigationRef}>
      <BackButtonHandler />
      <RootStack.Navigator screenOptions={{headerShown: false}}>
        {!splashDone ? (
          // ✅ Splash screen — passes onDone so it can signal completion
          <RootStack.Screen name="Splash">
            {() => (
              <SplashScreen
                user={user}
                authLoading={loading}
                onDone={() => setSplashDone(true)}
              />
            )}
          </RootStack.Screen>
        ) : user ? (
          <RootStack.Screen name="App" component={AppDrawer} />
        ) : (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}