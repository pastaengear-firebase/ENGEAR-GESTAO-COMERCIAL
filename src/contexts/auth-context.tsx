// src/contexts/auth-context.tsx
"use client";
import type React from 'react';
import { createContext, useState, useEffect, useCallback } from 'react';
// useRouter é removido pois window.location.assign será usado para todas as navegações de login/logout.
import { LOCAL_STORAGE_AUTH_KEY } from '@/lib/constants';
import type { AuthState, AuthContextType, User } from '@/lib/types';

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days
const EXPIRE_COOKIE_STRING = 'Thu, 01 Jan 1970 00:00:00 GMT';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>(initialState);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    const cookieAuth = document.cookie.split('; ').find(row => row.startsWith('isAuthenticated='));
    const isCookieAuthenticated = cookieAuth ? cookieAuth.split('=')[1] === 'true' : false;

    let userFromStorage: User | null = null;
    let finalIsAuthenticated = isCookieAuthenticated;

    if (isCookieAuthenticated) {
      // O cookie indica que o usuário está autenticado. Tenta obter detalhes do usuário.
      const storedAuthData = localStorage.getItem(LOCAL_STORAGE_AUTH_KEY);
      if (storedAuthData) {
        try {
          const parsedData: AuthState = JSON.parse(storedAuthData);
          // Verifica se o localStorage concorda e tem dados do usuário
          if (parsedData.isAuthenticated && parsedData.user) {
            userFromStorage = parsedData.user;
          } else {
            // localStorage discorda ou está malformado, mas o cookie diz autenticado.
            // Isso é uma dessincronização. Prioriza o cookie para autenticação, mas limpa o usuário do LS.
            // Poderia forçar o logout aqui se os dados do usuário fossem considerados essenciais.
            // Por enquanto, "autenticado" significa que o cookie está definido; dados do usuário são um bônus.
             localStorage.removeItem(LOCAL_STORAGE_AUTH_KEY); // Remove para evitar estado inconsistente do usuário
          }
        } catch (e) {
          localStorage.removeItem(LOCAL_STORAGE_AUTH_KEY); // Corrompido
        }
      }
      // Se o cookie for true, mas não houver dados do usuário no localStorage (ex: limpo manualmente),
      // userFromStorage permanece nulo. A sessão é "autenticada" pelo cookie.
      // Devemos garantir que o localStorage não reivindique um estado não autenticado se o cookie for true.
      // Então, se o cookie for true, certifique-se de que o localStorage tenha {isAuthenticated: true, user: userFromStorage}
      localStorage.setItem(LOCAL_STORAGE_AUTH_KEY, JSON.stringify({ isAuthenticated: true, user: userFromStorage }));
    } else {
      // O cookie indica não autenticado. Força este estado.
      finalIsAuthenticated = false;
      userFromStorage = null;
      localStorage.removeItem(LOCAL_STORAGE_AUTH_KEY);
      // Garante que o cookie também seja limpo se estava presente mas não era 'true'
      if (cookieAuth) { // se um cookie "isAuthenticated=..." existia mas não era "true"
        document.cookie = `isAuthenticated=false; path=/; expires=${EXPIRE_COOKIE_STRING}; SameSite=Lax`;
      }
    }

    setAuthState({ isAuthenticated: finalIsAuthenticated, user: userFromStorage });
    setLoading(false);
  }, []);

  const login = useCallback((username: string) => {
    const user: User = { username };
    // Atualiza o estado do React primeiro para responsividade imediata da UI (embora a página vá recarregar)
    setAuthState({ isAuthenticated: true, user });
    // Atualiza o localStorage
    localStorage.setItem(LOCAL_STORAGE_AUTH_KEY, JSON.stringify({ isAuthenticated: true, user }));
    // Define o cookie
    document.cookie = `isAuthenticated=true; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
    
    // Força um recarregamento completo da página para garantir que o cookie seja pego pelas requisições subsequentes
    if (typeof window !== "undefined") {
      window.location.assign('/'); // Redireciona para a raiz para que a HomePage lide com o roteamento
    }
  }, []);

  const logout = useCallback(() => {
    setAuthState({ isAuthenticated: false, user: null });
    localStorage.removeItem(LOCAL_STORAGE_AUTH_KEY);
    document.cookie = `isAuthenticated=false; path=/; expires=${EXPIRE_COOKIE_STRING}; SameSite=Lax`;
    
    // Redireciona para a página de login
    if (typeof window !== "undefined") {
      // Usando assign para logout também para garantir um estado "limpo"
      window.location.assign('/login');
    }
  }, []);

  return (
    <AuthContext.Provider value={{ ...authState, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
