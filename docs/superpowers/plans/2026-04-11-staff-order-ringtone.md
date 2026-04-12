# Staff Order Ringtone Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a foreground-only ringtone in the staff mobile app that plays once per newly received order after the initial orders query load, using the bundled `apps/blueprint-cafe-staff/ringtone.mp3` asset.

**Architecture:** Keep detection local to `OrdersScreen`, where the app already subscribes to `api.orders.listBoardOrders`. Add a small audio helper in the staff app that owns ringtone playback and serializes multiple play requests so simultaneous new orders ring one-by-one instead of overlapping. Cover the behavior with screen tests that prove the initial load stays silent and later query diffs trigger the correct number of ringtone plays.

**Tech Stack:** Expo, React Native, TypeScript, React Native Testing Library, Jest Expo, Convex, Expo audio module

---

## File Structure

### Existing files to modify

- `apps/blueprint-cafe-staff/package.json`
  - Add the Expo audio dependency needed to play bundled ringtone assets.
- `apps/blueprint-cafe-staff/src/screens/OrdersScreen.tsx`
  - Detect newly added order IDs after the first successful query result and trigger ringtone playback.
- `apps/blueprint-cafe-staff/src/screens/OrdersScreen.test.tsx`
  - Add regression coverage for initial-load silence and per-order ringtone playback on later updates.

### New files to create

- `apps/blueprint-cafe-staff/src/lib/ringtone.ts`
  - Provide a small app-local API for queued ringtone playback using `apps/blueprint-cafe-staff/ringtone.mp3`.

## Task 1: Add The Audio Dependency

**Files:**
- Modify: `apps/blueprint-cafe-staff/package.json`

- [ ] **Step 1: Write the failing environment check**

Run:

```bash
cd apps/blueprint-cafe-staff
npm test -- --watch=false src/screens/OrdersScreen.test.tsx
```

Expected: PASS or existing green test output, confirming there is currently no ringtone coverage and no audio dependency yet.

- [ ] **Step 2: Add the Expo audio package to the staff app**

Update `apps/blueprint-cafe-staff/package.json` by adding the Expo audio module used for bundled sound playback. Do not edit the version by hand; let Expo choose the SDK-compatible version.

- [ ] **Step 3: Install the dependency**

Run:

```bash
cd apps/blueprint-cafe-staff
npx expo install expo-audio
```

Expected: `package.json` and the lockfile update with the Expo-selected compatible version.

- [ ] **Step 4: Verify the dependency is installed cleanly**

Run:

```bash
cd apps/blueprint-cafe-staff
npm ls expo-audio
```

Expected: output includes a single installed `expo-audio` entry under `blueprint-cafe-staff`.

- [ ] **Step 5: Commit the dependency change**

Run:

```bash
git add apps/blueprint-cafe-staff/package.json apps/blueprint-cafe-staff/package-lock.json
git commit -m "chore: add staff app ringtone dependency"
```

## Task 2: Add A Queued Ringtone Helper

**Files:**
- Create: `apps/blueprint-cafe-staff/src/lib/ringtone.ts`

- [ ] **Step 1: Write the failing helper test through the screen boundary**

Add this test block to `apps/blueprint-cafe-staff/src/screens/OrdersScreen.test.tsx`:

```tsx
it('does not play a ringtone on the initial load', () => {
  mockUseQuery.mockReturnValue([
    createOrder({ _id: 'order-pending', customerName: 'Ari', status: 'pending' }),
  ]);

  render(<OrdersScreen />);

  expect(mockPlayOrderRingtone).not.toHaveBeenCalled();
});
```

Expected: the test fails because `mockPlayOrderRingtone` and the ringtone module do not exist yet.

- [ ] **Step 2: Run the test to verify the expected failure**

Run:

```bash
cd apps/blueprint-cafe-staff
npm test -- --watch=false src/screens/OrdersScreen.test.tsx
```

Expected: FAIL with a module or identifier error for the ringtone helper mock.

- [ ] **Step 3: Create the ringtone helper with queued playback**

Create `apps/blueprint-cafe-staff/src/lib/ringtone.ts`:

```ts
import { AudioPlayer, createAudioPlayer } from 'expo-audio';

const ringtoneSource = require('../../ringtone.mp3');

let playbackQueue = Promise.resolve();

async function playOnce(): Promise<void> {
  const player: AudioPlayer = createAudioPlayer(ringtoneSource);

  try {
    player.play();

    await new Promise<void>((resolve) => {
      const subscription = player.addListener('playbackStatusUpdate', (status) => {
        if (status.didJustFinish || status.error) {
          subscription.remove();
          resolve();
        }
      });
    });
  } finally {
    await player.remove();
  }
}

export function playOrderRingtone(): Promise<void> {
  playbackQueue = playbackQueue.then(() => playOnce(), () => playOnce());
  return playbackQueue;
}
```

- [ ] **Step 4: Re-run the screen test suite to confirm the helper now loads**

Run:

```bash
cd apps/blueprint-cafe-staff
npm test -- --watch=false src/screens/OrdersScreen.test.tsx
```

Expected: the new test still fails, but now it fails on ringtone behavior rather than a missing module.

- [ ] **Step 5: Commit the helper scaffold**

Run:

```bash
git add apps/blueprint-cafe-staff/src/lib/ringtone.ts apps/blueprint-cafe-staff/src/screens/OrdersScreen.test.tsx
git commit -m "feat: add queued staff ringtone helper"
```

## Task 3: Detect New Orders And Trigger The Ringtone

**Files:**
- Modify: `apps/blueprint-cafe-staff/src/screens/OrdersScreen.tsx`
- Test: `apps/blueprint-cafe-staff/src/screens/OrdersScreen.test.tsx`

- [ ] **Step 1: Write the failing behavior tests for later query updates**

Add these tests to `apps/blueprint-cafe-staff/src/screens/OrdersScreen.test.tsx`:

```tsx
it('plays a ringtone when one new order appears after the initial load', () => {
  mockUseQuery
    .mockReturnValueOnce([
      createOrder({ _id: 'order-1', customerName: 'Ari', status: 'pending' }),
    ])
    .mockReturnValueOnce([
      createOrder({ _id: 'order-1', customerName: 'Ari', status: 'pending' }),
      createOrder({ _id: 'order-2', customerName: 'Bea', status: 'pending' }),
    ]);

  const { rerender } = render(<OrdersScreen />);

  rerender(<OrdersScreen />);

  expect(mockPlayOrderRingtone).toHaveBeenCalledTimes(1);
});

it('plays one ringtone per new order when multiple orders appear together', () => {
  mockUseQuery
    .mockReturnValueOnce([
      createOrder({ _id: 'order-1', customerName: 'Ari', status: 'pending' }),
    ])
    .mockReturnValueOnce([
      createOrder({ _id: 'order-1', customerName: 'Ari', status: 'pending' }),
      createOrder({ _id: 'order-2', customerName: 'Bea', status: 'pending' }),
      createOrder({ _id: 'order-3', customerName: 'Cole', status: 'pending' }),
    ]);

  const { rerender } = render(<OrdersScreen />);

  rerender(<OrdersScreen />);

  expect(mockPlayOrderRingtone).toHaveBeenCalledTimes(2);
});
```

- [ ] **Step 2: Add the ringtone helper mock and run the tests to verify they fail**

Add this mock setup near the top of `apps/blueprint-cafe-staff/src/screens/OrdersScreen.test.tsx`:

```tsx
const mockPlayOrderRingtone = jest.fn();

jest.mock('../lib/ringtone', () => ({
  playOrderRingtone: () => mockPlayOrderRingtone(),
}));
```

Run:

```bash
cd apps/blueprint-cafe-staff
npm test -- --watch=false src/screens/OrdersScreen.test.tsx
```

Expected: FAIL because `OrdersScreen` does not yet diff order IDs or call `playOrderRingtone`.

- [ ] **Step 3: Implement minimal order-diff detection in the screen**

Update `apps/blueprint-cafe-staff/src/screens/OrdersScreen.tsx`:

```tsx
import { useEffect, useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from 'convex/react';

import { OrderRow } from '../components/OrderRow';
import { OrdersStatusTabs } from '../components/OrdersStatusTabs';
import { theme } from '../constants/theme';
import { api } from '../lib/convexApi';
import { playOrderRingtone } from '../lib/ringtone';
import type { RootStackParamList } from '../types/navigation';
import type { StaffOrderRecord, StaffOrderStatus, StaffOrderStatusCounts } from '../types/orders';

type OrdersScreenNavigation = NativeStackNavigationProp<RootStackParamList, 'Orders'>;

export function OrdersScreen() {
  const navigation = useNavigation<OrdersScreenNavigation>();
  const [selectedStatus, setSelectedStatus] = useState<StaffOrderStatus>('pending');
  const orders = useQuery(api.orders.listBoardOrders) as StaffOrderRecord[] | undefined;
  const hasProcessedInitialLoadRef = useRef(false);
  const previousOrderIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (orders === undefined) {
      return;
    }

    const currentIds = new Set(orders.map((order) => order._id));

    if (!hasProcessedInitialLoadRef.current) {
      previousOrderIdsRef.current = currentIds;
      hasProcessedInitialLoadRef.current = true;
      return;
    }

    const newOrderIds = [...currentIds].filter((orderId) => !previousOrderIdsRef.current.has(orderId));

    for (const _orderId of newOrderIds) {
      void playOrderRingtone();
    }

    previousOrderIdsRef.current = currentIds;
  }, [orders]);

  const counts: StaffOrderStatusCounts = {
    pending: 0,
    preparing: 0,
    ready: 0,
    completed: 0,
    canceled: 0,
  };

  for (const order of orders ?? []) {
    counts[order.status] += 1;
  }

  const filteredOrders = (orders ?? []).filter((order) => order.status === selectedStatus);

  return (
    <View style={styles.screen}>
      <View style={styles.headerBlock}>
        <Text style={styles.eyebrow}>Blueprint Cafe</Text>
        <Text style={styles.title}>Staff Orders</Text>
        <Text style={styles.subtitle}>
          Track the live queue and open any order for next-step actions.
        </Text>
      </View>

      <OrdersStatusTabs
        selectedStatus={selectedStatus}
        counts={counts}
        onSelect={setSelectedStatus}
      />

      <View style={styles.listSection}>
        {orders === undefined ? <Text style={styles.statusText}>Loading orders...</Text> : null}

        {orders !== undefined ? (
          <FlatList
            contentContainerStyle={styles.list}
            data={filteredOrders}
            keyExtractor={(order) => order._id}
            renderItem={({ item }) => (
              <OrderRow
                order={item}
                onPress={(orderId) =>
                  navigation.navigate('OrderDetail', {
                    orderId,
                  })
                }
              />
            )}
            ListEmptyComponent={
              <Text style={styles.statusText}>No {selectedStatus} orders right now.</Text>
            }
          />
        ) : null}
      </View>
    </View>
  );
}
```

- [ ] **Step 4: Run the targeted tests to verify they pass**

Run:

```bash
cd apps/blueprint-cafe-staff
npm test -- --watch=false src/screens/OrdersScreen.test.tsx
```

Expected: PASS for the initial-load silence test and both later-update ringtone tests, with existing orders-screen tests still green.

- [ ] **Step 5: Commit the screen behavior**

Run:

```bash
git add apps/blueprint-cafe-staff/src/screens/OrdersScreen.tsx apps/blueprint-cafe-staff/src/screens/OrdersScreen.test.tsx
git commit -m "feat: play ringtone for new staff orders"
```

## Task 4: Verify End-To-End App Health

**Files:**
- Modify: `apps/blueprint-cafe-staff/package.json`
- Modify: `apps/blueprint-cafe-staff/package-lock.json`
- Create: `apps/blueprint-cafe-staff/src/lib/ringtone.ts`
- Modify: `apps/blueprint-cafe-staff/src/screens/OrdersScreen.tsx`
- Modify: `apps/blueprint-cafe-staff/src/screens/OrdersScreen.test.tsx`

- [ ] **Step 1: Run the focused mobile test suite**

Run:

```bash
cd apps/blueprint-cafe-staff
npm test -- --watch=false src/screens/OrdersScreen.test.tsx
```

Expected: PASS with the ringtone regression tests and the pre-existing orders screen coverage.

- [ ] **Step 2: Run app typechecking**

Run:

```bash
cd apps/blueprint-cafe-staff
npm run typecheck
```

Expected: PASS with no TypeScript errors from the ringtone helper or screen changes.

- [ ] **Step 3: Manually verify the ringtone path**

Run the staff app, open the orders screen, and submit a new order from the customer flow.

Expected:

- the staff app stays silent when loading existing orders
- one new order causes one ringtone
- two newly created orders cause two sequential ringtones

- [ ] **Step 4: Commit the final verified state**

Run:

```bash
git add apps/blueprint-cafe-staff/package.json apps/blueprint-cafe-staff/package-lock.json apps/blueprint-cafe-staff/src/lib/ringtone.ts apps/blueprint-cafe-staff/src/screens/OrdersScreen.tsx apps/blueprint-cafe-staff/src/screens/OrdersScreen.test.tsx
git commit -m "test: verify staff ringtone behavior"
```
