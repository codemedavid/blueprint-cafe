import { useEffect, useRef, useState } from 'react';
import { AppState, FlatList, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from 'convex/react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OrderRow } from '../components/OrderRow';
import { OrdersStatusTabs } from '../components/OrdersStatusTabs';
import { theme } from '../constants/theme';
import { api } from '../lib/convexApi';
import { triggerOrderAlert } from '../lib/ringtone';
import type { RootStackParamList } from '../types/navigation';
import type { StaffOrderRecord, StaffOrderStatus, StaffOrderStatusCounts } from '../types/orders';

type OrdersScreenNavigation = NativeStackNavigationProp<RootStackParamList, 'Orders'>;

export function OrdersScreen() {
  const navigation = useNavigation<OrdersScreenNavigation>();
  const [selectedStatus, setSelectedStatus] = useState<StaffOrderStatus>('pending');
  const [appState, setAppState] = useState(AppState.currentState);
  const orders = useQuery(api.orders.listBoardOrders) as StaffOrderRecord[] | undefined;
  const previousOrderIdsRef = useRef<Set<string> | null>(null);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      setAppState(nextState);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (orders === undefined) {
      return;
    }

    const currentOrderIds = new Set(orders.map((order) => order._id));

    if (previousOrderIdsRef.current === null) {
      previousOrderIdsRef.current = currentOrderIds;
      return;
    }

    if (appState !== 'active') {
      previousOrderIdsRef.current = currentOrderIds;
      return;
    }

    let newOrderCount = 0;
    for (const orderId of currentOrderIds) {
      if (!previousOrderIdsRef.current.has(orderId)) {
        newOrderCount += 1;
      }
    }

    previousOrderIdsRef.current = currentOrderIds;

    for (let i = 0; i < newOrderCount; i += 1) {
      void triggerOrderAlert();
    }
  }, [orders, appState]);

  const counts: StaffOrderStatusCounts = {
    pending: 0,
    preparing: 0,
    ready: 0,
    completed: 0,
    canceled: 0,
  };

  for (const order of orders ?? []) {
    counts[order.status] += 1;
  }

  const filteredOrders = (orders ?? []).filter((order) => order.status === selectedStatus);

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea} testID="orders-safe-area">
      <View style={styles.screen}>
      <View style={styles.headerBlock}>
        <Text style={styles.eyebrow}>Blueprint Cafe</Text>
        <Text style={styles.title}>Staff Orders</Text>
        <Text style={styles.subtitle}>
          Track the live queue and open any order for next-step actions.
        </Text>
      </View>

      <OrdersStatusTabs
        selectedStatus={selectedStatus}
        counts={counts}
        onSelect={setSelectedStatus}
      />

      <View style={styles.listSection}>
        {orders === undefined ? <Text style={styles.statusText}>Loading orders...</Text> : null}

        {orders !== undefined ? (
          <FlatList
            contentContainerStyle={styles.list}
            data={filteredOrders}
            keyExtractor={(order) => order._id}
            renderItem={({ item }) => (
              <OrderRow
                order={item}
                onPress={(orderId) =>
                  navigation.navigate('OrderDetail', {
                    orderId,
                  })
                }
              />
            )}
            ListEmptyComponent={
              <Text style={styles.statusText}>No {selectedStatus} orders right now.</Text>
            }
          />
        ) : null}
      </View>
      </View>
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
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  headerBlock: {
    gap: theme.spacing.xs,
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
  subtitle: {
    color: theme.colors.muted,
    fontSize: 12,
    lineHeight: 17,
  },
  listSection: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.sm,
  },
  list: {
    gap: theme.spacing.xs,
    paddingBottom: theme.spacing.sm,
  },
  statusText: {
    color: theme.colors.muted,
    fontSize: 12,
  },
});
