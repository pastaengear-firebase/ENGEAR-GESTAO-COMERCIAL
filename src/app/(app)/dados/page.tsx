// src/app/(app)/dados/page.tsx
"use client";
import SalesTable from '@/components/sales/sales-table';
import { useSales } from '@/hooks/use-sales';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Printer, Search, RotateCcw, FileDown, FileUp } from 'lucide-react';
import { useState, useEffect, useMemo, useRef } from 'react';
import type { ChangeEvent } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { Sale, Seller, CompanyOption, AreaOption, StatusOption } from '@/lib/types';
import * as XLSX from 'xlsx';
import { useToast } from '@/hooks/use-toast';
import { SELLERS, COMPANY_OPTIONS, AREA_OPTIONS, STATUS_OPTIONS } from '@/lib/constants';
import { format, parseISO, isValid } from 'date-fns';

export default function DadosPage() {
  const { sales, setFilters, filters: globalFilters, selectedSeller, addBulkSales } = useSales();
  const [searchTerm, setSearchTerm] = useState(globalFilters.searchTerm || '');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

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
    window.print();
  };

  const handleExport = () => {
    const dataToExport = displaySales.map(sale => ({
      'Data': sale.date,
      'Vendedor': sale.seller,
      'Empresa': sale.company,
      'Projeto': sale.project,
      'O.S.': sale.os || '',
      'Área': sale.area,
      'Cliente/Serviço': sale.clientService,
      'Valor da Venda': sale.salesValue,
      'Status': sale.status,
      'Pagamento': sale.payment,
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Vendas");
    XLSX.writeFile(workbook, "Dados_Vendas.xlsx");
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json: any[] = XLSX.utils.sheet_to_json(worksheet);

        if (json.length === 0) {
          toast({ variant: "destructive", title: "Arquivo Vazio", description: "O arquivo Excel selecionado não contém dados." });
          return;
        }

        const expectedHeaders = ['Data', 'Vendedor', 'Empresa', 'Projeto', 'O.S.', 'Área', 'Cliente/Serviço', 'Valor da Venda', 'Status', 'Pagamento'];
        const actualHeaders = Object.keys(json[0]);
        const missingHeaders = expectedHeaders.filter(h => !actualHeaders.includes(h));
        
        if (missingHeaders.length > 0) {
          toast({
            variant: "destructive",
            title: "Cabeçalhos Inválidos",
            description: `O arquivo não corresponde ao modelo. Cabeçalhos faltando: ${missingHeaders.join(', ')}`,
          });
          return;
        }

        const newSales: Omit<Sale, 'id' | 'createdAt' | 'updatedAt'>[] = [];
        const errors: string[] = [];

        json.forEach((row, index) => {
          const lineNumber = index + 2;
          
          const dateValue = row['Data'];
          let jsDate: Date;
          if (dateValue instanceof Date) {
            jsDate = dateValue;
          } else if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
            jsDate = parseISO(dateValue);
          } else {
            errors.push(`Linha ${lineNumber}: Formato de data inválido. Use AAAA-MM-DD.`);
            return;
          }
          if (!isValid(jsDate)) {
             errors.push(`Linha ${lineNumber}: Data inválida: "${row['Data']}".`);
             return;
          }

          const seller = row['Vendedor'];
          const company = row['Empresa'];
          const area = row['Área'];
          const status = row['Status'];
          const project = String(row['Projeto'] ?? '').trim();
          const clientService = String(row['Cliente/Serviço'] ?? '').trim();

          if (!SELLERS.includes(seller)) { errors.push(`Linha ${lineNumber}: Vendedor inválido: "${seller}".`); return; }
          if (!COMPANY_OPTIONS.includes(company)) { errors.push(`Linha ${lineNumber}: Empresa inválida: "${company}".`); return; }
          if (!AREA_OPTIONS.includes(area)) { errors.push(`Linha ${lineNumber}: Área inválida: "${area}".`); return; }
          if (!STATUS_OPTIONS.includes(status)) { errors.push(`Linha ${lineNumber}: Status inválido: "${status}".`); return; }
          if (!project) { errors.push(`Linha ${lineNumber}: Campo 'Projeto' não pode ser vazio.`); return; }
          if (!clientService) { errors.push(`Linha ${lineNumber}: Campo 'Cliente/Serviço' não pode ser vazio.`); return; }
          
          const salesValue = Number(row['Valor da Venda']);
          const payment = Number(row['Pagamento']);

          if (isNaN(salesValue) || salesValue < 0) { errors.push(`Linha ${lineNumber}: 'Valor da Venda' deve ser um número não-negativo.`); return; }
          if (isNaN(payment) || payment < 0) { errors.push(`Linha ${lineNumber}: 'Pagamento' deve ser um número não-negativo.`); return; }
          
          newSales.push({
            date: format(jsDate, 'yyyy-MM-dd'),
            seller: seller as Seller,
            company: company as CompanyOption,
            project: project,
            os: String(row['O.S.'] ?? ''),
            area: area as AreaOption,
            clientService: clientService,
            salesValue: Number(Math.round(+(salesValue || 0) + 'e+2') + 'e-2'),
            status: status as StatusOption,
            payment: Number(Math.round(+(payment || 0) + 'e+2') + 'e-2'),
          });
        });

        if (errors.length > 0) {
          toast({
            variant: "destructive",
            title: `Encontrados ${errors.length} erros. Nenhuma venda importada.`,
            description: `Exemplo (Linha ${errors[0].split(':')[0].replace('Linha ','')}): ${errors[0].split(': ')[1]}. Corrija o arquivo e tente novamente.`,
            duration: 9000,
          });
          return;
        }
        
        if (newSales.length > 0) {
          addBulkSales(newSales);
          toast({ title: "Importação Concluída", description: `${newSales.length} novas vendas foram importadas.` });
        } else {
          toast({ variant: "destructive", title: "Nenhuma Venda Válida", description: "Nenhuma venda para importar foi encontrada no arquivo." });
        }

      } catch (error) {
        toast({ variant: "destructive", title: "Erro ao Ler Arquivo", description: "Não foi possível ler o arquivo. Verifique se é um arquivo Excel (.xlsx, .xls) válido." });
        console.error("Import error:", error);
      } finally {
        if (event.target) {
            event.target.value = '';
        }
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const displaySales = useMemo(() => {
    let filtered = sales;

    if (selectedSeller !== 'EQUIPE COMERCIAL') {
      filtered = filtered.filter(sale => sale.seller === selectedSeller);
    }

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
        <div className="flex items-center gap-2 print-hide">
          <Button onClick={() => fileInputRef.current?.click()} variant="outline" size="sm" className="w-full sm:w-auto">
            <FileUp className="mr-2 h-4 w-4" />
            Importar Dados
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept=".xlsx, .xls"
          />
          <Button onClick={handleExport} variant="outline" size="sm" className="w-full sm:w-auto">
            <FileDown className="mr-2 h-4 w-4" />
            Exportar Excel
          </Button>
          <Button onClick={handlePrint} variant="outline" size="icon" className="print-hide">
            <Printer className="h-4 w-4" />
            <span className="sr-only">Imprimir Tabela</span>
          </Button>
        </div>
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
