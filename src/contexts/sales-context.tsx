
// src/contexts/sales-context.tsx
"use client";
import type React from 'react';
import { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useFirestore, useCollection } from '@/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, getDocs, writeBatch, setDoc } from 'firebase/firestore';
import { ALL_SELLERS_OPTION, SELLER_EMAIL_MAP } from '@/lib/constants';
import type { Sale, Seller, SalesContextType, SalesFilters } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';

export const SalesContext = createContext<SalesContextType | undefined>(undefined);

export const SalesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const firestore = useFirestore();
  const { user, loading: authLoading } = useAuth();
  
  const salesCollection = useMemo(() => firestore ? collection(firestore, 'sales') : null, [firestore]);
  
  const { data: sales, loading: salesLoading } = useCollection<Sale>(salesCollection);

  const [selectedSeller, setSelectedSeller] = useState<Seller | typeof ALL_SELLERS_OPTION>(ALL_SELLERS_OPTION);
  const [filters, setFiltersState] = useState<SalesFilters>({ selectedYear: 'all' });
  
  const userSellerIdentity = useMemo(() => user?.email ? SELLER_EMAIL_MAP[user.email.toLowerCase() as keyof typeof SELLER_EMAIL_MAP] || null : null, [user]);
  
  useEffect(() => {
    if (userSellerIdentity) {
      setSelectedSeller(userSellerIdentity);
    } else {
      setSelectedSeller(ALL_SELLERS_OPTION);
    }
  }, [userSellerIdentity]);

  const isReadOnly = useMemo(() => !userSellerIdentity, [userSellerIdentity]);

  const addSale = useCallback(async (saleData: Omit<Sale, 'id' | 'createdAt' | 'updatedAt' | 'seller' | 'sellerUid'>): Promise<Sale> => {
    if (!salesCollection || !user || !userSellerIdentity) throw new Error("Usuário não tem permissão para adicionar vendas.");

    const docRef = doc(salesCollection);
    const newSaleData = {
      ...saleData,
      seller: userSellerIdentity,
      sellerUid: user.uid,
    };
    
    await setDoc(docRef, { ...newSaleData, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    
    return { 
        ...newSaleData, 
        id: docRef.id, 
        createdAt: new Date().toISOString() 
    } as Sale;
  }, [salesCollection, user, userSellerIdentity]);

  const addBulkSales = useCallback(async (newSalesData: Omit<Sale, 'id' | 'createdAt' | 'updatedAt' | 'sellerUid'>[]) => {
    if (!firestore || !salesCollection || !user || !userSellerIdentity) throw new Error("Usuário não tem permissão para importar vendas.");
    const batch = writeBatch(firestore);
    newSalesData.forEach(saleData => {
        const docRef = doc(salesCollection);
        batch.set(docRef, { ...saleData, sellerUid: user.uid, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    });
    await batch.commit();
  }, [firestore, salesCollection, user, userSellerIdentity]);

  const updateSale = useCallback(async (id: string, saleUpdateData: Partial<Omit<Sale, 'id' | 'createdAt' | 'updatedAt'>>) => {
    if (!salesCollection || !user) throw new Error("Firestore não está inicializado.");
    const originalSale = sales?.find(s => s.id === id);
    if (!originalSale || originalSale.sellerUid !== user.uid) {
      throw new Error("Usuário não tem permissão para modificar esta venda.");
    }
    const saleRef = doc(salesCollection, id);
    await updateDoc(saleRef, { ...saleUpdateData, updatedAt: serverTimestamp() });
  }, [sales, salesCollection, user]);

  const deleteSale = useCallback(async (id: string) => {
    if (!salesCollection || !user) throw new Error("Firestore não está inicializado.");
    const originalSale = sales?.find(s => s.id === id);
    if (!originalSale || originalSale.sellerUid !== user.uid) {
      throw new Error("Usuário não tem permissão para excluir esta venda.");
    }
    const saleRef = doc(salesCollection, id);
    await deleteDoc(saleRef);
  }, [salesCollection, sales, user]);

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

  const loading = salesLoading || authLoading;

  return (
    <SalesContext.Provider
      value={{
        sales: sales || [],
        filteredSales,
        selectedSeller,
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
