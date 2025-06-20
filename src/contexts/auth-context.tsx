
// src/contexts/auth-context.tsx
"use client";
import type React from 'react';
import { createContext, useState, useEffect } from 'react';
import { DEFAULT_LOGIN_CREDENTIALS } from '@/lib/constants';
import type { AuthState, AuthContextType, User } from '@/lib/types';

// Estado inicial agora é sempre autenticado
const initialAuthState: AuthState = {
  isAuthenticated: true,
  user: { username: DEFAULT_LOGIN_CREDENTIALS.username }, // Usuário padrão
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>(initialAuthState);
  const [loading, setLoading] = useState(true); // Pode ainda ser útil para uma carga inicial de outros dados

  useEffect(() => {
    // Simula um tempo de carregamento ou realiza outras verificações iniciais se necessário
    setLoading(false); 
  }, []);

  // Funções login e logout não são mais necessárias para o acesso direto
  // const login = useCallback(...) => { ... };
  // const logout = useCallback(...) => { ... };

  return (
    <AuthContext.Provider value={{ ...authState, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
