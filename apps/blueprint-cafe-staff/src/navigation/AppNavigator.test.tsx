import { fireEvent, render, screen } from '@testing-library/react-native';

import { AppNavigator } from './AppNavigator';

const mockUseAuth = jest.fn();
const mockNavigator = jest.fn();

jest.mock('@react-navigation/native', () => ({
  NavigationContainer: ({ children }: { children: unknown }) => children,
}));

jest.mock('@react-navigation/native-stack', () => {
  const { View } = require('react-native');

  return {
    createNativeStackNavigator: () => ({
      Navigator: ({
        children,
        initialRouteName,
      }: {
        children: unknown;
        initialRouteName: string;
      }) => {
        const React = require('react');
        mockNavigator(initialRouteName);
        const childArray = React.Children.toArray(children) as Array<{
          props?: { name?: string; component?: unknown };
        }>;
        const initialScreen = childArray.find(
          (child) => child.props?.name === initialRouteName,
        );
        const ScreenComponent = initialScreen?.props?.component as
          | undefined
          | (() => JSX.Element);

        return <View>{ScreenComponent ? <ScreenComponent /> : null}</View>;
      },
      Screen: () => null,
    }),
  };
});

jest.mock('../providers/AuthProvider', () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock('../screens/OrdersBoardScreen', () => ({
  OrdersBoardScreen: () => {
    const { Text } = require('react-native');
    return <Text>Orders Screen</Text>;
  },
}));

jest.mock('../screens/OrderDetailScreen', () => ({
  OrderDetailScreen: () => {
    const { Text } = require('react-native');
    return <Text>Order Detail Screen</Text>;
  },
}));

describe('AppNavigator', () => {
  beforeEach(() => {
    mockUseAuth.mockReset();
    mockNavigator.mockReset();
  });

  it('shows updated orders-focused copy and sign-in action when unauthenticated', () => {
    const signIn = jest.fn();
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      signIn,
    });

    render(<AppNavigator />);

    expect(
      screen.getByText('Open the live orders list for staff operations on this device.'),
    ).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Open Orders' }));

    expect(signIn).toHaveBeenCalledTimes(1);
  });

  it('uses Orders as the authenticated landing route', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      signIn: jest.fn(),
    });

    render(<AppNavigator />);

    expect(mockNavigator).toHaveBeenCalledWith('Orders');
    expect(screen.getByText('Orders Screen')).toBeTruthy();
  });
});
