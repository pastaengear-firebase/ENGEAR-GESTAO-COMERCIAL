// src/app/(app)/layout.tsx
"use client";
import type React from 'react';
import { useState } from 'react';
import SidebarNav from '@/components/layout/sidebar-nav';
import HeaderContent from '@/components/layout/header-content';

// Este layout agora é puramente estrutural e não contém mais nenhuma lógica de autenticação.
// A proteção da rota é garantida pelo AuthGate no layout raiz.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

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
