// src/contexts/auth-context.tsx
"use client";
import type React from 'react';
import { createContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { DEFAULT_LOGIN_CREDENTIALS, LOCAL_STORAGE_AUTH_KEY } from '@/lib/constants';
import type { AuthState, AuthContextType, User } from '@/lib/types';

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>(initialState);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const storedAuth = localStorage.getItem(LOCAL_STORAGE_AUTH_KEY);
      if (storedAuth) {
        const parsedAuth: AuthState = JSON.parse(storedAuth);
        if (parsedAuth.isAuthenticated && parsedAuth.user) {
          setAuthState(parsedAuth);
        }
      }
    } catch (error) {
      console.error("Failed to load auth state from localStorage", error);
      localStorage.removeItem(LOCAL_STORAGE_AUTH_KEY);
    }
    setLoading(false);
  }, []);

  const login = useCallback((username: string) => {
    // In a real app, you'd verify credentials against a backend.
    // Here, we just set the user if credentials match the default.
    // The actual check for credentials should happen in the login form.
    const user: User = { username };
    const newAuthState: AuthState = { isAuthenticated: true, user };
    setAuthState(newAuthState);
    localStorage.setItem(LOCAL_STORAGE_AUTH_KEY, JSON.stringify(newAuthState));
    router.push('/dashboard');
  }, [router]);

  const logout = useCallback(() => {
    setAuthState(initialState);
    localStorage.removeItem(LOCAL_STORAGE_AUTH_KEY);
    router.push('/login');
  }, [router]);

  if (loading) {
    // You can return a loading spinner here if needed
    return <div className="flex h-screen items-center justify-center"><p>Loading authentication...</p></div>;
  }

  return (
    <AuthContext.Provider value={{ ...authState, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
