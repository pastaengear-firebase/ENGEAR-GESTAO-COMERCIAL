// src/components/quotes/quotes-table.tsx
"use client";
import type { ChangeEvent } from 'react';
import { useState, useRef } from 'react';
import type { Quote } from '@/lib/types';
import { useQuotes } from '@/hooks/use-quotes';
import { useSales } from '@/hooks/use-sales';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit3, Trash2, Eye, BellRing, CheckCircle, FileUp, Loader2, Link as     
LinkIcon, Paperclip, UploadCloud } from 'lucide-react';
import { format, parseISO, isPast, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

interface QuotesTableProps {
  quotesData: Quote[];
  onEdit: (quote: Quote) => void;
  onDelete: (quoteId: string) => void;
  disabledActions?: boolean;
}

export default function QuotesTable({ quotesData, onEdit, onDelete, disabledActions:
globalDisabled }: QuotesTableProps) {
  const { toggleFollowUpDone, uploadAttachment, deleteAttachment } = useQuotes();
  const { userRole } = useSales();
  const router = useRouter();
  const { toast } = useToast();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedQuoteForUpload, setSelectedQuoteForUpload] = useState<Quote | null>(null);      
  const [isUploading, setIsUploading] = useState<string | null>(null);

  const getStatusBadgeVariant = (status: Quote['status']): React.ComponentProps<typeof
Badge>['variant'] => {
    switch (status) {
      case 'Aceita':
        return 'default';
      case 'Enviada':
      case 'Em Negociação':
        return 'secondary';
      case 'Recusada':
      case 'Cancelada':
        return 'destructive';
      case 'Pendente':
      default:
        return 'outline';
    }
  };

  const getFollowUpDateClass = (followUpDateStr?: string | null, followUpDone?: boolean):        
string => {
    if (followUpDone) return "text-green-600"; // Realizado
    if (!followUpDateStr) return "";
    try {
      const followUpD = parseISO(followUpDateStr);
      if (isPast(followUpD) && !isToday(followUpD)) return "text-destructive font-semibold"; //  
Vencido
      if (isToday(followUpD)) return "text-blue-600 font-semibold"; // Hoje
      return "text-muted-foreground"; // Futuro
    } catch {
      return "";
    }
  };

  const handleConvertToSale = (quote: Quote) => {
    if (userRole !== quote.seller) {
       toast({
        title: "Ação Não Permitida",
        description: Apenas o vendedor  pode converter esta proposta.,
        variant: "destructive",
      });
      return;
    }
    router.push(/vendas/nova?fromQuoteId=);
  };

  const handleAttachClick = (quote: Quote) => {
    setSelectedQuoteForUpload(quote);
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.length || !selectedQuoteForUpload) return;
    const file = event.target.files[0];

    // Basic validation
    if (file.size > 5 * 1024 * 1024) { // 5 MB limit
      toast({ title: "Arquivo Muito Grande", description: "O arquivo deve ter no máximo 5MB.",  
variant: "destructive" });
      return;
    }
    if (file.type !== "application/pdf") {
      toast({ title: "Formato Inválido", description: "Por favor, anexe apenas arquivos PDF.",  
variant: "destructive" });
      return;
    }

    setIsUploading(selectedQuoteForUpload.id);
    try {
      await uploadAttachment(selectedQuoteForUpload.id, file);
      toast({ title: "Sucesso!", description: "Anexo enviado." });
    } catch (error: any) {
      toast({ title: "Erro no Upload", description: error.message || "Não foi possível enviar   
o anexo.", variant: "destructive" });
    } finally {
      setIsUploading(null);
      setSelectedQuoteForUpload(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDeleteAttachment = async (quote: Quote) => {
    try {
      await deleteAttachment(quote);
      toast({ title: "Sucesso!", description: "Anexo removido." });
    } catch (error: any) {
      toast({ title: "Erro ao Remover", description: error.message || "Não foi possível
remover o anexo.", variant: "destructive" });
    }
  };


  if (!quotesData.length) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center p-4 border      
border-dashed rounded-lg">
        <Eye className="h-12 w-12 text-muted-foreground mb-3" />
        <h3 className="text-lg font-semibold text-foreground">Nenhuma Proposta Encontrada</h3>   
        <p className="text-sm text-muted-foreground">
          Não há propostas que correspondam aos filtros atuais ou nenhuma proposta foi
adicionada ainda.
        </p>
      </div>
    );
  }

  return (
    <>
    <input
      type="file"
      ref={fileInputRef}
      onChange={handleFileSelected}
      className="hidden"
      accept="application/pdf"
    />
    <ScrollArea className="whitespace-nowrap rounded-md border">
      <Table className="min-w-full">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Data Prop.</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Vendedor</TableHead>
            <TableHead className="text-right">Valor Proposto</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Anexo</TableHead>
            <TableHead className="w-[200px]">Follow-up</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {quotesData.map((quote) => {
            const areActionsDisabled = globalDisabled || userRole !== quote.seller;
            const isAccepted = quote.status === 'Aceita';

            return (
            <TableRow key={quote.id} className="hover:bg-muted/50 transition-colors">
              <TableCell>{format(parseISO(quote.proposalDate), 'dd/MM/yy', { locale: ptBR        
})}</TableCell>
              <TableCell className="font-medium max-w-[200px] truncate" title={quote.clientName  
|| ''}>{quote.clientName || ''}</TableCell>
              <TableCell>{quote.seller}</TableCell>
              <TableCell className="text-right">
                {(quote.proposedValue || 0).toLocaleString('pt-BR', { style: 'currency',
currency: 'BRL' })}
              </TableCell>
              <TableCell>
                <Badge variant={getStatusBadgeVariant(quote.status)} className="capitalize       
text-xs px-2 py-0.5">
                  {quote.status}
                </Badge>
              </TableCell>
              <TableCell>
                 {isUploading === quote.id ? (
                   <Button variant="outline" size="sm" disabled>
                     <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...
                   </Button>
                 ) : quote.attachmentUrl ? (
                   <Button asChild variant="outline" size="sm">
                     <a href={quote.attachmentUrl} target="_blank" rel="noopener noreferrer">    
                       <LinkIcon className="mr-2 h-4 w-4" /> Ver PDF
                     </a>
                   </Button>
                 ) : (
                   <Button variant="secondary" size="sm" onClick={() =>
handleAttachClick(quote)} disabled={areActionsDisabled}>
                     <UploadCloud className="mr-2 h-4 w-4" /> Anexar
                   </Button>
                 )}
              </TableCell>
              <TableCell className="space-x-2">
                 {quote.followUpDate ? (
                    <div className="flex items-center space-x-2">
                        {quote.followUpDone ? <CheckCircle className="h-4 w-4 text-green-600"    
/> : <BellRing className={cn("h-4 w-4", getFollowUpDateClass(quote.followUpDate,
quote.followUpDone))} />}
                        <span className={cn(getFollowUpDateClass(quote.followUpDate,
quote.followUpDone))}>
                            {format(parseISO(quote.followUpDate), 'dd/MM/yy', { locale: ptBR })} 
                        </span>
                        {!areActionsDisabled && (
                           <div className="flex items-center space-x-1">
                             <Checkbox
                                id={ollowUpDone-}
                                checked={!!quote.followUpDone}
                                onCheckedChange={() => toggleFollowUpDone(quote.id)}
                                disabled={areActionsDisabled}
                                aria-label="Follow-up realizado"
                             />
                             <Label htmlFor={ollowUpDone-} className="text-xs      
cursor-pointer">Realizado?</Label>
                           </div>
                        )}
                    </div>
                 ) : (
                    <span className="text-xs text-muted-foreground/70 italic">Não
agendado</span>
                 )}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0" >
                      <span className="sr-only">Abrir menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {!isAccepted && (
                      <DropdownMenuItem onClick={() => onEdit(quote)}
disabled={areActionsDisabled}>
                        <Edit3 className="mr-2 h-4 w-4" /> Modificar
                      </DropdownMenuItem>
                    )}
                    {!isAccepted && (
                      <DropdownMenuItem onClick={() => handleConvertToSale(quote)}
disabled={areActionsDisabled}>
                        <FileUp className="mr-2 h-4 w-4" /> Converter em Venda
                      </DropdownMenuItem>
                    )}
                     <DropdownMenuItem onClick={() => handleDeleteAttachment(quote)}
disabled={areActionsDisabled || !quote.attachmentUrl}>
                        <Paperclip className="mr-2 h-4 w-4" /> Remover Anexo
                     </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onDelete(quote.id)}
className="text-destructive" disabled={areActionsDisabled}>
                      <Trash2 className="mr-2 h-4 w-4" /> Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          )})}
        </TableBody>
      </Table>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
    </>
  );
}
