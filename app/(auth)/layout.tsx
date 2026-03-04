// src/app/(auth)/layout.tsx
import type React from 'react';
import Logo from '@/components/common/logo';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
       <div className="w-full max-w-sm space-y-6">
        <div className="flex justify-center">
            <Logo width={200} height={60} />
        </div>
        {children}
      </div>
    </main>
  );
}
