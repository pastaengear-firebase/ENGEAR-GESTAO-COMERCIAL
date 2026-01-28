// src/components/layout/auth-gate.tsx
'use client';

import { useUser } from '@/firebase';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import type React from 'react';

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

  // 1. Enquanto a autenticação está carregando, sempre mostre o loader.
  // Isso impede que qualquer conteúdo filho seja renderizado até que o estado do usuário seja conhecido.
  if (authLoading) {
    return <GlobalLoader />;
  }

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
  const isVerifyRoute = pathname === VERIFY_EMAIL_ROUTE;

  // 2. Lógica para usuários não autenticados.
  if (!user) {
    if (isPublicRoute) {
      // O usuário não está logado e está em uma página pública. Isso está correto.
      return <>{children}</>;
    } else {
      // O usuário não está logado e está tentando acessar uma página protegida.
      // Redirecione para o login e mostre o loader até que o redirecionamento seja concluído.
      router.replace('/login');
      return <GlobalLoader />;
    }
  }

  // 3. Lógica para usuários autenticados mas não verificados.
  if (!user.emailVerified) {
    if (isVerifyRoute) {
      // O usuário está na página de verificação. Isso está correto.
      return <>{children}</>;
    } else {
      // O usuário está em outro lugar. Redirecione para a página de verificação.
      router.replace(VERIFY_EMAIL_ROUTE);
      return <GlobalLoader />;
    }
  }

  // 4. Lógica para usuários totalmente autenticados e verificados.
  if (user.emailVerified) {
    if (isPublicRoute || isVerifyRoute) {
      // O usuário está em uma página pública/de verificação, mas deveria estar no dashboard.
      router.replace(HOME_ROUTE);
      return <GlobalLoader />;
    } else {
      // O usuário está em uma página protegida do aplicativo. Isso está correto.
      return <>{children}</>;
    }
  }

  // Loader de fallback, idealmente não deve ser alcançado.
  return <GlobalLoader />;
}
