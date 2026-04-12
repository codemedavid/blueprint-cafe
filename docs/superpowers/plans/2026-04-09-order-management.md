# Order Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refresh the staff order-management flow in the Expo app so it matches Blueprint Cafe’s light branding, has clearer spacing and sectioned layouts, and supports canceling orders only from `pending` and `preparing`.

**Architecture:** Keep the existing authenticated `Orders` list plus `OrderDetail` flow instead of returning to a board layout. Extend the Convex workflow to include `canceled` with a dedicated `cancelOrder` mutation, then update the shared mobile theme, tab metadata, row presentation, and detail-screen actions so the redesign and workflow rules stay consistent across the app.

**Tech Stack:** Convex, TypeScript, Expo, React Native, React Navigation, Jest Expo, React Native Testing Library, Vitest

---

## File Structure

### Existing backend files to modify

- `convex/orderStatus.ts`
  - Extend the workflow helpers to include `canceled`, keep forward-only transitions for `advanceOrderStatus`, and expose cancellation eligibility helpers.
- `convex/orderFields.ts`
  - Keep the widened order validator aligned with the expanded status union.
- `convex/schema.ts`
  - Add `canceledAt` while keeping the existing status/submittedAt index strategy.
- `convex/orders.ts`
  - Keep `createOrder`, `listBoardOrders`, and `getOrderById`, update `advanceOrderStatus` to reject terminal states, and add `cancelOrder`.
- `convex/orders.test.ts`
  - Cover `canceled` list inclusion, terminal behavior, and the new cancellation mutation.

### Existing mobile files to modify

- `apps/blueprint-cafe-staff/src/constants/theme.ts`
  - Replace the dark utility palette with Blueprint Cafe light tokens and roomier spacing.
- `apps/blueprint-cafe-staff/src/types/orders.ts`
  - Add `canceled` to shared order status types, tab metadata, status labels, and action helpers.
- `apps/blueprint-cafe-staff/src/components/OrdersStatusTabs.tsx`
  - Restyle the status tabs to match the light theme and handle the new canceled tab.
- `apps/blueprint-cafe-staff/src/components/OrdersStatusTabs.test.tsx`
  - Verify the new tab set still renders and selects correctly.
- `apps/blueprint-cafe-staff/src/components/OrderRow.tsx`
  - Redesign the row into a clearer light-theme list item with stronger separation and summary metadata.
- `apps/blueprint-cafe-staff/src/components/OrderRow.test.tsx`
  - Verify the row still renders summary info and remains detail-only.
- `apps/blueprint-cafe-staff/src/screens/OrdersScreen.tsx`
  - Rework the screen into a branded light-theme queue with stronger top spacing, header hierarchy, and better list separation.
- `apps/blueprint-cafe-staff/src/screens/OrdersScreen.test.tsx`
  - Verify `canceled` filtering, default selection behavior, and empty-state copy.
- `apps/blueprint-cafe-staff/src/screens/OrderDetailScreen.tsx`
  - Redesign the detail screen into grouped content sections and add a destructive cancel action for eligible statuses only.
- `apps/blueprint-cafe-staff/src/screens/OrderDetailScreen.test.tsx`
  - Verify cancel visibility, cancel mutation wiring, and terminal-state behavior.
- `apps/blueprint-cafe-staff/src/navigation/AppNavigator.tsx`
  - Align the login screen styling and copy with the new light-theme staff branding.
- `apps/blueprint-cafe-staff/src/navigation/AppNavigator.test.tsx`
  - Verify the updated login copy if it changes.

## Task 1: Extend The Workflow Model For Canceled Orders

**Files:**
- Modify: `convex/orderStatus.ts`
- Modify: `convex/orderFields.ts`
- Modify: `convex/schema.ts`
- Test: `convex/orders.test.ts`

- [ ] **Step 1: Write the failing workflow tests for canceled status support**

Append to `convex/orders.test.ts`:

```ts
import { BOARD_STATUS_ORDER, canCancelOrderStatus, isTerminalOrderStatus } from './orderStatus';

it('includes canceled in board status order and terminal checks', () => {
  expect(BOARD_STATUS_ORDER).toEqual([
    'pending',
    'preparing',
    'ready',
    'completed',
    'canceled',
  ]);
  expect(canCancelOrderStatus('pending')).toBe(true);
  expect(canCancelOrderStatus('preparing')).toBe(true);
  expect(canCancelOrderStatus('ready')).toBe(false);
  expect(isTerminalOrderStatus('completed')).toBe(true);
  expect(isTerminalOrderStatus('canceled')).toBe(true);
});
```

- [ ] **Step 2: Run the backend test file to verify it fails**

Run:

```bash
npx vitest run convex/orders.test.ts
```

Expected: FAIL because `orderStatus.ts` does not export `canCancelOrderStatus`, `BOARD_STATUS_ORDER` does not include `canceled`, and `isTerminalOrderStatus('canceled')` is not yet true.

- [ ] **Step 3: Update the workflow helpers and schema fields**

Update `convex/orderStatus.ts`:

```ts
import { v } from 'convex/values';

export const orderStatusValues = [
  'pending',
  'preparing',
  'ready',
  'completed',
  'canceled',
] as const;

export type OrderStatus = (typeof orderStatusValues)[number];

export const orderStatusValidator = v.union(
  v.literal('pending'),
  v.literal('preparing'),
  v.literal('ready'),
  v.literal('completed'),
  v.literal('canceled'),
);

export const BOARD_STATUS_ORDER: readonly OrderStatus[] = orderStatusValues;

export function getNextOrderStatus(status: OrderStatus): OrderStatus | null {
  switch (status) {
    case 'pending':
      return 'preparing';
    case 'preparing':
      return 'ready';
    case 'ready':
      return 'completed';
    case 'completed':
    case 'canceled':
      return null;
  }
}

export function canCancelOrderStatus(status: OrderStatus): boolean {
  return status === 'pending' || status === 'preparing';
}

export function isTerminalOrderStatus(status: OrderStatus): boolean {
  return status === 'completed' || status === 'canceled';
}
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
    startedAt: v.optional(v.number()),
    readyAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    canceledAt: v.optional(v.number()),
  }).index('by_status_and_submittedAt', ['status', 'submittedAt']),
});
```

- [ ] **Step 4: Run the backend test file again**

Run:

```bash
npx vitest run convex/orders.test.ts
```

Expected: still FAIL because `orders.ts` does not yet handle terminal canceled orders or expose `cancelOrder`.

- [ ] **Step 5: Commit the workflow-model update**

Run:

```bash
git add convex/orderStatus.ts convex/schema.ts convex/orders.test.ts
git commit -m "feat: add canceled order workflow model"
```

## Task 2: Add The Dedicated Cancel Order Mutation

**Files:**
- Modify: `convex/orders.ts`
- Modify: `convex/orders.test.ts`

- [ ] **Step 1: Write the failing cancellation tests**

Append to `convex/orders.test.ts`:

```ts
import { cancelOrder } from './orders';

it.each([
  ['pending'],
  ['preparing'],
])('cancelOrder moves %s orders to canceled and stamps canceledAt', async (status) => {
  vi.spyOn(Date, 'now').mockReturnValue(1710000000000);

  const get = vi.fn().mockResolvedValue({
    _id: 'order-1',
    status,
  });
  const patch = vi.fn().mockResolvedValue(undefined);
  const ctx = { db: { get, patch } };

  const result = await cancelOrder.handler(ctx as never, {
    orderId: 'order-1',
  });

  expect(patch).toHaveBeenCalledWith('order-1', {
    status: 'canceled',
    canceledAt: 1710000000000,
  });
  expect(result).toEqual({
    orderId: 'order-1',
    status: 'canceled',
  });
});

it.each(['ready', 'completed', 'canceled'])(
  'cancelOrder rejects %s orders',
  async (status) => {
    const get = vi.fn().mockResolvedValue({
      _id: 'order-1',
      status,
    });
    const patch = vi.fn();
    const ctx = { db: { get, patch } };

    await expect(
      cancelOrder.handler(ctx as never, {
        orderId: 'order-1',
      }),
    ).rejects.toBeInstanceOf(ConvexError);

    expect(patch).not.toHaveBeenCalled();
  },
);

it('listBoardOrders includes canceled orders after completed', async () => {
  const rowsByStatus = {
    pending: [{ _id: 'pending-1', status: 'pending' }],
    preparing: [{ _id: 'preparing-1', status: 'preparing' }],
    ready: [{ _id: 'ready-1', status: 'ready' }],
    completed: [{ _id: 'completed-1', status: 'completed' }],
    canceled: [{ _id: 'canceled-1', status: 'canceled' }],
  } as const;

  const statuses = ['pending', 'preparing', 'ready', 'completed', 'canceled'] as const;
  const observedStatuses: string[] = [];
  let callIndex = 0;

  const query = vi.fn(() => {
    const status = statuses[callIndex++];
    const take = vi.fn().mockResolvedValue(rowsByStatus[status]);
    const order = vi.fn(() => ({ take }));
    const withIndex = vi.fn((_indexName, predicate) => {
      const eq = vi.fn((field, value) => {
        if (field === 'status') {
          observedStatuses.push(value as string);
        }
        return null;
      });
      predicate({ eq });
      return { order };
    });
    return { withIndex };
  });

  const ctx = { db: { query } };
  const result = await listBoardOrders.handler(ctx as never, {});

  expect(query).toHaveBeenCalledTimes(5);
  expect(observedStatuses).toEqual(statuses);
  expect(result.at(-1)).toEqual({ _id: 'canceled-1', status: 'canceled' });
});
```

- [ ] **Step 2: Run the backend tests to verify they fail**

Run:

```bash
npx vitest run convex/orders.test.ts
```

Expected: FAIL because `cancelOrder` does not exist and `listBoardOrders` still only iterates four statuses.

- [ ] **Step 3: Implement `cancelOrder` and tighten terminal handling**

Update `convex/orders.ts`:

```ts
import { ConvexError, v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { orderFields } from './orderFields';
import {
  BOARD_STATUS_ORDER,
  canCancelOrderStatus,
  getNextOrderStatus,
  isTerminalOrderStatus,
} from './orderStatus';

const createOrderFields = {
  ...orderFields,
  status: v.literal('pending'),
};

function getAdvanceOrderPatch(status: (typeof BOARD_STATUS_ORDER)[number], now: number) {
  const nextStatus = getNextOrderStatus(status);

  if (!nextStatus) {
    return null;
  }

  if (nextStatus === 'preparing') {
    return { status: nextStatus, startedAt: now };
  }

  if (nextStatus === 'ready') {
    return { status: nextStatus, readyAt: now };
  }

  return { status: nextStatus, completedAt: now };
}

export const cancelOrder = mutation({
  args: {
    orderId: v.id('orders'),
  },
  handler: async (ctx, { orderId }) => {
    const order = await ctx.db.get(orderId);

    if (!order) {
      throw new ConvexError('Order not found');
    }

    if (!canCancelOrderStatus(order.status)) {
      throw new ConvexError('Order cannot be canceled');
    }

    await ctx.db.patch(orderId, {
      status: 'canceled',
      canceledAt: Date.now(),
    });

    return { orderId, status: 'canceled' as const };
  },
});

export const advanceOrderStatus = mutation({
  args: {
    orderId: v.id('orders'),
  },
  handler: async (ctx, { orderId }) => {
    const order = await ctx.db.get(orderId);

    if (!order) {
      throw new ConvexError('Order not found');
    }

    if (isTerminalOrderStatus(order.status)) {
      throw new ConvexError('Order is already terminal');
    }

    const patch = getAdvanceOrderPatch(order.status, Date.now());

    if (!patch) {
      throw new ConvexError('Order cannot be advanced');
    }

    await ctx.db.patch(orderId, patch);

    return { orderId, status: patch.status };
  },
});
```

- [ ] **Step 4: Run the backend tests to verify they pass**

Run:

```bash
npx vitest run convex/orders.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit the backend mutation changes**

Run:

```bash
git add convex/orders.ts convex/orders.test.ts
git commit -m "feat: add cancel order mutation"
```

## Task 3: Update Shared Mobile Status Metadata And Light Theme Tokens

**Files:**
- Modify: `apps/blueprint-cafe-staff/src/constants/theme.ts`
- Modify: `apps/blueprint-cafe-staff/src/types/orders.ts`
- Modify: `apps/blueprint-cafe-staff/src/components/OrdersStatusTabs.test.tsx`

- [ ] **Step 1: Write the failing tab test for canceled**

Update `apps/blueprint-cafe-staff/src/components/OrdersStatusTabs.test.tsx`:

```tsx
it('renders the canceled tab and allows selecting it', () => {
  const onSelect = jest.fn();

  render(
    <OrdersStatusTabs
      selectedStatus="pending"
      counts={{
        pending: 2,
        preparing: 1,
        ready: 0,
        completed: 3,
        canceled: 4,
      }}
      onSelect={onSelect}
    />,
  );

  expect(screen.getByRole('tab', { name: 'Canceled' })).toBeTruthy();

  fireEvent.press(screen.getByRole('tab', { name: 'Canceled' }));

  expect(onSelect).toHaveBeenCalledWith('canceled');
});
```

- [ ] **Step 2: Run the tabs test to verify it fails**

Run:

```bash
cd apps/blueprint-cafe-staff && npm test -- --runTestsByPath src/components/OrdersStatusTabs.test.tsx
```

Expected: FAIL because the mobile status types and tab config do not include `canceled`.

- [ ] **Step 3: Add shared status metadata and the light-theme token set**

Update `apps/blueprint-cafe-staff/src/types/orders.ts`:

```ts
import type { Id } from '../lib/convexApi';

export type StaffOrderStatus =
  | 'pending'
  | 'preparing'
  | 'ready'
  | 'completed'
  | 'canceled';

export const ORDER_STATUS_TABS: ReadonlyArray<{
  label: string;
  status: StaffOrderStatus;
}> = [
  { label: 'Pending', status: 'pending' },
  { label: 'Preparing', status: 'preparing' },
  { label: 'Ready', status: 'ready' },
  { label: 'Completed', status: 'completed' },
  { label: 'Canceled', status: 'canceled' },
];

export const ORDER_STATUS_LABELS: Record<StaffOrderStatus, string> = {
  pending: 'Pending',
  preparing: 'Preparing',
  ready: 'Ready',
  completed: 'Completed',
  canceled: 'Canceled',
};

export const NEXT_ORDER_ACTION_LABELS: Partial<Record<StaffOrderStatus, string>> = {
  pending: 'Start Preparing',
  preparing: 'Mark Ready',
  ready: 'Complete Order',
};

export function canCancelOrder(status: StaffOrderStatus) {
  return status === 'pending' || status === 'preparing';
}
```

Update `apps/blueprint-cafe-staff/src/constants/theme.ts`:

```ts
export const theme = {
  colors: {
    background: '#f7f4ee',
    surface: '#fffdf9',
    surfaceMuted: '#f1ebe1',
    surfaceElevated: '#ffffff',
    text: '#1f2937',
    muted: '#6b7280',
    primary: '#1e40af',
    primarySoft: '#dbe7ff',
    accent: '#c58a2e',
    border: '#d7d4cb',
    danger: '#b42318',
    dangerSoft: '#fde8e8',
    success: '#1f7a4d',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
  },
  radius: {
    sm: 10,
    md: 14,
    lg: 20,
    pill: 9999,
  },
} as const;
```

- [ ] **Step 4: Run the tabs test again**

Run:

```bash
cd apps/blueprint-cafe-staff && npm test -- --runTestsByPath src/components/OrdersStatusTabs.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit the shared theme and type updates**

Run:

```bash
git add apps/blueprint-cafe-staff/src/constants/theme.ts apps/blueprint-cafe-staff/src/types/orders.ts apps/blueprint-cafe-staff/src/components/OrdersStatusTabs.test.tsx
git commit -m "feat: add canceled tab metadata and light theme tokens"
```

## Task 4: Redesign The Orders List Layout

**Files:**
- Modify: `apps/blueprint-cafe-staff/src/components/OrdersStatusTabs.tsx`
- Modify: `apps/blueprint-cafe-staff/src/components/OrderRow.tsx`
- Modify: `apps/blueprint-cafe-staff/src/components/OrderRow.test.tsx`
- Modify: `apps/blueprint-cafe-staff/src/screens/OrdersScreen.tsx`
- Modify: `apps/blueprint-cafe-staff/src/screens/OrdersScreen.test.tsx`

- [ ] **Step 1: Write the failing orders-screen tests for canceled filtering and clearer queue copy**

Append to `apps/blueprint-cafe-staff/src/screens/OrdersScreen.test.tsx`:

```tsx
it('shows canceled orders when the canceled tab is selected', () => {
  mockUseQuery.mockReturnValue([
    createOrder({ _id: 'order-pending', customerName: 'Ari', status: 'pending' }),
    createOrder({ _id: 'order-canceled', customerName: 'Mina', status: 'canceled' }),
  ]);

  render(<OrdersScreen />);

  fireEvent.press(screen.getByRole('tab', { name: 'Canceled' }));

  expect(screen.getByText('Mina')).toBeTruthy();
  expect(screen.queryByText('Ari')).toBeNull();
});

it('shows the redesigned empty-state copy for the selected tab', () => {
  mockUseQuery.mockReturnValue([]);

  render(<OrdersScreen />);

  expect(screen.getByText('No pending orders right now.')).toBeTruthy();
});
```

- [ ] **Step 2: Run the orders screen test file to verify it fails**

Run:

```bash
cd apps/blueprint-cafe-staff && npm test -- --runTestsByPath src/screens/OrdersScreen.test.tsx
```

Expected: FAIL because the screen does not include the canceled tab and the empty-state copy still uses the older generic string.

- [ ] **Step 3: Implement the light-theme tabs, row, and queue screen**

Update `apps/blueprint-cafe-staff/src/components/OrdersStatusTabs.tsx`:

```tsx
const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  tab: {
    minWidth: '30%',
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  tabSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primarySoft,
  },
  label: {
    color: theme.colors.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  labelSelected: {
    color: theme.colors.primary,
  },
});
```

Update `apps/blueprint-cafe-staff/src/components/OrderRow.tsx`:

```tsx
return (
  <Pressable
    accessibilityRole="button"
    accessibilityLabel={`Open order ${order.customerName}`}
    onPress={() => onPress(order._id)}
    style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
  >
    <View style={styles.headerRow}>
      <Text style={styles.customerName}>{order.customerName}</Text>
      <Text style={styles.total}>{formatOrderCurrency(order.total)}</Text>
    </View>
    <View style={styles.metaRow}>
      <Text style={styles.meta}>{ORDER_SERVICE_TYPE_LABELS[order.serviceType]}</Text>
      <Text style={styles.dot}>•</Text>
      <Text style={styles.meta}>{order.paymentMethodName}</Text>
      <Text style={styles.dot}>•</Text>
      <Text style={styles.meta}>{order.items.length} items</Text>
    </View>
  </Pressable>
);
```

Update `apps/blueprint-cafe-staff/src/screens/OrdersScreen.tsx`:

```tsx
export function OrdersScreen() {
  const navigation = useNavigation<OrdersScreenNavigation>();
  const [selectedStatus, setSelectedStatus] = useState<StaffOrderStatus>('pending');
  const orders = useQuery(api.orders.listBoardOrders) as StaffOrderRecord[] | undefined;

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

      {orders === undefined ? <Text style={styles.statusText}>Loading orders...</Text> : null}

      {orders !== undefined ? (
        <FlatList
          contentContainerStyle={styles.list}
          data={filteredOrders}
          keyExtractor={(order) => order._id}
          renderItem={({ item }) => (
            <OrderRow
              order={item}
              onPress={(orderId) => navigation.navigate('OrderDetail', { orderId })}
            />
          )}
          ListEmptyComponent={
            <Text style={styles.statusText}>
              No {selectedStatus} orders right now.
            </Text>
          }
        />
      ) : null}
    </View>
  );
}
```

- [ ] **Step 4: Run the list-related tests**

Run:

```bash
cd apps/blueprint-cafe-staff && npm test -- --runTestsByPath src/components/OrdersStatusTabs.test.tsx src/components/OrderRow.test.tsx src/screens/OrdersScreen.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit the orders-list redesign**

Run:

```bash
git add apps/blueprint-cafe-staff/src/components/OrdersStatusTabs.tsx apps/blueprint-cafe-staff/src/components/OrderRow.tsx apps/blueprint-cafe-staff/src/components/OrderRow.test.tsx apps/blueprint-cafe-staff/src/screens/OrdersScreen.tsx apps/blueprint-cafe-staff/src/screens/OrdersScreen.test.tsx
git commit -m "feat: redesign staff orders list"
```

## Task 5: Redesign Order Detail And Add Cancel Action

**Files:**
- Modify: `apps/blueprint-cafe-staff/src/screens/OrderDetailScreen.tsx`
- Modify: `apps/blueprint-cafe-staff/src/screens/OrderDetailScreen.test.tsx`

- [ ] **Step 1: Write the failing detail-screen tests for cancel behavior**

Append to `apps/blueprint-cafe-staff/src/screens/OrderDetailScreen.test.tsx`:

```tsx
it('shows Cancel Order for pending orders and calls cancelOrder', async () => {
  const cancelOrder = jest.fn().mockResolvedValue(undefined);
  mockUseQuery.mockReturnValue(
    createOrder({
      _id: 'order-123',
      status: 'pending',
    }),
  );
  mockUseMutation
    .mockReturnValueOnce(jest.fn())
    .mockReturnValueOnce(cancelOrder);

  render(<OrderDetailScreen />);

  fireEvent.press(screen.getByRole('button', { name: 'Cancel Order' }));

  await waitFor(() => {
    expect(cancelOrder).toHaveBeenCalledWith({
      orderId: 'order-123',
    });
  });
});

it('hides Cancel Order for ready orders', () => {
  mockUseQuery.mockReturnValue(
    createOrder({
      _id: 'order-123',
      status: 'ready',
    }),
  );
  mockUseMutation.mockReturnValue(jest.fn());

  render(<OrderDetailScreen />);

  expect(screen.queryByRole('button', { name: 'Cancel Order' })).toBeNull();
});
```

- [ ] **Step 2: Run the detail-screen tests to verify they fail**

Run:

```bash
cd apps/blueprint-cafe-staff && npm test -- --runTestsByPath src/screens/OrderDetailScreen.test.tsx
```

Expected: FAIL because the detail screen does not bind `api.orders.cancelOrder`, does not render a cancel button, and still assumes only one mutation path.

- [ ] **Step 3: Implement the grouped detail layout and cancel action**

Update the `../lib/convexApi` mock in `apps/blueprint-cafe-staff/src/screens/OrderDetailScreen.test.tsx`:

```tsx
jest.mock('../lib/convexApi', () => ({
  api: {
    orders: {
      getOrderById: { _reference: 'orders.getOrderById' },
      advanceOrderStatus: { _reference: 'orders.advanceOrderStatus' },
      cancelOrder: { _reference: 'orders.cancelOrder' },
    },
  },
}));
```

Update `apps/blueprint-cafe-staff/src/screens/OrderDetailScreen.tsx`:

```tsx
const advanceOrderStatus = useMutation(api.orders.advanceOrderStatus);
const cancelOrder = useMutation(api.orders.cancelOrder);
const [isCanceling, setIsCanceling] = useState(false);

const actionLabel = order ? NEXT_ORDER_ACTION_LABELS[order.status] ?? null : null;
const showCancelAction = order ? canCancelOrder(order.status) : false;

const handleCancelOrder = async () => {
  if (!order || isCanceling || isUpdating) {
    return;
  }

  setIsCanceling(true);
  setStatusError(null);

  try {
    await cancelOrder({ orderId: order._id });
  } catch {
    setStatusError('Unable to cancel order. Please try again.');
  } finally {
    setIsCanceling(false);
  }
};

return (
  <ScrollView style={styles.screen} contentContainerStyle={styles.content} testID="order-detail-scroll">
    <View style={styles.heroCard}>
      <Text style={styles.eyebrow}>Blueprint Cafe</Text>
      <Text style={styles.title}>Order Details</Text>
      <Text style={styles.customerName}>{order.customerName}</Text>
    </View>

    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>Order Summary</Text>
      {/* existing summary rows */}
    </View>

    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>Items</Text>
      {/* existing items list */}
    </View>

    {order.notes ? (
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Notes</Text>
        <Text style={styles.value}>{order.notes}</Text>
      </View>
    ) : null}

    <View style={styles.actionCard}>
      {statusError ? <Text style={styles.error}>{statusError}</Text> : null}
      {actionLabel ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          disabled={isUpdating || isCanceling}
          onPress={handleAdvanceStatus}
          style={({ pressed }) => [
            styles.primaryAction,
            pressed && !isUpdating && !isCanceling && styles.buttonPressed,
          ]}
        >
          <Text style={styles.primaryActionText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
      {showCancelAction ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cancel Order"
          disabled={isUpdating || isCanceling}
          onPress={handleCancelOrder}
          style={({ pressed }) => [
            styles.destructiveAction,
            pressed && !isUpdating && !isCanceling && styles.buttonPressed,
          ]}
        >
          <Text style={styles.destructiveActionText}>Cancel Order</Text>
        </Pressable>
      ) : null}
    </View>
  </ScrollView>
);
```

- [ ] **Step 4: Run the detail-screen tests again**

Run:

```bash
cd apps/blueprint-cafe-staff && npm test -- --runTestsByPath src/screens/OrderDetailScreen.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit the order-detail redesign**

Run:

```bash
git add apps/blueprint-cafe-staff/src/screens/OrderDetailScreen.tsx apps/blueprint-cafe-staff/src/screens/OrderDetailScreen.test.tsx
git commit -m "feat: add cancel action to staff order details"
```

## Task 6: Align The Staff Entry Screen With The New Branding

**Files:**
- Modify: `apps/blueprint-cafe-staff/src/navigation/AppNavigator.tsx`
- Modify: `apps/blueprint-cafe-staff/src/navigation/AppNavigator.test.tsx`

- [ ] **Step 1: Write the failing navigation test for updated entry copy**

Update `apps/blueprint-cafe-staff/src/navigation/AppNavigator.test.tsx`:

```tsx
it('shows the light-theme staff orders entry copy when signed out', () => {
  const signIn = jest.fn();
  mockUseAuth.mockReturnValue({
    isAuthenticated: false,
    signIn,
  });

  render(<AppNavigator />);

  expect(screen.getByText('Blueprint Cafe')).toBeTruthy();
  expect(screen.getByText('Staff Orders')).toBeTruthy();
  expect(screen.getByText('Open the live queue for this device.')).toBeTruthy();
});
```

- [ ] **Step 2: Run the navigation test to verify it fails**

Run:

```bash
cd apps/blueprint-cafe-staff && npm test -- --runTestsByPath src/navigation/AppNavigator.test.tsx
```

Expected: FAIL because the login screen still says `Staff Login` and uses the older utility copy.

- [ ] **Step 3: Implement the branded entry screen**

Update `apps/blueprint-cafe-staff/src/navigation/AppNavigator.tsx`:

```tsx
function LoginScreen() {
  const { signIn } = useAuth();

  return (
    <View style={styles.screen}>
      <View style={styles.loginCard}>
        <Text style={styles.eyebrow}>Blueprint Cafe</Text>
        <Text style={styles.title}>Staff Orders</Text>
        <Text style={styles.body}>Open the live queue for this device.</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open Orders"
          onPress={() => {
            void signIn();
          }}
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        >
          <Text style={styles.buttonText}>Open Orders</Text>
        </Pressable>
      </View>
    </View>
  );
}
```

- [ ] **Step 4: Run the navigation test again**

Run:

```bash
cd apps/blueprint-cafe-staff && npm test -- --runTestsByPath src/navigation/AppNavigator.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit the entry-screen refresh**

Run:

```bash
git add apps/blueprint-cafe-staff/src/navigation/AppNavigator.tsx apps/blueprint-cafe-staff/src/navigation/AppNavigator.test.tsx
git commit -m "feat: refresh staff entry screen branding"
```

## Task 7: Final Verification

**Files:**
- Modify: none
- Test: `convex/orders.test.ts`
- Test: `apps/blueprint-cafe-staff/src/components/OrdersStatusTabs.test.tsx`
- Test: `apps/blueprint-cafe-staff/src/components/OrderRow.test.tsx`
- Test: `apps/blueprint-cafe-staff/src/screens/OrdersScreen.test.tsx`
- Test: `apps/blueprint-cafe-staff/src/screens/OrderDetailScreen.test.tsx`
- Test: `apps/blueprint-cafe-staff/src/navigation/AppNavigator.test.tsx`

- [ ] **Step 1: Run backend workflow verification**

Run:

```bash
npx vitest run convex/orders.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run the staff app test suite for the touched screens**

Run:

```bash
cd apps/blueprint-cafe-staff && npm test -- --runTestsByPath src/components/OrdersStatusTabs.test.tsx src/components/OrderRow.test.tsx src/screens/OrdersScreen.test.tsx src/screens/OrderDetailScreen.test.tsx src/navigation/AppNavigator.test.tsx
```

Expected: PASS.

- [ ] **Step 3: Review the final diff**

Run:

```bash
git status --short
git diff --stat
```

Expected: Only the intended backend, theme, orders list, detail screen, and navigation files are modified.

- [ ] **Step 4: Commit the verified final state**

Run:

```bash
git add convex/orderStatus.ts convex/schema.ts convex/orders.ts convex/orders.test.ts apps/blueprint-cafe-staff/src/constants/theme.ts apps/blueprint-cafe-staff/src/types/orders.ts apps/blueprint-cafe-staff/src/components/OrdersStatusTabs.tsx apps/blueprint-cafe-staff/src/components/OrdersStatusTabs.test.tsx apps/blueprint-cafe-staff/src/components/OrderRow.tsx apps/blueprint-cafe-staff/src/components/OrderRow.test.tsx apps/blueprint-cafe-staff/src/screens/OrdersScreen.tsx apps/blueprint-cafe-staff/src/screens/OrdersScreen.test.tsx apps/blueprint-cafe-staff/src/screens/OrderDetailScreen.tsx apps/blueprint-cafe-staff/src/screens/OrderDetailScreen.test.tsx apps/blueprint-cafe-staff/src/navigation/AppNavigator.tsx apps/blueprint-cafe-staff/src/navigation/AppNavigator.test.tsx
git commit -m "feat: redesign staff order management"
```

- [ ] **Step 5: Summarize outcomes**

Confirm:

```text
- Staff app uses a Blueprint Cafe light theme.
- Orders list has clearer top spacing and section separation.
- Canceled appears as a visible terminal status.
- Cancel Order is available only for pending and preparing.
- Backend and mobile tests pass.
```
