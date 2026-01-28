// src/app/login/page.tsx
"use client";
import type React from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Logo from '@/components/common/logo';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!auth) {
      toast({
        title: "Erro de Autenticação",
        description: "Serviço de autenticação não disponível.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // The AuthGate will handle redirection based on user state.
      // We just provide user feedback here.
      if (!userCredential.user.emailVerified) {
        toast({
          title: "Verificação de E-mail Pendente",
          description: "Por favor, verifique seu e-mail antes de fazer login. Redirecionando...",
          variant: "destructive",
        });
        // AuthGate will force the redirect to /auth/verify-email
      } else {
        toast({
          title: "Login bem-sucedido!",
          description: "Redirecionando para o dashboard...",
        });
        // AuthGate will force the redirect to /dashboard
      }
      
    } catch (error: any) {
      console.error("Erro no login:", error);
      let description = "Ocorreu um erro. Tente novamente.";
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        description = "E-mail ou senha incorretos.";
      }
      toast({
        title: "Falha no Login",
        description,
        variant: "destructive",
      });
    } finally {
        setIsLoading(false);
    }
  };
  
  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="w-full max-w-sm space-y-6 rounded-xl bg-white dark:bg-gray-800 p-8 shadow-lg">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <Logo width={250} height={70} />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Acesso ao Sistema
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Use seu e-mail e senha para entrar.
          </p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              disabled={isLoading}
            />
          </div>
           <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Senha</Label>
              <Link href="/auth/forgot-password" passHref>
                <span className="text-sm text-primary hover:underline cursor-pointer">
                  Esqueceu a senha?
                </span>
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Sua Senha"
              required
              disabled={isLoading}
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-lg py-6"
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isLoading ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>
        <p className="text-center text-sm text-muted-foreground">
          Não tem uma conta?{' '}
          <Link href="/signup" passHref>
            <span className="text-primary hover:underline cursor-pointer">
              Registre-se
            </span>
          </Link>
        </p>
      </div>
    </div>
  );
}
