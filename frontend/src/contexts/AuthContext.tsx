'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { authApi } from '@/lib/api';

interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string, role?: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Get initial user from localStorage (runs only once during module initialization on client)
function getInitialUser(): User | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem('user');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      localStorage.removeItem('user');
    }
  }
  return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Initialize state directly from localStorage (no useEffect needed)
  const [user, setUserState] = useState<User | null>(getInitialUser);
  const [isLoading] = useState(false);

  const setUser = useCallback((newUser: User | null) => {
    setUserState(newUser);
    if (newUser) {
      localStorage.setItem('user', JSON.stringify(newUser));
    } else {
      localStorage.removeItem('user');
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await authApi.login({ email, password });
    const userData = response.data;
    setUser(userData);
  }, [setUser]);

  const signup = useCallback(async (email: string, password: string, name: string, role: string = 'user') => {
    const response = await authApi.signup({ email, password, name, role });
    const userData = response.data;
    setUser(userData);
  }, [setUser]);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore logout errors
    }
    setUser(null);
  }, [setUser]);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
