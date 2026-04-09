import { StyleSheet, Text, View } from 'react-native';

import { theme } from '../constants/theme';
import type { StaffOrder, StaffOrderStatus } from '../types/orders';
import { OrderCard } from './OrderCard';

type OrderSectionProps = {
  title: string;
  orders: StaffOrder[];
  onAdvance: (orderId: string, currentStatus: StaffOrderStatus) => void;
};

export function OrderSection({ title, orders, onAdvance }: OrderSectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.headingRow}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.count}>{orders.length}</Text>
      </View>

      <View style={styles.cards}>
        {orders.map((order) => (
          <OrderCard key={order._id} order={order} onAdvance={onAdvance} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: theme.spacing.md,
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  count: {
    color: theme.colors.muted,
    fontSize: 14,
    fontWeight: '700',
    backgroundColor: theme.colors.surfaceElevated,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.radius.pill,
  },
  cards: {
    gap: theme.spacing.md,
  },
});
