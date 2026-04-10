import { v } from 'convex/values';

export const orderStatusValues = [
  'pending',
  'preparing',
  'ready',
  'completed',
  'canceled',
] as const;

export type OrderStatus = (typeof orderStatusValues)[number];

export const orderStatusValidator = v.union(
  v.literal('pending'),
  v.literal('preparing'),
  v.literal('ready'),
  v.literal('completed'),
  v.literal('canceled'),
);

export const BOARD_STATUS_ORDER: readonly OrderStatus[] = orderStatusValues;

export function getNextOrderStatus(status: OrderStatus): OrderStatus | null {
  switch (status) {
    case 'pending':
      return 'preparing';
    case 'preparing':
      return 'ready';
    case 'ready':
      return 'completed';
    case 'completed':
    case 'canceled':
      return null;
  }
}

export function canCancelOrderStatus(status: OrderStatus): boolean {
  return status === 'pending' || status === 'preparing';
}

export function isTerminalOrderStatus(status: OrderStatus): boolean {
  return status === 'completed' || status === 'canceled';
}
