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

// A full-screen loader to prevent any content flashing.
const GlobalLoader = () => (
  <div className="flex h-screen w-full items-center justify-center bg-background">
    <Loader2 className="h-12 w-12 animate-spin text-primary" />
  </div>
);

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  // isRouting state helps prevent rendering children during a redirect.
  const [isRouting, setIsRouting] = useState(true); 

  useEffect(() => {
    // If Firebase auth is still loading, we don't know the user's state yet.
    // Keep showing the loader and wait.
    if (authLoading) {
      setIsRouting(true); // Keep showing loader
      return;
    }

    const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
    const isVerifyRoute = pathname === VERIFY_EMAIL_ROUTE;
    let targetRoute: string | null = null;

    if (!user) {
      // STATE: User is not logged in.
      // If they are not on a public route, redirect them to login.
      if (!isPublicRoute) {
        targetRoute = '/login';
      }
    } else {
      // STATE: User is logged in.
      if (!user.emailVerified) {
        // SUB-STATE: User's email is not verified.
        // If they are not on the verification page, redirect them there.
        if (!isVerifyRoute) {
          targetRoute = VERIFY_EMAIL_ROUTE;
        }
      } else {
        // SUB-STATE: User is fully authenticated and verified.
        // If they are on a public route or the verification page,
        // they should be redirected to the main app dashboard.
        if (isPublicRoute || isVerifyRoute) {
          targetRoute = HOME_ROUTE;
        }
      }
    }

    if (targetRoute && pathname !== targetRoute) {
      // A redirect is necessary.
      setIsRouting(true); // Ensure loader stays visible during redirect.
      router.replace(targetRoute);
    } else {
      // No redirect is needed, the user is on the correct page.
      // We can stop routing and show the page content.
      setIsRouting(false);
    }
  }, [authLoading, user, pathname, router]);

  // While auth is loading or a redirect is in progress, show the global loader.
  // This is the core fix: we don't render `children` until we are certain
  // the user is on the correct page.
  if (isRouting) {
    return <GlobalLoader />;
  }

  // Auth is resolved, no redirect is needed. Render the actual page content.
  return <>{children}</>;
}
