// src/components/layout/auth-gate.tsx
'use client';

import { useUser } from '@/firebase';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';

const PUBLIC_ROUTES = ['/login', '/signup', '/auth/forgot-password'];
const VERIFY_EMAIL_ROUTE = '/auth/verify-email';
const HOME_ROUTE = '/dashboard';

const GlobalLoader = () => (
  <div className="flex h-screen w-full items-center justify-center bg-background">
    <Loader2 className="h-12 w-12 animate-spin text-primary" />
  </div>
);

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [isRouting, setIsRouting] = useState(false);

  useEffect(() => {
    // Não faça nada até que o estado de autenticação do Firebase seja resolvido.
    if (authLoading) return;

    let targetRoute: string | null = null;
    const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
    const isVerifyRoute = pathname === VERIFY_EMAIL_ROUTE;

    if (!user) {
      // Estado: Não Logado
      // Se não estiver em uma rota pública, redirecione para o login.
      if (!isPublicRoute) {
        targetRoute = '/login';
      }
    } else {
      // Estado: Logado
      if (!user.emailVerified) {
        // Estado: Logado, mas não verificado
        // Se não estiver na página de verificação, redirecione para ela.
        if (!isVerifyRoute) {
          targetRoute = VERIFY_EMAIL_ROUTE;
        }
      } else {
        // Estado: Logado e Verificado
        // Se estiver em uma rota pública ou de verificação, redirecione para o dashboard.
        if (isPublicRoute || isVerifyRoute) {
          targetRoute = HOME_ROUTE;
        }
      }
    }

    if (targetRoute && pathname !== targetRoute) {
      setIsRouting(true);
      router.replace(targetRoute);
    } else {
      setIsRouting(false);
    }
  }, [authLoading, user, pathname, router]);

  // Enquanto a autenticação está carregando ou um redirecionamento está em andamento,
  // exiba o loader global para evitar qualquer "flash" de conteúdo.
  if (authLoading || isRouting) {
    return <GlobalLoader />;
  }

  // Se nenhuma condição de redirecionamento for atendida, renderize o conteúdo da página solicitada.
  return <>{children}</>;
}
