
// src/contexts/app-provider.tsx
"use client";
import type React from 'react';
import { SalesProvider } from './sales-context';
import { SettingsProvider } from './settings-context';
import { QuotesProvider } from './quotes-context';
import { TooltipProvider } from '../components/ui/tooltip';
import { FirebaseClientProvider } from '../firebase/client-provider';

/**
 * Provedor mestre que unifica todos os contextos.
 * Usa caminhos relativos para garantir estabilidade no build.
 */
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
