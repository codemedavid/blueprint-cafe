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
}

const styles = StyleSheet.create({
  row: {
    minHeight: 72,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  rowPressed: {
    opacity: 0.85,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  customerName: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  meta: {
    color: theme.colors.muted,
    fontSize: 12,
  },
  dot: {
    color: theme.colors.muted,
    fontSize: 12,
  },
  total: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
});
