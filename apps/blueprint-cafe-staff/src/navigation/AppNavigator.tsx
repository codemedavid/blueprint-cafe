import { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { theme } from '../constants/theme';
import { useAuth } from '../providers/AuthProvider';
import { OrderDetailScreen } from '../screens/OrderDetailScreen';
import { OrdersScreen } from '../screens/OrdersScreen';
import type { RootStackParamList } from '../types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();
const STAFF_APP_PASSWORD = 'BlueprintCafe@Admin!2026';
const BRAND_LOGO = require('../../assets/logo.png');

function LoginScreen() {
  const { signIn } = useAuth();
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = () => {
    if (password !== STAFF_APP_PASSWORD) {
      setErrorMessage('Incorrect password. Try again.');
      return;
    }

    setErrorMessage(null);
    void signIn();
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea} testID="login-safe-area">
      <View style={styles.screen}>
        <View style={styles.loginCard}>
          <Image source={BRAND_LOGO} style={styles.logo} resizeMode="contain" testID="login-logo" />
          <Text style={styles.eyebrow}>Blueprint Cafe</Text>
          <Text style={styles.title}>Staff Orders</Text>
          <Text style={styles.body}>Open the live queue for this device.</Text>
          <TextInput
            accessibilityLabel="Staff Password"
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={(nextValue) => {
              setPassword(nextValue);
              if (errorMessage) {
                setErrorMessage(null);
              }
            }}
            placeholder="Enter staff password"
            placeholderTextColor={theme.colors.muted}
            secureTextEntry
            style={styles.input}
            value={password}
          />
          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open Orders"
            onPress={handleSubmit}
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          >
            <Text style={styles.buttonText}>Open Orders</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
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
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
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
  logo: {
    width: 176,
    height: 176,
    marginBottom: theme.spacing.sm,
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
  input: {
    width: '100%',
    minHeight: 44,
    marginBottom: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    fontSize: 13,
  },
  errorText: {
    width: '100%',
    marginBottom: theme.spacing.sm,
    color: theme.colors.primary,
    fontSize: 12,
  },
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    minHeight: 40,
    width: '100%',
    paddingHorizontal: theme.spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
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
