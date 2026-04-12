# Staff Order Alert Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a reliable foreground-only order alert in the staff app that vibrates, plays the bundled ringtone, and shows a local notification banner once for each newly detected order after the initial load.

**Architecture:** Keep new-order detection inside `OrdersScreen`, where the live Convex query already exists. Replace the ringtone-only helper with a single alert helper that owns foreground notification setup, Android channel creation, vibration, and queued ringtone playback so the screen stays focused on order-diff logic and the alert side effects remain testable in isolation.

**Tech Stack:** Expo SDK 54, React Native, `expo-audio`, `expo-notifications`, Jest, Testing Library

---

## File Structure

- Modify: `apps/blueprint-cafe-staff/package.json`
  - Add `expo-notifications` dependency for local foreground notification banners.
- Modify: `apps/blueprint-cafe-staff/app.json`
  - Add the `expo-notifications` config plugin alongside `expo-audio`.
- Modify: `apps/blueprint-cafe-staff/src/screens/OrdersScreen.tsx`
  - Switch the screen from ringtone-only calls to the new alert helper without changing the query-diff behavior.
- Modify: `apps/blueprint-cafe-staff/src/screens/OrdersScreen.test.tsx`
  - Keep the existing query-diff coverage, but point the screen tests at the new alert helper API and add alert-helper behavior tests.
- Modify: `apps/blueprint-cafe-staff/src/lib/ringtone.ts`
  - Convert this file into the app-local alert helper so its existing import path can remain stable, or rename its exported API while keeping the file’s responsibility focused on alerts.

### Task 1: Add Foreground Notification Dependency And Config

**Files:**
- Modify: `apps/blueprint-cafe-staff/package.json`
- Modify: `apps/blueprint-cafe-staff/app.json`

- [ ] **Step 1: Add the dependency and plugin config**

Update `apps/blueprint-cafe-staff/package.json` dependencies to include:

```json
"expo-notifications": "~0.32.12"
```

Update `apps/blueprint-cafe-staff/app.json` plugins to include:

```json
"plugins": [
  "expo-audio",
  "expo-notifications"
]
```

- [ ] **Step 2: Run install to update the lockfile**

Run: `npm install`

Expected: `package-lock.json` updates and `expo-notifications` is added without dependency resolution errors.

- [ ] **Step 3: Run typecheck to confirm config changes did not break the app**

Run: `npm run typecheck`

Expected: PASS with no TypeScript errors.

- [ ] **Step 4: Commit the dependency and config change**

```bash
git add apps/blueprint-cafe-staff/package.json apps/blueprint-cafe-staff/package-lock.json apps/blueprint-cafe-staff/app.json
git commit -m "chore: add local notification support to staff app"
```

### Task 2: Write The Failing Alert Helper Tests

**Files:**
- Modify: `apps/blueprint-cafe-staff/src/screens/OrdersScreen.test.tsx`
- Test: `apps/blueprint-cafe-staff/src/screens/OrdersScreen.test.tsx`

- [ ] **Step 1: Rename the screen mock to the new alert API**

Replace the ringtone-only mock near the top of `apps/blueprint-cafe-staff/src/screens/OrdersScreen.test.tsx`:

```ts
const mockTriggerOrderAlert = jest.fn();

jest.mock('../lib/ringtone', () => ({
  triggerOrderAlert: (...args: unknown[]) => mockTriggerOrderAlert(...args),
}));
```

Update the screen-level expectations so they assert on `mockTriggerOrderAlert` instead of `mockPlayOrderRingtone`.

- [ ] **Step 2: Add a failing helper test for vibration, local notification scheduling, and ringtone playback**

Append this new test block in `apps/blueprint-cafe-staff/src/screens/OrdersScreen.test.tsx`:

```ts
  it('triggers vibration, notification scheduling, and ringtone playback for one alert', async () => {
    const play = jest.fn();
    const seekTo = jest.fn().mockResolvedValue(undefined);
    const addListener = jest.fn((_, listener: (status: { didJustFinish: boolean }) => void) => {
      queueMicrotask(() => listener({ didJustFinish: true }));
      return { remove: jest.fn() };
    });
    const createAudioPlayer = jest.fn(() => ({
      play,
      seekTo,
      addListener,
      remove: jest.fn(),
    }));
    const setAudioModeAsync = jest.fn().mockResolvedValue(undefined);
    const setIsAudioActiveAsync = jest.fn().mockResolvedValue(undefined);
    const setNotificationHandler = jest.fn();
    const setNotificationChannelAsync = jest.fn().mockResolvedValue(undefined);
    const scheduleNotificationAsync = jest.fn().mockResolvedValue('notif-1');
    const vibrate = jest.fn();

    jest.doMock('expo-audio', () => ({
      createAudioPlayer,
      setAudioModeAsync,
      setIsAudioActiveAsync,
    }));
    jest.doMock('expo-notifications', () => ({
      AndroidImportance: { MAX: 'max' },
      setNotificationHandler,
      setNotificationChannelAsync,
      scheduleNotificationAsync,
    }));
    jest.doMock('react-native', () => {
      const actual = jest.requireActual('react-native');
      return {
        ...actual,
        Platform: { ...actual.Platform, OS: 'android' },
        Vibration: { vibrate },
      };
    });
    jest.unmock('../lib/ringtone');

    const { triggerOrderAlert } = require('../lib/ringtone') as typeof import('../lib/ringtone');

    await triggerOrderAlert();

    expect(vibrate).toHaveBeenCalledWith(500);
    expect(scheduleNotificationAsync).toHaveBeenCalledWith({
      content: {
        title: 'New order received',
        body: 'Open staff orders to review it.',
        sound: null,
      },
      trigger: null,
    });
    expect(seekTo).toHaveBeenCalledWith(0);
    expect(play).toHaveBeenCalledTimes(1);
  });
```

- [ ] **Step 3: Add a failing helper test for queued alerts and one-time notification setup**

Append this test in the same `describe` block:

```ts
  it('queues multiple alerts and configures notification setup once', async () => {
    const seekTo = jest.fn().mockResolvedValue(undefined);
    const play = jest.fn();
    const setNotificationHandler = jest.fn();
    const setNotificationChannelAsync = jest.fn().mockResolvedValue(undefined);
    const scheduleNotificationAsync = jest.fn().mockResolvedValue('notif-id');

    jest.doMock('expo-audio', () => ({
      createAudioPlayer: () => ({
        seekTo,
        play,
        addListener: jest.fn((_, listener: (status: { didJustFinish: boolean }) => void) => {
          queueMicrotask(() => listener({ didJustFinish: true }));
          return { remove: jest.fn() };
        }),
        remove: jest.fn(),
      }),
      setAudioModeAsync: jest.fn().mockResolvedValue(undefined),
      setIsAudioActiveAsync: jest.fn().mockResolvedValue(undefined),
    }));
    jest.doMock('expo-notifications', () => ({
      AndroidImportance: { MAX: 'max' },
      setNotificationHandler,
      setNotificationChannelAsync,
      scheduleNotificationAsync,
    }));
    jest.unmock('../lib/ringtone');

    const { triggerOrderAlert } = require('../lib/ringtone') as typeof import('../lib/ringtone');

    await triggerOrderAlert();
    await triggerOrderAlert();

    expect(setNotificationHandler).toHaveBeenCalledTimes(1);
    expect(setNotificationChannelAsync).toHaveBeenCalledTimes(1);
    expect(scheduleNotificationAsync).toHaveBeenCalledTimes(2);
    expect(play).toHaveBeenCalledTimes(2);
  });
```

- [ ] **Step 4: Run the focused test file and verify the new tests fail for the expected reason**

Run: `npm test -- OrdersScreen.test.tsx --runInBand`

Expected: FAIL because `triggerOrderAlert` does not exist yet and the helper does not schedule notifications or vibration.

- [ ] **Step 5: Commit the failing tests**

```bash
git add apps/blueprint-cafe-staff/src/screens/OrdersScreen.test.tsx
git commit -m "test: cover staff order alert helper behavior"
```

### Task 3: Implement The Alert Helper

**Files:**
- Modify: `apps/blueprint-cafe-staff/src/lib/ringtone.ts`
- Test: `apps/blueprint-cafe-staff/src/screens/OrdersScreen.test.tsx`

- [ ] **Step 1: Replace the helper export with a higher-level alert API**

Update `apps/blueprint-cafe-staff/src/lib/ringtone.ts` to export `triggerOrderAlert` and keep the queue:

```ts
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
const alertNotificationTitle = 'New order received';
const alertNotificationBody = 'Open staff orders to review it.';

let playbackQueue = Promise.resolve();
let audioSetupPromise: Promise<void> | null = null;
let playerPromise: Promise<AudioPlayer> | null = null;
let notificationSetupPromise: Promise<void> | null = null;
```

- [ ] **Step 2: Add one-time notification setup**

Add this function in `apps/blueprint-cafe-staff/src/lib/ringtone.ts`:

```ts
async function ensureNotificationsReady(): Promise<void> {
  if (notificationSetupPromise === null) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });

    notificationSetupPromise = (async () => {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('orders-foreground', {
          name: 'Foreground Orders',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          enableVibrate: true,
          showBadge: false,
          sound: undefined,
        });
      }
    })();
  }

  return notificationSetupPromise;
}
```

- [ ] **Step 3: Add local notification scheduling and vibration helpers**

Add these functions in `apps/blueprint-cafe-staff/src/lib/ringtone.ts`:

```ts
async function scheduleForegroundNotification(): Promise<void> {
  await ensureNotificationsReady();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: alertNotificationTitle,
      body: alertNotificationBody,
      sound: null,
    },
    trigger: null,
  });
}

function vibrateForOrderAlert(): void {
  Vibration.vibrate(500);
}
```

- [ ] **Step 4: Keep the reusable ringtone player and fold it into the alert flow**

Implement the reusable player and alert sequence in `apps/blueprint-cafe-staff/src/lib/ringtone.ts`:

```ts
async function ensureAudioReady(): Promise<void> {
  if (audioSetupPromise === null) {
    audioSetupPromise = (async () => {
      await setAudioModeAsync({
        interruptionMode: 'mixWithOthers',
        playsInSilentMode: true,
        shouldPlayInBackground: false,
      });
      await setIsAudioActiveAsync(true);
    })();
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

async function playRingtoneOnce(): Promise<void> {
  await ensureAudioReady();
  const player = await getPlayer();

  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  let subscription: { remove(): void } | undefined;

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
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
    subscription?.remove();
  }
}

async function runOrderAlert(): Promise<void> {
  vibrateForOrderAlert();
  await scheduleForegroundNotification();
  await playRingtoneOnce();
}

export function triggerOrderAlert(): Promise<void> {
  playbackQueue = playbackQueue.then(runOrderAlert, runOrderAlert);
  return playbackQueue;
}
```

- [ ] **Step 5: Run the focused test file and verify it now passes**

Run: `npm test -- OrdersScreen.test.tsx --runInBand`

Expected: PASS for the helper behavior tests and the existing screen tests.

- [ ] **Step 6: Commit the helper implementation**

```bash
git add apps/blueprint-cafe-staff/src/lib/ringtone.ts apps/blueprint-cafe-staff/src/screens/OrdersScreen.test.tsx
git commit -m "feat: add layered staff order alerts"
```

### Task 4: Switch OrdersScreen To The Alert Helper

**Files:**
- Modify: `apps/blueprint-cafe-staff/src/screens/OrdersScreen.tsx`
- Modify: `apps/blueprint-cafe-staff/src/screens/OrdersScreen.test.tsx`
- Test: `apps/blueprint-cafe-staff/src/screens/OrdersScreen.test.tsx`

- [ ] **Step 1: Update the screen import and alert call**

Change the import and loop in `apps/blueprint-cafe-staff/src/screens/OrdersScreen.tsx`:

```ts
import { triggerOrderAlert } from '../lib/ringtone';
```

and:

```ts
    for (let i = 0; i < newOrderCount; i += 1) {
      void triggerOrderAlert();
    }
```

- [ ] **Step 2: Update the screen tests to assert on the new helper name**

Make sure the screen tests in `apps/blueprint-cafe-staff/src/screens/OrdersScreen.test.tsx` consistently reference `mockTriggerOrderAlert`, including:

```ts
expect(mockTriggerOrderAlert).not.toHaveBeenCalled();
expect(mockTriggerOrderAlert).toHaveBeenCalledTimes(1);
expect(mockTriggerOrderAlert).toHaveBeenCalledTimes(2);
```

- [ ] **Step 3: Run the focused screen test file**

Run: `npm test -- OrdersScreen.test.tsx --runInBand`

Expected: PASS with the same order-diff semantics as before, now using the layered alert helper.

- [ ] **Step 4: Commit the screen wiring change**

```bash
git add apps/blueprint-cafe-staff/src/screens/OrdersScreen.tsx apps/blueprint-cafe-staff/src/screens/OrdersScreen.test.tsx
git commit -m "feat: trigger layered alerts for new staff orders"
```

### Task 5: Verify The Whole Staff App Slice

**Files:**
- Modify: `apps/blueprint-cafe-staff/package-lock.json`
- Verify: `apps/blueprint-cafe-staff/package.json`
- Verify: `apps/blueprint-cafe-staff/app.json`
- Verify: `apps/blueprint-cafe-staff/src/lib/ringtone.ts`
- Verify: `apps/blueprint-cafe-staff/src/screens/OrdersScreen.tsx`
- Verify: `apps/blueprint-cafe-staff/src/screens/OrdersScreen.test.tsx`

- [ ] **Step 1: Run the focused Jest suite one more time**

Run: `npm test -- OrdersScreen.test.tsx --runInBand`

Expected: PASS with all screen and helper tests green.

- [ ] **Step 2: Run the staff app typecheck**

Run: `npm run typecheck`

Expected: PASS with no TypeScript errors from notifications, vibration, or the alert helper.

- [ ] **Step 3: Manually verify on a physical device or emulator build**

Run one of:

```bash
npm run android
```

or

```bash
npm run ios
```

Then verify:

- initial load is silent
- one new order causes one vibration, one local banner, and one ringtone
- two newly created orders cause two queued alert sequences
- backgrounding the app suppresses the foreground alert path

- [ ] **Step 4: Commit the final verified state**

```bash
git add apps/blueprint-cafe-staff/package.json apps/blueprint-cafe-staff/package-lock.json apps/blueprint-cafe-staff/app.json apps/blueprint-cafe-staff/src/lib/ringtone.ts apps/blueprint-cafe-staff/src/screens/OrdersScreen.tsx apps/blueprint-cafe-staff/src/screens/OrdersScreen.test.tsx
git commit -m "test: verify staff order alert flow"
```
