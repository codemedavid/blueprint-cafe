import { fireEvent, render, screen } from '@testing-library/react-native';

import { OrderCard } from './OrderCard';
import type { StaffOrder } from '../types/orders';

describe('OrderCard', () => {
  it('renders order summary details and advances the order when the action is pressed', () => {
    const order: StaffOrder = {
      _id: 'order-1',
      customerName: 'Blueprint Tester',
      serviceType: 'dine-in',
      paymentMethodName: 'Cash',
      notes: 'Less ice',
      items: [
        { lineItemId: 'item-1', name: 'Iced Americano', quantity: 2 },
        { lineItemId: 'item-2', name: 'Cheesecake', quantity: 1 },
      ],
      total: 230,
      status: 'pending',
      submittedAt: 1710000000000,
    };
    const onAdvance = jest.fn();

    render(<OrderCard order={order} onAdvance={onAdvance} />);

    expect(screen.getByText('Blueprint Tester')).toBeTruthy();
    expect(screen.getByText('Dine-in')).toBeTruthy();
    expect(screen.getByText('Cash')).toBeTruthy();
    expect(screen.getByText('Less ice')).toBeTruthy();
    expect(screen.getByText('2x Iced Americano')).toBeTruthy();
    expect(screen.getByText('1x Cheesecake')).toBeTruthy();
    expect(screen.getByText('₱230')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Start Preparing' })).toBeTruthy();

    fireEvent.press(screen.getByRole('button', { name: 'Start Preparing' }));

    expect(onAdvance).toHaveBeenCalledWith('order-1', 'pending');
  });
});
