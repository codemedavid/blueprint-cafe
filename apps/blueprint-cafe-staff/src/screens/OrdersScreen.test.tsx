import { fireEvent, render, screen } from '@testing-library/react-native';

import type { StaffOrder } from '../types/orders';
import { OrdersScreen } from './OrdersScreen';

const mockUseQuery = jest.fn();
const mockNavigate = jest.fn();

jest.mock('convex/react', () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

jest.mock('../lib/convexApi', () => ({
  api: {
    orders: {
      listBoardOrders: { _reference: 'orders.listBoardOrders' },
    },
  },
}));

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

describe('OrdersScreen', () => {
  beforeEach(() => {
    mockUseQuery.mockReset();
    mockNavigate.mockReset();
  });

  it('shows pending orders by default', () => {
    mockUseQuery.mockReturnValue([
      createOrder({ _id: 'order-pending', customerName: 'Ari', status: 'pending' }),
      createOrder({ _id: 'order-preparing', customerName: 'Bea', status: 'preparing' }),
    ]);

    render(<OrdersScreen />);

    expect(screen.getByRole('tab', { name: 'Pending' })).toHaveAccessibilityState({
      selected: true,
    });
    expect(screen.getByText('Ari')).toBeTruthy();
    expect(screen.queryByText('Bea')).toBeNull();
  });

  it('filters visible rows when switching tabs', () => {
    mockUseQuery.mockReturnValue([
      createOrder({ _id: 'order-pending', customerName: 'Ari', status: 'pending' }),
      createOrder({ _id: 'order-preparing', customerName: 'Bea', status: 'preparing' }),
      createOrder({ _id: 'order-ready', customerName: 'Cole', status: 'ready' }),
    ]);

    render(<OrdersScreen />);

    fireEvent.press(screen.getByRole('tab', { name: 'Preparing' }));
    expect(screen.getByText('Bea')).toBeTruthy();
    expect(screen.queryByText('Ari')).toBeNull();
    expect(screen.queryByText('Cole')).toBeNull();

    fireEvent.press(screen.getByRole('tab', { name: 'Ready' }));
    expect(screen.getByText('Cole')).toBeTruthy();
    expect(screen.queryByText('Ari')).toBeNull();
  });

  it('navigates to order detail with order id when a row is pressed', () => {
    mockUseQuery.mockReturnValue([
      createOrder({ _id: 'order-pending', customerName: 'Ari', status: 'pending' }),
    ]);

    render(<OrdersScreen />);

    fireEvent.press(screen.getByRole('button', { name: 'Open order Ari' }));

    expect(mockNavigate).toHaveBeenCalledWith('OrderDetail', {
      orderId: 'order-pending',
    });
  });
});
