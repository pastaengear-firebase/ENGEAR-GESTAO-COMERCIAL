// src/contexts/quotes-context.tsx
"use client";
import type React from 'react';
import { createContext, useState, useCallback, useContext, useMemo } from 'react';
import { useFirestore, useCollection } from '@/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { ALL_SELLERS_OPTION, SELLERS } from '@/lib/constants';
import type { Quote, QuotesContextType, Seller, FollowUpOptionValue, QuoteDashboardFilters } from '@/lib/types';
import { useSales } from '@/hooks/use-sales';
import { useAuth } from '@/hooks/use-auth';
import { format, parseISO, addDays } from 'date-fns';

export const QuotesContext = createContext<QuotesContextType | undefined>(undefined);

const calculateFollowUp = (proposalDateStr: string, followUpOption: FollowUpOptionValue) => {
    if (followUpOption === '0') {
        return { date: null, sequence: undefined, done: false };
    }
    
    const sequence = followUpOption.split(',').map(Number);
    const firstOffset = sequence[0];

    try {
        const proposalD = parseISO(proposalDateStr);
        const nextDate = format(addDays(proposalD, firstOffset), 'yyyy-MM-dd');
        return {
            date: nextDate,
            sequence: sequence.length > 1 ? followUpOption : undefined,
            done: false
        };
    } catch (e) {
        console.error("Error calculating followUpDate", e);
        return { date: null, sequence: undefined, done: false };
    }
};

export const QuotesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const firestore = useFirestore();

  const quotesCollection = useMemo(() => firestore ? collection(firestore, 'quotes') : null, [firestore]);
  
  const { data: quotes, loading: loadingQuotesData } = useCollection<Quote>(quotesCollection);

  const [managementSearchTerm, setManagementSearchTermState] = useState<string>('');
  const [dashboardFilters, setDashboardFiltersState] = useState<QuoteDashboardFilters>({ selectedYear: 'all' });

  const { selectedSeller, isReadOnly } = useSales();
  const { user } = useAuth();


  const addQuote = useCallback(async (
    quoteData: Omit<Quote, 'id' | 'createdAt' | 'updatedAt' | 'seller' | 'sellerUid' | 'followUpDate' | 'followUpDone' | 'followUpSequence'> & { followUpOption: FollowUpOptionValue, sendProposalNotification?: boolean }
  ): Promise<Quote> => {
    if (!quotesCollection) throw new Error("Firestore não inicializado para propostas");
    if (isReadOnly || !user) {
      throw new Error("Usuário sem permissão para adicionar proposta.");
    }
    
    const { followUpOption, ...restOfQuoteData } = quoteData;
    const { date, sequence, done } = calculateFollowUp(quoteData.proposalDate, followUpOption);

    const newQuoteData = {
      ...restOfQuoteData,
      seller: selectedSeller as Seller,
      sellerUid: user.uid,
      followUpDate: date,
      followUpDone: done,
      followUpSequence: sequence,
      sendProposalNotification: quoteData.sendProposalNotification || false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(quotesCollection, newQuoteData);

    return { ...newQuoteData, seller: selectedSeller as Seller, sellerUid: user.uid, id: docRef.id, createdAt: new Date() } as Quote;
  }, [selectedSeller, quotesCollection, isReadOnly, user]);

  const updateQuote = useCallback(async (
    id: string, 
    quoteUpdateData: Partial<Omit<Quote, 'id' | 'createdAt' | 'updatedAt' | 'seller' | 'followUpDate' | 'followUpSequence'>> & { followUpOption: FollowUpOptionValue, sendProposalNotification?: boolean, followUpDone?: boolean }
  ): Promise<Quote | undefined> => {
    if (!quotesCollection) throw new Error("Firestore não inicializado para propostas");
    const originalQuote = quotes?.find(q => q.id === id);
    if (!originalQuote) return undefined;
    if (isReadOnly || selectedSeller !== originalQuote.seller) throw new Error("Usuário não tem permissão para modificar esta proposta.");

    const quoteRef = doc(quotesCollection, id);
    
    const { followUpOption, ...restOfUpdateData } = quoteUpdateData;
    let updatePayload: Partial<Quote> = restOfUpdateData;

    // Recalculate follow-up if option or proposal date changed
    if (followUpOption || quoteUpdateData.proposalDate) {
        const currentProposalDate = quoteUpdateData.proposalDate || originalQuote.proposalDate;
        const { date, sequence, done } = calculateFollowUp(currentProposalDate, followUpOption);
        updatePayload = { ...updatePayload, followUpDate: date, followUpSequence: sequence, followUpDone: done };
    }
    
    await updateDoc(quoteRef, { ...updatePayload, updatedAt: serverTimestamp() });
    
    return { ...originalQuote, ...updatePayload, id, updatedAt: new Date() };
  }, [quotes, quotesCollection, isReadOnly, selectedSeller]);

  const deleteQuote = useCallback(async (id: string) => {
    if (!quotesCollection) throw new Error("Firestore não inicializado para propostas");
    const originalQuote = quotes?.find(q => q.id === id);
    if (isReadOnly || (originalQuote && selectedSeller !== originalQuote.seller)) throw new Error("Usuário não tem permissão para excluir esta proposta.");
    await deleteDoc(doc(quotesCollection, id));
  }, [quotes, quotesCollection, isReadOnly, selectedSeller]);

  const getQuoteById = useCallback((id: string): Quote | undefined => {
    return quotes?.find(quote => quote.id === id);
  }, [quotes]);

  const toggleFollowUpDone = useCallback(async (quoteId: string) => {
    if (!quotesCollection) throw new Error("Firestore não inicializado para propostas.");
    const quote = quotes?.find(q => q.id === quoteId);
    if (!quote) return;
    if (isReadOnly || selectedSeller !== quote.seller) throw new Error("Usuário não tem permissão para modificar esta proposta.");

    const quoteRef = doc(quotesCollection, quoteId);

    // If it's being marked as "not done", just revert the 'done' status.
    if (quote.followUpDone) {
        await updateDoc(quoteRef, { followUpDone: false, updatedAt: serverTimestamp() });
        return;
    }

    // If no sequence, just mark as done.
    if (!quote.followUpSequence || !quote.followUpDate) {
        await updateDoc(quoteRef, { followUpDone: true, updatedAt: serverTimestamp() });
        return;
    }

    // Sequence logic: find current step and advance to the next, or finish.
    const sequence = quote.followUpSequence.split(',').map(Number);
    const proposalD = parseISO(quote.proposalDate);
    const currentFollowUpD = parseISO(quote.followUpDate);
    
    let currentIndex = -1;
    for (let i = 0; i < sequence.length; i++) {
        const dateInSequence = addDays(proposalD, sequence[i]);
        if (format(dateInSequence, 'yyyy-MM-dd') === format(currentFollowUpD, 'yyyy-MM-dd')) {
            currentIndex = i;
            break;
        }
    }

    if (currentIndex === -1 || currentIndex >= sequence.length - 1) {
        // Not found in sequence or it's the last one
        await updateDoc(quoteRef, { followUpDone: true, updatedAt: serverTimestamp() });
    } else {
        // Advance to the next date in the sequence
        const nextOffset = sequence[currentIndex + 1];
        const nextFollowUpDate = format(addDays(proposalD, nextOffset), 'yyyy-MM-dd');
        await updateDoc(quoteRef, { 
            followUpDate: nextFollowUpDate,
            followUpDone: false, // It's not done, it's newly scheduled
            updatedAt: serverTimestamp() 
        });
    }
  }, [quotes, quotesCollection, isReadOnly, selectedSeller]);


  const setManagementSearchTerm = useCallback((term: string) => {
    setManagementSearchTermState(term);
  }, []);

  const managementFilteredQuotes = useMemo(() => {
    return (quotes || [])
      .filter(quote => {
        if (selectedSeller === ALL_SELLERS_OPTION) return true;
        return quote.seller === selectedSeller;
      })
      .filter(quote => {
        if (!managementSearchTerm.trim()) return true;
        const lowerSearchTerm = managementSearchTerm.toLowerCase();
        return (
          quote.clientName.toLowerCase().includes(lowerSearchTerm) ||
          quote.description.toLowerCase().includes(lowerSearchTerm) ||
          quote.area.toLowerCase().includes(lowerSearchTerm) ||
          String(quote.proposedValue).includes(lowerSearchTerm)
        );
      });
  }, [quotes, selectedSeller, managementSearchTerm]);

  const setDashboardFilters = useCallback((newFilters: Partial<QuoteDashboardFilters>) => {
    setDashboardFiltersState(prevFilters => ({ ...prevFilters, ...newFilters }));
  }, []);

  const dashboardFilteredQuotes = useMemo(() => {
    return (quotes || [])
      .filter(quote => {
        if (selectedSeller === ALL_SELLERS_OPTION) return true;
        return quote.seller === selectedSeller;
      })
      .filter(quote => {
        if (!dashboardFilters.selectedYear || dashboardFilters.selectedYear === 'all') return true;
        const quoteYear = new Date(quote.proposalDate).getFullYear();
        return quoteYear === dashboardFilters.selectedYear;
      });
  }, [quotes, selectedSeller, dashboardFilters]);
  
  const loadingQuotes = loadingQuotesData;

  return (
    <QuotesContext.Provider
      value={{
        quotes: quotes || [],
        selectedSeller, 
        
        managementFilteredQuotes,
        setManagementSearchTerm,
        managementSearchTerm,

        dashboardFilteredQuotes,
        setDashboardFilters,
        dashboardFilters,
        
        addQuote,
        updateQuote,
        deleteQuote,
        getQuoteById,
        toggleFollowUpDone,
        loadingQuotes
      }}
    >
      {children}
    </QuotesContext.Provider>
  );
};
