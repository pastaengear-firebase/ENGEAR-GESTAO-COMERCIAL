// src/contexts/auth-context.tsx
"use client";
import type React from 'react';
import { createContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { LOCAL_STORAGE_AUTH_KEY } from '@/lib/constants';
import type { AuthState, AuthContextType, User } from '@/lib/types';

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

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
          // Sync cookie with localStorage state
          document.cookie = `isAuthenticated=true; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}`;
        } else {
          // Invalid or unauthenticated state in localStorage
          document.cookie = 'isAuthenticated=false; path=/; max-age=0';
        }
      } else {
        // No auth state in localStorage, ensure cookie reflects this
        document.cookie = 'isAuthenticated=false; path=/; max-age=0';
      }
    } catch (error) {
      console.error("Failed to load auth state from localStorage", error);
      localStorage.removeItem(LOCAL_STORAGE_AUTH_KEY);
      // Ensure cookie is cleared on error
      document.cookie = 'isAuthenticated=false; path=/; max-age=0';
    }
    setLoading(false);
  }, []);

  const login = useCallback((username: string) => {
    const user: User = { username };
    const newAuthState: AuthState = { isAuthenticated: true, user };
    setAuthState(newAuthState);
    localStorage.setItem(LOCAL_STORAGE_AUTH_KEY, JSON.stringify(newAuthState));
    // Set cookie for middleware
    document.cookie = `isAuthenticated=true; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}`;
    router.push('/dashboard');
  }, [router]);

  const logout = useCallback(() => {
    setAuthState(initialState);
    localStorage.removeItem(LOCAL_STORAGE_AUTH_KEY);
    // Clear cookie for middleware
    document.cookie = 'isAuthenticated=false; path=/; max-age=0'; // Expire immediately
    router.push('/login');
  }, [router]);

  if (loading) {
    return <div className="flex h-screen items-center justify-center"><p>Loading authentication...</p></div>;
  }

  return (
    <AuthContext.Provider value={{ ...authState, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
