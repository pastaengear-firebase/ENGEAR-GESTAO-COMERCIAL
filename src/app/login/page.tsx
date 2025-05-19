// src/app/login/page.tsx
"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth'; // Importar o hook useAuth
import LoginForm from '@/components/auth/login-form'; // Importar o LoginForm

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth(); // Usar o hook useAuth

  // Este useEffect agora só cuida do redirecionamento para o dashboard
  // se o login for detectado como já ativo (ex: usuário volta para /login já logado)
  // OU para desabilitar o login completamente para fins de teste.
  useEffect(() => {
    // ---- INÍCIO: DESABILITAR LOGIN PARA TESTES ----
    // Para desabilitar o login e ir direto ao dashboard, descomente a linha abaixo:
    console.log("LoginPage: Forcing redirect to /dashboard for testing.");
    router.replace('/dashboard');
    // ---- FIM: DESABILITAR LOGIN PARA TESTES ----

    // Lógica original para redirecionar se já autenticado
    // (Manter comentado se o redirecionamento forçado acima estiver ativo)
    // if (!loading && isAuthenticated) {
    //   console.log("LoginPage: Already authenticated, redirecting to /dashboard.");
    //   router.replace('/dashboard');
    // }
  }, [loading, isAuthenticated, router]);

  // Se estiver forçando o redirecionamento para teste, mostre um loader.
  // Ajuste esta condição se remover o redirecionamento forçado.
  // (isAuthenticated && !loading) // condição original se não estivesse forçando
  // if (true) // Condição simplificada porque estamos sempre forçando o redirecionamento acima
  if (!loading && isAuthenticated) { // Revertido para a lógica que exibe o loader se isAuthenticated for verdadeiro após o carregamento
      return (
        <div className="flex h-screen items-center justify-center bg-secondary">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-3 text-muted-foreground">Redirecionando para o painel...</p>
        </div>
      );
  }
  
  if (loading) {
     return (
        <div className="flex h-screen items-center justify-center bg-secondary">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-3 text-muted-foreground">Verificando autenticação...</p>
        </div>
      );
  }


  // Se não estiver carregando e não estiver autenticado (ou se o redirecionamento forçado não estiver ativo),
  // renderiza o formulário de login.
  // Certifique-se de que esta parte é alcançável se você reativar a lógica de login normal.
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/20 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          {/* <Logo width={180} height={60} className="mx-auto mb-6" /> */}
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Acesso ao Sistema
          </h1>
          <p className="mt-2 text-muted-foreground">
            CONTROLE DE VENDAS – EQUIPE COMERCIAL ENGEAR
          </p>
        </div>
        <Card className="shadow-2xl">
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>
              Insira suas credenciais para continuar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>
        <p className="text-center text-sm text-muted-foreground">
          Problemas para acessar? Contate o administrador.
        </p>
      </div>
    </div>
  );
}
