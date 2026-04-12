import { RouteProp, useRoute } from '@react-navigation/native';
import { useMutation, useQuery } from 'convex/react';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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

type OptimisticStatusState = {
  status: StaffOrderStatus;
  serverStatusAtUpdate: StaffOrderStatus;
};

function formatVariationSummary(
  variations: Array<{ name: string }>,
) {
  if (variations.length === 0) {
    return null;
  }

  return `Variations: ${variations.map((variation) => variation.name).join(', ')}`;
}

function formatAddOnSummary(
  addOns: Array<{ name: string; quantity: number }>,
) {
  if (addOns.length === 0) {
    return null;
  }

  return `Add-ons: ${addOns
    .map((addOn) => (addOn.quantity > 1 ? `${addOn.name} x${addOn.quantity}` : addOn.name))
    .join(', ')}`;
}

export function OrderDetailScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'OrderDetail'>>();
  const advanceOrderStatus = useMutation(api.orders.advanceOrderStatus);
  const cancelOrder = useMutation(api.orders.cancelOrder);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [optimisticState, setOptimisticState] = useState<OptimisticStatusState | null>(null);

  const order = useQuery(api.orders.getOrderById, {
    orderId: route.params.orderId,
  });

  const effectiveStatus: StaffOrderStatus | null = order
    ? (optimisticState?.status ?? order.status)
    : null;
  const actionLabel = effectiveStatus ? NEXT_ORDER_ACTION_LABELS[effectiveStatus] ?? null : null;
  const showCancelAction = effectiveStatus ? canCancelOrder(effectiveStatus) : false;

  useEffect(() => {
    if (order === undefined || order === null || optimisticState === null) {
      return;
    }

    if (
      order.status === optimisticState.status ||
      order.status !== optimisticState.serverStatusAtUpdate
    ) {
      setOptimisticState(null);
    }
  }, [order, optimisticState]);

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
        setOptimisticState({
          status: nextStatus,
          serverStatusAtUpdate: order.status,
        });
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
      setOptimisticState({
        status: 'canceled',
        serverStatusAtUpdate: order.status,
      });
    } catch {
      setStatusError('Unable to cancel order. Please try again.');
    } finally {
      setIsCanceling(false);
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea} testID="order-detail-safe-area">
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
                {order.items.map((item) => {
                  const variationSummary = formatVariationSummary(item.selectedVariations);
                  const addOnSummary = formatAddOnSummary(item.selectedAddOns);

                  return (
                    <View key={item.lineItemId} style={styles.itemBlock}>
                      <Text style={styles.value}>
                        {item.quantity}x {item.name}
                      </Text>
                      {variationSummary ? (
                        <Text style={styles.itemMeta}>{variationSummary}</Text>
                      ) : null}
                      {addOnSummary ? <Text style={styles.itemMeta}>{addOnSummary}</Text> : null}
                    </View>
                  );
                })}
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
              {isUpdating || isCanceling ? (
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
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
  itemBlock: {
    gap: theme.spacing.xs,
  },
  itemMeta: {
    color: theme.colors.muted,
    fontSize: 12,
  },
  itemsList: {
    gap: theme.spacing.sm,
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
