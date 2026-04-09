import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { theme } from '../constants/theme';
import type { Id } from '../lib/convexApi';
import { useAuth } from '../providers/AuthProvider';
import { OrderDetailScreen } from '../screens/OrderDetailScreen';
import { OrdersScreen } from '../screens/OrdersScreen';

type RootStackParamList = {
  Login: undefined;
  Orders: undefined;
  OrderDetail: { orderId: Id<'orders'> };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function LoginScreen() {
  const { signIn } = useAuth();

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Staff Login</Text>
      <Text style={styles.body}>
        Open the live orders list for staff operations on this device.
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open Orders"
        onPress={() => {
          void signIn();
        }}
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
      >
        <Text style={styles.buttonText}>Open Orders</Text>
      </Pressable>
    </View>
  );
}

export function AppNavigator() {
  const { isAuthenticated } = useAuth();

  return (
    <NavigationContainer>
      <Stack.Navigator
        key={isAuthenticated ? 'authenticated' : 'guest'}
        initialRouteName={isAuthenticated ? 'Orders' : 'Login'}
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: theme.colors.background,
          },
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Orders" component={OrdersScreen} />
        <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.background,
  },
  title: {
    color: theme.colors.text,
    fontSize: 24,
    fontWeight: '700',
    marginBottom: theme.spacing.sm,
  },
  body: {
    color: theme.colors.muted,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
});
