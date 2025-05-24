// src/contexts/sales-context.tsx
"use client";
import type React from 'react';
import { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import { SELLERS, ALL_SELLERS_OPTION, LOCAL_STORAGE_SALES_KEY } from '@/lib/constants';
import type { Sale, Seller, SalesContextType, SalesFilters, CompanyOption, AreaOption, StatusOption } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

/**
 * DADOS INICIAIS DE EXEMPLO (PARA SEREM SUBSTITUÍDOS PELOS SEUS DADOS REAIS)
 *
 * Se você deseja pré-carregar a aplicação com dados de vendas (por exemplo, do seu Excel):
 * 1. Converta seus dados do Excel para um array de objetos JavaScript, seguindo a estrutura da interface `Sale`.
 * 2. Certifique-se de que cada objeto tenha:
 *    - id: Uma string única (você pode usar `uuidv4()` se estiver gerando programaticamente, ou apenas strings únicas).
 *    - seller: "SERGIO" (para este caso).
 *    - date: "AAAA-MM-DD" (formato de string ISO para a data).
 *    - company: "ENGEAR" ou "CLIMAZONE".
 *    - project: string.
 *    - os: string (pode ser "0000" ou vazia).
 *    - area: Uma das AREA_OPTIONS (ex: "INST. AC").
 *    - clientService: string.
 *    - salesValue: número (ex: 1234.56).
 *    - status: Uma das STATUS_OPTIONS (ex: "FINALIZADO").
 *    - payment: número (ex: 1234.56).
 *    - createdAt: Timestamp numérico (ex: new Date("2023-01-15").getTime()).
 *    - updatedAt: Timestamp numérico opcional.
 * 3. Substitua o array `exampleSalesForSergio` abaixo pelo seu array de dados.
 *
 * NOTA: Estes dados iniciais SÓ SERÃO CARREGADOS SE o localStorage para 'salesAppData' estiver VAZIO.
 * Se você já usou a aplicação e tem dados salvos, precisará limpar o localStorage
 * (Ferramentas de Desenvolvedor do Navegador > Application > Local Storage > clique com o botão direito em salesAppData > Delete)
 * para que estes dados iniciais sejam carregados.
 */
const exampleSalesForSergio: Sale[] = [
  // EXEMPLO 1: Substitua este objeto e adicione os seus
  {
    id: uuidv4(),
    seller: "SERGIO",
    date: "2024-01-15",
    company: "ENGEAR",
    project: "Projeto Exemplo Alpha",
    os: "12345",
    area: "INST. AC",
    clientService: "Cliente Grande Porte",
    salesValue: 5000.00,
    status: "FINALIZADO",
    payment: 5000.00,
    createdAt: new Date("2024-01-15").getTime(),
  },
  // EXEMPLO 2: Substitua este objeto e adicione os seus
  {
    id: uuidv4(),
    seller: "SERGIO",
    date: "2024-02-20",
    company: "CLIMAZONE",
    project: "Projeto Exemplo Beta",
    os: "0000",
    area: "MANUT. AC",
    clientService: "Cliente Médio Porte",
    salesValue: 2500.50,
    status: "EM ANDAMENTO",
    payment: 1000.00,
    createdAt: new Date("2024-02-20").getTime(),
  },
  // Adicione mais objetos de venda para o SERGIO aqui, seguindo o formato.
];


export const SalesContext = createContext<SalesContextType | undefined>(undefined);

export const SalesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [selectedSeller, setSelectedSellerState] = useState<Seller | typeof ALL_SELLERS_OPTION>(ALL_SELLERS_OPTION);
  const [filters, setFiltersState] = useState<SalesFilters>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let initialData: Sale[] = [];
    try {
      const storedSales = localStorage.getItem(LOCAL_STORAGE_SALES_KEY);
      if (storedSales) {
        initialData = JSON.parse(storedSales);
      } else {
        // Se não há nada no localStorage, use os dados iniciais de exemplo (que você substituirá)
        // ATENÇÃO: No seu caso, você preencheria exampleSalesForSergio com os dados do Excel
        initialData = exampleSalesForSergio; 
        // Salva os dados iniciais no localStorage para persistência
        localStorage.setItem(LOCAL_STORAGE_SALES_KEY, JSON.stringify(initialData));
      }
    } catch (error) {
      console.error("Failed to load sales data from localStorage or use initial data", error);
      // Se houver erro, tenta limpar o localStorage e usar os dados de exemplo como fallback
      localStorage.removeItem(LOCAL_STORAGE_SALES_KEY);
      initialData = exampleSalesForSergio;
       // Tenta salvar os dados iniciais no localStorage novamente
      try {
        localStorage.setItem(LOCAL_STORAGE_SALES_KEY, JSON.stringify(initialData));
      } catch (saveError) {
        console.error("Failed to save initial data to localStorage after error", saveError);
      }
    }
    setSales(initialData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!loading) { // Só salva no localStorage se não estiver no carregamento inicial
      localStorage.setItem(LOCAL_STORAGE_SALES_KEY, JSON.stringify(sales));
    }
  }, [sales, loading]);

  const addSale = useCallback((saleData: Omit<Sale, 'id' | 'createdAt' | 'updatedAt'>): Sale => {
    const newSale: Sale = {
      ...saleData,
      id: uuidv4(),
      createdAt: Date.now(),
    };
    setSales(prevSales => [...prevSales, newSale].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    return newSale;
  }, []);

  const updateSale = useCallback((id: string, saleUpdateData: Partial<Omit<Sale, 'id' | 'createdAt' | 'updatedAt'>>): Sale | undefined => {
    let updatedSale: Sale | undefined;
    setSales(prevSales =>
      prevSales.map(sale => {
        if (sale.id === id) {
          const currentSeller = sale.seller;
          updatedSale = {
            ...sale,
            ...saleUpdateData,
            seller: saleUpdateData.seller || currentSeller,
            updatedAt: Date.now()
          };
          return updatedSale;
        }
        return sale;
      }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    );
    return updatedSale;
  }, []);

  const deleteSale = useCallback((id: string) => {
    setSales(prevSales => prevSales.filter(sale => sale.id !== id));
  }, []);

  const getSaleById = useCallback((id: string): Sale | undefined => {
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
        const saleDate = new Date(sale.date);
        saleDate.setHours(0,0,0,0);
        const filterStartDate = new Date(filters.startDate);
        filterStartDate.setHours(0,0,0,0);
        return saleDate >= filterStartDate;
      })
      .filter(sale => {
        if (!filters.endDate) return true;
        const saleDate = new Date(sale.date);
        saleDate.setHours(0,0,0,0);
        const filterEndDate = new Date(filters.endDate);
        filterEndDate.setHours(23, 59, 59, 999);
        return saleDate <= filterEndDate;
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
