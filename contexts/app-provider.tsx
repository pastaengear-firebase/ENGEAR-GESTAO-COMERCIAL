'use client';
import type React from 'react';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { SalesProvider } from '@/contexts/sales-context';
import { SettingsProvider } from '@/contexts/settings-context';
import { QuotesProvider } from '@/contexts/quotes-context';
import { TooltipProvider } from '@/components/ui/tooltip';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <FirebaseClientProvider>
        <SalesProvider>
          <SettingsProvider>
            <QuotesProvider>
              <TooltipProvider>
                {children}
              </TooltipProvider>
            </QuotesProvider>
          </SettingsProvider>
        </SalesProvider>
    </FirebaseClientProvider>
  );
};
