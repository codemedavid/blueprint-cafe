import type { Id } from '../lib/convexApi';

export type RootStackParamList = {
  Login: undefined;
  Orders: undefined;
  OrderDetail: { orderId: Id<'orders'> };
};
