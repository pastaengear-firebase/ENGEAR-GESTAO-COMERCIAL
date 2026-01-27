// src/app/(app)/layout.tsx
"use client";
import type React from 'react';
import { useState, useEffect } from 'react';
import SidebarNav from '@/components/layout/sidebar-nav';
import HeaderContent from '@/components/layout/header-content';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { APP_ACCESS_GRANTED_KEY } from '@/lib/constants';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    // This check is the single source of truth for authorization.
    const accessGranted = sessionStorage.getItem(APP_ACCESS_GRANTED_KEY) === 'true';

    if (!accessGranted) {
      // If the password was never entered, redirect to the login page (the root).
      router.replace('/');
    } else {
      // If the password was entered, authorize the view.
      setIsAuthorized(true);
    }
    // Mark verification as complete.
    setIsVerifying(false);
  }, [router]);


  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // While verifying authorization, display a full-screen loader.
  // This prevents protected content from flashing briefly before redirection.
  if (isVerifying) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Verificando autorização...</p>
      </div>
    );
  }

  // If verification is done and the user is authorized, render the application.
  if (isAuthorized) {
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

  // If verification is done and the user is not authorized,
  // show the loader while the redirection (initiated in useEffect) happens.
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  );
}
