// src/contexts/auth-context.tsx
"use client";
import type React from 'react';
import { createContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  onAuthStateChanged, 
  GoogleAuthProvider, 
  signInWithPopup,
  signOut as firebaseSignOut, 
  type User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from 'firebase/auth';
import { useAuth as useFirebaseAuth, useFirestore } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import type { AppUser } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
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
        const userData: any = { uid, email };
        if (displayName) userData.displayName = displayName;
        if (photoURL) userData.photoURL = photoURL;

        await setDoc(userRef, userData, { merge: true });

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
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast({
            title: 'Login bem-sucedido!',
            description: `Bem-vindo(a) de volta!`,
      });
    } catch (error: any) {
      console.error("Error signing in with Google: ", error);
      let description = "Ocorreu um erro durante o login com Google.";
      if (error.code === 'auth/account-exists-with-different-credential') {
          description = 'Já existe uma conta com este e-mail, mas com um método de login diferente.';
      } else if (error.code === 'auth/popup-blocked') {
          description = 'O pop-up de login foi bloqueado pelo seu navegador. Por favor, habilite os pop-ups para este site.';
      }
      toast({
        title: "Falha no Login com Google",
        description,
        variant: "destructive",
      });
    }
  }, [auth, toast]);

  const signInWithEmail = useCallback(async (email, password) => {
    if (!auth) {
        toast({ title: "Erro de Autenticação", description: "Sistema não inicializado.", variant: "destructive" });
        return;
    }
    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
        console.error("Error signing in with email: ", error);
        let description = 'Ocorreu um erro desconhecido.';
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
            description = 'E-mail ou senha inválidos.';
        } else if (error.code === 'auth/too-many-requests') {
            description = 'Muitas tentativas de login. Tente novamente mais tarde.';
        }
        toast({ title: 'Falha no Login', description, variant: 'destructive' });
    }
  }, [auth, toast]);

  const signUpWithEmail = useCallback(async (email, password) => {
    if (!auth) {
        toast({ title: "Erro de Autenticação", description: "Sistema não inicializado.", variant: "destructive" });
        return;
    }
    try {
        await createUserWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
        console.error("Error signing up with email: ", error);
        let description = 'Ocorreu um erro desconhecido.';
        if (error.code === 'auth/email-already-in-use') {
            description = 'Este endereço de e-mail já está em uso.';
        } else if (error.code === 'auth/invalid-email') {
            description = 'O e-mail fornecido é inválido.';
        } else if (error.code === 'auth/weak-password') {
            description = 'A senha é muito fraca. Por favor, use pelo menos 6 caracteres.';
        }
        toast({ title: 'Falha no Cadastro', description, variant: 'destructive' });
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
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut, signInWithEmail, signUpWithEmail }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext };
