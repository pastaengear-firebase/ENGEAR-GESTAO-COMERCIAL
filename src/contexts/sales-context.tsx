
// src/contexts/sales-context.tsx
"use client";
import type React from 'react';
import { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useFirestore, useCollection } from '@/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, writeBatch, setDoc } from 'firebase/firestore';
import { ALL_SELLERS_OPTION } from '@/lib/constants';
import type { Sale, Seller, SalesContextType, SalesFilters } from '@/lib/types';

export const SalesContext = createContext<SalesContextType | undefined>(undefined);

export const SalesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const firestore = useFirestore();
  
  const salesCollection = useMemo(() => firestore ? collection(firestore, 'sales') : null, [firestore]);
  
  const { data: sales, loading: salesLoading } = useCollection<Sale>(salesCollection);

  const [selectedSeller, setSelectedSellerState] = useState<Seller | typeof ALL_SELLERS_OPTION>(ALL_SELLERS_OPTION);
  const [filters, setFiltersState] = useState<SalesFilters>({ selectedYear: 'all' });
  
  const isReadOnly = useMemo(() => selectedSeller === ALL_SELLERS_OPTION, [selectedSeller]);

  const setSelectedSeller = (seller: Seller | typeof ALL_SELLERS_OPTION) => {
    setSelectedSellerState(seller);
  };

  const addSale = useCallback(async (saleData: Omit<Sale, 'id' | 'createdAt' | 'updatedAt' | 'seller' | 'sellerUid'>): Promise<Sale> => {
    if (!salesCollection || selectedSeller === ALL_SELLERS_OPTION) throw new Error("Selecione um vendedor para adicionar uma venda.");

    const docRef = doc(salesCollection);
    const newSaleData = {
      ...saleData,
      seller: selectedSeller as Seller,
      sellerUid: "static_user", // Static UID since there's no auth
    };
    
    await setDoc(docRef, { ...newSaleData, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    
    return { 
        ...newSaleData, 
        id: docRef.id, 
        createdAt: new Date().toISOString() 
    } as Sale;
  }, [salesCollection, selectedSeller]);

  const addBulkSales = useCallback(async (newSalesData: Omit<Sale, 'id' | 'createdAt' | 'updatedAt' | 'sellerUid'>[]) => {
    if (!firestore || !salesCollection || isReadOnly) throw new Error("Selecione um vendedor para importar vendas.");
    const batch = writeBatch(firestore);
    newSalesData.forEach(saleData => {
        const docRef = doc(salesCollection);
        batch.set(docRef, { ...saleData, sellerUid: "static_user", createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    });
    await batch.commit();
  }, [firestore, salesCollection, isReadOnly]);

  const updateSale = useCallback(async (id: string, saleUpdateData: Partial<Omit<Sale, 'id' | 'createdAt' | 'updatedAt'>>) => {
    if (!salesCollection) throw new Error("Firestore não está inicializado.");
    const saleRef = doc(salesCollection, id);
    await updateDoc(saleRef, { ...saleUpdateData, updatedAt: serverTimestamp() });
  }, [salesCollection]);

  const deleteSale = useCallback(async (id: string) => {
    if (!salesCollection) throw new Error("Firestore não está inicializado.");
    const saleRef = doc(salesCollection, id);
    await deleteDoc(saleRef);
  }, [salesCollection]);

  const getSaleById = useCallback((id: string): Sale | undefined => {
    return sales?.find(sale => sale.id === id);
  }, [sales]);

  const setFilters = useCallback((newFilters: Partial<SalesFilters>) => {
    setFiltersState(prevFilters => ({ ...prevFilters, ...newFilters }));
  }, []);

  const filteredSales = useMemo(() => {
    return (sales || [])
      .filter(sale => {
        if (selectedSeller === ALL_SELLERS_OPTION) return true;
        return sale.seller === selectedSeller;
      })
      .filter(sale => {
        if (!filters.searchTerm) return true;
        const term = filters.searchTerm.toLowerCase();
        return (
          sale.company.toLowerCase().includes(term) ||
          sale.project.toLowerCase().includes(term) ||
          sale.os.toLowerCase().includes(term) ||
          sale.clientService.toLowerCase().includes(term)
        );
      })
      .filter(sale => {
        if (!filters.selectedYear || filters.selectedYear === 'all') return true;
        const saleYear = new Date(sale.date).getFullYear();
        return saleYear === filters.selectedYear;
      });
  }, [sales, selectedSeller, filters]);

  const loading = salesLoading;

  return (
    <SalesContext.Provider
      value={{
        sales: sales || [],
        filteredSales,
        selectedSeller,
        setSelectedSeller,
        isReadOnly,
        addSale,
        addBulkSales,
        updateSale,
        deleteSale,
        getSaleById,
        setFilters,
        filters,
        loading
      }}
    >
      {children}
    </SalesContext.Provider>
  );
};
