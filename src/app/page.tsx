// src/app/page.tsx
"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    // ---- INÍCIO: DESABILITAR LOGIN PARA TESTES ----
    // Para desabilitar o login e ir direto ao dashboard:
    console.log("HomePage: Forcing redirect to /dashboard for testing.");
    router.replace('/dashboard');
    return; // Importante para não executar a lógica abaixo
    // ---- FIM: DESABILITAR LOGIN PARA TESTES ----

    // Lógica original de redirecionamento (manter comentada se o acima estiver ativo)
    // if (!loading) {
    //   if (isAuthenticated) {
    //     console.log("HomePage: Authenticated, redirecting to /dashboard.");
    //     router.replace('/dashboard');
    //   } else {
    //     console.log("HomePage: Not authenticated, redirecting to /login.");
    //     router.replace('/login');
    //   }
    // }
  }, [loading, isAuthenticated, router]);

  // Exibe um loader enquanto a lógica de autenticação e redirecionamento está ocorrendo.
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="ml-4 text-lg text-foreground">Carregando aplicação...</p>
    </div>
  );
}
