"use client";
import type { ChangeEvent } from 'react';
import { useState, useMemo, useRef } from 'react';
import { useSales } from '@/hooks/use-sales';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO, isValid } from 'date-fns';

import SalesForm from '@/components/sales/sales-form';
import SalesTable from '@/components/sales/sales-table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, RotateCcw, FileUp, FileDown, Wrench, Printer } from 'lucide-react';

import type { Sale, CompanyOption, AreaOption, StatusOption } from '@/lib/types';
import { COMPANY_OPTIONS, AREA_OPTIONS, STATUS_OPTIONS, ALL_SELLERS_OPTION } from '@/lib/constants';

export default function GerenciarVendasPage() {
  const { sales, viewingAsSeller, userRole, addBulkSales, deleteSale } = useSales();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [saleToDelete, setSaleToDelete] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const displaySales = useMemo(() => {
    let filtered = sales;
    if (viewingAsSeller !== 'EQUIPE COMERCIAL') {
        filtered = filtered.filter(sale => sale.seller === viewingAsSeller);
    }
    if (searchTerm) {
        const lowerSearchTerm = searchTerm.toLowerCase();
        filtered = filtered.filter(sale =>
            sale.project.toLowerCase().includes(lowerSearchTerm) ||
            (sale.os && sale.os.toLowerCase().includes(lowerSearchTerm)) ||
            sale.clientService.toLowerCase().includes(lowerSearchTerm) ||
            sale.company.toLowerCase().includes(lowerSearchTerm)
        );
    }
    return filtered;
  }, [sales, viewingAsSeller, searchTerm]);

  const totalSalesValue = displaySales.reduce((sum, sale) => sum + sale.salesValue, 0);
  const totalPayments = displaySales.reduce((sum, sale) => sum + sale.payment, 0);
  const isUserReadOnly = userRole === ALL_SELLERS_OPTION;
  
  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
  };
  
  const handleEditClick = (sale: Sale) => {
    if (userRole !== sale.seller) {
        toast({
            title: "Ação Não Permitida",
            description: `Apenas o vendedor ${sale.seller} pode modificar esta venda.`,
            variant: "destructive",
        });
        return;
    }
    setEditingSale(sale);
    setShowEditModal(true);
  };
  
  const confirmDelete = (id: string) => {
    const sale = sales.find(s => s.id === id);
     if (!sale || userRole !== sale.seller) {
        toast({
            title: "Ação Não Permitida",
            description: `Apenas o vendedor que criou a venda pode excluí-la.`,
            variant: "destructive",
        });
        return;
    }
    setSaleToDelete(id);
    setShowDeleteDialog(true);
  };

  const handleDelete = async () => {
    if (saleToDelete) {
      try {
        await deleteSale(saleToDelete);
        toast({ title: "Sucesso!", description: "Venda excluída com sucesso." });
        if (editingSale?.id === saleToDelete) {
            setShowEditModal(false);
            setEditingSale(null);
        }
        setSaleToDelete(null);
      } catch (err: any) {
        toast({ title: "Erro ao excluir", description: err.message, variant: 'destructive'});
      }
    }
    setShowDeleteDialog(false);
  };
  
  const handleFormSubmitted = () => {
    setShowEditModal(false);
    setEditingSale(null);
  };

  
  // Helpers CSV (Excel PT-BR usa ';')
  const escapeCsv = (value: any) => {
    const v = String(value ?? '');
    return /[",\n\r;]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
  };

  const rowsToCsv = (rows: Record<string, any>[]) => {
    if (!rows || rows.length === 0) return '';
    const headers = Object.keys(rows[0]);
    const lines = [
      headers.join(';'),
      ...rows.map(r => headers.map(h => escapeCsv(r[h])).join(';')),
    ];
    return lines.join('\n');
  };

  const csvToRows = (csvText: string) => {
    const text = (csvText || '').replace(/^\uFEFF/, '');
    const rows: string[][] = [];
    let row: string[] = [];
    let field = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      const next = text[i + 1];

      if (inQuotes) {
        if (c === '"' && next === '"') { field += '"'; i++; continue; }
        if (c === '"') { inQuotes = false; continue; }
        field += c;
        continue;
      }

      if (c === '"') { inQuotes = true; continue; }
      if (c === ';') { row.push(field.trim()); field = ''; continue; }
      if (c === '\r') { continue; }
      if (c === '\n') { row.push(field.trim()); rows.push(row); row = []; field = ''; continue; }
      field += c;
    }
    row.push(field.trim());
    rows.push(row);

    const cleaned = rows.filter(r => r.some(v => String(v ?? '').trim() !== ''));
    if (cleaned.length === 0) return [];

    const headers = cleaned[0].map(h => String(h ?? '').trim());
    return cleaned.slice(1).map(r => {
      const obj: Record<string, any> = {};
      headers.forEach((h, idx) => { obj[h] = r[idx] ?? ''; });
      return obj;
    });
  };

  const downloadTextFile = (content: string, filename: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleExport = async () => {

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
    const csv = rowsToCsv(dataToExport);
    downloadTextFile(csv, "Dados_Vendas.csv", "text/csv;charset=utf-8;");  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = String(e.target?.result ?? '');
        const json: any[] = csvToRows(text);

        if (json.length === 0) {
          toast({ variant: "destructive", title: "Arquivo Vazio", description: "O arquivo CSV selecionado não contém dados." });
          return;
        }

        const expectedHeaders = ['Data', 'Empresa', 'Projeto', 'O.S.', 'Área', 'Cliente/Serviço', 'Valor da Venda', 'Status', 'Pagamento'];
        const actualHeaders = Object.keys(json[0]);
        const missingHeaders = expectedHeaders.filter(h => !actualHeaders.includes(h));
        
        if (missingHeaders.length > 0) {
          toast({
            variant: "destructive",
            title: "Cabeçalhos Inválidos",
            description: `O arquivo não corresponde ao modelo. Cabeçalhos faltando: ${missingHeaders.join(', ')}.`,
          });
          return;
        }

        const newSales: Omit<Sale, 'id' | 'createdAt' | 'updatedAt' | 'seller' | 'sellerUid'>[] = [];
        const errors: string[] = [];

        json.forEach((row, index) => {
          const lineNumber = index + 2;
          const dateValue = row['Data'];
          let jsDate: Date;
          if (dateValue instanceof Date) { jsDate = dateValue; }
          else if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) { jsDate = parseISO(dateValue); }
          else { errors.push(`Linha ${lineNumber}: Formato de data inválido. Use AAAA-MM-DD.`); return; }
          if (!isValid(jsDate)) { errors.push(`Linha ${lineNumber}: Data inválida: "${row['Data']}".`); return; }

          const company = row['Empresa'];
          const area = row['Área'];
          const status = row['Status'];
          const project = String(row['Projeto'] ?? '').trim();
          const clientService = String(row['Cliente/Serviço'] ?? '').trim();

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
          toast({ variant: "destructive", title: `Erro na importação.`, description: errors[0], duration: 9000 });
          return;
        }
        
        if (newSales.length > 0) {
          await addBulkSales(newSales as any);
          toast({ title: "Importação Concluída", description: `${newSales.length} novas vendas foram importadas.` });
        }
      } catch (error) {
        toast({ variant: "destructive", title: "Erro ao Ler Arquivo", description: "Falha na leitura do Excel." });
      } finally {
        if (event.target) { event.target.value = ''; }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
            <div>
              <CardTitle className="text-2xl flex items-center">
                <Wrench className="mr-3 h-6 w-6" />
                Gerenciar Vendas
              </CardTitle>
              <CardDescription>Visualize, filtre e gerencie os registros de vendas.</CardDescription>
            </div>
            <div className="flex items-center gap-2 print-hide w-full sm:w-auto">
              <Button onClick={() => fileInputRef.current?.click()} variant="outline" size="sm" disabled={isUserReadOnly}>
                <FileUp className="mr-2 h-4 w-4" /> Importar
              </Button>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".csv" disabled={isUserReadOnly} />
              <Button onClick={handleExport} variant="outline" size="sm"> <FileDown className="mr-2 h-4 w-4" /> Exportar </Button>
              <Button onClick={() => window.print()} variant="outline" size="icon" className="print-hide"> <Printer className="h-4 w-4" /> </Button>
            </div>
          </div>
           <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
            <div className="relative flex-grow w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input type="search" placeholder="Buscar por projeto, empresa, O.S..." value={searchTerm} onChange={handleSearchChange} className="pl-10 w-full" />
            </div>
            <Button variant="outline" onClick={handleClearSearch} className="w-full sm:w-auto print-hide"> <RotateCcw className="mr-2 h-4 w-4" /> Limpar </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <SalesTable salesData={displaySales} onEdit={handleEditClick} onDelete={confirmDelete} />
        </CardContent>
        <CardFooter className="border-t p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-sm text-muted-foreground">
           <p className="flex-1">Total de Registros: <span className="font-semibold text-foreground">{displaySales.length}</span></p>
           <p className="flex-1">Valor Total: <span className="font-semibold text-foreground">{totalSalesValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></p>
        </CardFooter>
      </Card>
      
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-[600px] md:max-w-[750px] lg:max-w-[900px] max-h-[90vh]">
           <ScrollArea className="max-h-[85vh] p-1">
            <DialogHeader className="px-4 pt-4">
              <DialogTitle className="text-2xl">Modificar Venda</DialogTitle>
              <DialogDescription>Alterando venda: {editingSale?.project}</DialogDescription>
            </DialogHeader>
            <div className="p-4">
              <SalesForm saleToEdit={editingSale} onFormSubmit={handleFormSubmitted} showReadOnlyAlert={true} />
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza que deseja excluir esta venda? Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSaleToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
