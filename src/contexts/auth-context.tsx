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
    let resolvedAuthState: AuthState = initialState;
    let cookieValue = 'false';
    let cookieMaxAge = 0;

    try {
      const storedAuth = localStorage.getItem(LOCAL_STORAGE_AUTH_KEY);
      if (storedAuth) {
        const parsedAuth: AuthState = JSON.parse(storedAuth);
        if (parsedAuth.isAuthenticated && parsedAuth.user) {
          resolvedAuthState = parsedAuth;
          cookieValue = 'true';
          cookieMaxAge = COOKIE_MAX_AGE_SECONDS;
        } else {
          // Invalid or unauthenticated state in localStorage, ensure it's cleaned up.
          localStorage.removeItem(LOCAL_STORAGE_AUTH_KEY);
        }
      }
    } catch (error) {
      console.error("Failed to load auth state from localStorage", error);
      localStorage.removeItem(LOCAL_STORAGE_AUTH_KEY);
      // resolvedAuthState remains initialState, cookieValue remains 'false'
    }
    
    document.cookie = `isAuthenticated=${cookieValue}; path=/; max-age=${cookieMaxAge}; SameSite=Lax`;
    setAuthState(resolvedAuthState);
    setLoading(false);
  }, []);

  const login = useCallback((username: string) => {
    const user: User = { username };
    const newAuthState: AuthState = { isAuthenticated: true, user };
    setAuthState(newAuthState);
    localStorage.setItem(LOCAL_STORAGE_AUTH_KEY, JSON.stringify(newAuthState));
    document.cookie = `isAuthenticated=true; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
    router.push('/dashboard');
  }, [router]);

  const logout = useCallback(() => {
    setAuthState(initialState);
    localStorage.removeItem(LOCAL_STORAGE_AUTH_KEY);
    document.cookie = 'isAuthenticated=false; path=/; max-age=0; SameSite=Lax'; // Expire immediately
    router.push('/login');
  }, [router]);

  if (loading) {
    // Este é o loader do AuthProvider, se ele ficar preso aqui, as páginas não renderizam.
    // A mensagem do usuário "Verificando autenticação..." é da LoginPage,
    // o que significa que este 'loading' do AuthProvider tornou-se 'false'.
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Inicializando autenticação...</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ ...authState, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
