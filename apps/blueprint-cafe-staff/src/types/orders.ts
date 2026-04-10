import type { Id } from '../lib/convexApi';

export type StaffOrderStatus =
  | 'pending'
  | 'preparing'
  | 'ready'
  | 'completed'
  | 'canceled';

export type StaffOrderItem = {
  lineItemId: string;
  name: string;
  quantity: number;
};

export type StaffOrder<OrderId extends string = string> = {
  _id: OrderId;
  customerName: string;
  serviceType: 'dine-in' | 'pickup' | 'delivery';
  paymentMethodName: string;
  notes?: string;
  items: StaffOrderItem[];
  total: number;
  status: StaffOrderStatus;
  submittedAt: number;
};

export type StaffOrderStatusCounts = Record<StaffOrderStatus, number>;

export const ORDER_STATUS_TABS: ReadonlyArray<{
  label: string;
  status: StaffOrderStatus;
}> = [
  { label: 'Pending', status: 'pending' },
  { label: 'Preparing', status: 'preparing' },
  { label: 'Ready', status: 'ready' },
  { label: 'Completed', status: 'completed' },
  { label: 'Canceled', status: 'canceled' },
];

export const ORDER_STATUS_LABELS: Record<StaffOrderStatus, string> = {
  pending: 'Pending',
  preparing: 'Preparing',
  ready: 'Ready',
  completed: 'Completed',
  canceled: 'Canceled',
};

export const ORDER_SERVICE_TYPE_LABELS: Record<StaffOrder['serviceType'], string> = {
  'dine-in': 'Dine-in',
  pickup: 'Pickup',
  delivery: 'Delivery',
};

export function formatOrderCurrency(total: number) {
  return `₱${Math.round(total).toLocaleString('en-PH')}`;
}

export const NEXT_ORDER_ACTION_LABELS: Partial<Record<StaffOrderStatus, string>> = {
  pending: 'Start Preparing',
  preparing: 'Mark Ready',
  ready: 'Complete Order',
};

export function canCancelOrder(status: StaffOrderStatus) {
  return status === 'pending' || status === 'preparing';
}

export type StaffOrderRecord = StaffOrder<Id<'orders'>>;
