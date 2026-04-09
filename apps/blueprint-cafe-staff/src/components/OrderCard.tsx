import { StyleSheet, Text, View } from 'react-native';

import { theme } from '../constants/theme';
import type { StaffOrder, StaffOrderStatus } from '../types/orders';

type OrderCardProps = {
  order: StaffOrder;
  onAdvance: (orderId: string, currentStatus: StaffOrderStatus) => void;
};

const serviceTypeLabels: Record<StaffOrder['serviceType'], string> = {
  'dine-in': 'Dine-in',
  pickup: 'Pickup',
  delivery: 'Delivery',
};

function formatCurrency(total: number) {
  return `₱${Math.round(total).toLocaleString('en-PH')}`;
}

export function OrderCard({ order, onAdvance }: OrderCardProps) {
  void onAdvance;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.customerName}>{order.customerName}</Text>
        <Text style={styles.meta}>{serviceTypeLabels[order.serviceType]}</Text>
      </View>

      <View style={styles.detailsRow}>
        <Text style={styles.meta}>{order.paymentMethodName}</Text>
        <Text style={styles.meta}>{formatCurrency(order.total)}</Text>
      </View>

      {order.notes ? (
        <View style={styles.notesBlock}>
          <Text style={styles.notesLabel}>Notes</Text>
          <Text style={styles.notesText}>{order.notes}</Text>
        </View>
      ) : null}

      <View style={styles.itemsBlock}>
        {order.items.map((item) => (
          <Text key={item.lineItemId} style={styles.itemText}>
            {item.quantity}x {item.name}
          </Text>
        ))}
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(248, 250, 252, 0.08)',
  },
  header: {
    gap: 4,
  },
  customerName: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  meta: {
    color: theme.colors.muted,
    fontSize: 14,
  },
  notesBlock: {
    gap: 4,
    paddingTop: theme.spacing.xs,
  },
  notesLabel: {
    color: theme.colors.accent,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  notesText: {
    color: theme.colors.text,
    fontSize: 14,
  },
  itemsBlock: {
    gap: 4,
    paddingTop: theme.spacing.xs,
  },
  itemText: {
    color: theme.colors.text,
    fontSize: 14,
  },
});
