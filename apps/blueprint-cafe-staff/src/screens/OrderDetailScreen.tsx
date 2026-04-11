import { RouteProp, useRoute } from '@react-navigation/native';
import { useMutation, useQuery } from 'convex/react';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { theme } from '../constants/theme';
import { api } from '../lib/convexApi';
import type { RootStackParamList } from '../types/navigation';
import {
  canCancelOrder,
  formatOrderCurrency,
  NEXT_ORDER_STATUS,
  ORDER_SERVICE_TYPE_LABELS,
  ORDER_STATUS_LABELS,
  NEXT_ORDER_ACTION_LABELS,
  type StaffOrderStatus,
} from '../types/orders';

export function OrderDetailScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'OrderDetail'>>();
  const advanceOrderStatus = useMutation(api.orders.advanceOrderStatus);
  const cancelOrder = useMutation(api.orders.cancelOrder);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [optimisticStatus, setOptimisticStatus] = useState<StaffOrderStatus | null>(null);

  const order = useQuery(api.orders.getOrderById, {
    orderId: route.params.orderId,
  });

  const effectiveStatus: StaffOrderStatus | null = order
    ? (optimisticStatus ?? order.status)
    : null;
  const actionLabel = effectiveStatus ? NEXT_ORDER_ACTION_LABELS[effectiveStatus] ?? null : null;
  const showCancelAction = effectiveStatus ? canCancelOrder(effectiveStatus) : false;

  useEffect(() => {
    if (order === undefined || order === null || optimisticStatus === null) {
      return;
    }

    if (order.status === optimisticStatus) {
      setOptimisticStatus(null);
    }
  }, [order, optimisticStatus]);

  const handleAdvanceStatus = async () => {
    if (!order || !effectiveStatus || !actionLabel || isUpdating || isCanceling) {
      return;
    }

    setIsUpdating(true);
    setStatusError(null);

    try {
      await advanceOrderStatus({
        orderId: order._id,
        currentStatus: effectiveStatus,
      });
      const nextStatus = NEXT_ORDER_STATUS[effectiveStatus];
      if (nextStatus) {
        setOptimisticStatus(nextStatus);
      }
    } catch (error) {
      setStatusError('Unable to update order. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order || isCanceling || isUpdating) {
      return;
    }

    setIsCanceling(true);
    setStatusError(null);

    try {
      await cancelOrder({ orderId: order._id });
      setOptimisticStatus('canceled');
    } catch {
      setStatusError('Unable to cancel order. Please try again.');
    } finally {
      setIsCanceling(false);
    }
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      testID="order-detail-scroll"
    >
      <Text style={styles.eyebrow}>Blueprint Cafe</Text>
      <Text style={styles.title}>Order Details</Text>
      {order === undefined ? <Text style={styles.meta}>Loading order...</Text> : null}
      {order === null ? <Text style={styles.meta}>Order not found.</Text> : null}
      {order ? (
        <>
          <View style={styles.heroCard}>
            <Text style={styles.customerName}>{order.customerName}</Text>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Order Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.label}>Status</Text>
              <Text style={styles.value}>
                {ORDER_STATUS_LABELS[effectiveStatus ?? order.status]}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.label}>Service</Text>
              <Text style={styles.value}>{ORDER_SERVICE_TYPE_LABELS[order.serviceType]}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.label}>Payment</Text>
              <Text style={styles.value}>{order.paymentMethodName}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.label}>Total</Text>
              <Text style={styles.value}>{formatOrderCurrency(order.total)}</Text>
            </View>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Items</Text>
            <View style={styles.itemsList}>
              {order.items.map((item) => (
                <Text key={item.lineItemId} style={styles.value}>
                  {item.quantity}x {item.name}
                </Text>
              ))}
            </View>
          </View>

          {order.notes ? (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Notes</Text>
              <Text style={styles.value}>{order.notes}</Text>
            </View>
          ) : null}

          <View style={styles.actionCard}>
            {statusError ? <Text style={styles.error}>{statusError}</Text> : null}
            {isUpdating || isCanceling ? <Text style={styles.meta}>Updating status...</Text> : null}

            {actionLabel ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={actionLabel}
                disabled={isUpdating || isCanceling}
                onPress={handleAdvanceStatus}
                style={({ pressed }) => [
                  styles.primaryAction,
                  pressed && !isUpdating && !isCanceling && styles.buttonPressed,
                  (isUpdating || isCanceling) && styles.buttonDisabled,
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
                  (isUpdating || isCanceling) && styles.buttonDisabled,
                ]}
              >
                <Text style={styles.destructiveActionText}>Cancel Order</Text>
              </Pressable>
            ) : null}
          </View>
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.md,
    gap: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  eyebrow: {
    color: theme.colors.primary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  title: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: '700',
  },
  heroCard: {
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sectionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  actionCard: {
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  customerName: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  label: {
    color: theme.colors.muted,
    fontSize: 12,
  },
  value: {
    color: theme.colors.text,
    fontSize: 13,
  },
  sectionTitle: {
    color: theme.colors.accent,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  itemsList: {
    gap: theme.spacing.xs,
  },
  meta: {
    color: theme.colors.muted,
    fontSize: 12,
  },
  error: {
    color: theme.colors.danger,
    fontSize: 12,
  },
  primaryAction: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  destructiveAction: {
    backgroundColor: theme.colors.dangerSoft,
    borderRadius: theme.radius.md,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryActionText: {
    color: theme.colors.surfaceElevated,
    fontSize: 12,
    fontWeight: '700',
  },
  destructiveActionText: {
    color: theme.colors.danger,
    fontSize: 12,
    fontWeight: '700',
  },
});
