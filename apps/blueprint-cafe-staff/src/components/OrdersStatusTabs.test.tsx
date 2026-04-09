import { fireEvent, render, screen } from '@testing-library/react-native';

import { OrdersStatusTabs } from './OrdersStatusTabs';

describe('OrdersStatusTabs', () => {
  it('renders all status tabs and marks the selected tab', () => {
    render(
      <OrdersStatusTabs
        selectedStatus="pending"
        counts={{
          pending: 2,
          preparing: 1,
          ready: 0,
          completed: 3,
        }}
        onSelect={jest.fn()}
      />,
    );

    expect(screen.getByRole('tab', { name: 'Pending' })).toHaveAccessibilityState({
      selected: true,
    });
    expect(screen.getByRole('tab', { name: 'Preparing' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Ready' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Completed' })).toBeTruthy();
  });

  it('calls onSelect with the pressed status', () => {
    const onSelect = jest.fn();

    render(
      <OrdersStatusTabs
        selectedStatus="pending"
        counts={{
          pending: 2,
          preparing: 1,
          ready: 0,
          completed: 3,
        }}
        onSelect={onSelect}
      />,
    );

    fireEvent.press(screen.getByRole('tab', { name: 'Preparing' }));

    expect(onSelect).toHaveBeenCalledWith('preparing');
  });
});
