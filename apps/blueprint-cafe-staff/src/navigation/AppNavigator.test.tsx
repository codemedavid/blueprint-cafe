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

jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');

  return {
    SafeAreaView: ({
      children,
      testID,
      style,
    }: {
      children: React.ReactNode;
      testID?: string;
      style?: unknown;
    }) => (
      <View testID={testID} style={style}>
        {children}
      </View>
    ),
  };
});

jest.mock('../providers/AuthProvider', () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock('../screens/OrdersScreen', () => ({
  OrdersScreen: () => {
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

  it('shows the light-theme staff orders entry copy when signed out', () => {
    const signIn = jest.fn();
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      signIn,
    });

    render(<AppNavigator />);

    expect(screen.getByTestId('login-safe-area')).toBeTruthy();
    expect(screen.getByTestId('login-logo')).toBeTruthy();
    expect(screen.getByText('Blueprint Cafe')).toBeTruthy();
    expect(screen.getByText('Staff Orders')).toBeTruthy();
    expect(screen.getByText('Open the live queue for this device.')).toBeTruthy();
    expect(screen.getByLabelText('Staff Password')).toBeTruthy();
  });

  it('blocks sign-in and shows an error when the password is wrong', () => {
    const signIn = jest.fn();
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      signIn,
    });

    render(<AppNavigator />);

    fireEvent.changeText(screen.getByLabelText('Staff Password'), 'wrong-password');
    fireEvent.press(screen.getByRole('button', { name: 'Open Orders' }));

    expect(signIn).not.toHaveBeenCalled();
    expect(screen.getByText('Incorrect password. Try again.')).toBeTruthy();
  });

  it('signs in when the correct password is entered', () => {
    const signIn = jest.fn();
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      signIn,
    });

    render(<AppNavigator />);

    fireEvent.changeText(
      screen.getByLabelText('Staff Password'),
      'BlueprintCafe@Admin!2026',
    );
    fireEvent.press(screen.getByRole('button', { name: 'Open Orders' }));

    expect(signIn).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Incorrect password. Try again.')).toBeNull();
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
