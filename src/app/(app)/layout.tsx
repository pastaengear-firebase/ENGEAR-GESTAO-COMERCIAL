// src/app/(app)/layout.tsx
"use client";
import type React from 'react';
import { useState, useEffect } from 'react';
import SidebarNav from '@/components/layout/sidebar-nav';
import HeaderContent from '@/components/layout/header-content';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { APP_ACCESS_GRANTED_KEY } from '@/lib/constants';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();
  // This state is the single source of truth for authorization.
  const [isAuthorized, setIsAuthorized] = useState(false);
  // We still get user and its loading state for other parts of the UI,
  // but it's no longer part of the primary authorization gate.
  const { loading: userLoading } = useUser();

  useEffect(() => {
    // This check must run on the client after hydration.
    // It is the single source of truth for whether the user can see the app content.
    const accessGranted = sessionStorage.getItem(APP_ACCESS_GRANTED_KEY) === 'true';

    if (!accessGranted) {
      // If the password was never entered, redirect to the root login page.
      router.replace('/');
    } else {
      // If the password was entered, authorize the view.
      setIsAuthorized(true);
    }
  }, [router]);


  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // While checking authorization OR waiting for Firebase user data, show a loader.
  // This prevents content from flashing if the user is unauthorized and provides a smoother experience.
  if (!isAuthorized || userLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Carregando aplicação...</p>
      </div>
    );
  }

  // Render children only when authorized.
  return (
      <div className="flex min-h-screen flex-col">
        <SidebarNav isMobileMenuOpen={isMobileMenuOpen} closeMobileMenu={closeMobileMenu} />
        <div className="flex flex-1 flex-col md:pl-64">
          <HeaderContent toggleMobileMenu={toggleMobileMenu} />
          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-full">
              {children}
            </div>
          </main>
        </div>
      </div>
  );
}
