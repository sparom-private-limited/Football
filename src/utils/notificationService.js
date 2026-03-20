import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
import {
  getMessaging,
  requestPermission,
  AuthorizationStatus,
  getToken,
  onMessage,
  onNotificationOpenedApp,
  getInitialNotification,
} from '@react-native-firebase/messaging';
import { AppState } from 'react-native';

export async function requestNotificationPermission() {
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
    const response = await fetch(
      'https://ftbl-xi.sparom.in/api/notifications/save-token',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ token: fcmToken, role }),
      },
    );
    const data = await response.json();
    console.log('✅ Token save response:', data);
  } catch (error) {
    console.error('Save token error:', error);
  }
}

async function displayNotification(title, body, data = {}) {
  try {
    const channelId = await notifee.createChannel({
      id: 'football_app',
      name: 'Football App',
      importance: AndroidImportance.HIGH,
    });

    await notifee.displayNotification({
      title,
      body,
      data,
      android: {
        channelId,
        importance: AndroidImportance.HIGH,
        pressAction: { id: 'default' },
        showTimestamp: true,
        smallIcon: 'ic_launcher', // 👈 add this
        color: '#2563EB',               // 👈 add this
      },
    });

    console.log('✅ Notifee notification displayed');
  } catch (err) {
    console.error('❌ Notifee display error:', err);
  }
}

function handleNotificationNavigation(data, navigationRef) {
  if (!navigationRef?.current) {
    console.log('❌ navigationRef not ready');
    return;
  }

  const { type, matchId, tournamentId } = data || {};
  console.log('🧭 Navigating for type:', type);

  switch (type) {

    // ✅ Match notifications → MatchDetail screen
    case 'MATCH_REQUEST':
    case 'MATCH_ACCEPTED':
    case 'MATCH_REJECTED':
    case 'MATCH_RESULT':
    case 'MATCH_STARTED':
    case 'MATCH_ENDED':
    case 'MATCH_REMINDER':
      if (matchId) {
        navigationRef.current.navigate('MatchNavigator', {
          screen: 'MatchDetail',
          params: { matchId },
        });
      }
      break;

    // ✅ Player notifications → Player profile screen
    case 'ADDED_TO_TEAM':
    case 'REMOVED_FROM_TEAM':
      navigationRef.current.navigate('ProfileNavigator', {
        screen: 'PlayerProfileView',
      });
      break;

    // ✅ Tournament notifications for ORGANISER → TournamentDetail screen
    case 'TOURNAMENT_NEW_TEAM':
      if (tournamentId) {
        navigationRef.current.navigate('TournamentNavigator', {
          screen: 'TournamentDetail',
          params: { tournamentId },
        });
      }
      break;

    // ✅ Tournament notifications for TEAM → TeamTournamentDetail screen
    case 'TOURNAMENT_JOINED':
    case 'TOURNAMENT_STARTED':
    case 'FIXTURES_GENERATED':
    case 'KNOCKOUT_ROUND_ADVANCED':
    case 'TOURNAMENT_COMPLETED':
      if (tournamentId) {
        navigationRef.current.navigate('TournamentNavigator', {
          screen: 'TeamTournamentDetail',
          params: { tournamentId },
        });
      }
      break;

      case 'ORGANISER_MATCH_RESULT':
  if (data.tournamentId) {
    navigationRef.current.navigate('TournamentNavigator', {
      screen: 'TournamentDetail',
      params: { tournamentId: data.tournamentId },
    });
  }
  break;

    default:
      console.log('No navigation for type:', type);
  }
}

export function setupNotificationListeners(navigationRef) {
  const messaging = getMessaging();

  // ✅ Foreground — show notification via Notifee
  const unsubscribeFCM = onMessage(messaging, async remoteMessage => {
    if (AppState.currentState === 'active') {
      console.log('🔔 Foreground notification:', remoteMessage.notification?.title);
      await displayNotification(
        remoteMessage.notification?.title || 'Notification',
        remoteMessage.notification?.body || '',
        remoteMessage.data || {},
      );
    }
  });

  // ✅ Foreground tap handler
  const unsubscribeNotifee = notifee.onForegroundEvent(({ type, detail }) => {
    if (type === EventType.PRESS) {
      console.log('👆 Notifee tapped, data:', detail.notification?.data);
      handleNotificationNavigation(detail.notification?.data, navigationRef);
    }
  });

  // ✅ Background tap — app minimized
  onNotificationOpenedApp(messaging, remoteMessage => {
    console.log('📬 Background tap:', remoteMessage.notification?.title);
    setTimeout(() => {
      handleNotificationNavigation(remoteMessage.data, navigationRef);
    }, 500);
  });

  // ✅ Quit state tap — app was closed
  getInitialNotification(messaging).then(remoteMessage => {
    if (remoteMessage) {
      console.log('📬 Quit state tap:', remoteMessage.notification?.title);
      setTimeout(() => {
        handleNotificationNavigation(remoteMessage.data, navigationRef);
      }, 1500);
    }
  });

  return () => {
    unsubscribeFCM();
    unsubscribeNotifee();
  };
}