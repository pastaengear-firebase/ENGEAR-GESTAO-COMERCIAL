// contexts/sales-context.tsx
"use client";
import type React from 'react';
import { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useFirestore, useAuth } from '../firebase/provider';
import { useCollection } from '../firebase/firestore/use-collection';
import { collection, updateDoc, deleteDoc, doc, serverTimestamp, writeBatch, setDoc } from 'firebase/firestore';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { ALL_SELLERS_OPTION, SELLER_EMAIL_MAP } from '../lib/constants';
import type { Sale, SalesContextType, SalesFilters, AppUser, UserRole, Seller } from '../lib/types';
import { useRouter } from 'next/navigation';

export const SalesContext = createContext<SalesContextType | undefined>(undefined);

export const SalesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  
  const salesCollection = useMemo(() => firestore ? collection(firestore, 'sales') : null, [firestore]);
  
  const { data: sales, loading: salesLoading } = useCollection<Sale>(salesCollection);

  const [user, setUser] = useState<AppUser | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(ALL_SELLERS_OPTION);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [viewingAsSeller, setViewingAsSeller] = useState<UserRole>(ALL_SELLERS_OPTION);
  const [filters, setFiltersState] = useState<SalesFilters>({ selectedYear: 'all' });
  
  useEffect(() => {
    if (!auth) {
        setLoadingAuth(false);
        return;
    };
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: User | null) => {
      if (firebaseUser) {
        const appUser: AppUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
        };
        setUser(appUser);
        
        const role = SELLER_EMAIL_MAP[firebaseUser.email?.toLowerCase() as keyof typeof SELLER_EMAIL_MAP] || ALL_SELLERS_OPTION;
        setUserRole(role);
        setViewingAsSeller(role);

      } else {
        setUser(null);
        setUserRole(ALL_SELLERS_OPTION);
        setViewingAsSeller(ALL_SELLERS_OPTION);
      }
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, [auth]);
  
  const logout = useCallback(async () => {
    if (!auth) return;
    await signOut(auth);
    router.push('/login');
  }, [auth, router]);

  const addSale = useCallback(async (saleData: Omit<Sale, 'id' | 'createdAt' | 'updatedAt' | 'seller' | 'sellerUid'>): Promise<Sale> => {
    if (!salesCollection || !user || userRole === ALL_SELLERS_OPTION) throw new Error("Usuário não tem permissão para adicionar uma venda.");

    const docRef = doc(salesCollection);
    const newSaleData = {
      ...saleData,
      seller: userRole as Seller,
      sellerUid: user.uid,
    };
    
    const cleanedData = Object.fromEntries(Object.entries(newSaleData).filter(([_, v]) => v !== undefined));
    await setDoc(docRef, { ...cleanedData, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    
    return { 
        ...cleanedData, 
        id: docRef.id, 
        createdAt: new Date().toISOString() 
    } as Sale;
  }, [salesCollection, userRole, user]);

  const addBulkSales = useCallback(async (newSalesData: Omit<Sale, 'id' | 'createdAt' | 'updatedAt' | 'seller' | 'sellerUid'>[]) => {
    if (!firestore || !salesCollection || !user || userRole === ALL_SELLERS_OPTION) throw new Error("Usuário não tem permissão para importar vendas.");
    const batch = writeBatch(firestore);
    newSalesData.forEach(saleData => {
        const docRef = doc(salesCollection);
        const cleanedData = Object.fromEntries(Object.entries(saleData).filter(([_, v]) => v !== undefined));
        batch.set(docRef, { ...cleanedData, seller: userRole, sellerUid: user.uid, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    });
    await batch.commit();
  }, [firestore, salesCollection, user, userRole]);

  const updateSale = useCallback(async (id: string, saleUpdateData: Partial<Omit<Sale, 'id' | 'createdAt' | 'updatedAt'>>) => {
    if (!salesCollection) throw new Error("Firestore não está inicializado.");
    const saleRef = doc(salesCollection, id);
    const cleanedData = Object.fromEntries(Object.entries(saleUpdateData).filter(([_, v]) => v !== undefined));
    await updateDoc(saleRef, { ...cleanedData, updatedAt: serverTimestamp() });
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
        if (viewingAsSeller === ALL_SELLERS_OPTION) return true;
        return sale.seller === viewingAsSeller;
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
  }, [sales, viewingAsSeller, filters]);

  return (
    <SalesContext.Provider
      value={{
        user,
        userRole,
        loadingAuth,
        logout,
        sales: sales || [],
        filteredSales,
        viewingAsSeller,
        setViewingAsSeller,
        addSale,
        addBulkSales,
        updateSale,
        deleteSale,
        getSaleById,
        setFilters,
        filters,
        loading: salesLoading
      }}
    >
      {children}
    </SalesContext.Provider>
  );
};
