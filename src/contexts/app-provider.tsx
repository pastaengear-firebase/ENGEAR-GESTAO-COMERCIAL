// src/contexts/app-provider.tsx
"use client";
import type React from 'react';
import { AuthProvider } from './auth-context';
import { SalesProvider } from './sales-context';
import { TooltipProvider } from "@/components/ui/tooltip"; // Required by ShadCN Sidebar

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AuthProvider>
      <SalesProvider>
        <TooltipProvider>
          {children}
        </TooltipProvider>
      </SalesProvider>
    </AuthProvider>
  );
};
