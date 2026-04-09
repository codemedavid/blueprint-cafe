import { RouteProp, useRoute } from '@react-navigation/native';
import { useMutation, useQuery } from 'convex/react';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { theme } from '../constants/theme';
import { api, type Id } from '../lib/convexApi';
import type { StaffOrder, StaffOrderStatus } from '../types/orders';

type OrderDetailRouteParams = {
  OrderDetail: {
    orderId: Id<'orders'>;
  };
};

export function OrderDetailScreen() {
  const route = useRoute<RouteProp<OrderDetailRouteParams, 'OrderDetail'>>();
  const advanceOrderStatus = useMutation(api.orders.advanceOrderStatus);
  const [isUpdating, setIsUpdating] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  const order = useQuery(api.orders.getOrderById, {
    orderId: route.params.orderId,
  });

  const actionLabel = order ? getNextActionLabel(order.status) : null;

  const handleAdvanceStatus = async () => {
    if (!order || !actionLabel || isUpdating) {
      return;
    }

    setIsUpdating(true);
    setStatusError(null);

    try {
      await advanceOrderStatus({
        orderId: order._id,
        currentStatus: order.status,
      });
    } catch (error) {
      setStatusError('Unable to update order. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Order Detail</Text>
      {order === undefined ? <Text style={styles.meta}>Loading order...</Text> : null}
      {order === null ? <Text style={styles.meta}>Order not found.</Text> : null}
      {order ? (
        <View style={styles.card}>
          <Text style={styles.customerName}>{order.customerName}</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.label}>Status</Text>
            <Text style={styles.value}>{statusLabels[order.status]}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.label}>Service</Text>
            <Text style={styles.value}>{serviceTypeLabels[order.serviceType]}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.label}>Payment</Text>
            <Text style={styles.value}>{order.paymentMethodName}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.label}>Total</Text>
            <Text style={styles.value}>{formatCurrency(order.total)}</Text>
          </View>

          {order.notes ? (
            <View style={styles.block}>
              <Text style={styles.sectionTitle}>Notes</Text>
              <Text style={styles.value}>{order.notes}</Text>
            </View>
          ) : null}

          <View style={styles.block}>
            <Text style={styles.sectionTitle}>Items</Text>
            <View style={styles.itemsList}>
              {order.items.map((item) => (
                <Text key={item.lineItemId} style={styles.value}>
                  {item.quantity}x {item.name}
                </Text>
              ))}
            </View>
          </View>

          {statusError ? <Text style={styles.error}>{statusError}</Text> : null}
          {isUpdating ? <Text style={styles.meta}>Updating status...</Text> : null}

          {actionLabel ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={actionLabel}
              disabled={isUpdating}
              onPress={handleAdvanceStatus}
              style={({ pressed }) => [
                styles.actionButton,
                pressed && !isUpdating && styles.actionButtonPressed,
                isUpdating && styles.actionButtonDisabled,
              ]}
            >
              <Text style={styles.actionText}>{actionLabel}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const statusLabels: Record<StaffOrderStatus, string> = {
  pending: 'Pending',
  preparing: 'Preparing',
  ready: 'Ready',
  completed: 'Completed',
};

const serviceTypeLabels: Record<StaffOrder['serviceType'], string> = {
  'dine-in': 'Dine-in',
  pickup: 'Pickup',
  delivery: 'Delivery',
};

const nextActionLabels: Record<Exclude<StaffOrderStatus, 'completed'>, string> = {
  pending: 'Start Preparing',
  preparing: 'Mark Ready',
  ready: 'Complete Order',
};

function getNextActionLabel(status: StaffOrderStatus) {
  if (status === 'completed') {
    return null;
  }
  return nextActionLabels[status];
}

function formatCurrency(total: number) {
  return `₱${Math.round(total).toLocaleString('en-PH')}`;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.background,
    gap: theme.spacing.sm,
  },
  title: {
    color: theme.colors.text,
    fontSize: 28,
    fontWeight: '700',
  },
  card: {
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(248, 250, 252, 0.08)',
  },
  customerName: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: theme.spacing.xs,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  label: {
    color: theme.colors.muted,
    fontSize: 14,
  },
  value: {
    color: theme.colors.text,
    fontSize: 14,
  },
  block: {
    gap: 4,
    paddingTop: theme.spacing.xs,
  },
  sectionTitle: {
    color: theme.colors.accent,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  itemsList: {
    gap: 3,
  },
  meta: {
    color: theme.colors.muted,
    fontSize: 14,
  },
  error: {
    color: '#fca5a5',
    fontSize: 14,
  },
  actionButton: {
    marginTop: theme.spacing.xs,
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  actionButtonPressed: {
    opacity: 0.85,
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  actionText: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
});
