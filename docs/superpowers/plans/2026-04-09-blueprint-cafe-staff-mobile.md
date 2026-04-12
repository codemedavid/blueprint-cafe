# Blueprint Cafe Staff Mobile Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an Android-first Expo staff app that uses Convex to show live Blueprint Cafe orders and lets staff move orders through the kitchen workflow behind a temporary password gate.

**Architecture:** Keep the existing Vite web app as the customer ordering surface and add a separate Expo app at `apps/blueprint-cafe-staff`. Extend the current Convex `orders` model with a bounded kitchen status workflow, then connect the mobile app to Convex queries and mutations for a real-time board and order detail view. Keep the mobile authentication layer isolated and temporary so real staff auth can replace it later without touching the order screens.

**Tech Stack:** Expo (latest at implementation time), React Native, TypeScript, Convex, AsyncStorage, React Navigation, Jest Expo, React Native Testing Library, Vitest

---

## File Structure

### Existing files to modify

- `package.json`
  - Keep the root web app scripts intact; add only minimal helper scripts if needed for shared verification.
- `convex/orderFields.ts`
  - Widen the order status validator from a single literal to the full kitchen workflow union.
- `convex/schema.ts`
  - Add the indexes required for active-order reads and detail lookup.
- `convex/orders.ts`
  - Keep `createOrder` behavior for web checkout, and add list/detail/update functions for staff operations.
- `src/lib/orders.test.ts`
  - Extend regression coverage so the web checkout contract still creates `pending` orders after the schema change.

### New backend files

- `convex/orderStatus.ts`
  - Centralize the status list, validator, transition helper, and active-status predicate.
- `convex/orders.test.ts`
  - Cover status transitions and query shaping at the function/helper level if testable in-repo without a full Convex harness.

### New Expo app files

- `apps/blueprint-cafe-staff/package.json`
  - Expo app dependencies and scripts.
- `apps/blueprint-cafe-staff/app.json`
  - Expo configuration and environment bridge.
- `apps/blueprint-cafe-staff/babel.config.js`
  - Expo Babel configuration.
- `apps/blueprint-cafe-staff/tsconfig.json`
  - TypeScript config for the mobile app.
- `apps/blueprint-cafe-staff/App.tsx`
  - Root provider composition and app shell.
- `apps/blueprint-cafe-staff/src/lib/convex.ts`
  - Convex client setup using Expo environment values.
- `apps/blueprint-cafe-staff/src/lib/auth.ts`
  - AsyncStorage-backed temporary staff auth helpers.
- `apps/blueprint-cafe-staff/src/types/orders.ts`
  - Mobile-safe order/status types shared across screens.
- `apps/blueprint-cafe-staff/src/navigation/AppNavigator.tsx`
  - Stack navigation for login, board, and detail flows.
- `apps/blueprint-cafe-staff/src/providers/AuthProvider.tsx`
  - Authentication state boundary for the mobile app.
- `apps/blueprint-cafe-staff/src/screens/LoginScreen.tsx`
  - Temporary password entry screen.
- `apps/blueprint-cafe-staff/src/screens/OrdersBoardScreen.tsx`
  - Real-time grouped board of active orders.
- `apps/blueprint-cafe-staff/src/screens/OrderDetailScreen.tsx`
  - Detailed order view with status actions.
- `apps/blueprint-cafe-staff/src/components/OrderCard.tsx`
  - Compact board card UI for one order.
- `apps/blueprint-cafe-staff/src/components/StatusColumn.tsx`
  - Group container for one active status.
- `apps/blueprint-cafe-staff/src/components/LoadingState.tsx`
  - Shared loading state UI.
- `apps/blueprint-cafe-staff/src/components/ErrorState.tsx`
  - Shared error/offline state UI.
- `apps/blueprint-cafe-staff/src/hooks/useStaffOrders.ts`
  - Query adapter for grouped active orders.
- `apps/blueprint-cafe-staff/src/hooks/useOrderDetail.ts`
  - Query adapter for a single order.
- `apps/blueprint-cafe-staff/src/hooks/useOrderActions.ts`
  - Mutation adapter for status transitions.
- `apps/blueprint-cafe-staff/src/constants/theme.ts`
  - Shared mobile colors/spacing/typography tokens.

### New Expo app tests

- `apps/blueprint-cafe-staff/jest.config.js`
  - Jest Expo test config.
- `apps/blueprint-cafe-staff/jest.setup.ts`
  - Native test setup and mocks.
- `apps/blueprint-cafe-staff/src/lib/auth.test.ts`
  - Temporary auth persistence tests.
- `apps/blueprint-cafe-staff/src/screens/LoginScreen.test.tsx`
  - Login behavior tests.
- `apps/blueprint-cafe-staff/src/screens/OrdersBoardScreen.test.tsx`
  - Real-time board rendering state tests.
- `apps/blueprint-cafe-staff/src/screens/OrderDetailScreen.test.tsx`
  - Detail rendering and action-button state tests.

## Task 1: Scaffold The Expo Staff App

**Files:**
- Create: `apps/blueprint-cafe-staff/package.json`
- Create: `apps/blueprint-cafe-staff/app.json`
- Create: `apps/blueprint-cafe-staff/babel.config.js`
- Create: `apps/blueprint-cafe-staff/tsconfig.json`
- Create: `apps/blueprint-cafe-staff/App.tsx`
- Create: `apps/blueprint-cafe-staff/src/constants/theme.ts`
- Create: `apps/blueprint-cafe-staff/src/lib/convex.ts`
- Create: `apps/blueprint-cafe-staff/jest.config.js`
- Create: `apps/blueprint-cafe-staff/jest.setup.ts`

- [ ] **Step 1: Generate the Expo app with the latest template**

Run:

```bash
npx create-expo-app@latest apps/blueprint-cafe-staff --template blank-typescript
```

Expected: Expo creates the app directory with `package.json`, `app.json`, `babel.config.js`, `tsconfig.json`, and starter `App.tsx`.

- [ ] **Step 2: Add the mobile dependencies and test tooling**

Run:

```bash
cd apps/blueprint-cafe-staff
npm install convex @react-native-async-storage/async-storage @react-navigation/native @react-navigation/native-stack react-native-safe-area-context react-native-screens
npm install -D jest-expo @testing-library/react-native @testing-library/jest-native react-test-renderer
```

Expected: `package.json` contains the runtime and test dependencies needed for Convex, navigation, storage, and screen tests.

- [ ] **Step 3: Replace the starter app shell with the shared provider entry point**

Update `apps/blueprint-cafe-staff/App.tsx`:

```tsx
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ConvexProvider } from 'convex/react';
import { convex } from './src/lib/convex';
import { AuthProvider } from './src/providers/AuthProvider';
import { AppNavigator } from './src/navigation/AppNavigator';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ConvexProvider client={convex}>
          <AuthProvider>
            <AppNavigator />
          </AuthProvider>
        </ConvexProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
```

- [ ] **Step 4: Configure the mobile Convex client**

Create `apps/blueprint-cafe-staff/src/lib/convex.ts`:

```ts
import { ConvexReactClient } from 'convex/react';

const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL;

if (!convexUrl) {
  throw new Error('Missing Expo environment variable: EXPO_PUBLIC_CONVEX_URL');
}

export const convex = new ConvexReactClient(convexUrl);
```

- [ ] **Step 5: Add Jest Expo configuration before feature work**

Create `apps/blueprint-cafe-staff/jest.config.js`:

```js
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|expo|@expo|@react-navigation|convex)/)',
  ],
};
```

Create `apps/blueprint-cafe-staff/jest.setup.ts`:

```ts
import '@testing-library/jest-native/extend-expect';
```

- [ ] **Step 6: Verify the scaffold builds and tests boot**

Run:

```bash
cd apps/blueprint-cafe-staff
npx tsc --noEmit
npm test -- --watch=false
```

Expected: TypeScript exits cleanly, and Jest starts successfully even if there are zero passing app tests yet.

- [ ] **Step 7: Commit the scaffold**

Run:

```bash
git add apps/blueprint-cafe-staff
git commit -m "feat: scaffold expo staff app"
```

## Task 2: Extend Convex Orders For Kitchen Workflow

**Files:**
- Create: `convex/orderStatus.ts`
- Modify: `convex/orderFields.ts`
- Modify: `convex/schema.ts`
- Modify: `convex/orders.ts`
- Test: `src/lib/orders.test.ts`
- Test: `convex/orders.test.ts`

- [ ] **Step 1: Add a focused regression test for the widened status model**

Append to `src/lib/orders.test.ts`:

```ts
it('keeps new checkout submissions on pending after mobile status expansion', () => {
  const order = buildOrderSubmission({
    cartItems: [sampleCartItem],
    customerName: 'Blueprint Tester',
    contactNumber: '09170000000',
    serviceType: 'dine-in',
    pickupTimeSelection: '10',
    customPickupTime: '',
    paymentMethodId: 'cash',
    paymentMethodName: 'Cash',
    notes: '',
    subtotal: 230,
    serviceChargeEnabled: false,
    serviceChargeLabel: '',
    serviceChargePercentage: 0,
    serviceChargeAmount: 0,
    total: 230,
  });

  expect(order.status).toBe('pending');
});
```

- [ ] **Step 2: Run the web regression test first**

Run:

```bash
npm test -- --run src/lib/orders.test.ts
```

Expected: PASS before backend changes, proving the existing checkout helper still produces `pending`.

- [ ] **Step 3: Create centralized status helpers**

Create `convex/orderStatus.ts`:

```ts
import { v } from 'convex/values';

export const orderStatuses = ['pending', 'preparing', 'ready', 'completed', 'cancelled'] as const;

export type OrderStatus = (typeof orderStatuses)[number];

export const orderStatusValidator = v.union(
  v.literal('pending'),
  v.literal('preparing'),
  v.literal('ready'),
  v.literal('completed'),
  v.literal('cancelled'),
);

const transitionMap: Record<OrderStatus, OrderStatus[]> = {
  pending: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

export const isValidOrderStatusTransition = (
  currentStatus: OrderStatus,
  nextStatus: OrderStatus,
) => transitionMap[currentStatus].includes(nextStatus);

export const activeOrderStatuses: OrderStatus[] = ['pending', 'preparing', 'ready'];
```

- [ ] **Step 4: Use the shared validator in the order schema**

Update `convex/orderFields.ts`:

```ts
import { v } from 'convex/values';
import { orderStatusValidator } from './orderStatus';

export const orderFields = {
  status: orderStatusValidator,
  source: v.literal('web_checkout'),
  // keep the remaining fields unchanged
};
```

Update `convex/schema.ts`:

```ts
import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';
import { orderFields } from './orderFields';

export default defineSchema({
  orders: defineTable({
    ...orderFields,
    submittedAt: v.number(),
  })
    .index('by_status_submittedAt', ['status', 'submittedAt'])
    .index('by_submittedAt', ['submittedAt']),
});
```

- [ ] **Step 5: Add list/detail/update functions to `convex/orders.ts`**

Update `convex/orders.ts`:

```ts
import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { orderFields } from './orderFields';
import {
  activeOrderStatuses,
  isValidOrderStatusTransition,
  orderStatusValidator,
} from './orderStatus';

export const createOrder = mutation({
  args: {
    order: v.object(orderFields),
  },
  handler: async (ctx, { order }) => {
    const orderId = await ctx.db.insert('orders', {
      ...order,
      status: 'pending',
      submittedAt: Date.now(),
    });

    return { orderId };
  },
});

export const listActiveOrders = query({
  args: {},
  handler: async (ctx) => {
    const groups = await Promise.all(
      activeOrderStatuses.map(async (status) => {
        const orders = await ctx.db
          .query('orders')
          .withIndex('by_status_submittedAt', (q) => q.eq('status', status))
          .order('desc')
          .take(50);

        return [status, orders] as const;
      }),
    );

    return Object.fromEntries(groups);
  },
});

export const getOrderById = query({
  args: { orderId: v.id('orders') },
  handler: async (ctx, { orderId }) => {
    return await ctx.db.get(orderId);
  },
});

export const updateOrderStatus = mutation({
  args: {
    orderId: v.id('orders'),
    status: orderStatusValidator,
  },
  handler: async (ctx, { orderId, status }) => {
    const existingOrder = await ctx.db.get(orderId);

    if (!existingOrder) {
      throw new Error('Order not found');
    }

    if (!isValidOrderStatusTransition(existingOrder.status, status)) {
      throw new Error(`Invalid status transition from ${existingOrder.status} to ${status}`);
    }

    await ctx.db.patch(orderId, { status });
    return { ok: true };
  },
});
```

- [ ] **Step 6: Add pure transition tests for the new helper**

Create `convex/orders.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { isValidOrderStatusTransition } from './orderStatus';

describe('isValidOrderStatusTransition', () => {
  it('allows forward kitchen transitions', () => {
    expect(isValidOrderStatusTransition('pending', 'preparing')).toBe(true);
    expect(isValidOrderStatusTransition('preparing', 'ready')).toBe(true);
    expect(isValidOrderStatusTransition('ready', 'completed')).toBe(true);
  });

  it('allows cancelling active orders and blocks terminal regressions', () => {
    expect(isValidOrderStatusTransition('pending', 'cancelled')).toBe(true);
    expect(isValidOrderStatusTransition('completed', 'pending')).toBe(false);
    expect(isValidOrderStatusTransition('cancelled', 'ready')).toBe(false);
  });
});
```

- [ ] **Step 7: Run backend and web tests**

Run:

```bash
npm test -- --run src/lib/orders.test.ts convex/orders.test.ts
```

Expected: PASS with the new status helper coverage and the original checkout regression still green.

- [ ] **Step 8: Regenerate Convex types and commit**

Run:

```bash
npx convex dev --once
git add convex src/lib/orders.test.ts
git commit -m "feat: add kitchen order workflow to convex"
```

Expected: Convex regenerates `_generated` files and the commit contains the widened status model plus new query/mutation APIs.

## Task 3: Add Mobile Auth Boundary And Navigation

**Files:**
- Create: `apps/blueprint-cafe-staff/src/lib/auth.ts`
- Create: `apps/blueprint-cafe-staff/src/lib/auth.test.ts`
- Create: `apps/blueprint-cafe-staff/src/providers/AuthProvider.tsx`
- Create: `apps/blueprint-cafe-staff/src/navigation/AppNavigator.tsx`
- Create: `apps/blueprint-cafe-staff/src/screens/LoginScreen.tsx`
- Test: `apps/blueprint-cafe-staff/src/screens/LoginScreen.test.tsx`

- [ ] **Step 1: Write the auth helper test first**

Create `apps/blueprint-cafe-staff/src/lib/auth.test.ts`:

```ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { clearStaffSession, loadStaffSession, saveStaffSession } from './auth';

describe('staff auth storage', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('persists and clears the temporary staff session', async () => {
    expect(await loadStaffSession()).toBe(false);

    await saveStaffSession();
    expect(await loadStaffSession()).toBe(true);

    await clearStaffSession();
    expect(await loadStaffSession()).toBe(false);
  });
});
```

- [ ] **Step 2: Run the failing auth helper test**

Run:

```bash
cd apps/blueprint-cafe-staff
npm test -- --watch=false src/lib/auth.test.ts
```

Expected: FAIL because `src/lib/auth.ts` does not exist yet.

- [ ] **Step 3: Implement the auth storage helper**

Create `apps/blueprint-cafe-staff/src/lib/auth.ts`:

```ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const STAFF_SESSION_KEY = 'blueprint-cafe-staff-session';

export async function loadStaffSession() {
  return (await AsyncStorage.getItem(STAFF_SESSION_KEY)) === 'true';
}

export async function saveStaffSession() {
  await AsyncStorage.setItem(STAFF_SESSION_KEY, 'true');
}

export async function clearStaffSession() {
  await AsyncStorage.removeItem(STAFF_SESSION_KEY);
}
```

- [ ] **Step 4: Add the auth provider and navigator shell**

Create `apps/blueprint-cafe-staff/src/providers/AuthProvider.tsx`:

```tsx
import { createContext, useContext, useEffect, useState } from 'react';
import { clearStaffSession, loadStaffSession, saveStaffSession } from '../lib/auth';

type AuthContextValue = {
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    loadStaffSession()
      .then(setIsAuthenticated)
      .finally(() => setIsLoading(false));
  }, []);

  async function signIn() {
    await saveStaffSession();
    setIsAuthenticated(true);
  }

  async function signOut() {
    await clearStaffSession();
    setIsAuthenticated(false);
  }

  return (
    <AuthContext.Provider value={{ isLoading, isAuthenticated, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return value;
}
```

Create `apps/blueprint-cafe-staff/src/navigation/AppNavigator.tsx`:

```tsx
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../providers/AuthProvider';
import { LoadingState } from '../components/LoadingState';
import { LoginScreen } from '../screens/LoginScreen';
import { OrdersBoardScreen } from '../screens/OrdersBoardScreen';
import { OrderDetailScreen } from '../screens/OrderDetailScreen';

export type RootStackParamList = {
  Login: undefined;
  OrdersBoard: undefined;
  OrderDetail: { orderId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return <LoadingState label="Loading staff session..." />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {isAuthenticated ? (
          <>
            <Stack.Screen name="OrdersBoard" component={OrdersBoardScreen} options={{ title: 'Orders' }} />
            <Stack.Screen name="OrderDetail" component={OrderDetailScreen} options={{ title: 'Order Detail' }} />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

- [ ] **Step 5: Write the login screen test**

Create `apps/blueprint-cafe-staff/src/screens/LoginScreen.test.tsx`:

```tsx
import { fireEvent, render, screen } from '@testing-library/react-native';
import { LoginScreen } from './LoginScreen';

describe('LoginScreen', () => {
  it('shows an error for an incorrect password', async () => {
    const onSuccess = jest.fn();
    render(<LoginScreen onSuccess={onSuccess} />);

    fireEvent.changeText(screen.getByPlaceholderText('Enter staff password'), 'wrong');
    fireEvent.press(screen.getByText('Unlock Orders'));

    expect(await screen.findByText('Incorrect password')).toBeTruthy();
    expect(onSuccess).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 6: Implement the login screen against `EXPO_PUBLIC_STAFF_PASSWORD`**

Create `apps/blueprint-cafe-staff/src/screens/LoginScreen.tsx`:

```tsx
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useAuth } from '../providers/AuthProvider';

const staffPassword = process.env.EXPO_PUBLIC_STAFF_PASSWORD;

export function LoginScreen({ onSuccess }: { onSuccess?: () => void }) {
  const { signIn } = useAuth();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit() {
    if (!staffPassword || password !== staffPassword) {
      setError('Incorrect password');
      return;
    }

    setError('');
    await signIn();
    onSuccess?.();
  }

  return (
    <View>
      <Text>Blueprint Cafe Staff</Text>
      <TextInput
        placeholder="Enter staff password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      {error ? <Text>{error}</Text> : null}
      <Pressable onPress={handleSubmit}>
        <Text>Unlock Orders</Text>
      </Pressable>
    </View>
  );
}
```

- [ ] **Step 7: Run auth and login tests**

Run:

```bash
cd apps/blueprint-cafe-staff
npm test -- --watch=false src/lib/auth.test.ts src/screens/LoginScreen.test.tsx
```

Expected: PASS with session persistence covered and incorrect-password handling verified.

- [ ] **Step 8: Commit the auth boundary**

Run:

```bash
git add apps/blueprint-cafe-staff/src/lib/auth.ts apps/blueprint-cafe-staff/src/lib/auth.test.ts apps/blueprint-cafe-staff/src/providers/AuthProvider.tsx apps/blueprint-cafe-staff/src/navigation/AppNavigator.tsx apps/blueprint-cafe-staff/src/screens/LoginScreen.tsx apps/blueprint-cafe-staff/src/screens/LoginScreen.test.tsx
git commit -m "feat: add staff auth gate and navigation"
```

## Task 4: Build The Real-Time Orders Board

**Files:**
- Create: `apps/blueprint-cafe-staff/src/types/orders.ts`
- Create: `apps/blueprint-cafe-staff/src/hooks/useStaffOrders.ts`
- Create: `apps/blueprint-cafe-staff/src/components/OrderCard.tsx`
- Create: `apps/blueprint-cafe-staff/src/components/StatusColumn.tsx`
- Create: `apps/blueprint-cafe-staff/src/components/LoadingState.tsx`
- Create: `apps/blueprint-cafe-staff/src/components/ErrorState.tsx`
- Create: `apps/blueprint-cafe-staff/src/screens/OrdersBoardScreen.tsx`
- Test: `apps/blueprint-cafe-staff/src/screens/OrdersBoardScreen.test.tsx`

- [ ] **Step 1: Write the board screen test before implementation**

Create `apps/blueprint-cafe-staff/src/screens/OrdersBoardScreen.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react-native';
import { OrdersBoardScreen } from './OrdersBoardScreen';

jest.mock('../hooks/useStaffOrders', () => ({
  useStaffOrders: () => ({
    isLoading: false,
    error: null,
    groups: {
      pending: [
        {
          _id: 'order_1',
          customerName: 'Ada Lovelace',
          serviceType: 'pickup',
          total: 494.5,
          submittedAt: 1712668800000,
          items: [{ quantity: 2 }],
        },
      ],
      preparing: [],
      ready: [],
    },
  }),
}));

describe('OrdersBoardScreen', () => {
  it('renders grouped active orders', () => {
    render(<OrdersBoardScreen navigation={{ navigate: jest.fn() } as never} />);

    expect(screen.getByText('Pending')).toBeTruthy();
    expect(screen.getByText('Ada Lovelace')).toBeTruthy();
    expect(screen.getByText('Pickup')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run the failing board test**

Run:

```bash
cd apps/blueprint-cafe-staff
npm test -- --watch=false src/screens/OrdersBoardScreen.test.tsx
```

Expected: FAIL because the hook, types, and screen are not implemented yet.

- [ ] **Step 3: Add the typed order adapter and hook**

Create `apps/blueprint-cafe-staff/src/types/orders.ts`:

```ts
export type StaffOrderStatus = 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';

export type StaffOrder = {
  _id: string;
  customerName: string;
  serviceType: 'dine-in' | 'pickup' | 'delivery';
  total: number;
  submittedAt: number;
  items: Array<{ quantity: number }>;
};

export type ActiveOrderGroups = Record<'pending' | 'preparing' | 'ready', StaffOrder[]>;
```

Create `apps/blueprint-cafe-staff/src/hooks/useStaffOrders.ts`:

```ts
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import type { ActiveOrderGroups } from '../types/orders';

export function useStaffOrders(): {
  isLoading: boolean;
  error: Error | null;
  groups: ActiveOrderGroups;
} {
  const result = useQuery(api.orders.listActiveOrders);

  if (result === undefined) {
    return {
      isLoading: true,
      error: null,
      groups: { pending: [], preparing: [], ready: [] },
    };
  }

  return {
    isLoading: false,
    error: null,
    groups: result,
  };
}
```

- [ ] **Step 4: Implement focused board components**

Create `apps/blueprint-cafe-staff/src/components/OrderCard.tsx`:

```tsx
import { Pressable, Text, View } from 'react-native';
import type { StaffOrder } from '../types/orders';

export function OrderCard({
  order,
  onPress,
}: {
  order: StaffOrder;
  onPress: () => void;
}) {
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const serviceLabel = order.serviceType.charAt(0).toUpperCase() + order.serviceType.slice(1);

  return (
    <Pressable onPress={onPress}>
      <View>
        <Text>{order.customerName}</Text>
        <Text>{serviceLabel}</Text>
        <Text>{itemCount} items</Text>
        <Text>PHP {order.total.toFixed(2)}</Text>
      </View>
    </Pressable>
  );
}
```

Create `apps/blueprint-cafe-staff/src/components/StatusColumn.tsx`:

```tsx
import { Text, View } from 'react-native';
import type { StaffOrder } from '../types/orders';
import { OrderCard } from './OrderCard';

export function StatusColumn({
  label,
  orders,
  onOpenOrder,
}: {
  label: string;
  orders: StaffOrder[];
  onOpenOrder: (orderId: string) => void;
}) {
  return (
    <View>
      <Text>{label}</Text>
      {orders.map((order) => (
        <OrderCard key={order._id} order={order} onPress={() => onOpenOrder(order._id)} />
      ))}
    </View>
  );
}
```

- [ ] **Step 5: Implement loading/error states and the board screen**

Create `apps/blueprint-cafe-staff/src/components/LoadingState.tsx`:

```tsx
import { ActivityIndicator, Text, View } from 'react-native';

export function LoadingState({ label }: { label: string }) {
  return (
    <View>
      <ActivityIndicator />
      <Text>{label}</Text>
    </View>
  );
}
```

Create `apps/blueprint-cafe-staff/src/components/ErrorState.tsx`:

```tsx
import { Text, View } from 'react-native';

export function ErrorState({ label }: { label: string }) {
  return (
    <View>
      <Text>{label}</Text>
    </View>
  );
}
```

Create `apps/blueprint-cafe-staff/src/screens/OrdersBoardScreen.tsx`:

```tsx
import { ScrollView, View } from 'react-native';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import { StatusColumn } from '../components/StatusColumn';
import { useStaffOrders } from '../hooks/useStaffOrders';

export function OrdersBoardScreen({ navigation }: { navigation: any }) {
  const { isLoading, error, groups } = useStaffOrders();

  if (isLoading) {
    return <LoadingState label="Loading live orders..." />;
  }

  if (error) {
    return <ErrorState label="Unable to load orders. Check Convex connection and try again." />;
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <View style={{ gap: 16 }}>
        <StatusColumn
          label="Pending"
          orders={groups.pending}
          onOpenOrder={(orderId) => navigation.navigate('OrderDetail', { orderId })}
        />
        <StatusColumn
          label="Preparing"
          orders={groups.preparing}
          onOpenOrder={(orderId) => navigation.navigate('OrderDetail', { orderId })}
        />
        <StatusColumn
          label="Ready"
          orders={groups.ready}
          onOpenOrder={(orderId) => navigation.navigate('OrderDetail', { orderId })}
        />
      </View>
    </ScrollView>
  );
}
```

- [ ] **Step 6: Run the board test**

Run:

```bash
cd apps/blueprint-cafe-staff
npm test -- --watch=false src/screens/OrdersBoardScreen.test.tsx
```

Expected: PASS with grouped live orders rendered through the board screen.

- [ ] **Step 7: Commit the board**

Run:

```bash
git add apps/blueprint-cafe-staff/src/types/orders.ts apps/blueprint-cafe-staff/src/hooks/useStaffOrders.ts apps/blueprint-cafe-staff/src/components/OrderCard.tsx apps/blueprint-cafe-staff/src/components/StatusColumn.tsx apps/blueprint-cafe-staff/src/components/LoadingState.tsx apps/blueprint-cafe-staff/src/components/ErrorState.tsx apps/blueprint-cafe-staff/src/screens/OrdersBoardScreen.tsx apps/blueprint-cafe-staff/src/screens/OrdersBoardScreen.test.tsx
git commit -m "feat: add real-time staff orders board"
```

## Task 5: Build Order Detail And Status Actions

**Files:**
- Create: `apps/blueprint-cafe-staff/src/hooks/useOrderDetail.ts`
- Create: `apps/blueprint-cafe-staff/src/hooks/useOrderActions.ts`
- Create: `apps/blueprint-cafe-staff/src/screens/OrderDetailScreen.tsx`
- Test: `apps/blueprint-cafe-staff/src/screens/OrderDetailScreen.test.tsx`

- [ ] **Step 1: Write the detail screen test first**

Create `apps/blueprint-cafe-staff/src/screens/OrderDetailScreen.test.tsx`:

```tsx
import { fireEvent, render, screen } from '@testing-library/react-native';
import { OrderDetailScreen } from './OrderDetailScreen';

const updateStatus = jest.fn();

jest.mock('../hooks/useOrderDetail', () => ({
  useOrderDetail: () => ({
    isLoading: false,
    error: null,
    order: {
      _id: 'order_1',
      customerName: 'Ada Lovelace',
      contactNumber: '09171234567',
      serviceType: 'pickup',
      status: 'pending',
      paymentMethodName: 'GCash',
      notes: 'Less ice',
      items: [{ lineItemId: 'line_1', name: 'Iced Latte', quantity: 2, lineTotal: 460 }],
      total: 494.5,
    },
  }),
}));

jest.mock('../hooks/useOrderActions', () => ({
  useOrderActions: () => ({
    isSaving: false,
    updateStatus,
  }),
}));

describe('OrderDetailScreen', () => {
  it('shows order details and fires the next status action', async () => {
    render(
      <OrderDetailScreen route={{ params: { orderId: 'order_1' } } as never} navigation={{ goBack: jest.fn() } as never} />,
    );

    expect(screen.getByText('Ada Lovelace')).toBeTruthy();
    expect(screen.getByText('Iced Latte x2')).toBeTruthy();

    fireEvent.press(screen.getByText('Start Preparing'));

    expect(updateStatus).toHaveBeenCalledWith('order_1', 'preparing');
  });
});
```

- [ ] **Step 2: Run the failing detail test**

Run:

```bash
cd apps/blueprint-cafe-staff
npm test -- --watch=false src/screens/OrderDetailScreen.test.tsx
```

Expected: FAIL because the detail hook, action hook, and screen do not exist yet.

- [ ] **Step 3: Add the detail and mutation hooks**

Create `apps/blueprint-cafe-staff/src/hooks/useOrderDetail.ts`:

```ts
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';

export function useOrderDetail(orderId: string) {
  const order = useQuery(api.orders.getOrderById, { orderId: orderId as any });

  return {
    isLoading: order === undefined,
    error: null,
    order: order ?? null,
  };
}
```

Create `apps/blueprint-cafe-staff/src/hooks/useOrderActions.ts`:

```ts
import { useMutation } from 'convex/react';
import { useState } from 'react';
import { api } from '../../../convex/_generated/api';
import type { StaffOrderStatus } from '../types/orders';

export function useOrderActions() {
  const mutate = useMutation(api.orders.updateOrderStatus);
  const [isSaving, setIsSaving] = useState(false);

  async function updateStatus(orderId: string, status: StaffOrderStatus) {
    setIsSaving(true);
    try {
      await mutate({ orderId: orderId as any, status });
    } finally {
      setIsSaving(false);
    }
  }

  return { isSaving, updateStatus };
}
```

- [ ] **Step 4: Implement the detail screen**

Create `apps/blueprint-cafe-staff/src/screens/OrderDetailScreen.tsx`:

```tsx
import { Pressable, ScrollView, Text, View } from 'react-native';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import { useOrderActions } from '../hooks/useOrderActions';
import { useOrderDetail } from '../hooks/useOrderDetail';

function getPrimaryAction(status: string) {
  if (status === 'pending') return { label: 'Start Preparing', nextStatus: 'preparing' as const };
  if (status === 'preparing') return { label: 'Mark Ready', nextStatus: 'ready' as const };
  if (status === 'ready') return { label: 'Complete Order', nextStatus: 'completed' as const };
  return null;
}

export function OrderDetailScreen({ route, navigation }: { route: any; navigation: any }) {
  const { orderId } = route.params;
  const { isLoading, error, order } = useOrderDetail(orderId);
  const { isSaving, updateStatus } = useOrderActions();

  if (isLoading) {
    return <LoadingState label="Loading order..." />;
  }

  if (error || !order) {
    return <ErrorState label="Unable to load this order." />;
  }

  const primaryAction = getPrimaryAction(order.status);

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <View style={{ gap: 12 }}>
        <Text>{order.customerName}</Text>
        <Text>{order.contactNumber}</Text>
        <Text>{order.paymentMethodName}</Text>
        {order.notes ? <Text>{order.notes}</Text> : null}

        {order.items.map((item: any) => (
          <Text key={item.lineItemId}>
            {item.name} x{item.quantity}
          </Text>
        ))}

        {primaryAction ? (
          <Pressable
            disabled={isSaving}
            onPress={async () => {
              await updateStatus(order._id, primaryAction.nextStatus);
              navigation.goBack();
            }}
          >
            <Text>{primaryAction.label}</Text>
          </Pressable>
        ) : null}

        {order.status !== 'completed' && order.status !== 'cancelled' ? (
          <Pressable disabled={isSaving} onPress={() => updateStatus(order._id, 'cancelled')}>
            <Text>Cancel Order</Text>
          </Pressable>
        ) : null}
      </View>
    </ScrollView>
  );
}
```

- [ ] **Step 5: Run the detail tests**

Run:

```bash
cd apps/blueprint-cafe-staff
npm test -- --watch=false src/screens/OrderDetailScreen.test.tsx
```

Expected: PASS with order detail rendering and primary status action behavior verified.

- [ ] **Step 6: Commit the detail workflow**

Run:

```bash
git add apps/blueprint-cafe-staff/src/hooks/useOrderDetail.ts apps/blueprint-cafe-staff/src/hooks/useOrderActions.ts apps/blueprint-cafe-staff/src/screens/OrderDetailScreen.tsx apps/blueprint-cafe-staff/src/screens/OrderDetailScreen.test.tsx
git commit -m "feat: add order detail and kitchen status actions"
```

## Task 6: End-To-End Verification And Developer Docs

**Files:**
- Modify: `README.md`
- Modify: `package.json`

- [ ] **Step 1: Add root helper scripts for mobile verification**

Update `package.json`:

```json
{
  "scripts": {
    "test": "vitest run",
    "mobile:test": "npm --prefix apps/blueprint-cafe-staff test -- --watch=false",
    "mobile:android": "npm --prefix apps/blueprint-cafe-staff run android"
  }
}
```

- [ ] **Step 2: Document the mobile app setup**

Append to `README.md`:

```md
## Staff Mobile App

The staff app lives in `apps/blueprint-cafe-staff` and uses the same Convex deployment as the web app.

Required environment variables for Expo:

```bash
EXPO_PUBLIC_CONVEX_URL=...
EXPO_PUBLIC_STAFF_PASSWORD=...
```

Useful commands:

```bash
npm run mobile:test
npm run mobile:android
```
```

- [ ] **Step 3: Run the full verification set**

Run:

```bash
npm test -- --run src/lib/orders.test.ts convex/orders.test.ts
npm run mobile:test
cd apps/blueprint-cafe-staff
npx expo start --android
```

Expected:

- root Vitest suite passes for order helpers and status transition helpers
- Expo Jest suite passes for login, board, and detail screens
- Expo launches on Android with the login screen, live board, and detail flow available when pointed at the configured Convex deployment

- [ ] **Step 4: Commit the verification/docs pass**

Run:

```bash
git add README.md package.json
git commit -m "docs: add staff mobile app setup and scripts"
```

## Self-Review

- Spec coverage:
  - Android-first Expo app: covered by Tasks 1, 3, 4, and 5.
  - Real-time Convex-backed board/detail workflow: covered by Tasks 2, 4, and 5.
  - Temporary hardcoded password gate with local persistence: covered by Task 3.
  - Web checkout remaining on `pending`: covered by Task 2 regression tests.
  - Cross-platform-safe structure for later iPhone support: reflected in Task 1 dependency choices and navigation/provider setup.
- Placeholder scan:
  - Removed vague “implement later” language and kept each task tied to concrete files, commands, and code snippets.
- Type consistency:
  - Status values, hook names, and screen names are consistent across backend and mobile tasks. The implementation pass should replace any temporary `as any` casts in hook wiring with generated Convex id types once the Expo app imports the regenerated client types successfully.
