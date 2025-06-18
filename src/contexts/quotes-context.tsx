
// src/contexts/quotes-context.tsx
"use client";
import type React from 'react';
import { createContext, useState, useEffect, useCallback, useContext } from 'react';
import { LOCAL_STORAGE_QUOTES_KEY, ALL_SELLERS_OPTION, SELLERS } from '@/lib/constants';
import type { Quote, QuotesContextType, Seller, FollowUpDaysOptionValue } from '@/lib/types';
import { SalesContext } from './sales-context'; // Para acessar selectedSeller
import { v4 as uuidv4 } from 'uuid';
import { format, parseISO, addDays } from 'date-fns';

export const QuotesContext = createContext<QuotesContextType | undefined>(undefined);

export const QuotesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loadingQuotes, setLoadingQuotes] = useState(true);
  const salesContext = useContext(SalesContext);

  if (!salesContext) {
    throw new Error("QuotesProvider must be used within a SalesProvider");
  }
  const { selectedSeller } = salesContext;


  useEffect(() => {
    setLoadingQuotes(true);
    try {
      const storedQuotes = localStorage.getItem(LOCAL_STORAGE_QUOTES_KEY);
      if (storedQuotes) {
        const parsedQuotes = JSON.parse(storedQuotes);
         if (Array.isArray(parsedQuotes)) {
            setQuotes(parsedQuotes.map(q => ({...q, followUpDone: q.followUpDone || false })).sort((a,b) => new Date(b.proposalDate).getTime() - new Date(a.proposalDate).getTime()));
        } else {
            setQuotes([]); 
        }
      } else {
         setQuotes([]); 
      }
    } catch (error) {
      console.error("QuotesContext: Error loading quotes from localStorage", error);
      setQuotes([]); 
    } finally {
      setLoadingQuotes(false);
    }
  }, []);

  useEffect(() => {
    if (!loadingQuotes) {
      localStorage.setItem(LOCAL_STORAGE_QUOTES_KEY, JSON.stringify(quotes));
    }
  }, [quotes, loadingQuotes]);

  const calculateFollowUpDate = (proposalDateStr: string, offsetDays?: FollowUpDaysOptionValue): string | null => {
    if (offsetDays && offsetDays > 0) {
        try {
            const proposalD = parseISO(proposalDateStr); 
            return format(addDays(proposalD, offsetDays), 'yyyy-MM-dd');
        } catch(e) {
            console.error("Error calculating followUpDate", e);
            return null;
        }
    }
    return null;
  };

  const addQuote = useCallback((
    quoteData: Omit<Quote, 'id' | 'createdAt' | 'updatedAt' | 'seller' | 'followUpDate' | 'followUpDone'> & { followUpDaysOffset?: FollowUpDaysOptionValue, sendProposalNotification?: boolean }
  ): Quote => {
    if (selectedSeller === ALL_SELLERS_OPTION || !SELLERS.includes(selectedSeller as Seller)) {
      throw new Error("Um vendedor específico (SERGIO ou RODRIGO) deve ser selecionado para adicionar uma proposta.");
    }
    
    const finalFollowUpDate = calculateFollowUpDate(quoteData.proposalDate, quoteData.followUpDaysOffset);

    const newQuote: Quote = {
      ...quoteData,
      id: uuidv4(),
      seller: selectedSeller as Seller,
      followUpDate: finalFollowUpDate,
      followUpDone: false, // Default para nova proposta
      sendProposalNotification: quoteData.sendProposalNotification || false,
      createdAt: Date.now(),
    };
    
    delete (newQuote as any).followUpDaysOffset;

    setQuotes(prevQuotes => [...prevQuotes, newQuote].sort((a,b) => new Date(b.proposalDate).getTime() - new Date(a.proposalDate).getTime()));
    return newQuote;
  }, [selectedSeller]);

  const updateQuote = useCallback((
    id: string, 
    quoteUpdateData: Partial<Omit<Quote, 'id' | 'createdAt' | 'updatedAt' | 'seller' | 'followUpDate'>> & { followUpDaysOffset?: FollowUpDaysOptionValue, sendProposalNotification?: boolean, followUpDone?: boolean }
  ): Quote | undefined => {
    let updatedQuote: Quote | undefined;
    setQuotes(prevQuotes =>
      prevQuotes.map(quote => {
        if (quote.id === id) {
          const currentProposalDate = quoteUpdateData.proposalDate || quote.proposalDate;
          let finalFollowUpDate = quote.followUpDate; // Mantem o existente por padrão
          // Recalcula a data de follow-up apenas se followUpDaysOffset for fornecido e diferente do que geraria a data atual
          // Ou se a data da proposta mudou, é bom recalcular
          if (quoteUpdateData.followUpDaysOffset !== undefined || quoteUpdateData.proposalDate) {
             finalFollowUpDate = calculateFollowUpDate(currentProposalDate, quoteUpdateData.followUpDaysOffset);
          }


          updatedQuote = {
            ...quote,
            ...quoteUpdateData,
            followUpDate: finalFollowUpDate,
            followUpDone: quoteUpdateData.followUpDone !== undefined ? quoteUpdateData.followUpDone : quote.followUpDone,
            sendProposalNotification: quoteUpdateData.sendProposalNotification !== undefined ? quoteUpdateData.sendProposalNotification : quote.sendProposalNotification,
            updatedAt: Date.now()
          };
          delete (updatedQuote as any).followUpDaysOffset;
          return updatedQuote;
        }
        return quote;
      }).sort((a,b) => new Date(b.proposalDate).getTime() - new Date(a.proposalDate).getTime())
    );
    return updatedQuote;
  }, []);

  const deleteQuote = useCallback((id: string) => {
    setQuotes(prevQuotes => prevQuotes.filter(quote => quote.id !== id));
  }, []);

  const getQuoteById = useCallback((id: string): Quote | undefined => {
    return quotes.find(quote => quote.id === id);
  }, [quotes]);

  const toggleFollowUpDone = useCallback((quoteId: string) => {
    setQuotes(prevQuotes =>
      prevQuotes.map(quote => {
        if (quote.id === quoteId) {
          return {
            ...quote,
            followUpDone: !quote.followUpDone,
            updatedAt: Date.now(),
          };
        }
        return quote;
      })
    );
  }, []);

  return (
    <QuotesContext.Provider
      value={{
        quotes,
        selectedSeller, 
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

