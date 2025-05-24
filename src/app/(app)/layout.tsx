
// src/app/(app)/layout.tsx
import type React from 'react';
import SidebarNav from '@/components/layout/sidebar-nav';
import HeaderContent from '@/components/layout/header-content';
// ThemeProvider foi movido para src/app/layout.tsx

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    // ThemeProvider foi removido daqui
    <div className="flex min-h-screen flex-col"> {/* Removed bg-secondary/50 from here */}
      <SidebarNav />
      <div className="flex flex-1 flex-col md:pl-64 page-bg-pattern"> {/* Added page-bg-pattern */}
        <HeaderContent />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-full"> {/* Ensure content can be full width */}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
