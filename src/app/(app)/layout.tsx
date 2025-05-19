// src/app/(app)/layout.tsx
import type React from 'react';
import SidebarNav from '@/components/layout/sidebar-nav';
import HeaderContent from '@/components/layout/header-content';
import { ThemeProvider } from "next-themes"; // Needs: npm install next-themes

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <div className="flex min-h-screen flex-col bg-secondary/50">
        <SidebarNav />
        <div className="flex flex-1 flex-col md:pl-64">
          <HeaderContent />
          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-full"> {/* Ensure content can be full width */}
              {children}
            </div>
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
}
