
// src/contexts/auth-context.tsx
"use client";
import type React from 'react';
import { createContext, useState, useCallback, useEffect } from 'react';
import { DEFAULT_LOGIN_CREDENTIALS } from '@/lib/constants';
import type { AuthState, AuthContextType, User } from '@/lib/types';

// Login está desabilitado. Usuário é sempre 'ENGEAR' e autenticado.
const defaultAuthenticatedUser: User = { username: DEFAULT_LOGIN_CREDENTIALS.username };
const initialAuthState: AuthState = {
  isAuthenticated: true,
  user: defaultAuthenticatedUser,
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>(initialAuthState);
  // Loading é sempre false pois o login está desabilitado e o estado é fixo.
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // console.log("AuthProvider (Login Disabled): Initializing with default authenticated state.");
    setAuthState({ isAuthenticated: true, user: defaultAuthenticatedUser });
    setLoading(false);
  }, []);

  const login = useCallback(async (username: string, passwordAttempt: string) => {
    console.warn("AuthProvider (Login Disabled): Login function called, but login is disabled. No action taken.");
    // Não faz nada, usuário já está "autenticado"
  }, []);

  const logout = useCallback(() => {
    console.warn("AuthProvider (Login Disabled): Logout function called, but login is disabled. No action taken.");
    // Não faz nada, usuário permanece "autenticado"
    // Poderia redirecionar para uma página de "login desabilitado" se existisse,
    // mas como estamos tentando acessar a app, isso não é útil.
  }, []);

  return (
    <AuthContext.Provider value={{ ...authState, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
