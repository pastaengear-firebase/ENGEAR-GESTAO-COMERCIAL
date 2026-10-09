'use client';
import type React from 'react';
import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useSales } from '../../hooks/use-sales';

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loadingAuth, userRole } = useSales();
  const router = useRouter();
  const pathname = usePathname();
  const isRedirecting = useRef(false);

  const RESTRICTED_FOR_READERS = [
    '/vendas/nova',
    '/inserir-venda',
    '/propostas/nova',
    '/editar-venda',
    '/configuracoes',
    '/dashboard/auditoria',
  ];

  useEffect(() => {
    if (!loadingAuth) {
      if (!user && pathname !== '/login' && !isRedirecting.current) {
        isRedirecting.current = true;
        router.replace('/login');
      } else if (user && pathname === '/login' && !isRedirecting.current) {
        isRedirecting.current = true;
        router.replace('/dashboard');
      } else if (user && userRole === 'LEITOR' && RESTRICTED_FOR_READERS.some(route => pathname.startsWith(route)) && !isRedirecting.current) {
        isRedirecting.current = true;
        router.replace('/dashboard');
      } else {
        isRedirecting.current = false;
      }
    }
  }, [user, loadingAuth, userRole, router, pathname]);

  if (loadingAuth || (!user && pathname !== '/login')) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}