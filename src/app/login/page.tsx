
// src/app/login/page.tsx
"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import LoginForm from '@/components/auth/login-form';
import Logo from '@/components/common/logo';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SESSION_STORAGE_LOGIN_FLAG } from '@/lib/constants';

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    // Se autenticado e não acabou de fazer login (para evitar loop na primeira renderização pós-login)
    // O middleware já deve ter redirecionado, mas isso é uma segurança extra.
    if (!loading && isAuthenticated) {
        const justLoggedIn = sessionStorage.getItem(SESSION_STORAGE_LOGIN_FLAG);
        if (!justLoggedIn) {
          router.replace('/dashboard');
        } else {
          // Limpa o flag para permitir que o middleware redirecione em futuras visitas diretas a /login
          // ou para permitir que o usuário acesse /login se deslogar e voltar.
          sessionStorage.removeItem(SESSION_STORAGE_LOGIN_FLAG);
        }
    }
  }, [isAuthenticated, loading, router]);

  // Se estiver carregando o estado de autenticação, não renderiza o formulário ainda
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-secondary">
        <p className="text-muted-foreground">Verificando autenticação...</p>
      </div>
    );
  }

  // Se já estiver autenticado (e não apenas logado), o useEffect acima já deve ter redirecionado.
  // Este return é principalmente para o caso de não autenticado.
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-primary/20 via-background to-background p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="items-center text-center">
          <Logo className="mb-6" />
          <CardTitle className="text-3xl font-bold tracking-tight text-foreground">
            CONTROLE DE VENDAS
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Equipe Comercial ENGEAR
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
      <footer className="mt-8 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} ENGEAR. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
