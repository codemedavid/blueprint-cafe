import { useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from 'convex/react';

import { OrderRow } from '../components/OrderRow';
import { OrdersStatusTabs } from '../components/OrdersStatusTabs';
import { theme } from '../constants/theme';
import { api, type Id } from '../lib/convexApi';
import type { StaffOrder, StaffOrderStatus, StaffOrderStatusCounts } from '../types/orders';

type OrdersScreenNavigation = NativeStackNavigationProp<{
  OrderDetail: { orderId: Id<'orders'> };
}>;

const EMPTY_COUNTS: StaffOrderStatusCounts = {
  pending: 0,
  preparing: 0,
  ready: 0,
  completed: 0,
};

export function OrdersScreen() {
  const navigation = useNavigation<OrdersScreenNavigation>();
  const [selectedStatus, setSelectedStatus] = useState<StaffOrderStatus>('pending');
  const boardOrders = useQuery(api.orders.listBoardOrders) as StaffOrder[] | undefined;

  const counts: StaffOrderStatusCounts = { ...EMPTY_COUNTS };
  for (const order of boardOrders ?? []) {
    counts[order.status] += 1;
  }

  const filteredOrders = (boardOrders ?? []).filter(
    (order) => order.status === selectedStatus,
  );

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Orders</Text>
        <Text style={styles.subtitle}>Tap an order to view details.</Text>
      </View>

      <OrdersStatusTabs
        selectedStatus={selectedStatus}
        counts={counts}
        onSelect={setSelectedStatus}
      />

      {boardOrders === undefined ? <Text style={styles.statusText}>Loading orders...</Text> : null}

      {boardOrders !== undefined ? (
        <FlatList
          contentContainerStyle={styles.list}
          data={filteredOrders}
          keyExtractor={(order) => order._id}
          renderItem={({ item }) => (
            <OrderRow
              order={item}
              onPress={(orderId) =>
                navigation.navigate('OrderDetail', {
                  orderId: orderId as Id<'orders'>,
                })
              }
            />
          )}
          ListEmptyComponent={
            <Text style={styles.statusText}>No {selectedStatus} orders.</Text>
          }
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  header: {
    gap: 2,
  },
  title: {
    color: theme.colors.text,
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    color: theme.colors.muted,
    fontSize: 13,
  },
  list: {
    gap: theme.spacing.sm,
    paddingBottom: theme.spacing.lg,
  },
  statusText: {
    color: theme.colors.muted,
    fontSize: 13,
  },
});
