// src/contexts/sales-context.tsx
"use client";
import type React from 'react';
import { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useFirestore, useCollection, useAuth, useFirebaseApp } from '@/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, writeBatch, setDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { ALL_SELLERS_OPTION, SELLER_EMAIL_MAP } from '@/lib/constants';
import type { Sale, Seller, SalesContextType, SalesFilters, AppUser } from '@/lib/types';
import { useRouter } from 'next/navigation';

export const SalesContext = createContext<SalesContextType | undefined>(undefined);

export const SalesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const firebaseApp = useFirebaseApp();
  const auth = useAuth();
  const firestore = useFirestore();
  
  const salesCollection = useMemo(() => firestore ? collection(firestore, 'sales') : null, [firestore]);
  
  const { data: sales, loading: salesLoading } = useCollection<Sale>(salesCollection);

  const [user, setUser] = useState<AppUser | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [selectedSeller, setSelectedSellerState] = useState<Seller | typeof ALL_SELLERS_OPTION>(ALL_SELLERS_OPTION);
  const [filters, setFiltersState] = useState<SalesFilters>({ selectedYear: 'all' });
  
  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: User | null) => {
      if (firebaseUser) {
        const appUser: AppUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
        };
        setUser(appUser);
        
        const sellerRole = SELLER_EMAIL_MAP[firebaseUser.email?.toLowerCase() as keyof typeof SELLER_EMAIL_MAP] || ALL_SELLERS_OPTION;
        setSelectedSellerState(sellerRole);

      } else {
        setUser(null);
        setSelectedSellerState(ALL_SELLERS_OPTION);
      }
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, [auth]);

  const isReadOnly = useMemo(() => selectedSeller === ALL_SELLERS_OPTION, [selectedSeller]);
  
  const logout = useCallback(async () => {
    if (!auth) return;
    await signOut(auth);
    router.push('/login');
  }, [auth, router]);

  const addSale = useCallback(async (saleData: Omit<Sale, 'id' | 'createdAt' | 'updatedAt' | 'seller' | 'sellerUid'>): Promise<Sale> => {
    if (!salesCollection || !user || isReadOnly) throw new Error("Usuário não tem permissão para adicionar uma venda.");

    const docRef = doc(salesCollection);
    const newSaleData = {
      ...saleData,
      seller: selectedSeller as Seller,
      sellerUid: user.uid,
    };
    
    await setDoc(docRef, { ...newSaleData, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    
    return { 
        ...newSaleData, 
        id: docRef.id, 
        createdAt: new Date().toISOString() 
    } as Sale;
  }, [salesCollection, selectedSeller, user, isReadOnly]);

  const addBulkSales = useCallback(async (newSalesData: Omit<Sale, 'id' | 'createdAt' | 'updatedAt' | 'seller' | 'sellerUid'>[]) => {
    if (!firestore || !salesCollection || !user || isReadOnly) throw new Error("Usuário não tem permissão para importar vendas.");
    const batch = writeBatch(firestore);
    newSalesData.forEach(saleData => {
        const docRef = doc(salesCollection);
        batch.set(docRef, { ...saleData, seller: selectedSeller, sellerUid: user.uid, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    });
    await batch.commit();
  }, [firestore, salesCollection, isReadOnly, user, selectedSeller]);

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
        user,
        loadingAuth,
        logout,
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
