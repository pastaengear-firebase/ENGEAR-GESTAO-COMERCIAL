// components/quotes/quotes-table.tsx
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit3, Trash2, Eye, BellRing, CheckCircle, FileUp, Loader2, Link as LinkIcon, UploadCloud, Lock } from 'lucide-react';
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

export default function QuotesTable({ quotesData, onEdit, onDelete, disabledActions: globalDisabled }: QuotesTableProps) {
  const { toggleFollowUpDone, uploadAttachment, deleteAttachment } = useQuotes();
  const { userRole } = useSales();
  const router = useRouter();
  const { toast } = useToast();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedQuoteForUpload, setSelectedQuoteForUpload] = useState<Quote | null>(null);
  const [isUploading, setIsUploading] = useState<string | null>(null);

  const getStatusBadgeVariant = (status: Quote['status']): any => {
    if (status === 'Aceita') return 'default';
    if (['Enviada', 'Em Negociação'].includes(status)) return 'secondary';
    if (['Recusada', 'Cancelada'].includes(status)) return 'destructive';
    return 'outline';
  };

  const handleConvertToSale = (quote: Quote) => {
    if (quote.status === 'Aceita') {
        toast({ title: "Atenção", description: "Esta proposta já foi convertida em venda.", variant: "default" });
        return;
    }
    if (userRole !== quote.seller) {
       toast({ title: "Ação Não Permitida", description: "Apenas o dono da proposta pode converter.", variant: "destructive" });
      return;
    }
    router.push(`/vendas/nova?fromQuoteId=${quote.id}`);
  };

  if (!quotesData.length) {
    return (
      <div className="flex flex-col items-center justify-center h-64 border border-dashed rounded-lg">
        <Eye className="h-12 w-12 text-muted-foreground mb-3" />
        <h3 className="text-lg font-semibold">Nenhuma Proposta</h3>
      </div>
    );
  }

  return (
    <>
    <input type="file" ref={fileInputRef} onChange={(e) => {
        if (!e.target.files?.length || !selectedQuoteForUpload) return;
        setIsUploading(selectedQuoteForUpload.id);
        uploadAttachment(selectedQuoteForUpload.id, e.target.files[0])
          .then(() => toast({ title: "Sucesso!" }))
          .finally(() => setIsUploading(null));
    }} className="hidden" accept="application/pdf" />

    <ScrollArea className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Vendedor</TableHead>
            <TableHead className="text-right">Valor</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Anexo</TableHead>
            <TableHead>Follow-up</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {quotesData.map((quote) => {
            const isOwner = userRole === quote.seller;
            const isAccepted = quote.status === 'Aceita';
            const areActionsDisabled = globalDisabled || !isOwner;

            return (
            <TableRow key={quote.id} className={cn(isAccepted && "bg-muted/30")}>
              <TableCell>{format(parseISO(quote.proposalDate), 'dd/MM/yy')}</TableCell>
              <TableCell className="font-medium">{quote.clientName}</TableCell>
              <TableCell>{quote.seller}</TableCell>
              <TableCell className="text-right">
                {quote.proposedValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </TableCell>
              <TableCell>
                <Badge variant={getStatusBadgeVariant(quote.status)}>{quote.status}</Badge>
              </TableCell>
              <TableCell>
                 {quote.attachmentUrl ? (
                   <Button asChild variant="outline" size="sm">
                     <a href={quote.attachmentUrl} target="_blank" rel="noopener noreferrer"><LinkIcon className="h-4 w-4" /></a>
                   </Button>
                 ) : (
                   <Button variant="secondary" size="sm" onClick={() => { setSelectedQuoteForUpload(quote); fileInputRef.current?.click(); }} disabled={areActionsDisabled || isAccepted}>
                     <UploadCloud className="h-4 w-4" />
                   </Button>
                 )}
              </TableCell>
              <TableCell>
                {quote.followUpDate && (
                  <div className="flex items-center space-x-2">
                    <Checkbox checked={!!quote.followUpDone} onCheckedChange={() => toggleFollowUpDone(quote.id)} disabled={areActionsDisabled} />
                    <span className="text-xs">{format(parseISO(quote.followUpDate), 'dd/MM/yy')}</span>
                  </div>
                )}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm"><MoreHorizontal className="h-4 w-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {/* TRAVA: Se aceita, desabilita Modificar e Converter */}
                    <DropdownMenuItem onClick={() => onEdit(quote)} disabled={areActionsDisabled || isAccepted}>
                      {isAccepted ? <Lock className="mr-2 h-4 w-4" /> : <Edit3 className="mr-2 h-4 w-4" />}
                      Modificar
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem onClick={() => handleConvertToSale(quote)} disabled={areActionsDisabled || isAccepted}>
                      <FileUp className="mr-2 h-4 w-4" /> 
                      {isAccepted ? "Já Convertida" : "Converter em Venda"}
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onDelete(quote.id)} className="text-destructive" disabled={areActionsDisabled}>
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