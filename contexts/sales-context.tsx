'use client';
import type React from 'react';
import { createContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { collection, serverTimestamp, setDoc, doc, writeBatch, updateDoc, deleteDoc } from 'firebase/firestore';
import { useFirestore, useAuth } from '@/firebase/provider';
import { useCollection } from '@/firebase/firestore/use-collection';
import { ALL_SELLERS_OPTION, SELLER_EMAIL_MAP } from '@/lib/constants';
import type { Sale, SalesContextType, SalesFilters, AppUser, UserRole, Seller } from '@/lib/types';

export const SalesContext = createContext<SalesContextType | undefined>(undefined);

export const SalesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  
  const [user, setUser] = useState<AppUser | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(ALL_SELLERS_OPTION);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [viewingAsSeller, setViewingAsSeller] = useState<UserRole>(ALL_SELLERS_OPTION);
  const [filters, setFiltersState] = useState<SalesFilters>({ selectedYear: 'all' });

  const initialSetupDone = useRef(false);

  const salesCollection = useMemo(() => firestore ? collection(firestore, 'sales') : null, [firestore]);
  const { data: sales, loading: salesLoading } = useCollection<Sale>(salesCollection);
  
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
        
        setUser(prev => {
            if (prev?.uid === appUser.uid) return prev;
            return appUser;
        });
        
        const role = SELLER_EMAIL_MAP[firebaseUser.email?.toLowerCase() as keyof typeof SELLER_EMAIL_MAP] || ALL_SELLERS_OPTION;
        setUserRole(role);
        
        if (!initialSetupDone.current) {
            setViewingAsSeller(role);
            initialSetupDone.current = true;
        }
      } else {
        setUser(null);
        setUserRole(ALL_SELLERS_OPTION);
        setViewingAsSeller(ALL_SELLERS_OPTION);
        initialSetupDone.current = false;
      }
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, [auth]);
  
  const logout = useCallback(async () => {
    if (!auth) return;
    await signOut(auth);
    router.replace('/login');
  }, [auth, router]);

  const addSale = useCallback(async (saleData: Omit<Sale, 'id' | 'createdAt' | 'updatedAt' | 'seller' | 'sellerUid'>): Promise<Sale> => {
    if (!salesCollection || !user || userRole === ALL_SELLERS_OPTION) throw new Error("Sem permissão para adicionar.");
    const docRef = doc(salesCollection);
    const newSaleData = { ...saleData, seller: userRole as Seller, sellerUid: user.uid };
    const cleanedData = Object.fromEntries(Object.entries(newSaleData).filter(([_, v]) => v !== undefined));
    await setDoc(docRef, { ...cleanedData, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    return { ...cleanedData, id: docRef.id, createdAt: new Date().toISOString() } as Sale;
  }, [salesCollection, userRole, user]);

  const addBulkSales = useCallback(async (newSalesData: Omit<Sale, 'id' | 'createdAt' | 'updatedAt' | 'seller' | 'sellerUid'>[]) => {
    if (!firestore || !salesCollection || !user || userRole === ALL_SELLERS_OPTION) throw new Error("Sem permissão.");
    const batch = writeBatch(firestore);
    newSalesData.forEach(saleData => {
        const docRef = doc(salesCollection);
        const cleanedData = Object.fromEntries(Object.entries(saleData).filter(([_, v]) => v !== undefined));
        batch.set(docRef, { ...cleanedData, seller: userRole, sellerUid: user.uid, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    });
    await batch.commit();
  }, [firestore, salesCollection, user, userRole]);

  const updateSale = useCallback(async (id: string, saleUpdateData: Partial<Omit<Sale, 'id' | 'createdAt' | 'updatedAt'>>) => {
    if (!salesCollection) return;
    const saleRef = doc(salesCollection, id);
    const cleanedData = Object.fromEntries(Object.entries(saleUpdateData).filter(([_, v]) => v !== undefined));
    await updateDoc(saleRef, { ...cleanedData, updatedAt: serverTimestamp() });
  }, [salesCollection]);

  const deleteSale = useCallback(async (id: string) => {
    if (!salesCollection) return;
    await deleteDoc(doc(salesCollection, id));
  }, [salesCollection]);

  const getSaleById = useCallback((id: string) => sales?.find(sale => sale.id === id), [sales]);

  const setFilters = useCallback((newFilters: Partial<SalesFilters>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
  }, []);

  const filteredSales = useMemo(() => {
    return (sales || [])
      .filter(sale => viewingAsSeller === ALL_SELLERS_OPTION || sale.seller === viewingAsSeller)
      .filter(sale => {
        if (!filters.searchTerm) return true;
        const term = filters.searchTerm.toLowerCase();
        return sale.project.toLowerCase().includes(term) || (sale.os || '').toLowerCase().includes(term);
      })
      .filter(sale => !filters.selectedYear || filters.selectedYear === 'all' || new Date(sale.date).getFullYear() === filters.selectedYear);
  }, [sales, viewingAsSeller, filters]);

  const contextValue = useMemo(() => ({
    user, userRole, loadingAuth, logout, sales: sales || [], filteredSales, viewingAsSeller, setViewingAsSeller,
    addSale, addBulkSales, updateSale, deleteSale, getSaleById, setFilters, filters, loading: salesLoading
  }), [user, userRole, loadingAuth, logout, sales, filteredSales, viewingAsSeller, addSale, addBulkSales, updateSale, deleteSale, getSaleById, setFilters, filters, salesLoading]);

  return <SalesContext.Provider value={contextValue}>{children}</SalesContext.Provider>;
};
