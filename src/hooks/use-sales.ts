// src/hooks/use-sales.ts
"use client";
import { useContext } from 'react';
import { SalesContext } from '@/contexts/sales-context';
import type { SalesContextType } from '@/lib/types';

export const useSales = (): SalesContextType => {
  const context = useContext(SalesContext);
  if (context === undefined) {
    throw new Error('useSales must be used within a SalesProvider');
  }
  return context;
};
