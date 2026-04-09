import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from 'convex/react';

import { OrderSection } from '../components/OrderSection';
import { theme } from '../constants/theme';
import { api } from '../lib/convexApi';
import type { StaffOrder, StaffOrderStatus } from '../types/orders';

const BOARD_SECTIONS: Array<{
  title: string;
  status: StaffOrderStatus;
}> = [
  { title: 'Pending', status: 'pending' },
  { title: 'Preparing', status: 'preparing' },
  { title: 'Ready', status: 'ready' },
  { title: 'Completed', status: 'completed' },
];

export function OrdersBoardScreen() {
  const boardOrders = useQuery(api.orders.listBoardOrders) as StaffOrder[] | undefined;

  const groupedOrders: Record<StaffOrderStatus, StaffOrder[]> = {
    pending: [],
    preparing: [],
    ready: [],
    completed: [],
  };

  for (const order of boardOrders ?? []) {
    groupedOrders[order.status].push(order);
  }

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      style={styles.screen}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Orders Board</Text>
        <Text style={styles.subtitle}>Track each order from queue to completion.</Text>
      </View>

      {boardOrders === undefined ? (
        <Text style={styles.statusText}>Loading orders...</Text>
      ) : null}

      <View style={styles.sections}>
        {BOARD_SECTIONS.map((section) => (
          <OrderSection
            key={section.status}
            title={section.title}
            orders={groupedOrders[section.status]}
            onAdvance={() => {}}
          />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.xl,
    gap: theme.spacing.lg,
  },
  header: {
    gap: theme.spacing.xs,
  },
  title: {
    color: theme.colors.text,
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    color: theme.colors.muted,
    fontSize: 15,
  },
  statusText: {
    color: theme.colors.muted,
    fontSize: 14,
  },
  sections: {
    gap: theme.spacing.xl,
  },
});
