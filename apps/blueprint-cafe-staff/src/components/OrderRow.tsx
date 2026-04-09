import { Pressable, StyleSheet, Text, View } from 'react-native';

import { theme } from '../constants/theme';
import type { StaffOrder } from '../types/orders';

type OrderRowProps = {
  order: StaffOrder;
  onPress: (orderId: string) => void;
};

const serviceTypeLabels: Record<StaffOrder['serviceType'], string> = {
  'dine-in': 'Dine-in',
  pickup: 'Pickup',
  delivery: 'Delivery',
};

function formatCurrency(total: number) {
  return `₱${Math.round(total).toLocaleString('en-PH')}`;
}

export function OrderRow({ order, onPress }: OrderRowProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open order ${order.customerName}`}
      onPress={() => onPress(order._id)}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <View style={styles.main}>
        <Text style={styles.customerName}>{order.customerName}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.meta}>{serviceTypeLabels[order.serviceType]}</Text>
          <Text style={styles.separator}>·</Text>
          <Text style={styles.meta}>{order.paymentMethodName}</Text>
          <Text style={styles.separator}>·</Text>
          <Text style={styles.meta}>{order.items.length} items</Text>
        </View>
      </View>
      <Text style={styles.total}>{formatCurrency(order.total)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 58,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: 'rgba(248, 250, 252, 0.12)',
    backgroundColor: theme.colors.surfaceElevated,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  rowPressed: {
    opacity: 0.85,
  },
  main: {
    flex: 1,
    gap: 2,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 4,
  },
  customerName: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  meta: {
    color: theme.colors.muted,
    fontSize: 12,
  },
  separator: {
    color: theme.colors.muted,
    fontSize: 12,
  },
  total: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
});
