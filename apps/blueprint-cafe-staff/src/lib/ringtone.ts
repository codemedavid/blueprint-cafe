import {
  createAudioPlayer,
  setAudioModeAsync,
  setIsAudioActiveAsync,
  type AudioPlayer,
} from 'expo-audio';
import * as Notifications from 'expo-notifications';
import { Platform, Vibration } from 'react-native';

const ringtoneSource = require('../../ringtone.mp3');
const ringtoneTimeoutMs = 5000;
const orderAlertNotificationChannelId = 'staff-order-alerts';
const orderAlertNotificationTitle = 'New order received';
const orderAlertNotificationBody = 'Open staff orders to review it.';

let playbackQueue = Promise.resolve();
let audioSetupPromise: Promise<void> | null = null;
let playerPromise: Promise<AudioPlayer> | null = null;
let notificationSetupPromise: Promise<void> | null = null;

function logOrderAlert(message: string, details?: Record<string, unknown>): void {
  if (!__DEV__) {
    return;
  }

  if (details === undefined) {
    console.log('[staff-order-alert]', message);
    return;
  }

  console.log('[staff-order-alert]', message, details);
}

async function ensureAudioReady(): Promise<void> {
  if (audioSetupPromise === null) {
    logOrderAlert('configuring audio session');
    audioSetupPromise = (async () => {
      if (Platform.OS === 'ios') {
        await setAudioModeAsync({
          interruptionMode: 'mixWithOthers',
          playsInSilentMode: true,
          shouldPlayInBackground: false,
        });
      }
      await setIsAudioActiveAsync(true);
      logOrderAlert('audio session ready');
    })().catch((error) => {
      logOrderAlert('audio session failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      audioSetupPromise = null;
      throw error;
    });
  }

  return audioSetupPromise;
}

async function getPlayer(): Promise<AudioPlayer> {
  if (playerPromise === null) {
    logOrderAlert('creating audio player');
    playerPromise = Promise.resolve(
      createAudioPlayer(ringtoneSource, {
        downloadFirst: true,
        keepAudioSessionActive: true,
        updateInterval: 100,
      }),
    );
  }

  return playerPromise;
}

async function ensureNotificationReady(): Promise<void> {
  if (notificationSetupPromise === null) {
    logOrderAlert('configuring notification handling', {
      platform: Platform.OS,
    });
    notificationSetupPromise = (async () => {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });

      const existingPermissions = await Notifications.getPermissionsAsync();
      let finalStatus = existingPermissions.status;
      logOrderAlert('notification permission status', {
        status: finalStatus,
      });

      if (finalStatus !== 'granted') {
        const requestedPermissions = await Notifications.requestPermissionsAsync();
        finalStatus = requestedPermissions.status;
        logOrderAlert('notification permission requested', {
          status: finalStatus,
        });
      }

      if (finalStatus !== 'granted') {
        throw new Error('Notification permission not granted');
      }

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync(
          orderAlertNotificationChannelId,
          {
            name: 'Staff order alerts',
            importance: Notifications.AndroidImportance.MAX,
            enableVibrate: true,
            vibrationPattern: [0, 250, 250, 250],
            showBadge: false,
            sound: 'default',
          },
        );
        logOrderAlert('android notification channel ready', {
          channelId: orderAlertNotificationChannelId,
        });
      }
    })().catch((error) => {
      logOrderAlert('notification setup failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      notificationSetupPromise = null;
      throw error;
    });
  }

  return notificationSetupPromise;
}

async function scheduleOrderNotification(): Promise<void> {
  logOrderAlert('scheduling foreground notification', {
    platform: Platform.OS,
  });
  await Notifications.scheduleNotificationAsync({
    content: {
      title: orderAlertNotificationTitle,
      body: orderAlertNotificationBody,
      sound: 'default',
    },
    trigger: Platform.OS === 'android'
      ? {
          channelId: orderAlertNotificationChannelId,
        }
      : null,
  });
  logOrderAlert('foreground notification scheduled');
}

async function playRingtoneOnce(): Promise<void> {
  await ensureAudioReady();
  const player = await getPlayer();

  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  let subscription: { remove(): void } | undefined;
  let cleanedUp = false;

  const cleanUp = () => {
    if (cleanedUp) {
      return;
    }

    cleanedUp = true;

    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }

    subscription?.remove();
  };

  try {
    const playbackCompleted = new Promise<void>((resolve) => {
      timeoutId = setTimeout(resolve, ringtoneTimeoutMs);
      subscription = player.addListener('playbackStatusUpdate', (status) => {
        logOrderAlert('playback status update', {
          didJustFinish: status.didJustFinish,
        });
        if (status.didJustFinish) {
          logOrderAlert('playback finished');
          resolve();
        }
      });
    });

    logOrderAlert('seeking player to start');
    await player.seekTo(0);
    logOrderAlert('starting playback');
    player.play();
    await playbackCompleted;
    logOrderAlert('playback completed');
  } finally {
    cleanUp();
  }
}

async function triggerOrderAlertOnce(): Promise<void> {
  logOrderAlert('starting alert', {
    platform: Platform.OS,
  });
  Vibration.vibrate(500);
  void ensureNotificationReady()
    .then(() => scheduleOrderNotification())
    .catch((error) => {
      logOrderAlert('notification branch skipped', {
        error: error instanceof Error ? error.message : String(error),
      });
    });
  await playRingtoneOnce();
}

export function triggerOrderAlert(): Promise<void> {
  playbackQueue = playbackQueue.then(triggerOrderAlertOnce, triggerOrderAlertOnce);
  return playbackQueue;
}

export function playOrderRingtone(): Promise<void> {
  return triggerOrderAlert();
}
