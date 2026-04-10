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
  const [pendingSyncStatus, setPendingSyncStatus] = useState<StaffOrderStatus | null>(null);

  const order = useQuery(api.orders.getOrderById, {
    orderId: route.params.orderId,
  });

  const isAwaitingStatusSync =
    order !== undefined &&
    order !== null &&
    pendingSyncStatus !== null &&
    order.status === pendingSyncStatus;

  const actionLabel = order && !isAwaitingStatusSync ? NEXT_ORDER_ACTION_LABELS[order.status] ?? null : null;
  const showCancelAction = order ? canCancelOrder(order.status) : false;

  useEffect(() => {
    if (order === undefined || order === null || pendingSyncStatus === null) {
      return;
    }

    if (order.status !== pendingSyncStatus) {
      setPendingSyncStatus(null);
    }
  }, [order, pendingSyncStatus]);

  const handleAdvanceStatus = async () => {
    if (!order || !actionLabel || isUpdating || isAwaitingStatusSync) {
      return;
    }

    setIsUpdating(true);
    setStatusError(null);

    try {
      await advanceOrderStatus({
        orderId: order._id,
        currentStatus: order.status,
      });
      setPendingSyncStatus(order.status);
    } catch (error) {
      setStatusError('Unable to update order. Please try again.');
      setPendingSyncStatus(null);
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
              <Text style={styles.value}>{ORDER_STATUS_LABELS[order.status]}</Text>
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
            {isUpdating || isAwaitingStatusSync ? (
              <Text style={styles.meta}>Updating status...</Text>
            ) : null}

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
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    paddingBottom: theme.spacing.xxl,
  },
  eyebrow: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  title: {
    color: theme.colors.text,
    fontSize: 28,
    fontWeight: '700',
  },
  heroCard: {
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sectionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  actionCard: {
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  customerName: {
    color: theme.colors.text,
    fontSize: 24,
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
    fontSize: 13,
  },
  value: {
    color: theme.colors.text,
    fontSize: 15,
  },
  sectionTitle: {
    color: theme.colors.accent,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  itemsList: {
    gap: theme.spacing.sm,
  },
  meta: {
    color: theme.colors.muted,
    fontSize: 14,
  },
  error: {
    color: theme.colors.danger,
    fontSize: 14,
  },
  primaryAction: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  destructiveAction: {
    backgroundColor: theme.colors.dangerSoft,
    borderRadius: theme.radius.md,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryActionText: {
    color: theme.colors.surfaceElevated,
    fontSize: 14,
    fontWeight: '700',
  },
  destructiveActionText: {
    color: theme.colors.danger,
    fontSize: 14,
    fontWeight: '700',
  },
});
