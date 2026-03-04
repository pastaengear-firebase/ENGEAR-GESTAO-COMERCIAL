'use client';
import { useContext } from 'react';
import { QuotesContext } from '../contexts/quotes-context';
import type { QuotesContextType } from '../lib/types';

export const useQuotes = (): QuotesContextType => {
  const context = useContext(QuotesContext);
  if (context === undefined) {
    throw new Error('useQuotes must be used within a QuotesProvider');
  }
  return context;
};