// src/contexts/auth-context.tsx
"use client";
import type React from 'react';
import { createContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { LOCAL_STORAGE_AUTH_KEY, DEFAULT_LOGIN_CREDENTIALS, EMAIL_RECOVERY_ADDRESS } from '@/lib/constants';
import type { AuthState, AuthContextType, User } from '@/lib/types';

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days
const EXPIRE_COOKIE_STRING = 'Thu, 01 Jan 1970 00:00:00 GMT';

// Estado inicial para DESABILITAR LOGIN PARA TESTES
const initialAuthState: AuthState = {
  isAuthenticated: true,
  user: { username: DEFAULT_LOGIN_CREDENTIALS.username }, // Usuário padrão para teste
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>(initialAuthState);
  const [loading, setLoading] = useState(false); // Começa como false para o modo de teste
  const router = useRouter();

  useEffect(() => {
    // ---- INÍCIO: LÓGICA PARA DESABILITAR LOGIN PARA TESTES ----
    console.log("AuthProvider: Forcing authenticated state for testing. Login is disabled.");
    const testUser: User = { username: DEFAULT_LOGIN_CREDENTIALS.username };
    setAuthState({ isAuthenticated: true, user: testUser });
    setLoading(false);

    // Ainda tentamos definir localStorage e cookie para consistência,
    // embora o middleware os ignore neste modo de teste.
    try {
      if (typeof localStorage !== 'undefined') {
          localStorage.setItem(LOCAL_STORAGE_AUTH_KEY, JSON.stringify({ isAuthenticated: true, user: testUser }));
      }
      if (typeof document !== 'undefined') {
          document.cookie = `isAuthenticated=true; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
      }
    } catch (e) {
      console.error("AuthProvider: Error setting localStorage/cookie in test mode", e);
    }
    // ---- FIM: LÓGICA PARA DESABILITAR LOGIN PARA TESTES ----
  }, []);


  const login = useCallback((username: string) => {
    // No modo de teste (login desabilitado), esta função apenas atualiza o estado interno.
    // A navegação real é controlada pelas páginas e pelo middleware (que está em modo passthrough).
    console.log(`AuthProvider: Login attempt for ${username} (test mode - login disabled).`);
    const user: User = { username };
    setAuthState({ isAuthenticated: true, user });
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(LOCAL_STORAGE_AUTH_KEY, JSON.stringify({ isAuthenticated: true, user }));
      }
      if (typeof document !== 'undefined') {
        document.cookie = `isAuthenticated=true; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
      }
    } catch (e) {
      console.error("AuthProvider: Error setting localStorage/cookie during login (test mode)", e);
    }
    // Em modo de teste, o redirecionamento é feito pela HomePage/LoginPage.
    // window.location.assign('/'); // Descomente se precisar de um redirecionamento forte aqui.
  }, [router]);

  const logout = useCallback(() => {
    // No modo de teste (login desabilitado), esta função apenas atualiza o estado interno.
    console.log("AuthProvider: Logout attempt (test mode - login disabled).");
    setAuthState({ isAuthenticated: false, user: null });
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(LOCAL_STORAGE_AUTH_KEY);
      }
      if (typeof document !== 'undefined') {
        document.cookie = `isAuthenticated=false; path=/; expires=${EXPIRE_COOKIE_STRING}; SameSite=Lax`;
      }
    } catch (e) {
      console.error("AuthProvider: Error clearing localStorage/cookie during logout (test mode)", e);
    }
    // Em modo de teste, o redirecionamento para /login (se necessário) é feito pela HomePage.
    // window.location.assign('/login'); // Descomente se precisar de um redirecionamento forte aqui.
  }, [router]);

  return (
    <AuthContext.Provider value={{ ...authState, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
