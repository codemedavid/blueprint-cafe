export type StaffOrderStatus = 'pending' | 'preparing' | 'ready' | 'completed';

export type StaffOrderItem = {
  lineItemId: string;
  name: string;
  quantity: number;
};

export type StaffOrder = {
  _id: string;
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
];
