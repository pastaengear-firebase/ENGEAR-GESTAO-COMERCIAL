// src/components/auth/auth-gate.tsx
'use client';
import type React from 'react';
import { useEffect } from 'react';
import { useSales } from '@/hooks/use-sales';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loadingAuth } = useSales();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loadingAuth && !user) {
      router.push('/login');
    }
  }, [user, loadingAuth, router, pathname]);

  if (loadingAuth || !user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
