import {
  createAudioPlayer,
  setAudioModeAsync,
  setIsAudioActiveAsync,
  type AudioPlayer,
} from 'expo-audio';
import * as Notifications from 'expo-notifications';
import { Vibration } from 'react-native';

const ringtoneSource = require('../../ringtone.mp3');
const ringtoneTimeoutMs = 5000;
const orderAlertNotificationChannelId = 'staff-order-alerts';
const orderAlertNotificationTitle = 'New order received';
const orderAlertNotificationBody = 'Open staff orders to review it.';

let playbackQueue = Promise.resolve();
let audioSetupPromise: Promise<void> | null = null;
let playerPromise: Promise<AudioPlayer> | null = null;
let notificationSetupPromise: Promise<void> | null = null;

async function ensureAudioReady(): Promise<void> {
  if (audioSetupPromise === null) {
    audioSetupPromise = (async () => {
      await setAudioModeAsync({
        interruptionMode: 'mixWithOthers',
        playsInSilentMode: true,
        shouldPlayInBackground: false,
      });
      await setIsAudioActiveAsync(true);
    })().catch((error) => {
      audioSetupPromise = null;
      throw error;
    });
  }

  return audioSetupPromise;
}

async function getPlayer(): Promise<AudioPlayer> {
  if (playerPromise === null) {
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

      if (finalStatus !== 'granted') {
        const requestedPermissions = await Notifications.requestPermissionsAsync();
        finalStatus = requestedPermissions.status;
      }

      if (finalStatus !== 'granted') {
        throw new Error('Notification permission not granted');
      }

      await Notifications.setNotificationChannelAsync(
        orderAlertNotificationChannelId,
        {
          name: 'Staff order alerts',
          importance: Notifications.AndroidImportance.MAX,
          enableVibrate: true,
          vibrationPattern: [0, 250, 250, 250],
          showBadge: false,
        },
      );
    })().catch((error) => {
      notificationSetupPromise = null;
      throw error;
    });
  }

  return notificationSetupPromise;
}

async function scheduleOrderNotification(): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: orderAlertNotificationTitle,
      body: orderAlertNotificationBody,
      sound: null as never,
    },
    trigger: {
      channelId: orderAlertNotificationChannelId,
    },
  });
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
        if (status.didJustFinish) {
          resolve();
        }
      });
    });

    await player.seekTo(0);
    player.play();
    await playbackCompleted;
  } finally {
    cleanUp();
  }
}

async function triggerOrderAlertOnce(): Promise<void> {
  Vibration.vibrate(500);
  void ensureNotificationReady()
    .then(() => scheduleOrderNotification())
    .catch(() => undefined);
  await playRingtoneOnce();
}

export function triggerOrderAlert(): Promise<void> {
  playbackQueue = playbackQueue.then(triggerOrderAlertOnce, triggerOrderAlertOnce);
  return playbackQueue;
}

export function playOrderRingtone(): Promise<void> {
  return triggerOrderAlert();
}
