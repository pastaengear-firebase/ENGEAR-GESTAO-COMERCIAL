
// src/hooks/use-settings.ts
"use client";
import { useContext } from 'react';
import { SettingsContext } from '@/contexts/settings-context';
import type { SettingsContextType } from '@/lib/types';

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
