// src/app/login/page.tsx
"use client";
import LoginForm from '@/components/auth/login-form';
import Logo from '@/components/common/logo';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LoginPage() {
  const { isAuthenticated, loading } = useAuth(); // Use loading state from useAuth
  const router = useRouter();

  useEffect(() => {
    // Only redirect if not loading and isAuthenticated is true
    if (!loading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, loading, router]);

  // Optional: Show a loading indicator or null while auth state is resolving
  // to prevent brief flash of login form if already authenticated.
  if (loading || (!loading && isAuthenticated)) {
     return (
      <div className="flex h-screen items-center justify-center bg-secondary">
        {/* You can put a loader here if you want */}
        <p className="text-muted-foreground">Verificando autenticação...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-secondary p-4">
      <div className="mb-8">
        <Logo width={180} height={60} />
      </div>
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">Bem-vindo!</CardTitle>
          <CardDescription>CONTROLE DE VENDAS – EQUIPE COMERCIAL ENGEAR</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
       <p className="mt-6 text-center text-sm text-muted-foreground">
        Esqueceu a senha?{' '}
        <a
          href="mailto:pastaengear@gmail.com?subject=Recuperação de Senha - Controle de Vendas ENGEAR"
          className="font-medium text-primary hover:underline"
        >
          Recuperar via E-mail
        </a>
      </p>
    </div>
  );
}
