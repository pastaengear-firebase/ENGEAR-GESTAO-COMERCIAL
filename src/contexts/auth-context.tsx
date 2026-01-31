// src/contexts/auth-context.tsx
"use client";
import type React from 'react';
import { createContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut, type User } from 'firebase/auth';
import { useAuth as useFirebaseAuth, useFirestore } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import type { AppUser } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const auth = useFirebaseAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!auth || !firestore) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      if (firebaseUser) {
        const { uid, email, displayName, photoURL } = firebaseUser;
        const appUser: AppUser = { uid, email, displayName, photoURL };
        
        const userRef = doc(firestore, 'users', uid);
        await setDoc(userRef, { uid, email, displayName, photoURL }, { merge: true });

        setUser(appUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth, firestore]);

  const signInWithGoogle = useCallback(async () => {
    if (!auth) {
        toast({
            title: "Erro de Autenticação",
            description: "O sistema de autenticação não foi inicializado corretamente.",
            variant: "destructive",
        });
        return;
    }
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      // onAuthStateChanged will handle the rest
    } catch (error: any) {
      console.error("Error signing in with Google: ", error);
      
      let description = "Ocorreu um erro desconhecido durante o login.";
      if (error.code === 'auth/unauthorized-domain') {
          description = "O domínio da aplicação não está autorizado para login. Verifique as configurações de autenticação no seu projeto Firebase.";
      } else if (error.code === 'auth/popup-closed-by-user') {
          description = "A janela de login foi fechada antes da conclusão.";
      } else if (error.code) {
          description = `Erro: ${error.code}.`;
      }

      toast({
        title: "Falha no Login",
        description: description,
        variant: "destructive",
      });
      setLoading(false);
    }
  }, [auth, toast]);

  const signOut = useCallback(async () => {
    if (!auth) return;
    try {
      await firebaseSignOut(auth);
      router.push('/login');
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  }, [auth, router]);

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext };
