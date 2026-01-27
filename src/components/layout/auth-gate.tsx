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

  // 1. Show a global loader while auth state is being determined.
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
  const isVerifyRoute = pathname === VERIFY_EMAIL_ROUTE;

  // 2. Handle routing for Anonymous users (no user logged in).
  if (!user) {
    // If the user is not logged in, they can only be on public routes.
    // Any other route should redirect to login.
    if (!isPublicRoute) {
      router.replace('/login');
      // Show loader during redirect to prevent content flash.
      return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      );
    }
  }
  
  // 3. Handle routing for Logged-in users.
  if (user) {
    // 3a. User is logged in and their email is verified.
    if (user.emailVerified) {
      // If they are on a public page or the verification page, they should be
      // redirected to the main application (dashboard).
      if (isPublicRoute || isVerifyRoute) {
        router.replace(HOME_ROUTE);
        // Show loader during redirect.
        return (
          <div className="flex h-screen w-full items-center justify-center bg-background">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        );
      }
    } 
    // 3b. User is logged in but email is NOT verified.
    else {
      // Their one and only allowed page is the verification page.
      // If they are on any other page, redirect them there.
      if (!isVerifyRoute) {
        router.replace(VERIFY_EMAIL_ROUTE);
        // Show loader during redirect.
        return (
          <div className="flex h-screen w-full items-center justify-center bg-background">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        );
      }
    }
  }

  // 4. If no redirect was triggered, the user is on the correct page for their state.
  // Render the requested page content.
  return <>{children}</>;
}
