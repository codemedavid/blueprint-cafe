import AsyncStorage from '@react-native-async-storage/async-storage';
import { PropsWithChildren, createContext, useContext, useEffect, useState } from 'react';

type AuthContextValue = {
  isHydrated: boolean;
  isAuthenticated: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AUTH_STORAGE_KEY = 'blueprint-cafe-staff.is-authenticated';

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let isMounted = true;

    AsyncStorage.getItem(AUTH_STORAGE_KEY)
      .then((storedValue) => {
        if (!isMounted) {
          return;
        }

        setIsAuthenticated(storedValue === 'true');
      })
      .finally(() => {
        if (isMounted) {
          setIsHydrated(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const persistAuthState = async (nextState: boolean) => {
    setIsAuthenticated(nextState);
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, nextState ? 'true' : 'false');
  };

  const value: AuthContextValue = {
    isHydrated,
    isAuthenticated,
    signIn: () => persistAuthState(true),
    signOut: () => persistAuthState(false),
  };

  if (!isHydrated) {
    return null;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
