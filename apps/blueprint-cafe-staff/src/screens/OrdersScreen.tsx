import { useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from 'convex/react';

import { OrderRow } from '../components/OrderRow';
import { OrdersStatusTabs } from '../components/OrdersStatusTabs';
import { theme } from '../constants/theme';
import { api } from '../lib/convexApi';
import type { RootStackParamList } from '../types/navigation';
import type { StaffOrderRecord, StaffOrderStatus, StaffOrderStatusCounts } from '../types/orders';

type OrdersScreenNavigation = NativeStackNavigationProp<RootStackParamList, 'Orders'>;

export function OrdersScreen() {
  const navigation = useNavigation<OrdersScreenNavigation>();
  const [selectedStatus, setSelectedStatus] = useState<StaffOrderStatus>('pending');
  const orders = useQuery(api.orders.listBoardOrders) as StaffOrderRecord[] | undefined;

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
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
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
