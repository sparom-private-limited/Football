// /**
//  * @format
//  */

// import 'react-native-reanimated';
// import {AppRegistry} from 'react-native';
// import App from './App';
// import {name as appName} from './app.json';

// AppRegistry.registerComponent(appName, () => App);

/**
 * @format
 */
import 'react-native-reanimated';
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import { getMessaging, setBackgroundMessageHandler } from '@react-native-firebase/messaging';

// ✅ Just register handler — FCM shows notification automatically
const messaging = getMessaging();
setBackgroundMessageHandler(messaging, async remoteMessage => {
  console.log('📬 Background message:', remoteMessage.notification?.title);
  // FCM handles showing the notification automatically in background/quit
  // Navigation happens via onNotificationOpenedApp and getInitialNotification
});

AppRegistry.registerComponent(appName, () => App);