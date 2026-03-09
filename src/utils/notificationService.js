import notifee, { AndroidImportance } from '@notifee/react-native';
import {
  getMessaging,
  requestPermission,
  AuthorizationStatus,  // ✅ only from firebase, removed from notifee
  getToken,
  onMessage,
  onNotificationOpenedApp,
  getInitialNotification,
} from '@react-native-firebase/messaging';

export async function requestNotificationPermission() {
  // ✅ Request via Notifee first (handles Android 13+)
  await notifee.requestPermission();

  const messaging = getMessaging();
  const authStatus = await requestPermission(messaging);
  return (
    authStatus === AuthorizationStatus.AUTHORIZED ||
    authStatus === AuthorizationStatus.PROVISIONAL
  );
}

export async function getFCMToken() {
  try {
    const messaging = getMessaging();
    const token = await getToken(messaging);
    console.log('FCM Token:', token);
    return token;
  } catch (error) {
    console.error('FCM Token Error:', error);
    return null;
  }
}

export async function saveTokenToBackend(fcmToken, userId, role, authToken) {
  try {
    const response = await fetch('http://192.168.0.140:8000/api/notifications/save-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({ token: fcmToken, role }),
    });
    const data = await response.json();
    console.log('✅ Token save response:', data);
  } catch (error) {
    console.error('Save token error:', error);
  }
}

async function displayNotification(title, body) {
  try {
    // ✅ Create channel every time (safe — won't duplicate)
    const channelId = await notifee.createChannel({
      id: 'football_app',
      name: 'Football App',
      importance: AndroidImportance.HIGH,
    });

    console.log('📲 Displaying notification via Notifee...');

    await notifee.displayNotification({
      title,
      body,
      android: {
        channelId,
        importance: AndroidImportance.HIGH,
        pressAction: { id: 'default' },
        showTimestamp: true,
      },
    });

    console.log('✅ Notifee notification displayed');
  } catch (err) {
    console.error('❌ Notifee display error:', err);
  }
}

export function setupNotificationListeners(onNotification) {
  const messaging = getMessaging();

  // Foreground — Notifee shows system notification
  const unsubscribe = onMessage(messaging, async remoteMessage => {
    console.log('🔔 Foreground notification received:', remoteMessage.notification?.title);
    await displayNotification(
      remoteMessage.notification?.title || 'Notification',
      remoteMessage.notification?.body || ''
    );
    if (onNotification) onNotification(remoteMessage);
  });

  // Background → app opened
  onNotificationOpenedApp(messaging, remoteMessage => {
    console.log('📬 Opened from background:', remoteMessage);
    if (onNotification) onNotification(remoteMessage);
  });

  // Quit state → app opened
  getInitialNotification(messaging).then(remoteMessage => {
    if (remoteMessage) {
      console.log('📬 Opened from quit state:', remoteMessage);
      if (onNotification) onNotification(remoteMessage);
    }
  });

  return unsubscribe;
}