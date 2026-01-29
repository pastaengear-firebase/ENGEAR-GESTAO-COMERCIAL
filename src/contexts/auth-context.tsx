// src/contexts/auth-context.tsx
"use client";
import type React from 'react';
import { createContext } from 'react';
import { useRouter } from 'next/navigation';
import type { AppUser } from '@/lib/types';

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- MOCK USER DATA ---
// To bypass login in the development preview, we simulate a logged-in user.
const mockUser: AppUser = {
  uid: 'dev-sergio-uid',
  email: 'sergio@engearpb.com.br',
  displayName: 'Sergio',
  photoURL: null,
};
// ----------------------

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();

  const signInWithGoogle = async () => {
    // This is a no-op in dev mode
    console.log("signInWithGoogle called in dev mode, no action taken.");
  };

  const signOut = async () => {
    // In a real scenario, this would clear the mock. For now, it just reloads.
    console.log("signOut called in dev mode, redirecting to login.");
    // We redirect to a page that will redirect back, effectively a "soft refresh" of state
    router.push('/login'); 
  };

  return (
    <AuthContext.Provider value={{ user: mockUser, loading: false, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext };
