import { RouteProp, useRoute } from '@react-navigation/native';
import { useQuery } from 'convex/react';
import { StyleSheet, Text, View } from 'react-native';

import { theme } from '../constants/theme';
import { api, type Id } from '../lib/convexApi';

type OrderDetailRouteParams = {
  OrderDetail: {
    orderId: Id<'orders'>;
  };
};

export function OrderDetailScreen() {
  const route = useRoute<RouteProp<OrderDetailRouteParams, 'OrderDetail'>>();
  const order = useQuery(api.orders.getOrderById, {
    orderId: route.params.orderId,
  });

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Order Detail</Text>
      {order === undefined ? <Text style={styles.meta}>Loading order...</Text> : null}
      {order === null ? <Text style={styles.meta}>Order not found.</Text> : null}
      {order ? (
        <>
          <Text style={styles.meta}>Order ID: {order._id}</Text>
          <Text style={styles.meta}>Status: {order.status}</Text>
        </>
      ) : null}
    </View>
  );
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
  meta: {
    color: theme.colors.muted,
    fontSize: 14,
  },
});
