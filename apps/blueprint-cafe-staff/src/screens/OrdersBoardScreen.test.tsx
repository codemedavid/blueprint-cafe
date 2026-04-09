import { render, screen } from '@testing-library/react-native';

import type { StaffOrder } from '../types/orders';
import { OrdersBoardScreen } from './OrdersBoardScreen';

const mockUseQuery = jest.fn();
jest.mock('convex/react', () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}));

jest.mock('../lib/convexApi', () => ({
  api: {
    orders: {
      listBoardOrders: { _reference: 'orders.listBoardOrders' },
    },
  },
}));

jest.mock('../components/OrderSection', () => {
  const React = require('react');
  const { Pressable, Text, View } = require('react-native');

  return {
    OrderSection: ({
      title,
      orders,
    }: {
      title: string;
      orders: StaffOrder[];
    }) => (
      <View>
        <Text>{title}</Text>
        {orders.map((order) => (
          <Text key={order._id}>
            {title}:{order.customerName}
          </Text>
        ))}
      </View>
    ),
  };
});

function createOrder(overrides: Partial<StaffOrder>): StaffOrder {
  return {
    _id: 'order-1',
    customerName: 'Blueprint Tester',
    serviceType: 'dine-in',
    paymentMethodName: 'Cash',
    items: [{ lineItemId: 'item-1', name: 'Latte', quantity: 1 }],
    total: 180,
    status: 'pending',
    submittedAt: 1710000000000,
    ...overrides,
  };
}

describe('OrdersBoardScreen', () => {
  beforeEach(() => {
    mockUseQuery.mockReset();
  });

  it('renders all four sections and groups orders by backend status without status mutation wiring', () => {
    mockUseQuery.mockReturnValue([
      createOrder({ _id: 'order-pending', customerName: 'Ari', status: 'pending' }),
      createOrder({ _id: 'order-preparing', customerName: 'Bea', status: 'preparing' }),
      createOrder({ _id: 'order-ready', customerName: 'Cole', status: 'ready' }),
      createOrder({ _id: 'order-completed', customerName: 'Dee', status: 'completed' }),
    ]);

    render(<OrdersBoardScreen />);

    expect(screen.getByText('Pending')).toBeTruthy();
    expect(screen.getByText('Preparing')).toBeTruthy();
    expect(screen.getByText('Ready')).toBeTruthy();
    expect(screen.getByText('Completed')).toBeTruthy();

    expect(screen.getByText('Pending:Ari')).toBeTruthy();
    expect(screen.getByText('Preparing:Bea')).toBeTruthy();
    expect(screen.getByText('Ready:Cole')).toBeTruthy();
    expect(screen.getByText('Completed:Dee')).toBeTruthy();

    expect(screen.queryByText('Pending:Bea')).toBeNull();
    expect(screen.queryByText('Preparing:Cole')).toBeNull();
    expect(screen.queryByText('Ready:Dee')).toBeNull();
    expect(screen.queryByRole('button', { name: /Advance /i })).toBeNull();
  });
});
