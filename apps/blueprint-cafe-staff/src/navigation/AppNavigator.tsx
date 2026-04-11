import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { theme } from '../constants/theme';
import { useAuth } from '../providers/AuthProvider';
import { OrderDetailScreen } from '../screens/OrderDetailScreen';
import { OrdersScreen } from '../screens/OrdersScreen';
import type { RootStackParamList } from '../types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

function LoginScreen() {
  const { signIn } = useAuth();

  return (
    <View style={styles.screen}>
      <View style={styles.loginCard}>
        <Text style={styles.eyebrow}>Blueprint Cafe</Text>
        <Text style={styles.title}>Staff Orders</Text>
        <Text style={styles.body}>Open the live queue for this device.</Text>
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
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background,
  },
  loginCard: {
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
  },
  eyebrow: {
    color: theme.colors.muted,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.9,
    marginBottom: theme.spacing.xs,
    textTransform: 'uppercase',
  },
  title: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: theme.spacing.sm,
  },
  body: {
    color: theme.colors.muted,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    minHeight: 40,
    paddingHorizontal: theme.spacing.lg,
    justifyContent: 'center',
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    color: theme.colors.surfaceElevated,
    fontSize: 12,
    fontWeight: '700',
  },
});
