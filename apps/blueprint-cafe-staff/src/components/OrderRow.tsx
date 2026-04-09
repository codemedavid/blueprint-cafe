import { Pressable, StyleSheet, Text, View } from 'react-native';

import { theme } from '../constants/theme';
import {
  formatOrderCurrency,
  ORDER_SERVICE_TYPE_LABELS,
  type StaffOrder,
} from '../types/orders';

type OrderRowProps<OrderId extends string = string> = {
  order: StaffOrder<OrderId>;
  onPress: (orderId: OrderId) => void;
};

export function OrderRow<OrderId extends string>({
  order,
  onPress,
}: OrderRowProps<OrderId>) {
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
          <Text style={styles.meta}>{ORDER_SERVICE_TYPE_LABELS[order.serviceType]}</Text>
          <Text style={styles.separator}>·</Text>
          <Text style={styles.meta}>{order.paymentMethodName}</Text>
          <Text style={styles.separator}>·</Text>
          <Text style={styles.meta}>{order.items.length} items</Text>
        </View>
      </View>
      <Text style={styles.total}>{formatOrderCurrency(order.total)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 50,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.xs,
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
    fontSize: 14,
    fontWeight: '600',
  },
  meta: {
    color: theme.colors.muted,
    fontSize: 11,
  },
  separator: {
    color: theme.colors.muted,
    fontSize: 11,
  },
  total: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
});
