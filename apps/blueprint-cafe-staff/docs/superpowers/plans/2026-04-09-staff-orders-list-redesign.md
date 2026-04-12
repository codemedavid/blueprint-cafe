# Staff Orders List Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the board-based authenticated flow with a compact status-tabbed orders queue and a dedicated order detail screen where status changes happen.

**Architecture:** Keep the existing app shell, auth provider, and Convex client wiring. Reshape the authenticated navigation into an `Orders` list screen plus an `OrderDetail` screen, replace board/card components with compact row-based components, and update tests to reflect tabbed navigation and detail-only workflow actions.

**Tech Stack:** Expo, React Native, React Navigation native stack, Convex React hooks, Jest, Testing Library for React Native

---

## File Structure

- Modify: `src/navigation/AppNavigator.tsx`
  Responsibility: rename board-centric routes/copy, register the orders list screen and the order detail screen, and wire row-to-detail navigation.
- Modify: `src/navigation/AppNavigator.test.tsx`
  Responsibility: verify unauthenticated copy/action and authenticated landing screen naming.
- Create: `src/screens/OrdersScreen.tsx`
  Responsibility: render compact status tabs, filter orders by selected tab, show loading/error states, and navigate to order details on row press.
- Create: `src/screens/OrdersScreen.test.tsx`
  Responsibility: verify tab behavior, filtered list rendering, and row navigation.
- Create: `src/components/OrdersStatusTabs.tsx`
  Responsibility: render the compact tab control for the four statuses.
- Create: `src/components/OrdersStatusTabs.test.tsx`
  Responsibility: verify selected tab styling hooks and press behavior.
- Create: `src/components/OrderRow.tsx`
  Responsibility: render a compact queue row with summary metadata and tap affordance only.
- Create: `src/components/OrderRow.test.tsx`
  Responsibility: verify row summary rendering and row press behavior without inline status actions.
- Create: `src/screens/OrderDetailScreen.tsx`
  Responsibility: render full order details and handle the single status-advance action.
- Create: `src/screens/OrderDetailScreen.test.tsx`
  Responsibility: verify detail rendering, status action behavior, and completed-order behavior.
- Modify: `src/types/orders.ts`
  Responsibility: export helpers needed by both list and detail screens, including the tab order and next-action labels if they are promoted into shared constants.
- Modify: `src/constants/theme.ts`
  Responsibility: tighten spacing, font scale, radii, and colors so the app reads as compact and minimalist instead of card-heavy.
- Delete: `src/screens/OrdersBoardScreen.tsx`
  Responsibility: remove the obsolete board screen after the new orders screen is in place.
- Delete: `src/screens/OrdersBoardScreen.test.tsx`
  Responsibility: remove obsolete board-specific assertions after replacement coverage exists.
- Delete: `src/components/OrderCard.tsx`
  Responsibility: remove board-era card UI once `OrderRow` and `OrderDetailScreen` fully cover its responsibilities.
- Delete: `src/components/OrderCard.test.tsx`
  Responsibility: remove obsolete card/action coverage once row/detail tests replace it.
- Delete: `src/components/OrderSection.tsx`
  Responsibility: remove board-era grouped section UI once status tabs replace vertical board sections.

## Task 1: Replace Board Navigation With Orders + Detail Routes

**Files:**
- Modify: `src/navigation/AppNavigator.tsx`
- Modify: `src/navigation/AppNavigator.test.tsx`
- Create: `src/screens/OrderDetailScreen.tsx`
- Test: `src/navigation/AppNavigator.test.tsx`

- [ ] **Step 1: Write the failing navigation test for renamed copy and authenticated orders landing**

```tsx
jest.mock('../screens/OrdersScreen', () => ({
  OrdersScreen: () => {
    const { Text } = require('react-native');
    return <Text>Orders Screen</Text>;
  },
}));

jest.mock('../screens/OrderDetailScreen', () => ({
  OrderDetailScreen: () => {
    const { Text } = require('react-native');
    return <Text>Order Detail Screen</Text>;
  },
}));

it('shows a working sign-in action when staff are unauthenticated', () => {
  const signIn = jest.fn();
  mockUseAuth.mockReturnValue({
    isAuthenticated: false,
    signIn,
  });

  render(<AppNavigator />);

  fireEvent.press(screen.getByRole('button', { name: 'Open Orders' }));

  expect(signIn).toHaveBeenCalledTimes(1);
  expect(screen.getByText('Staff Orders')).toBeTruthy();
});

it('renders the orders screen when staff are authenticated', () => {
  mockUseAuth.mockReturnValue({
    isAuthenticated: true,
    signIn: jest.fn(),
  });

  render(<AppNavigator />);

  expect(screen.getByText('Orders Screen')).toBeTruthy();
});
```

- [ ] **Step 2: Run the navigation test to verify it fails**

Run: `npm test -- --runTestsByPath src/navigation/AppNavigator.test.tsx`
Expected: FAIL because `OrdersScreen` and `OrderDetailScreen` are not registered yet and the login copy still says `Orders Board`.

- [ ] **Step 3: Implement the renamed stack and login copy**

```tsx
type RootStackParamList = {
  Login: undefined;
  Orders: undefined;
  OrderDetail: {
    orderId: string;
  };
};

function LoginScreen() {
  const { signIn } = useAuth();

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Staff Orders</Text>
      <Text style={styles.body}>
        Open the live staff queue for this device.
      </Text>
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
  );
}

<Stack.Navigator
  key={isAuthenticated ? 'authenticated' : 'guest'}
  initialRouteName={isAuthenticated ? 'Orders' : 'Login'}
  screenOptions={{
    contentStyle: { backgroundColor: theme.colors.background },
  }}
>
  <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
  <Stack.Screen name="Orders" component={OrdersScreen} options={{ title: 'Orders' }} />
  <Stack.Screen
    name="OrderDetail"
    component={OrderDetailScreen}
    options={{ title: 'Order Details' }}
  />
</Stack.Navigator>
```

- [ ] **Step 4: Run the navigation test to verify it passes**

Run: `npm test -- --runTestsByPath src/navigation/AppNavigator.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit the navigation rename**

```bash
git add src/navigation/AppNavigator.tsx src/navigation/AppNavigator.test.tsx src/screens/OrderDetailScreen.tsx
git commit -m "feat: replace board navigation with orders routes"
```

## Task 2: Build The Compact Status-Tabbed Orders Screen

**Files:**
- Create: `src/screens/OrdersScreen.tsx`
- Create: `src/screens/OrdersScreen.test.tsx`
- Create: `src/components/OrdersStatusTabs.tsx`
- Create: `src/components/OrdersStatusTabs.test.tsx`
- Create: `src/components/OrderRow.tsx`
- Create: `src/components/OrderRow.test.tsx`
- Modify: `src/types/orders.ts`
- Test: `src/screens/OrdersScreen.test.tsx`

- [ ] **Step 1: Write the failing orders screen test for tab filtering and row navigation**

```tsx
jest.mock('convex/react', () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}));

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

it('shows pending orders by default and switches to ready orders when that tab is pressed', () => {
  mockUseQuery.mockReturnValue([
    createOrder({ _id: 'order-pending', customerName: 'Ari', status: 'pending' }),
    createOrder({ _id: 'order-ready', customerName: 'Cole', status: 'ready' }),
  ]);

  render(<OrdersScreen />);

  expect(screen.getByText('Ari')).toBeTruthy();
  expect(screen.queryByText('Cole')).toBeNull();

  fireEvent.press(screen.getByRole('tab', { name: 'Ready' }));

  expect(screen.getByText('Cole')).toBeTruthy();
  expect(screen.queryByText('Ari')).toBeNull();
});

it('navigates to the detail screen with the tapped order id', () => {
  mockUseQuery.mockReturnValue([
    createOrder({ _id: 'order-pending', customerName: 'Ari', status: 'pending' }),
  ]);

  render(<OrdersScreen />);

  fireEvent.press(screen.getByRole('button', { name: 'View order Ari' }));

  expect(mockNavigate).toHaveBeenCalledWith('OrderDetail', { orderId: 'order-pending' });
});
```

- [ ] **Step 2: Run the orders screen test to verify it fails**

Run: `npm test -- --runTestsByPath src/screens/OrdersScreen.test.tsx`
Expected: FAIL because `OrdersScreen` does not exist yet.

- [ ] **Step 3: Add shared status metadata for tabs and labels**

```ts
export const staffOrderStatuses: StaffOrderStatus[] = [
  'pending',
  'preparing',
  'ready',
  'completed',
];

export const staffOrderStatusLabels: Record<StaffOrderStatus, string> = {
  pending: 'Pending',
  preparing: 'Preparing',
  ready: 'Ready',
  completed: 'Completed',
};

export const nextActionLabels: Record<Exclude<StaffOrderStatus, 'completed'>, string> = {
  pending: 'Start Preparing',
  preparing: 'Mark Ready',
  ready: 'Complete Order',
};
```

- [ ] **Step 4: Implement the compact tabs, row component, and list screen**

```tsx
export function OrdersScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const orders = (useQuery(api.orders.listBoardOrders) as StaffOrder[] | undefined) ?? [];
  const [selectedStatus, setSelectedStatus] = useState<StaffOrderStatus>('pending');

  const visibleOrders = orders.filter((order) => order.status === selectedStatus);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Orders</Text>
        <Text style={styles.subtitle}>Compact queue by status.</Text>
      </View>

      <OrdersStatusTabs
        selectedStatus={selectedStatus}
        onSelectStatus={setSelectedStatus}
      />

      <FlatList
        data={visibleOrders}
        keyExtractor={(order) => order._id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <OrderRow
            order={item}
            onPress={() => navigation.navigate('OrderDetail', { orderId: item._id })}
          />
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No orders in this status.</Text>}
      />
    </View>
  );
}
```

- [ ] **Step 5: Run the new list tests and focused component tests**

Run: `npm test -- --runTestsByPath src/screens/OrdersScreen.test.tsx src/components/OrdersStatusTabs.test.tsx src/components/OrderRow.test.tsx`
Expected: PASS

- [ ] **Step 6: Commit the tabbed orders queue**

```bash
git add src/screens/OrdersScreen.tsx src/screens/OrdersScreen.test.tsx src/components/OrdersStatusTabs.tsx src/components/OrdersStatusTabs.test.tsx src/components/OrderRow.tsx src/components/OrderRow.test.tsx src/types/orders.ts
git commit -m "feat: add compact tabbed orders queue"
```

## Task 3: Move Status Actions Into The Detail Screen

**Files:**
- Modify: `src/screens/OrderDetailScreen.tsx`
- Create: `src/screens/OrderDetailScreen.test.tsx`
- Test: `src/screens/OrderDetailScreen.test.tsx`

- [ ] **Step 1: Write the failing detail screen test for order rendering and action-only workflow updates**

```tsx
const mockUseQuery = jest.fn();
const mockUseMutation = jest.fn();
const mockSetOptions = jest.fn();

jest.mock('convex/react', () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
  useMutation: (...args: unknown[]) => mockUseMutation(...args),
}));

jest.mock('@react-navigation/native', () => ({
  useRoute: () => ({
    params: { orderId: 'order-ready' },
  }),
  useNavigation: () => ({
    setOptions: mockSetOptions,
  }),
}));

it('renders the full order details and advances the order from the detail screen', async () => {
  const advanceOrderStatus = jest.fn().mockResolvedValue(undefined);
  mockUseQuery.mockReturnValue(createOrder({
    _id: 'order-ready',
    customerName: 'Cole',
    status: 'ready',
    notes: 'No straw',
  }));
  mockUseMutation.mockReturnValue(advanceOrderStatus);

  render(<OrderDetailScreen />);

  expect(screen.getByText('Cole')).toBeTruthy();
  expect(screen.getByText('No straw')).toBeTruthy();
  expect(screen.getByText('1x Latte')).toBeTruthy();

  fireEvent.press(screen.getByRole('button', { name: 'Complete Order' }));

  await waitFor(() => {
    expect(advanceOrderStatus).toHaveBeenCalledWith({
      orderId: 'order-ready',
      currentStatus: 'ready',
    });
  });
});

it('hides the action button for completed orders', () => {
  mockUseQuery.mockReturnValue(createOrder({
    _id: 'order-completed',
    customerName: 'Dee',
    status: 'completed',
  }));
  mockUseMutation.mockReturnValue(jest.fn());

  render(<OrderDetailScreen />);

  expect(screen.queryByRole('button', { name: 'Complete Order' })).toBeNull();
});
```

- [ ] **Step 2: Run the detail screen test to verify it fails**

Run: `npm test -- --runTestsByPath src/screens/OrderDetailScreen.test.tsx`
Expected: FAIL because the detail screen does not yet load an order or expose the status action.

- [ ] **Step 3: Implement detail loading and the status action**

```tsx
export function OrderDetailScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'OrderDetail'>>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const orders = useQuery(api.orders.listBoardOrders) as StaffOrder[] | undefined;
  const advanceOrderStatus = useMutation(api.orders.advanceOrderStatus);
  const order = orders?.find((candidate) => candidate._id === route.params.orderId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    navigation.setOptions({
      title: order ? order.customerName : 'Order Details',
    });
  }, [navigation, order]);

  if (!order) {
    return <Text style={styles.statusText}>Order not found.</Text>;
  }

  const actionLabel =
    order.status === 'completed' ? null : nextActionLabels[order.status];

  async function handleAdvance() {
    if (!actionLabel || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await advanceOrderStatus({
        orderId: order._id as Id<'orders'>,
        currentStatus: order.status,
      });
    } catch {
      setErrorMessage('Unable to update order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.customerName}>{order.customerName}</Text>
      <Text style={styles.meta}>{staffOrderStatusLabels[order.status]}</Text>
      {order.items.map((item) => (
        <Text key={item.lineItemId}>{item.quantity}x {item.name}</Text>
      ))}
      {order.notes ? <Text>{order.notes}</Text> : null}
      {errorMessage ? <Text>{errorMessage}</Text> : null}
      {actionLabel ? (
        <Pressable accessibilityRole="button" accessibilityLabel={actionLabel} onPress={handleAdvance}>
          <Text>{isSubmitting ? 'Updating...' : actionLabel}</Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}
```

- [ ] **Step 4: Run the detail screen test to verify it passes**

Run: `npm test -- --runTestsByPath src/screens/OrderDetailScreen.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit the detail workflow**

```bash
git add src/screens/OrderDetailScreen.tsx src/screens/OrderDetailScreen.test.tsx
git commit -m "feat: add order detail workflow screen"
```

## Task 4: Tighten The Visual System And Remove Board-Era Components

**Files:**
- Modify: `src/constants/theme.ts`
- Modify: `src/screens/OrdersScreen.tsx`
- Modify: `src/components/OrderRow.tsx`
- Modify: `src/screens/OrderDetailScreen.tsx`
- Delete: `src/screens/OrdersBoardScreen.tsx`
- Delete: `src/screens/OrdersBoardScreen.test.tsx`
- Delete: `src/components/OrderCard.tsx`
- Delete: `src/components/OrderCard.test.tsx`
- Delete: `src/components/OrderSection.tsx`
- Test: `src/screens/OrdersScreen.test.tsx`
- Test: `src/screens/OrderDetailScreen.test.tsx`

- [ ] **Step 1: Write or update tests that prove rows are navigation-only and board components are no longer used**

```tsx
it('renders a compact row without inline workflow buttons', () => {
  render(<OrderRow order={createOrder({ customerName: 'Ari' })} onPress={jest.fn()} />);

  expect(screen.getByText('Ari')).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Start Preparing' })).toBeNull();
});

it('uses tabs instead of board section headings', () => {
  mockUseQuery.mockReturnValue([
    createOrder({ _id: 'order-pending', customerName: 'Ari', status: 'pending' }),
  ]);

  render(<OrdersScreen />);

  expect(screen.getByRole('tab', { name: 'Pending' })).toBeTruthy();
  expect(screen.queryByText('Orders Board')).toBeNull();
});
```

- [ ] **Step 2: Run focused UI tests to verify they fail before the cleanup**

Run: `npm test -- --runTestsByPath src/components/OrderRow.test.tsx src/screens/OrdersScreen.test.tsx`
Expected: FAIL until the row no longer exposes inline actions and the screen copy is fully updated.

- [ ] **Step 3: Implement the compact visual system and delete obsolete board files**

```ts
export const theme = {
  colors: {
    background: '#f5f5f4',
    surface: '#ffffff',
    surfaceMuted: '#fafaf9',
    border: '#e7e5e4',
    text: '#1c1917',
    muted: '#78716c',
    primary: '#2563eb',
    accent: '#0f766e',
    danger: '#dc2626',
    success: '#16a34a',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 10,
    lg: 14,
    xl: 20,
    xxl: 28,
  },
  radius: {
    sm: 6,
    md: 10,
    lg: 14,
    pill: 9999,
  },
} as const;
```

```tsx
<Pressable
  accessibilityRole="button"
  accessibilityLabel={`View order ${order.customerName}`}
  onPress={onPress}
  style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
>
  <View style={styles.primaryColumn}>
    <Text style={styles.customerName}>{order.customerName}</Text>
    <Text style={styles.meta}>
      {serviceTypeLabels[order.serviceType]} · {order.items.length} items
    </Text>
  </View>
  <View style={styles.trailingColumn}>
    <Text style={styles.total}>{formatCurrency(order.total)}</Text>
    <Text style={styles.meta}>{order.paymentMethodName}</Text>
  </View>
</Pressable>
```

- [ ] **Step 4: Run the full targeted suite and typecheck**

Run: `npm test -- --runTestsByPath src/navigation/AppNavigator.test.tsx src/screens/OrdersScreen.test.tsx src/components/OrdersStatusTabs.test.tsx src/components/OrderRow.test.tsx src/screens/OrderDetailScreen.test.tsx`
Expected: PASS

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 5: Commit the redesign polish and cleanup**

```bash
git add src/constants/theme.ts src/screens/OrdersScreen.tsx src/components/OrderRow.tsx src/screens/OrderDetailScreen.tsx src/navigation/AppNavigator.tsx src/navigation/AppNavigator.test.tsx src/screens/OrdersScreen.test.tsx src/components/OrdersStatusTabs.tsx src/components/OrdersStatusTabs.test.tsx src/components/OrderRow.test.tsx src/screens/OrderDetailScreen.test.tsx src/types/orders.ts
git rm src/screens/OrdersBoardScreen.tsx src/screens/OrdersBoardScreen.test.tsx src/components/OrderCard.tsx src/components/OrderCard.test.tsx src/components/OrderSection.tsx
git commit -m "feat: redesign staff orders flow as compact list"
```

## Self-Review

### Spec Coverage

- Compact status-tabbed list: covered by Task 2 and Task 4.
- Dedicated order detail screen: covered by Task 1 and Task 3.
- Status changes only inside detail screen: covered by Task 3 and Task 4 tests.
- Minimalist, less oversized visual direction: covered by Task 4.
- Rename board-oriented language: covered by Task 1 and Task 4.

No uncovered spec requirements remain.

### Placeholder Scan

No `TODO`, `TBD`, or “appropriate error handling” placeholders remain. Each task includes exact files, code snippets, commands, and expected outcomes.

### Type Consistency

The plan consistently uses `StaffOrderStatus`, `staffOrderStatusLabels`, `nextActionLabels`, `Orders`, and `OrderDetail`. The route param shape and status action payload stay aligned across tasks.
