// contexts/quotes-context.tsx
"use client";
import type React from 'react';
import { createContext, useState, useCallback, useMemo } from 'react';
import { useFirestore, useStorage } from '../firebase/provider';
import { useCollection } from '../firebase/firestore/use-collection';
import { collection, updateDoc, deleteDoc, doc, serverTimestamp, writeBatch, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { ALL_SELLERS_OPTION } from '../lib/constants';
import type { Quote, QuotesContextType, Seller, FollowUpOptionValue, QuoteDashboardFilters } from '../lib/types';
import { useSales } from '../hooks/use-sales';
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
  const storage = useStorage();

  const quotesCollection = useMemo(() => firestore ? collection(firestore, 'quotes') : null, [firestore]);
  
  const { data: quotes, loading: loadingQuotesData } = useCollection<Quote>(quotesCollection);

  const [managementSearchTerm, setManagementSearchTermState] = useState<string>('');
  const [dashboardFilters, setDashboardFiltersState] = useState<QuoteDashboardFilters>({ selectedYear: 'all' });

  const { viewingAsSeller, userRole, user } = useSales();
  
  const addQuote = useCallback(async (
    quoteData: Omit<Quote, 'id' | 'createdAt' | 'updatedAt' | 'seller' | 'sellerUid' | 'followUpDate' | 'followUpDone' | 'followUpSequence'> & { followUpOption: FollowUpOptionValue }
  ): Promise<Quote> => {
    if (!quotesCollection || !user || userRole === ALL_SELLERS_OPTION) throw new Error("Usuário não tem permissão para adicionar uma proposta.");
    
    const { followUpOption, ...restOfQuoteData } = quoteData;
    const { date, sequence, done } = calculateFollowUp(quoteData.proposalDate, followUpOption);

    const docRef = doc(quotesCollection);
    const newQuoteData = {
      ...restOfQuoteData,
      seller: userRole as Seller,
      sellerUid: user.uid,
      followUpDate: date,
      followUpDone: done,
      followUpSequence: sequence,
    };

    const cleanedData = Object.fromEntries(Object.entries(newQuoteData).filter(([_, v]) => v !== undefined));
    await setDoc(docRef, { ...cleanedData, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });

    return { 
        ...cleanedData,
        id: docRef.id,
        createdAt: new Date().toISOString() 
    } as Quote;
  }, [userRole, quotesCollection, user]);

  const addBulkQuotes = useCallback(async (newQuotesData: Omit<Quote, 'id' | 'createdAt' | 'updatedAt' | 'seller' | 'sellerUid'>[]) => {
    if (!firestore || !quotesCollection || !user || userRole === ALL_SELLERS_OPTION) throw new Error("Usuário não tem permissão para importar propostas.");
    const batch = writeBatch(firestore);
    newQuotesData.forEach(quoteData => {
        const docRef = doc(quotesCollection);
        const cleanedData = Object.fromEntries(Object.entries(quoteData).filter(([_, v]) => v !== undefined));
        batch.set(docRef, { ...cleanedData, seller: userRole, sellerUid: user.uid, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    });
    await batch.commit();
  }, [firestore, quotesCollection, user, userRole]);

  const updateQuote = useCallback(async (
    id: string, 
    quoteUpdateData: Partial<Omit<Quote, 'id' | 'createdAt' | 'updatedAt' | 'seller' | 'followUpDate' | 'followUpSequence'>> & { followUpOption: FollowUpOptionValue, followUpDone?: boolean }
  ) => {
    if (!quotesCollection) throw new Error("Firestore não inicializado para propostas");
    
    const quoteRef = doc(quotesCollection, id);
    const { followUpOption, ...restOfUpdateData } = quoteUpdateData;
    let updatePayload: Partial<Quote> = restOfUpdateData;

    const originalQuote = quotes?.find(q => q.id === id);
    if (originalQuote && (followUpOption || quoteUpdateData.proposalDate)) {
        const currentProposalDate = quoteUpdateData.proposalDate || originalQuote.proposalDate;
        const { date, sequence, done } = calculateFollowUp(currentProposalDate, followUpOption);
        updatePayload = { ...updatePayload, followUpDate: date, followUpSequence: sequence, followUpDone: done };
    }
    
    const cleanedPayload = Object.fromEntries(Object.entries(updatePayload).filter(([_, v]) => v !== undefined));
    await updateDoc(quoteRef, { ...cleanedPayload, updatedAt: serverTimestamp() });
  }, [quotes, quotesCollection]);

  const deleteQuote = useCallback(async (id: string) => {
    if (!quotesCollection) throw new Error("Firestore não inicializado para propostas");
    
    const quoteToDelete = quotes?.find(q => q.id === id);
    if (quoteToDelete?.attachmentPath) {
        const fileRef = ref(storage!, quoteToDelete.attachmentPath);
        await deleteObject(fileRef).catch(() => {});
    }
    await deleteDoc(doc(quotesCollection, id));
  }, [quotesCollection, quotes, storage]);

  const getQuoteById = useCallback((id: string): Quote | undefined => {
    return quotes?.find(quote => quote.id === id);
  }, [quotes]);

  const uploadAttachment = useCallback(async (quoteId: string, file: File) => {
    if (!storage || !quotesCollection) throw new Error("Storage ou Firestore não inicializado.");
    
    const filePath = `proposals/${quoteId}/${file.name}`;
    const fileRef = ref(storage, filePath);
    await uploadBytes(fileRef, file);
    const url = await getDownloadURL(fileRef);
    
    const quoteRef = doc(quotesCollection, quoteId);
    await updateDoc(quoteRef, {
        attachmentUrl: url,
        attachmentPath: filePath,
        updatedAt: serverTimestamp()
    });
  }, [storage, quotesCollection]);

  const deleteAttachment = useCallback(async (quote: Quote) => {
      if (!storage || !quotesCollection || !quote.attachmentPath) return;
      const fileRef = ref(storage, quote.attachmentPath);
      await deleteObject(fileRef).catch(() => {});

      const quoteRef = doc(quotesCollection, quote.id);
      await updateDoc(quoteRef, {
          attachmentUrl: null,
          attachmentPath: null,
          updatedAt: serverTimestamp()
      });
  }, [storage, quotesCollection]);

  const toggleFollowUpDone = useCallback(async (quoteId: string) => {
    if (!quotesCollection) throw new Error("Firestore não inicializado para propostas.");
    const quote = quotes?.find(q => q.id === quoteId);
    if (!quote) return;

    const quoteRef = doc(quotesCollection, quoteId);
    if (quote.followUpDone) {
        await updateDoc(quoteRef, { followUpDone: false, updatedAt: serverTimestamp() });
        return;
    }

    if (!quote.followUpSequence || !quote.followUpDate) {
        await updateDoc(quoteRef, { followUpDone: true, updatedAt: serverTimestamp() });
        return;
    }

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
        await updateDoc(quoteRef, { followUpDone: true, updatedAt: serverTimestamp() });
    } else {
        const nextOffset = sequence[currentIndex + 1];
        const nextFollowUpDate = format(addDays(proposalD, nextOffset), 'yyyy-MM-dd');
        await updateDoc(quoteRef, { 
            followUpDate: nextFollowUpDate,
            followUpDone: false,
            updatedAt: serverTimestamp() 
        });
    }
  }, [quotes, quotesCollection]);

  const setManagementSearchTerm = (term: string) => setManagementSearchTermState(term);

  const managementFilteredQuotes = useMemo(() => {
    return (quotes || [])
      .filter(quote => {
        if (viewingAsSeller === ALL_SELLERS_OPTION) return true;
        return quote.seller === viewingAsSeller;
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
  }, [quotes, viewingAsSeller, managementSearchTerm]);

  const setDashboardFilters = (newFilters: Partial<QuoteDashboardFilters>) => {
    setDashboardFiltersState(prevFilters => ({ ...prevFilters, ...newFilters }));
  };

  const dashboardFilteredQuotes = useMemo(() => {
    return (quotes || [])
      .filter(quote => {
        if (viewingAsSeller === ALL_SELLERS_OPTION) return true;
        return quote.seller === viewingAsSeller;
      })
      .filter(quote => {
        if (!dashboardFilters.selectedYear || dashboardFilters.selectedYear === 'all') return true;
        const quoteYear = new Date(quote.proposalDate).getFullYear();
        return quoteYear === dashboardFilters.selectedYear;
      });
  }, [quotes, viewingAsSeller, dashboardFilters]);
  
  const loadingQuotes = loadingQuotesData;

  return (
    <QuotesContext.Provider
      value={{
        quotes: quotes || [],
        managementFilteredQuotes,
        setManagementSearchTerm,
        managementSearchTerm,
        dashboardFilteredQuotes,
        setDashboardFilters,
        dashboardFilters,
        addQuote,
        addBulkQuotes,
        updateQuote,
        deleteQuote,
        uploadAttachment,
        deleteAttachment,
        getQuoteById,
        toggleFollowUpDone,
        loadingQuotes
      }}
    >
      {children}
    </QuotesContext.Provider>
  );
};
