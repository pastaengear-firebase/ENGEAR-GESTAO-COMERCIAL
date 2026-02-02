
'use client';
import type React from 'react';
import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useSales } from '@/hooks/use-sales';

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loadingAuth } = useSales();
  const router = useRouter();
  const pathname = usePathname();
  const isRedirecting = useRef(false);

  useEffect(() => {
    if (!loadingAuth && !user && pathname !== '/login' && !isRedirecting.current) {
      isRedirecting.current = true;
      router.replace('/login');
    } else if (user && pathname === '/login' && !isRedirecting.current) {
      isRedirecting.current = true;
      router.replace('/dashboard');
    }
  }, [user, loadingAuth, router, pathname]);

  if (loadingAuth || (!user && pathname !== '/login')) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
