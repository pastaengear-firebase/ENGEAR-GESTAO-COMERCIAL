'use client';
import type React from 'react';
import { FirebaseClientProvider } from '../firebase/client-provider';
import { SalesProvider } from './sales-context';
import { SettingsProvider } from './settings-context';
import { QuotesProvider } from './quotes-context';
import { TooltipProvider } from '../components/ui/tooltip';

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
