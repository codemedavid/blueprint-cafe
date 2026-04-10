import { fireEvent, render, screen } from '@testing-library/react-native';

import type { StaffOrder } from '../types/orders';
import { OrderRow } from './OrderRow';

describe('OrderRow', () => {
  it('renders the redesigned two-row order summary without workflow action controls', () => {
    const order: StaffOrder = {
      _id: 'order-1',
      customerName: 'Blueprint Tester',
      serviceType: 'dine-in',
      paymentMethodName: 'Cash',
      items: [
        { lineItemId: 'item-1', name: 'Iced Americano', quantity: 2 },
        { lineItemId: 'item-2', name: 'Cheesecake', quantity: 1 },
      ],
      total: 230,
      status: 'pending',
      submittedAt: 1710000000000,
    };
    const onPress = jest.fn();

    render(<OrderRow order={order} onPress={onPress} />);

    expect(screen.getByText('Blueprint Tester')).toBeTruthy();
    expect(screen.getByText('₱230')).toBeTruthy();
    expect(screen.getByText('Dine-in')).toBeTruthy();
    expect(screen.getByText('Cash')).toBeTruthy();
    expect(screen.getByText('2 items')).toBeTruthy();
    expect(screen.getAllByText('•')).toHaveLength(2);
    expect(screen.queryByText('·')).toBeNull();

    expect(screen.queryByRole('button', { name: 'Start Preparing' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Mark Ready' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Complete Order' })).toBeNull();

    fireEvent.press(screen.getByRole('button', { name: 'Open order Blueprint Tester' }));

    expect(onPress).toHaveBeenCalledWith('order-1');
  });
});
