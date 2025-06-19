
// src/contexts/auth-context.tsx
"use client";
import type React from 'react';
import { createContext, useState, useCallback, useEffect } from 'react';
import { DEFAULT_LOGIN_CREDENTIALS, LOCAL_STORAGE_AUTH_KEY, COOKIE_AUTH_FLAG, COOKIE_MAX_AGE_SECONDS, EXPIRE_COOKIE_STRING, SESSION_STORAGE_LOGIN_FLAG } from '@/lib/constants';
import type { AuthState, AuthContextType, User } from '@/lib/types';

const initialAuthState: AuthState = {
  isAuthenticated: false,
  user: null,
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>(initialAuthState);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    try {
      const storedAuthState = localStorage.getItem(LOCAL_STORAGE_AUTH_KEY);
      if (storedAuthState) {
        const parsedState: AuthState = JSON.parse(storedAuthState);
        if (parsedState.isAuthenticated && parsedState.user) {
          setAuthState(parsedState);
        } else {
          // Limpar estado inválido e cookie se houver
          localStorage.removeItem(LOCAL_STORAGE_AUTH_KEY);
          document.cookie = `${COOKIE_AUTH_FLAG}=; path=/; expires=${EXPIRE_COOKIE_STRING}`;
          setAuthState(initialAuthState);
        }
      } else {
        // Se não há estado no localStorage, garantir que o cookie também não exista
        document.cookie = `${COOKIE_AUTH_FLAG}=; path=/; expires=${EXPIRE_COOKIE_STRING}`;
        setAuthState(initialAuthState);
      }
    } catch (error) {
      console.error("AuthProvider: Error loading auth state from localStorage", error);
      localStorage.removeItem(LOCAL_STORAGE_AUTH_KEY);
      document.cookie = `${COOKIE_AUTH_FLAG}=; path=/; expires=${EXPIRE_COOKIE_STRING}`;
      setAuthState(initialAuthState);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (username: string, passwordAttempt: string) => {
    if (username === DEFAULT_LOGIN_CREDENTIALS.username && passwordAttempt === DEFAULT_LOGIN_CREDENTIALS.password) {
      const newAuthenticatedState: AuthState = { isAuthenticated: true, user: { username } };
      setAuthState(newAuthenticatedState);
      localStorage.setItem(LOCAL_STORAGE_AUTH_KEY, JSON.stringify(newAuthenticatedState));
      document.cookie = `${COOKIE_AUTH_FLAG}=true; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}`;
      sessionStorage.setItem(SESSION_STORAGE_LOGIN_FLAG, 'true'); // Sinaliza um login recente
      window.location.assign('/dashboard'); // Redireciona após o login
    } else {
      throw new Error('Credenciais inválidas.');
    }
  }, []);

  const logout = useCallback(() => {
    setAuthState(initialAuthState);
    localStorage.removeItem(LOCAL_STORAGE_AUTH_KEY);
    document.cookie = `${COOKIE_AUTH_FLAG}=; path=/; expires=${EXPIRE_COOKIE_STRING}`;
    sessionStorage.removeItem(SESSION_STORAGE_LOGIN_FLAG);
    window.location.assign('/login'); // Redireciona para a página de login
  }, []);

  return (
    <AuthContext.Provider value={{ ...authState, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

