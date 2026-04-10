import { RouteProp, useRoute } from '@react-navigation/native';
import { useMutation, useQuery } from 'convex/react';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { theme } from '../constants/theme';
import { api } from '../lib/convexApi';
import type { RootStackParamList } from '../types/navigation';
import {
  formatOrderCurrency,
  ORDER_SERVICE_TYPE_LABELS,
  ORDER_STATUS_LABELS,
  NEXT_ORDER_ACTION_LABELS,
  type StaffOrder,
  type StaffOrderStatus,
} from '../types/orders';

export function OrderDetailScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'OrderDetail'>>();
  const advanceOrderStatus = useMutation(api.orders.advanceOrderStatus);
  const [isUpdating, setIsUpdating] = useState(false);
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

  const actionLabel = order && !isAwaitingStatusSync ? getNextActionLabel(order.status) : null;

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

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      testID="order-detail-scroll"
    >
      <Text style={styles.title}>Order Detail</Text>
      {order === undefined ? <Text style={styles.meta}>Loading order...</Text> : null}
      {order === null ? <Text style={styles.meta}>Order not found.</Text> : null}
      {order ? (
        <View style={styles.card}>
          <Text style={styles.customerName}>{order.customerName}</Text>

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
          {isUpdating || isAwaitingStatusSync ? (
            <Text style={styles.meta}>Updating status...</Text>
          ) : null}

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
    </ScrollView>
  );
}

function getNextActionLabel(status: StaffOrderStatus) {
  if (status === 'completed') {
    return null;
  }
  return NEXT_ORDER_ACTION_LABELS[status] ?? null;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
    paddingBottom: theme.spacing.xl,
  },
  title: {
    color: theme.colors.text,
    fontSize: 21,
    fontWeight: '700',
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.18)',
  },
  customerName: {
    color: theme.colors.text,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: theme.spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  block: {
    gap: theme.spacing.xs,
    paddingTop: theme.spacing.sm,
  },
  sectionTitle: {
    color: theme.colors.accent,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  itemsList: {
    gap: theme.spacing.xs,
  },
  meta: {
    color: theme.colors.muted,
    fontSize: 12,
  },
  error: {
    color: '#fca5a5',
    fontSize: 12,
  },
  actionButton: {
    marginTop: theme.spacing.sm,
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
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
    fontSize: 12,
    fontWeight: '700',
  },
});
