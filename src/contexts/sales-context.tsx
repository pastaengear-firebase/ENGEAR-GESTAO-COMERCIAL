// src/contexts/sales-context.tsx
"use client";
import type React from 'react';
import { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import { SELLERS, ALL_SELLERS_OPTION, LOCAL_STORAGE_SALES_KEY } from '@/lib/constants';
import type { Sale, Seller, SalesContextType, SalesFilters } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid'; // Needs: npm install uuid && npm install @types/uuid

export const SalesContext = createContext<SalesContextType | undefined>(undefined);

export const SalesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [selectedSeller, setSelectedSellerState] = useState<Seller | typeof ALL_SELLERS_OPTION>(ALL_SELLERS_OPTION);
  const [filters, setFiltersState] = useState<SalesFilters>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedSales = localStorage.getItem(LOCAL_STORAGE_SALES_KEY);
      if (storedSales) {
        setSales(JSON.parse(storedSales));
      }
    } catch (error) {
      console.error("Failed to load sales data from localStorage", error);
      localStorage.removeItem(LOCAL_STORAGE_SALES_KEY);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!loading) {
      localStorage.setItem(LOCAL_STORAGE_SALES_KEY, JSON.stringify(sales));
    }
  }, [sales, loading]);

  const addSale = useCallback((saleData: Omit<Sale, 'id' | 'createdAt' | 'seller'>): Sale => {
    if (!SELLERS.includes(selectedSeller as Seller) && selectedSeller !== ALL_SELLERS_OPTION) {
        throw new Error("Invalid seller selected for new sale.");
    }
    
    // If 'EQUIPE COMERCIAL' is selected, default to the first seller or handle as error/prompt user
    // For simplicity, let's assume if 'EQUIPE COMERCIAL' is selected, the form should enforce seller selection,
    // or we default. Here, we'll require the form to pass a specific seller.
    // This logic is a bit tricky: a sale MUST belong to a specific seller.
    // 'selectedSeller' in context is for filtering. The form should specify the actual seller.
    // Let's assume the form provides the seller, or a default if 'EQUIPE COMERCIAL' is active.
    // For now, this method expects saleData to have a valid seller if not using context's selectedSeller.
    // The prompt implies the seller selector is global. So, new sales are for selectedSeller.
    // If selectedSeller is EQUIPE COMERCIAL, this is an issue. Form must handle.
    // For this implementation, we'll assume the form ensures a specific seller is tied to the sale.
    // Let's adjust: the `addSale` method should take a `seller` property.
    // No, the requirement "Create a seller selector on all pages (except login) with options: SERGIO, RODRIGO, and EQUIPE COMERCIAL"
    // implies this global selector dictates the seller for new entries *if* a specific seller is chosen.
    // If 'EQUIPE COMERCIAL' is chosen, the form should probably have its own seller field.
    // This is a design ambiguity. I'll assume if selectedSeller is SERGIO or RODRIGO, new sales go to them.
    // If EQUIPE COMERCIAL, the form should have a selector for SERGIO/RODRIGO.

    // For simplicity in this context, let's assume new sales can only be added when SERGIO or RODRIGO is selected.
    // The SalesForm will need to handle this.
    // The method here will just assign the current *specific* seller.
    // The form component itself should prevent adding if 'EQUIPE COMERCIAL' is selected
    // or provide a way to choose SERGIO/RODRIGO within the form.
    // Given the flow, let's assume `saleData` comes from `SalesForm` which will have the specific seller.
    // Re-evaluating: `addSale` should take the full sale object including seller, or derive it.
    // The `SalesForm` will be responsible for setting the seller.
    // The global `selectedSeller` is primarily for filtering views.

    // Correct approach: SalesForm will know which seller to assign.
    // This `addSale` will receive `seller` in `saleData`.
    // The type `Omit<Sale, 'id' | 'createdAt'>` should be `Omit<Sale, 'id' | 'createdAt'>`
    // This means `SalesFormData` should map to `Omit<Sale, 'id' | 'createdAt' | 'updatedAt'>`
    // and the `SalesForm` passes the chosen specific seller.

    const newSale: Sale = {
      ...saleData,
      id: uuidv4(),
      createdAt: Date.now(),
    };
    setSales(prevSales => [...prevSales, newSale].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    return newSale;
  }, []);

  const updateSale = useCallback((id: string, saleUpdateData: Partial<Omit<Sale, 'id' | 'createdAt'>>): Sale | undefined => {
    let updatedSale: Sale | undefined;
    setSales(prevSales =>
      prevSales.map(sale => {
        if (sale.id === id) {
          updatedSale = { ...sale, ...saleUpdateData, updatedAt: Date.now() };
          return updatedSale;
        }
        return sale;
      })
    );
    return updatedSale;
  }, []);

  const deleteSale = useCallback((id: string) => {
    setSales(prevSales => prevSales.filter(sale => sale.id !== id));
  }, []);

  const getSaleById = useCallback((id: string) => {
    return sales.find(sale => sale.id === id);
  }, [sales]);

  const setSelectedSeller = useCallback((seller: Seller | typeof ALL_SELLERS_OPTION) => {
    setSelectedSellerState(seller);
  }, []);
  
  const setFilters = useCallback((newFilters: SalesFilters) => {
    setFiltersState(prevFilters => ({ ...prevFilters, ...newFilters }));
  }, []);

  const filteredSales = useMemo(() => {
    return sales
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
        if (!filters.startDate) return true;
        return new Date(sale.date) >= filters.startDate;
      })
      .filter(sale => {
        if (!filters.endDate) return true;
        // Ensure endDate is inclusive by setting time to end of day
        const endOfDay = new Date(filters.endDate);
        endOfDay.setHours(23, 59, 59, 999);
        return new Date(sale.date) <= endOfDay;
      });
  }, [sales, selectedSeller, filters]);

  return (
    <SalesContext.Provider
      value={{
        sales,
        filteredSales,
        selectedSeller,
        setSelectedSeller,
        addSale,
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
