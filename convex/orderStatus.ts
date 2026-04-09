import { v } from 'convex/values';

export const orderStatusValues = [
  'pending',
  'preparing',
  'ready',
  'completed',
] as const;

export type OrderStatus = (typeof orderStatusValues)[number];

export const orderStatusValidator = v.union(
  v.literal('pending'),
  v.literal('preparing'),
  v.literal('ready'),
  v.literal('completed'),
);

export const BOARD_STATUS_ORDER: readonly OrderStatus[] = orderStatusValues;

export function getNextOrderStatus(status: OrderStatus): OrderStatus | null {
  const currentIndex = BOARD_STATUS_ORDER.indexOf(status);
  if (currentIndex === -1) {
    return null;
  }
  const nextStatus = BOARD_STATUS_ORDER[currentIndex + 1];
  return nextStatus ?? null;
}

export function isTerminalOrderStatus(status: OrderStatus): boolean {
  return status === 'completed';
}
