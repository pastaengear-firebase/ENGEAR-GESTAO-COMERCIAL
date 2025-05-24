// src/app/(app)/dados/page.tsx
"use client";
import SalesTable from '@/components/sales/sales-table';
import { useSales } from '@/hooks/use-sales';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Printer, Search, RotateCcw } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import type { ChangeEvent } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { Sale } from '@/lib/types';

export default function DadosPage() {
  const { sales, setFilters, filters: globalFilters, selectedSeller } = useSales(); // Usar 'sales' em vez de 'filteredSales'
  const [searchTerm, setSearchTerm] = useState(globalFilters.searchTerm || '');

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setFilters({ searchTerm }); // Atualiza o filtro global de searchTerm
    }, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm, setFilters]);

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setFilters({ searchTerm: '' }); // Limpa o filtro global de searchTerm
  };
  
  const handlePrint = () => {
    window.print();
  };

  // Filtragem local para a página Dados, ignorando filtros de data globais
  const displaySales = useMemo(() => {
    let filtered = sales;

    // Filtro por vendedor selecionado globalmente
    if (selectedSeller !== 'EQUIPE COMERCIAL') {
      filtered = filtered.filter(sale => sale.seller === selectedSeller);
    }

    // Filtro por termo de busca local
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(sale =>
        sale.company.toLowerCase().includes(lowerSearchTerm) ||
        sale.project.toLowerCase().includes(lowerSearchTerm) ||
        sale.os.toLowerCase().includes(lowerSearchTerm) ||
        sale.clientService.toLowerCase().includes(lowerSearchTerm)
      );
    }
    return filtered;
  }, [sales, selectedSeller, searchTerm]);

  const totalSalesValue = displaySales.reduce((sum, sale) => sum + sale.salesValue, 0);
  const totalPayments = displaySales.reduce((sum, sale) => sum + sale.payment, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dados de Vendas</h1>
          <p className="text-muted-foreground">Visualize, filtre e gerencie os registros de vendas.</p>
        </div>
        <Button onClick={handlePrint} variant="outline" size="icon" className="print-hide">
          <Printer className="h-4 w-4" />
          <span className="sr-only">Imprimir Tabela</span>
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative flex-grow w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por empresa, projeto, O.S..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-10 w-full"
              />
            </div>
            <Button variant="outline" onClick={handleClearSearch} className="w-full sm:w-auto print-hide">
              <RotateCcw className="mr-2 h-4 w-4" />
              Limpar Busca
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <SalesTable salesData={displaySales} />
        </CardContent>
        <CardFooter className="border-t p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-sm text-muted-foreground">
           <p className="flex-1">Total de Registros: <span className="font-semibold text-foreground">{displaySales.length}</span></p>
           <p className="flex-1">Valor Total em Vendas: <span className="font-semibold text-foreground">{totalSalesValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></p>
           <p className="flex-1">Total Recebido: <span className="font-semibold text-foreground">{totalPayments.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></p>
        </CardFooter>
      </Card>
    </div>
  );
}
