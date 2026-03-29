import React, { createContext, useContext, useState, useMemo, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type UserType = 'delivery' | 'shop' | null;

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  type: UserType;
  shopData?: { category?: string; address?: string; city?: string; deliveryFee?: number; deliveryTime?: string; isOpen?: boolean; imageUrl?: string };
}

interface AuthContextValue {
  user: AuthUser | null;
  userType: UserType;
  login: (user: AuthUser) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const STORAGE_KEY = '@tiligo_user_v2';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(data => {
      if (data) { try { setUser(JSON.parse(data)); } catch {} }
      setIsLoading(false);
    });
  }, []);

  const login = (u: AuthUser) => { setUser(u); AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(u)); };
  const logout = () => { setUser(null); AsyncStorage.removeItem(STORAGE_KEY); };

  const value = useMemo(() => ({ user, userType: user?.type ?? null, login, logout, isLoading }), [user, isLoading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
