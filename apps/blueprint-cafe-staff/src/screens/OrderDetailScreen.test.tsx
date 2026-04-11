import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import type { StaffOrder } from '../types/orders';
import { OrderDetailScreen } from './OrderDetailScreen';

const mockUseRoute = jest.fn();
const mockUseQuery = jest.fn();
const mockUseMutation = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useRoute: () => mockUseRoute(),
}));

jest.mock('convex/react', () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
  useMutation: (...args: unknown[]) => mockUseMutation(...args),
}));

jest.mock('../lib/convexApi', () => ({
  api: {
    orders: {
      getOrderById: { _reference: 'orders.getOrderById' },
      advanceOrderStatus: { _reference: 'orders.advanceOrderStatus' },
      cancelOrder: { _reference: 'orders.cancelOrder' },
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

describe('OrderDetailScreen', () => {
  beforeEach(() => {
    mockUseRoute.mockReset();
    mockUseQuery.mockReset();
    mockUseMutation.mockReset();

    mockUseRoute.mockReturnValue({
      params: { orderId: 'order-123' },
    });
  });

  it('renders notes and line items for the selected order', () => {
    mockUseQuery.mockReturnValue(
      createOrder({
        _id: 'order-123',
        customerName: 'Ari',
        status: 'preparing',
        serviceType: 'pickup',
        paymentMethodName: 'GCash',
        total: 412,
        notes: 'No ice',
        items: [
          { lineItemId: 'item-1', name: 'Iced Latte', quantity: 2 },
          { lineItemId: 'item-2', name: 'Brownie', quantity: 1 },
        ],
      }),
    );
    mockUseMutation.mockReturnValue(jest.fn());

    render(<OrderDetailScreen />);

    expect(screen.getByText('Ari')).toBeTruthy();
    expect(screen.getByText('Preparing')).toBeTruthy();
    expect(screen.getByText('Pickup')).toBeTruthy();
    expect(screen.getByText('GCash')).toBeTruthy();
    expect(screen.getByText('₱412')).toBeTruthy();
    expect(screen.getByText('No ice')).toBeTruthy();
    expect(screen.getByText('2x Iced Latte')).toBeTruthy();
    expect(screen.getByText('1x Brownie')).toBeTruthy();
  });

  it('shows loading and missing-order states', () => {
    mockUseQuery.mockReturnValue(undefined);
    mockUseMutation.mockReturnValue(jest.fn());

    const { rerender } = render(<OrderDetailScreen />);
    expect(screen.getByText('Loading order...')).toBeTruthy();

    mockUseQuery.mockReturnValue(null);
    rerender(<OrderDetailScreen />);
    expect(screen.getByText('Order not found.')).toBeTruthy();
  });

  it('calls advanceOrderStatus with orderId and currentStatus on successful action', async () => {
    const advanceOrderStatus = jest.fn().mockResolvedValue(undefined);
    mockUseQuery.mockReturnValue(
      createOrder({
        _id: 'order-123',
        status: 'pending',
      }),
    );
    mockUseMutation.mockReturnValue(advanceOrderStatus);

    render(<OrderDetailScreen />);

    fireEvent.press(screen.getByRole('button', { name: 'Start Preparing' }));

    await waitFor(() => {
      expect(advanceOrderStatus).toHaveBeenCalledWith({
        orderId: 'order-123',
        currentStatus: 'pending',
      });
    });
  });

  it('applies optimistic status after advance and uses it for the next action while query data is stale', async () => {
    const advanceOrderStatus = jest
      .fn()
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined);
    mockUseQuery.mockReturnValue(
      createOrder({
        _id: 'order-123',
        status: 'pending',
      }),
    );
    mockUseMutation.mockReturnValue(advanceOrderStatus);

    render(<OrderDetailScreen />);

    fireEvent.press(screen.getByRole('button', { name: 'Start Preparing' }));

    await waitFor(() => {
      expect(advanceOrderStatus).toHaveBeenCalledTimes(1);
    });
    expect(screen.queryByText('Updating status...')).toBeNull();
    expect(screen.getByText('Preparing')).toBeTruthy();
    const markReadyButton = screen.getByRole('button', { name: 'Mark Ready' });
    await waitFor(() => {
      expect(markReadyButton).not.toBeDisabled();
    });

    fireEvent.press(markReadyButton);

    await waitFor(() => {
      expect(advanceOrderStatus).toHaveBeenCalledTimes(2);
    });
    expect(advanceOrderStatus).toHaveBeenNthCalledWith(2, {
      orderId: 'order-123',
      currentStatus: 'preparing',
    });
  });

  it('shows Mark Ready as the primary action for preparing orders', () => {
    mockUseQuery.mockReturnValue(
      createOrder({
        _id: 'order-123',
        status: 'preparing',
      }),
    );
    mockUseMutation.mockReturnValue(jest.fn());

    render(<OrderDetailScreen />);

    expect(screen.getByRole('button', { name: 'Mark Ready' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Start Preparing' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Complete Order' })).toBeNull();
  });

  it('hides the action button for completed orders', () => {
    mockUseQuery.mockReturnValue(
      createOrder({
        _id: 'order-123',
        status: 'completed',
      }),
    );
    mockUseMutation.mockReturnValue(jest.fn());

    render(<OrderDetailScreen />);

    expect(screen.queryByRole('button', { name: 'Complete Order' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Mark Ready' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Start Preparing' })).toBeNull();
  });

  it('shows an error when status action fails', async () => {
    const advanceOrderStatus = jest.fn().mockRejectedValue(new Error('Network down'));
    mockUseQuery.mockReturnValue(
      createOrder({
        _id: 'order-123',
        status: 'ready',
      }),
    );
    mockUseMutation.mockReturnValue(advanceOrderStatus);

    render(<OrderDetailScreen />);

    fireEvent.press(screen.getByRole('button', { name: 'Complete Order' }));

    await waitFor(() => {
      expect(screen.getByText('Unable to update order. Please try again.')).toBeTruthy();
    });
  });

  it('shows Cancel Order for pending orders and calls cancelOrder', async () => {
    const cancelOrder = jest.fn().mockResolvedValue(undefined);
    mockUseQuery.mockReturnValue(
      createOrder({
        _id: 'order-123',
        status: 'pending',
      }),
    );
    mockUseMutation
      .mockReturnValueOnce(jest.fn())
      .mockReturnValueOnce(cancelOrder);

    render(<OrderDetailScreen />);

    fireEvent.press(screen.getByRole('button', { name: 'Cancel Order' }));

    await waitFor(() => {
      expect(cancelOrder).toHaveBeenCalledWith({
        orderId: 'order-123',
      });
    });
  });

  it('applies optimistic canceled state after cancel while query data is stale', async () => {
    const cancelOrder = jest.fn().mockResolvedValue(undefined);
    mockUseQuery.mockReturnValue(
      createOrder({
        _id: 'order-123',
        status: 'pending',
      }),
    );
    mockUseMutation
      .mockReturnValueOnce(jest.fn())
      .mockReturnValueOnce(cancelOrder);

    render(<OrderDetailScreen />);

    fireEvent.press(screen.getByRole('button', { name: 'Cancel Order' }));

    await waitFor(() => {
      expect(cancelOrder).toHaveBeenCalledTimes(1);
    });
    expect(screen.queryByText('Updating status...')).toBeNull();
    expect(screen.getByText('Canceled')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Cancel Order' })).toBeNull();
    expect(screen.queryByText('Unable to cancel order. Please try again.')).toBeNull();
  });

  it('hides Cancel Order immediately after a successful advance based on optimistic status', async () => {
    const advanceOrderStatus = jest.fn().mockResolvedValue(undefined);
    const cancelOrder = jest.fn();
    mockUseQuery.mockReturnValue(
      createOrder({
        _id: 'order-123',
        status: 'preparing',
      }),
    );
    mockUseMutation
      .mockReturnValueOnce(advanceOrderStatus)
      .mockReturnValueOnce(cancelOrder);

    render(<OrderDetailScreen />);

    fireEvent.press(screen.getByRole('button', { name: 'Mark Ready' }));

    await waitFor(() => {
      expect(advanceOrderStatus).toHaveBeenCalledTimes(1);
    });
    expect(screen.queryByText('Updating status...')).toBeNull();
    expect(screen.getByText('Ready')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Cancel Order' })).toBeNull();
    expect(cancelOrder).not.toHaveBeenCalled();
  });

  it('hides Cancel Order for ready orders', () => {
    mockUseQuery.mockReturnValue(
      createOrder({
        _id: 'order-123',
        status: 'ready',
      }),
    );
    mockUseMutation.mockReturnValue(jest.fn());

    render(<OrderDetailScreen />);

    expect(screen.queryByRole('button', { name: 'Cancel Order' })).toBeNull();
  });

  it('shows in-flight state and disables action while updating', async () => {
    const advanceOrderStatus = jest.fn(() => new Promise(() => {}));
    mockUseQuery.mockReturnValue(
      createOrder({
        _id: 'order-123',
        status: 'pending',
      }),
    );
    mockUseMutation.mockReturnValue(advanceOrderStatus);

    render(<OrderDetailScreen />);

    const actionButton = screen.getByRole('button', { name: 'Start Preparing' });
    fireEvent.press(actionButton);

    await waitFor(() => {
      expect(screen.getByText('Updating status...')).toBeTruthy();
      expect(actionButton).toBeDisabled();
    });
  });

  it('renders inside a scrollable container', () => {
    mockUseQuery.mockReturnValue(
      createOrder({
        _id: 'order-123',
      }),
    );
    mockUseMutation.mockReturnValue(jest.fn());

    render(<OrderDetailScreen />);

    expect(screen.getByTestId('order-detail-scroll')).toBeTruthy();
  });
});
