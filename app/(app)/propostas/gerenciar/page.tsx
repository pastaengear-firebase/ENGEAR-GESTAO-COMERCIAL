// src/app/(app)/propostas/gerenciar/page.tsx
"use client";
import type { ChangeEvent } from 'react';
import { useState, useRef } from 'react';
import { useQuotes } from '@/hooks/use-quotes';
import { useSales } from '@/hooks/use-sales'; 
import QuoteForm from '@/components/quotes/quote-form';
import QuotesTable from '@/components/quotes/quotes-table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; 
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, RotateCcw, Info, Printer, FileUp, FileDown } from 'lucide-react'; 
import { useToast } from '@/hooks/use-toast';
import type { Quote, Seller, CompanyOption, AreaOption, ProposalStatusOption, ContactSourceOption } from '@/lib/types';
import { SELLERS, COMPANY_OPTIONS, AREA_OPTIONS, PROPOSAL_STATUS_OPTIONS, CONTACT_SOURCE_OPTIONS, ALL_SELLERS_OPTION } from '@/lib/constants';
import { format, parseISO, isValid } from 'date-fns';

export default function GerenciarPropostasPage() {
  const { 
    managementFilteredQuotes, 
    setManagementSearchTerm, 
    managementSearchTerm,
    deleteQuote,
    addBulkQuotes, 
    loadingQuotes 
  } = useQuotes();
  const { userRole } = useSales();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [quoteToDelete, setQuoteToDelete] = useState<string | null>(null);

  const isUserReadOnly = userRole === ALL_SELLERS_OPTION;

  const handleEditClick = (quote: Quote) => {
    if (userRole !== quote.seller) {
       toast({
        title: "Ação Não Permitida",
        description: `Apenas o vendedor ${quote.seller} pode modificar esta proposta.`,
        variant: "destructive",
      });
      return;
    }
    setEditingQuote(quote);
    setShowEditModal(true);
  };

  const confirmDelete = (id: string) => {
    const quote = managementFilteredQuotes.find(q => q.id === id);
    if (!quote || userRole !== quote.seller) {
       toast({
        title: "Ação Não Permitida",
        description: "Apenas o criador da proposta pode excluí-la.",
        variant: "destructive",
      });
      return;
    }
    setQuoteToDelete(id);
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (quoteToDelete) {
      try {
        await deleteQuote(quoteToDelete);
        toast({ title: "Sucesso!", description: "Proposta excluída com sucesso." });
        if (editingQuote?.id === quoteToDelete) {
          setShowEditModal(false);
          setEditingQuote(null);
        }
        setQuoteToDelete(null);
      } catch (err: any) {
        toast({ title: "Erro ao excluir", description: err.message, variant: 'destructive'});
      }
    }
    setDialogOpen(false);
  };
  
  const handleClearSearch = () => {
    setManagementSearchTerm('');
  };

  const handleFormSubmitted = () => {
    setShowEditModal(false);
    setEditingQuote(null);
  }
  
  const handlePrint = () => {
    window.print();
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
    ...rows.map(r => headers.map(h => escapeCsv((r as any)[h])).join(';')),
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
    if (c === '\r') continue;
    if (c === '\n') { row.push(field.trim()); rows.push(row); row = []; field = ''; continue; }
    field += c;
  }
  row.push(field.trim());
  rows.push(row);

  const cleaned = rows.filter(r => r.some(v => (v ?? '').trim() !== ''));
  if (cleaned.length === 0) return [];

  const headers = cleaned[0].map(h => (h ?? '').trim());
  return cleaned.slice(1).map(r => {
    const obj: Record<string, string> = {};
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
    const dataToExport = managementFilteredQuotes.map(q => ({
      'Cliente': q.clientName || '',
      'Vendedor': q.seller,
      'Data Proposta': q.proposalDate,
      'Data Validade': q.validityDate || '',
      'Empresa': q.company || '',
      'Área': q.area || '',
      'Fonte Contato': q.contactSource || '',
      'Descrição': q.description || '',
      'Valor Proposto': q.proposedValue || 0,
      'Status': q.status,
      'Notas': q.notes || '',
      'Data Follow-up': q.followUpDate || '',
      'Follow-up Realizado?': q.followUpDone ? 'Sim' : 'Não',
    }));
    
    const csv = rowsToCsv(dataToExport);
    downloadTextFile(csv, "Dados_Propostas.csv", "text/csv;charset=utf-8;");
  };

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

        const requiredHeaders = ['Cliente', 'Data Proposta', 'Empresa', 'Área', 'Fonte Contato', 'Descrição', 'Valor Proposto', 'Status'];
        const actualHeaders = Object.keys(json[0]);
        const missingHeaders = requiredHeaders.filter(h => !actualHeaders.includes(h));
        
        if (missingHeaders.length > 0) {
          toast({
            variant: "destructive",
            title: "Cabeçalhos Inválidos",
            description: `O arquivo não corresponde ao modelo. Cabeçalhos faltando: ${missingHeaders.join(', ')}. O campo 'Vendedor' será preenchido automaticamente.`,
          });
          return;
        }

        const newQuotes: Omit<Quote, 'id' | 'createdAt' | 'updatedAt' | 'sellerUid' | 'seller'>[] = [];
        const errors: string[] = [];

        json.forEach((row, index) => {
          const lineNumber = index + 2;

          const parseDate = (dateValue: any): Date | null => {
              if (!dateValue) return null;
              let jsDate: Date;
              if (dateValue instanceof Date) {
                  jsDate = dateValue;
              } else if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
                  jsDate = parseISO(dateValue);
              } else {
                  return null;
              }
              return isValid(jsDate) ? jsDate : null;
          };

          const proposalDate = parseDate(row['Data Proposta']);
          if (!proposalDate) {
              errors.push(`Linha ${lineNumber}: Data Proposta inválida ou ausente. Use o formato AAAA-MM-DD.`);
              return;
          }

          const company = row['Empresa'];
          const area = row['Área'];
          const status = row['Status'];
          const contactSource = row['Fonte Contato'];
          const clientName = String(row['Cliente'] ?? '').trim();
          const description = String(row['Descrição'] ?? '').trim();

          if (!COMPANY_OPTIONS.includes(company)) { errors.push(`Linha ${lineNumber}: Empresa inválida: "${company}".`); return; }
          if (!AREA_OPTIONS.includes(area)) { errors.push(`Linha ${lineNumber}: Área inválida: "${area}".`); return; }
          if (!PROPOSAL_STATUS_OPTIONS.includes(status)) { errors.push(`Linha ${lineNumber}: Status inválido: "${status}".`); return; }
          if (!CONTACT_SOURCE_OPTIONS.includes(contactSource)) { errors.push(`Linha ${lineNumber}: Fonte Contato inválida: "${contactSource}".`); return; }
          if (!clientName) { errors.push(`Linha ${lineNumber}: Campo 'Cliente' não pode ser vazio.`); return; }
          if (!description) { errors.push(`Linha ${lineNumber}: Campo 'Descrição' não pode ser vazio.`); return; }
          
          const proposedValue = Number(row['Valor Proposto']);
          if (isNaN(proposedValue) || proposedValue <= 0) { errors.push(`Linha ${lineNumber}: 'Valor Proposto' deve ser um número positivo.`); return; }

          const validityDate = parseDate(row['Data Validade']);
          const followUpDate = parseDate(row['Data Follow-up']);
          const followUpDone = String(row['Follow-up Realizado?'] || '').toLowerCase() === 'sim';
          
          newQuotes.push({
            clientName,
            proposalDate: format(proposalDate, 'yyyy-MM-dd'),
            validityDate: validityDate ? format(validityDate, 'yyyy-MM-dd') : undefined,
            company: company as CompanyOption,
            area: area as AreaOption,
            contactSource: contactSource as ContactSourceOption,
            description,
            proposedValue: Number(Math.round(+(proposedValue || 0) + 'e+2') + 'e-2'),
            status: status as ProposalStatusOption,
            notes: String(row['Notas'] ?? ''),
            followUpDate: followUpDate ? format(followUpDate, 'yyyy-MM-dd') : undefined,
            followUpDone,
          });
        });

        if (errors.length > 0) {
          toast({
            variant: "destructive",
            title: `Encontrados ${errors.length} erros. Nenhuma proposta importada.`,
            description: `Exemplo (Linha ${errors[0].split(':')[0].replace('Linha ','')}): ${errors[0].split(': ')[1]}. Corrija o arquivo e tente novamente.`,
            duration: 9000,
          });
          return;
        }
        
        if (newQuotes.length > 0) {
          await addBulkQuotes(newQuotes as any);
          toast({ title: "Importação Concluída", description: `${newQuotes.length} novas propostas foram importadas.` });
        } else {
          toast({ variant: "destructive", title: "Nenhuma Proposta Válida", description: "Nenhuma proposta para importar foi encontrada no arquivo." });
        }

      } catch (error) {
        toast({ variant: "destructive", title: "Erro ao Ler Arquivo", description: "Não foi possível ler o arquivo. Verifique se é um arquivo CSV (.csv) válido." });
        console.error("Import error:", error);
      } finally {
        if (event.target) {
            event.target.value = '';
        }
      }
    };
    reader.readAsText(file);
  };


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Gerenciar Propostas Comerciais
          </h1>
          <p className="text-muted-foreground">
            Visualize, busque, edite ou exclua propostas existentes.
          </p>
        </div>
      </div>

      {isUserReadOnly && (
         <Alert variant="default" className="bg-amber-50 border-amber-300 text-amber-700">
          <Info className="h-4 w-4 !text-amber-600" />
          <AlertTitle>Funcionalidade Limitada</AlertTitle>
          <AlertDescription>
            Seu perfil é de leitura. Para modificar ou excluir propostas, por favor, faça login com uma conta de vendedor autorizada.
          </AlertDescription>
        </Alert>
      )}

      <Card className="shadow-lg" id="propostas-printable-area">
        <CardHeader className="print-hide">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Buscar Propostas</CardTitle>
              <CardDescription>Digite o nome do cliente, descrição, área ou valor para filtrar.</CardDescription>
            </div>
             <Button onClick={handlePrint} variant="outline" size="icon" className="print-hide">
                <Printer className="h-4 w-4" />
                <span className="sr-only">Imprimir Tabela</span>
            </Button>
          </div>
          <div className="flex flex-col sm:flex-row flex-wrap gap-2 pt-2">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar propostas..."
                value={managementSearchTerm}
                onChange={(e) => setManagementSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
             <Button variant="outline" onClick={handleClearSearch} className="w-full sm:w-auto">
              <RotateCcw className="mr-2 h-4 w-4" /> Limpar Busca
            </Button>
             <Button onClick={() => fileInputRef.current?.click()} variant="outline" size="sm" className="w-full sm:w-auto" disabled={isUserReadOnly}>
              <FileUp className="mr-2 h-4 w-4" />
              Importar Dados
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept=".csv"
              disabled={isUserReadOnly}
            />
            <Button onClick={handleExport} variant="outline" size="sm" className="w-full sm:w-auto">
              <FileDown className="mr-2 h-4 w-4" />
              Exportar Excel
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loadingQuotes && <p className="p-4 text-center">Carregando propostas...</p>}
          {!loadingQuotes && (
            <QuotesTable 
              quotesData={managementFilteredQuotes}
              onEdit={handleEditClick} 
              onDelete={confirmDelete}
            />
          )}
        </CardContent>
         <CardFooter className="border-t p-4 text-sm text-muted-foreground print-hide">
            Total de Propostas Encontradas: <span className="font-semibold text-foreground">{managementFilteredQuotes.length}</span>
        </CardFooter>
      </Card>

      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-[600px] md:max-w-[750px] lg:max-w-[900px] max-h-[90vh]">
           <ScrollArea className="max-h-[85vh] p-1">
            <DialogHeader className="px-4 pt-4">
              <DialogTitle className="text-2xl">
                {editingQuote ? 'Modificar Proposta' : 'Nova Proposta'}
              </DialogTitle>
              <DialogDescription>
                {editingQuote ? `Alterando proposta para: ${editingQuote.clientName}` : 'Preencha os dados da nova proposta.'}
              </DialogDescription>
            </DialogHeader>
            <div className="p-4">
              <QuoteForm 
                key={editingQuote?.id || 'new-quote'}  {/* FORÇAR REMOUNT AQUI! */}
                quoteToEdit={editingQuote} 
                onFormSubmit={handleFormSubmitted}
                showReadOnlyAlert={true} 
              />
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta proposta? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setQuoteToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
       <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #propostas-printable-area, #propostas-printable-area * {
            visibility: visible;
          }
          #propostas-printable-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            font-size: 8pt;
          }
          .print-hide {
            display: none !important;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
          }
          th, td {
            border: 1px solid #ccc !important;
            padding: 4px !important;
            white-space: normal !important;
            word-break: break-word;
          }
          .max-w-\\[200px\\] { max-width: 100px !important; }
          @page {
            size: A4 landscape;
            margin: 10mm;
          }
        }
      `}</style>
    </div>
  );
}