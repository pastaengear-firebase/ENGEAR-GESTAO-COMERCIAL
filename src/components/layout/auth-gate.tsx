// src/components/layout/auth-gate.tsx
'use client';

import { useUser } from '@/firebase';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

const PUBLIC_ROUTES = ['/login', '/signup', '/auth/forgot-password'];
const VERIFY_EMAIL_ROUTE = '/auth/verify-email';
const HOME_ROUTE = '/dashboard';

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  // 1. Se o estado do usuário ainda está carregando, mostre um loader global e não faça mais nada.
  // Isso impede qualquer decisão baseada em dados incompletos.
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
  const isVerifyRoute = pathname === VERIFY_EMAIL_ROUTE;

  // 2. O estado do usuário está definido. Agora, tomamos decisões de roteamento.

  // Cenário: Usuário está logado
  if (user) {
    // Se o e-mail está verificado, o lugar dele é dentro da aplicação.
    if (user.emailVerified) {
      // Se ele está em uma página pública ou na de verificação, redirecione para o dashboard.
      if (isPublicRoute || isVerifyRoute) {
        router.replace(HOME_ROUTE);
        // Enquanto o redirecionamento ocorre, mostre o loader para evitar flashes de conteúdo.
        return (
          <div className="flex h-screen w-full items-center justify-center bg-background">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        );
      }
    } 
    // Se o e-mail não está verificado, o único lugar onde ele pode estar é na página de verificação.
    else {
      if (!isVerifyRoute) {
        router.replace(VERIFY_EMAIL_ROUTE);
        // Enquanto o redirecionamento ocorre, mostre o loader.
        return (
          <div className="flex h-screen w-full items-center justify-center bg-background">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        );
      }
    }
  }
  // Cenário: Usuário NÃO está logado
  else {
    // Se ele tentar acessar qualquer página protegida, redirecione para o login.
    if (!isPublicRoute) {
      router.replace('/login');
       // Enquanto o redirecionamento ocorre, mostre o loader.
      return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      );
    }
  }

  // 3. Se nenhuma das condições acima acionou um redirecionamento, significa que o usuário
  // está exatamente onde deveria estar (ex: não logado e na página de login).
  // Só então renderizamos o conteúdo da rota solicitada.
  return <>{children}</>;
}
