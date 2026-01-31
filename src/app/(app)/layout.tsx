// src/app/(app)/layout.tsx
"use client";
import type React from 'react';
import { useState } from 'react';
import SidebarNav from '@/components/layout/sidebar-nav';
import HeaderContent from '@/components/layout/header-content';
import { AuthGate } from '@/components/auth/auth-gate';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <AuthGate>
      <div className="flex min-h-screen flex-col">
        <SidebarNav isMobileMenuOpen={isMobileMenuOpen} closeMobileMenu={closeMobileMenu} />
        <div className="flex flex-1 flex-col md:pl-36">
          <HeaderContent toggleMobileMenu={toggleMobileMenu} />
          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-full">
              {children}
            </div>
          </main>
        </div>
      </div>
    </AuthGate>
  );
}
