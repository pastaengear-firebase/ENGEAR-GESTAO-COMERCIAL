// src/components/auth/auth-gate.tsx
"use client";
import type React from 'react';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

const PUBLIC_PATHS = ['/login'];

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) {
      return; // Wait for auth state to load
    }

    const isPublicPath = PUBLIC_PATHS.includes(pathname);

    // If user is not logged in and trying to access a protected page, redirect to login
    if (!user && !isPublicPath) {
      router.replace(`/login?redirect=${pathname}`);
      return;
    }

    // If user is logged in and trying to access the login page, redirect to dashboard
    if (user && pathname === '/login') {
      router.replace('/dashboard');
      return;
    }

  }, [user, loading, router, pathname]);

  if (loading || (!user && !PUBLIC_PATHS.includes(pathname))) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
