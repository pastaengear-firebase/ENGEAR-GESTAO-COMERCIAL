// src/app/page.tsx
"use client";
import type React from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser } from '@/firebase';
import { signInAnonymously } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Logo from '@/components/common/logo';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DEFAULT_ACCESS_PASSWORD, APP_ACCESS_GRANTED_KEY } from '@/lib/constants';

export default function RootPage() {
  const auth = useAuth();
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  // This state prevents the login form from flashing if the user is already logged in.
  const [isVerifying, setIsVerifying] = useState(true);

  // This effect acts as the main gatekeeper.
  useEffect(() => {
    // This check must run on the client after hydration
    if (typeof window !== 'undefined') {
      const accessGranted = sessionStorage.getItem(APP_ACCESS_GRANTED_KEY) === 'true';
      if (accessGranted) {
        // If already granted, just go to the dashboard.
        router.replace('/dashboard');
      } else {
        // If not granted, stop verifying and show the login form.
        setIsVerifying(false);
      }
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== DEFAULT_ACCESS_PASSWORD) {
      toast({
        title: "Senha Incorreta",
        description: "A senha de acesso está incorreta. Tente novamente.",
        variant: "destructive",
      });
      return;
    }

    if (!auth) {
      toast({
        title: "Erro de Autenticação",
        description: "Não foi possível conectar ao serviço de autenticação.",
        variant: "destructive",
      });
      return;
    }

    setIsLoggingIn(true);
    try {
      // 1. Ensure we have a Firebase anonymous user for database operations.
      if (!user) {
        await signInAnonymously(auth);
      }
      
      // 2. Set the session key to grant access for this session
      sessionStorage.setItem(APP_ACCESS_GRANTED_KEY, 'true');

      toast({
        title: "Acesso Autorizado",
        description: "Bem-vindo ao sistema de controle de vendas.",
      });

      // 3. Redirect to the dashboard
      router.replace('/dashboard');

    } catch (error) {
      console.error("Erro no login anônimo:", error);
      sessionStorage.removeItem(APP_ACCESS_GRANTED_KEY); // Clean up on failure
      toast({
        title: "Erro de Conexão",
        description: "Não foi possível estabelecer uma sessão segura. Tente novamente.",
        variant: "destructive",
      });
    } finally {
        setIsLoggingIn(false);
    }
  };
  
  // While verifying the session, show a full-page loader.
  if (isVerifying) {
     return (
        <div className="flex h-screen items-center justify-center bg-background">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="ml-4 text-lg text-foreground">Verificando sessão...</p>
        </div>
     );
  }


  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="w-full max-w-sm space-y-8 rounded-xl bg-white dark:bg-gray-800 p-8 shadow-lg text-center">
        <div className="flex justify-center">
          <Logo width={250} height={70} />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Acesso ao Sistema de Vendas
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Insira a senha de acesso da equipe.
          </p>
        </div>
        <form onSubmit={handleLogin} className="space-y-6">
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Senha de Acesso"
            required
            className="text-center"
            disabled={isLoggingIn || userLoading}
          />
          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-lg py-6"
            disabled={isLoggingIn || userLoading}
          >
            {isLoggingIn || userLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {isLoggingIn || userLoading ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>
        <p className="text-xs text-muted-foreground pt-4">
          © {new Date().getFullYear()} ENGEAR. Acesso restrito.
        </p>
      </div>
    </div>
  );
}
