
'use client';
import type React from 'react';
import { createContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { collection, serverTimestamp, setDoc, doc, writeBatch, updateDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { useFirestore, useAuth, useStorage } from '../firebase/provider';
import { useCollection } from '../firebase/firestore/use-collection';
import { ALL_SELLERS_OPTION, SELLER_EMAIL_MAP, READER_ROLE } from '../lib/constants';
import type { Sale, SalesContextType, SalesFilters, AppUser, UserRole, Seller } from '../lib/types';
import { normalizeArea, normalizeCompany, normalizeSaleStatus } from '../lib/normalizers';

export const SalesContext = createContext<SalesContextType | undefined>(undefined);

export const SalesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const storage = useStorage();
  
  const [user, setUser] = useState<AppUser | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(ALL_SELLERS_OPTION);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [viewingAsSeller, setViewingAsSeller] = useState<UserRole>(ALL_SELLERS_OPTION);
  const [filters, setFiltersState] = useState<SalesFilters>({ selectedYear: 'all' });

  const initialSetupDone = useRef(false);

  const salesCollection = useMemo(() => firestore ? collection(firestore, 'sales') : null, [firestore]);
  const { data: sales, loading: salesLoading } = useCollection<Sale>(salesCollection);

  const [availableSellers, setAvailableSellers] = useState<{name: Seller, uid: string}[]>([]);

  useEffect(() => {
    if (!firestore) return;
    const usersCollection = collection(firestore, 'users');
    // Em um app real, usaríamos onSnapshot. Aqui, vamos simplificar carregando todos os perfis.
    // O SalesProvider receberá os perfis conforme Sergio e Rodrigo forem logando.
    const unsubscribe = onAuthStateChanged(auth!, () => {
        // Recarregar vendedores conhecidos (Sergio e Rodrigo)
        import('firebase/firestore').then(({ getDocs, query, where }) => {
            const q = query(usersCollection, where('role', 'in', ['SERGIO', 'RODRIGO']));
            getDocs(q).then(snapshot => {
                const sellers = snapshot.docs.map(doc => ({
                    name: doc.data().role as Seller,
                    uid: doc.data().uid as string
                }));
                setAvailableSellers(sellers);
            });
        });
    });
    return () => unsubscribe();
  }, [firestore, auth]);
  
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
          emailVerified: firebaseUser.emailVerified,
        };
        
        setUser(prev => {
            if (prev?.uid === appUser.uid) return prev;
            return appUser;
        });
        
        const emailLower = firebaseUser.email?.toLowerCase().trim() || '';
        const role: UserRole = (SELLER_EMAIL_MAP as Record<string, UserRole>)[emailLower] || READER_ROLE;
        setUserRole(role);

        // Salvar/Atualizar perfil do usuário no Firestore para possibilitar atribuição por editores
        if (firestore && firebaseUser.email) {
          const userRef = doc(firestore, 'users', firebaseUser.email.toLowerCase());
          setDoc(userRef, {
            uid: firebaseUser.uid,
            email: firebaseUser.email.toLowerCase(),
            displayName: firebaseUser.displayName,
            role: role,
            updatedAt: serverTimestamp()
          }, { merge: true }).catch(err => console.error("Erro ao salvar perfil:", err));
        }
        
        if (!initialSetupDone.current) {
            setViewingAsSeller(role === READER_ROLE ? ALL_SELLERS_OPTION : role);
            initialSetupDone.current = true;
        }
      } else {
        setUser(null);
        setUserRole(READER_ROLE);
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

  const addSale = useCallback(async (saleData: Omit<Sale, 'id' | 'createdAt' | 'updatedAt' | 'seller' | 'sellerUid'> & { seller?: Seller; sellerUid?: string }): Promise<Sale> => {
    if (!salesCollection || !user) throw new Error("Usuário não autenticado.");
    if (userRole === READER_ROLE) throw new Error("Usuários com perfil de Leitor não possuem permissão para adicionar vendas.");
    
    // Se for vendedor, usa seus próprios dados. Se for equipe, usa os dados passados pelo form.
    const finalSeller = userRole !== ALL_SELLERS_OPTION ? (userRole as Seller) : saleData.seller;
    const finalSellerUid = userRole !== ALL_SELLERS_OPTION ? user.uid : saleData.sellerUid;

    if (!finalSeller || !finalSellerUid) {
      throw new Error("Vendedor não identificado. Selecione um vendedor válido.");
    }

    const docRef = doc(salesCollection);
    const newSaleData = {
      ...saleData,
      company: normalizeCompany(saleData.company),
      area: normalizeArea(saleData.area),
      status: normalizeSaleStatus(saleData.status),
      seller: finalSeller,
      sellerUid: finalSellerUid,
      creatorUid: user.uid, // Guardamos quem preencheu
    };
    
    // Remover campos undefined e os campos extras de override
    const { seller: _, sellerUid: __, ...rest } = newSaleData;
    const finalData = { ...rest, seller: finalSeller, sellerUid: finalSellerUid };
    
    const cleanedData = Object.fromEntries(Object.entries(finalData).filter(([_, v]) => v !== undefined));
    await setDoc(docRef, { ...cleanedData, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    return { ...cleanedData, id: docRef.id, createdAt: new Date().toISOString() } as Sale;
  }, [salesCollection, userRole, user]);

  const addBulkSales = useCallback(async (newSalesData: (Omit<Sale, 'id' | 'createdAt' | 'updatedAt' | 'seller' | 'sellerUid'> & { seller?: Seller; sellerUid?: string })[]) => {
    if (!firestore || !salesCollection || !user) throw new Error("Permissão negada.");
    if (userRole === READER_ROLE) throw new Error("Usuários com perfil de Leitor não possuem permissão para importar vendas.");
    const batch = writeBatch(firestore);
    newSalesData.forEach(saleData => {
        const docRef = doc(salesCollection);
        
        const finalSeller = userRole !== ALL_SELLERS_OPTION ? (userRole as Seller) : saleData.seller;
        const finalSellerUid = userRole !== ALL_SELLERS_OPTION ? user.uid : saleData.sellerUid;

        if (!finalSeller || !finalSellerUid) return; // Pula se não tiver vendedor

        const normalizedSale = {
          ...saleData,
          company: normalizeCompany(saleData.company),
          area: normalizeArea(saleData.area),
          status: normalizeSaleStatus(saleData.status),
          seller: finalSeller,
          sellerUid: finalSellerUid,
          creatorUid: user.uid,
        };
        const cleanedData = Object.fromEntries(Object.entries(normalizedSale).filter(([_, v]) => v !== undefined));
        batch.set(docRef, { ...cleanedData, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    });
    await batch.commit();
  }, [firestore, salesCollection, user, userRole]);

  const updateSale = useCallback(async (id: string, saleUpdateData: Partial<Omit<Sale, 'id' | 'createdAt' | 'updatedAt'>>) => {
    if (!salesCollection) return;
    if (userRole === READER_ROLE) throw new Error("Usuários com perfil de Leitor não possuem permissão para modificar vendas.");
    const saleRef = doc(salesCollection, id);
    const normalizedUpdateData = {
      ...saleUpdateData,
      company: normalizeCompany(saleUpdateData.company),
      area: normalizeArea(saleUpdateData.area),
      status: normalizeSaleStatus(saleUpdateData.status),
    };
    const cleanedData = Object.fromEntries(Object.entries(normalizedUpdateData).filter(([_, v]) => v !== undefined));
    await updateDoc(saleRef, { ...cleanedData, updatedAt: serverTimestamp() });
  }, [salesCollection, userRole]);

  const deleteSale = useCallback(async (id: string) => {
    if (!salesCollection) return;
    if (userRole === READER_ROLE) throw new Error("Usuários com perfil de Leitor não possuem permissão para excluir vendas.");
    await deleteDoc(doc(salesCollection, id));
  }, [salesCollection, userRole]);

  const uploadAttachment = useCallback(async (saleId: string, file: File) => {
    if (!storage || !salesCollection) throw new Error("Storage ou Firestore não inicializado.");
    if (userRole === READER_ROLE) throw new Error("Usuários com perfil de Leitor não possuem permissão para anexar arquivos.");
    const safeName = file.name.replace(/[^\w.\-() ]+/g, '_');
    const filePath = `sales/${saleId}/${Date.now()}-${safeName}`;
    const fileRef = ref(storage, filePath);
    await uploadBytes(fileRef, file);
    const url = await getDownloadURL(fileRef);
    const saleRef = doc(salesCollection, saleId);
    await updateDoc(saleRef, {
      attachmentUrl: url,
      attachmentPath: filePath,
      attachmentName: file.name,
      updatedAt: serverTimestamp(),
    });
  }, [storage, salesCollection, userRole]);

  const deleteAttachment = useCallback(async (sale: Sale) => {
    if (!storage || !salesCollection || !sale.attachmentPath) return;
    if (userRole === READER_ROLE) throw new Error("Usuários com perfil de Leitor não possuem permissão para remover arquivos.");
    const fileRef = ref(storage, sale.attachmentPath);
    await deleteObject(fileRef).catch(() => {});
    const saleRef = doc(salesCollection, sale.id);
    await updateDoc(saleRef, {
      attachmentUrl: null,
      attachmentPath: null,
      attachmentName: null,
      updatedAt: serverTimestamp(),
    });
  }, [storage, salesCollection, userRole]);

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
    addSale, addBulkSales, updateSale, deleteSale, uploadAttachment, deleteAttachment, getSaleById, setFilters, filters, loading: salesLoading,
    availableSellers
  }), [user, userRole, loadingAuth, logout, sales, filteredSales, viewingAsSeller, addSale, addBulkSales, updateSale, deleteSale, uploadAttachment, deleteAttachment, getSaleById, setFilters, filters, salesLoading, availableSellers]);

  return <SalesContext.Provider value={contextValue}>{children}</SalesContext.Provider>;
};
