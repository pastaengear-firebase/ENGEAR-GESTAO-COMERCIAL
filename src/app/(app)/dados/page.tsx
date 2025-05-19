// src/app/(app)/dados/page.tsx
"use client";
import SalesTable from '@/components/sales/sales-table';
import { useSales } from '@/hooks/use-sales';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Printer, Search, RotateCcw } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { ChangeEvent } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function DadosPage() {
  const { filteredSales, setFilters, filters } = useSales();
  const [searchTerm, setSearchTerm] = useState(filters.searchTerm || '');

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setFilters({ searchTerm });
    }, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm, setFilters]);

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setFilters({ searchTerm: '' });
  };
  
  const handlePrint = () => {
    // Specific print styles will be in SalesTable component
    window.print();
  };

  const totalSalesValue = filteredSales.reduce((sum, sale) => sum + sale.salesValue, 0);
  const totalPayments = filteredSales
    .filter(sale => sale.status === 'Ganha') // Assuming only 'Ganha' sales contribute to payments here
    .reduce((sum, sale) => sum + sale.salesValue, 0);


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
        <CardContent className="p-0"> {/* Remove padding to allow table to span full width */}
          <SalesTable salesData={filteredSales} />
        </CardContent>
        <CardFooter className="border-t p-4 flex flex-col sm:flex-row justify-between items-center gap-2 text-sm text-muted-foreground">
           <p>Total de Registros: <span className="font-semibold text-foreground">{filteredSales.length}</span></p>
           <div className="flex gap-4">
             <p>Valor Total em Vendas: <span className="font-semibold text-foreground">R$ {totalSalesValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></p>
             <p>Total Recebido (Ganha): <span className="font-semibold text-foreground">R$ {totalPayments.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></p>
           </div>
        </CardFooter>
      </Card>
    </div>
  );
}
