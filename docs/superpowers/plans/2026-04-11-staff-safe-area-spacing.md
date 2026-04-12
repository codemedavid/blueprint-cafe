# Staff Safe Area Spacing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add reliable top spacing to the staff mobile app order screens by using safe-area-aware screen wrappers instead of hardcoded padding.

**Architecture:** Keep the current custom in-screen title blocks and stack configuration unchanged. Add `SafeAreaView` wrappers to the orders list and order detail screens so top insets are device-aware and consistent across the staff flow, with tests proving both screens render inside those wrappers.

**Tech Stack:** React Native, Expo, `react-native-safe-area-context`, Jest, Testing Library

---

### Task 1: Cover screen wrappers with tests

**Files:**
- Modify: `apps/blueprint-cafe-staff/src/screens/OrdersScreen.test.tsx`
- Modify: `apps/blueprint-cafe-staff/src/screens/OrderDetailScreen.test.tsx`

- [ ] **Step 1: Write the failing tests**

```tsx
expect(screen.getByTestId('orders-safe-area')).toBeTruthy();
expect(screen.getByTestId('order-detail-safe-area')).toBeTruthy();
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --runInBand src/screens/OrdersScreen.test.tsx src/screens/OrderDetailScreen.test.tsx`
Expected: FAIL because the safe-area wrapper test IDs do not exist yet.

- [ ] **Step 3: Write minimal implementation**

```tsx
<SafeAreaView edges={['top']} style={styles.safeArea} testID="orders-safe-area">
  ...
</SafeAreaView>
```

```tsx
<SafeAreaView edges={['top']} style={styles.safeArea} testID="order-detail-safe-area">
  ...
</SafeAreaView>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --runInBand src/screens/OrdersScreen.test.tsx src/screens/OrderDetailScreen.test.tsx`
Expected: PASS

- [ ] **Step 5: Verify the app-level suite for the touched area**

Run: `npm test -- --runInBand src/navigation/AppNavigator.test.tsx src/screens/OrdersScreen.test.tsx src/screens/OrderDetailScreen.test.tsx`
Expected: PASS
