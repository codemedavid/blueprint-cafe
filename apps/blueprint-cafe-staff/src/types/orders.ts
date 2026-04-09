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
