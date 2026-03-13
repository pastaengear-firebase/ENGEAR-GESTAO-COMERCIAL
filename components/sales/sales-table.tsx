// src/components/sales/sales-table.tsx
"use client";
import { useRef, useState } from 'react';
import type { Sale } from '@/lib/types';
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit3, Trash2, Eye, Link as LinkIcon, UploadCloud, Loader2, Mail, Download } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useSales } from '@/hooks/use-sales';
import { useToast } from '@/hooks/use-toast';
import { getFriendlyPdfErrorMessage } from '@/lib/utils';
import { normalizeSaleStatus } from '@/lib/normalizers';

interface SalesTableProps {
  salesData: Sale[];
  onEdit?: (sale: Sale) => void;
  onDelete?: (saleId: string) => void;
  disabledActions?: boolean;
}

export default function SalesTable({ salesData, onEdit, onDelete, disabledActions: globalDisabled }: SalesTableProps) {
  const { userRole, uploadAttachment } = useSales();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedSaleForUpload, setSelectedSaleForUpload] = useState<Sale | null>(null);
  const [isUploading, setIsUploading] = useState<string | null>(null);

  const getStatusBadgeVariant = (status: string): React.ComponentProps<typeof Badge>['variant'] => {
    const normalizedStatus = normalizeSaleStatus(status);
    switch (normalizedStatus) {
      case 'FINALIZADA':
      case 'RECEBIDA':
        return 'default';
      case 'A INICIAR':
      case 'EM ANDAMENTO':
        return 'secondary';
      case 'CANCELADO':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const showActions = onEdit && onDelete;

  if (!salesData.length) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center p-4">
        <Eye className="h-12 w-12 text-muted-foreground mb-3" />
        <h3 className="text-lg font-semibold text-foreground">Nenhuma Venda Encontrada</h3>
        <p className="text-sm text-muted-foreground">
          Não há vendas que correspondam aos filtros atuais ou nenhum registro foi adicionado.
        </p>
      </div>
    );
  }

  return (
    <>
    <input
      type="file"
      ref={fileInputRef}
      onChange={async (e) => {
        if (!e.target.files?.length || !selectedSaleForUpload) return;
        const file = e.target.files[0];

        if (file.type !== 'application/pdf') {
          toast({ title: 'Formato inválido', description: 'Selecione apenas arquivo PDF.', variant: 'destructive' });
          e.target.value = '';
          return;
        }
        if (file.size > 4 * 1024 * 1024) {
          toast({ title: 'Arquivo muito grande', description: 'O PDF deve ter no máximo 4MB.', variant: 'destructive' });
          e.target.value = '';
          return;
        }

        setIsUploading(selectedSaleForUpload.id);
        try {
          await uploadAttachment(selectedSaleForUpload.id, file);
          toast({ title: "PDF enviado com sucesso!" });
        } catch (err: any) {
          toast({ title: "Erro ao enviar PDF", description: getFriendlyPdfErrorMessage(err), variant: "destructive" });
        } finally {
          setIsUploading(null);
          setSelectedSaleForUpload(null);
          if (e.target) e.target.value = '';
        }
      }}
      className="hidden"
      accept="application/pdf"
    />
    <ScrollArea className="rounded-md border" id="sales-table-printable-area">
      <Table className="w-full table-fixed text-[12px] lg:text-[13px]">
        <TableHeader>
          <TableRow>
            <TableHead className="h-9 px-2 w-[7%]">Data</TableHead>
            <TableHead className="h-9 px-2 w-[8%]">Vendedor</TableHead>
            <TableHead className="h-9 px-2 w-[9%]">Empresa</TableHead>
            <TableHead className="h-9 px-2 w-[7%]">Projeto</TableHead>
            <TableHead className="h-9 px-2 w-[6%]">O.S.</TableHead>
            <TableHead className="h-9 px-2 w-[8%]">Área</TableHead>
            <TableHead className="h-9 px-2 w-[18%]">Cliente/Serviço</TableHead>
            <TableHead className="h-9 px-2 text-right w-[11%]">Valor Venda</TableHead>
            <TableHead className="h-9 px-2 w-[11%]">Status</TableHead>
            <TableHead className="h-9 px-2 text-right w-[11%]">Pagamento</TableHead>
            <TableHead className="h-9 px-2 w-[4%] text-center">PDF</TableHead>
            {showActions && <TableHead className="h-9 px-2 text-right w-[4%] print-hide">Ações</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {salesData.map((sale) => {
            const areActionsDisabled = globalDisabled || userRole !== sale.seller;
            const attachmentUrl = sale.attachmentUrl;
            const uploading = isUploading === sale.id;
            const normalizedStatus = normalizeSaleStatus(sale.status) || sale.status;

            return (
            <TableRow key={sale.id} className="hover:bg-muted/50 transition-colors">
              <TableCell className="px-2 py-2 whitespace-nowrap">{format(parseISO(sale.date), 'dd/MM/yy', { locale: ptBR })}</TableCell>
              <TableCell className="px-2 py-2 whitespace-nowrap">{sale.seller}</TableCell>
              <TableCell className="px-2 py-2 font-medium truncate" title={sale.company}>{sale.company}</TableCell>
              <TableCell className="px-2 py-2 truncate" title={sale.project}>{sale.project}</TableCell>
              <TableCell className="px-2 py-2 whitespace-nowrap">{sale.os}</TableCell>
              <TableCell className="px-2 py-2 truncate" title={sale.area}>{sale.area}</TableCell>
              <TableCell className="px-2 py-2 truncate" title={sale.clientService}>{sale.clientService}</TableCell>
              <TableCell className="px-2 py-2 text-right whitespace-nowrap">
                {sale.salesValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </TableCell>
              <TableCell className="px-2 py-2">
                <Badge variant={getStatusBadgeVariant(normalizedStatus)} className="capitalize text-[11px] px-2 py-0.5">
                  {normalizedStatus}
                </Badge>
              </TableCell>
              <TableCell className="px-2 py-2 text-right whitespace-nowrap">
                {sale.payment.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </TableCell>
              <TableCell className="px-2 py-2 text-center">
                {attachmentUrl ? (
                  <div className="flex items-center justify-center gap-1">
                    <Button asChild variant="outline" size="icon" className="h-7 w-7" title="Ver PDF">
                      <a href={attachmentUrl} target="_blank" rel="noopener noreferrer">
                        <LinkIcon className="h-3.5 w-3.5" />
                      </a>
                    </Button>
                    <Button asChild variant="secondary" size="icon" className="h-7 w-7" title="Download PDF">
                      <a href={attachmentUrl} download={sale.attachmentName || undefined}>
                        <Download className="h-3.5 w-3.5" />
                      </a>
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-7 w-7"
                    title="Anexar PDF"
                    disabled={areActionsDisabled || uploading}
                    onClick={() => {
                      setSelectedSaleForUpload(sale);
                      fileInputRef.current?.click();
                    }}
                  >
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                  </Button>
                )}
              </TableCell>
              {showActions && (
                <TableCell className="px-2 py-2 text-right print-hide">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-7 w-7 p-0" disabled={areActionsDisabled}>
                        <span className="sr-only">Abrir menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(sale)} disabled={areActionsDisabled}>
                        <Edit3 className="mr-2 h-4 w-4" /> Modificar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          const value = sale.salesValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                          const appBaseUrl = window.location.origin;
                          const salesLink = `${appBaseUrl}/vendas/gerenciar`;
                          const subject = `NOVA VENDA REALIZADA! - ${sale.company || 'NÃO INFORMADO'} PROJETO ${sale.project || 'NÃO INFORMADO'} - O.S. N. ${sale.os || 'NÃO INFORMADO'} - VALOR: ${value} - CLIENTE ${sale.clientService || 'NÃO INFORMADO'} - VENDEDOR: ${sale.seller || 'NÃO INFORMADO'}`;
                          const body = [
                            `Cliente: ${sale.clientService || 'NÃO INFORMADO'}`,
                            `Dados do Cliente: `,
                            `Valor Proposto: ${value}`,
                            `Área: ${sale.area || 'NÃO INFORMADA'}`,
                            `Data: ${sale.date ? new Date(sale.date).toLocaleDateString('pt-BR') : '-'}`,
                            `Projeto: ${sale.project || 'NÃO INFORMADO'}`,
                            `O.S.: ${sale.os || 'NÃO INFORMADO'}`,
                            `Descrição: ${sale.summary || ''}`,
                            `PDF da Proposta: ${sale.attachmentUrl ? 'Sim' : 'Não'}`,
                            `Vendedor: ${sale.seller || 'NÃO INFORMADO'}`,
                            ``,
                            `Resumo: ${sale.summary || ''}`,
                            ``,
                            `Para consultar, acesse: ${salesLink}`,
                          ].join('\n');
                          window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
                        }}
                        disabled={areActionsDisabled}
                      >
                        <Mail className="mr-2 h-4 w-4" /> Reenviar E-mail
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onDelete(sale.id)} className="text-destructive" disabled={areActionsDisabled}>
                        <Trash2 className="mr-2 h-4 w-4" /> Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              )}
            </TableRow>
          )})}
        </TableBody>
      </Table>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          #sales-table-printable-area, #sales-table-printable-area * { visibility: visible; }
          #sales-table-printable-area {
            position: absolute;
            left: 0; top: 0; width: 100%;
            font-size: 8pt;
          }
          .print-hide { display: none !important; }
          table { width: 100% !important; border-collapse: collapse !important; }
          th, td {
            border: 1px solid #ccc !important;
            padding: 4px !important;
            white-space: normal !important;
            word-break: break-word;
          }
          .max-w-\\[200px\\] { max-width: 100px !important; }
          @page { size: A4 landscape; margin: 10mm; }
        }
      `}</style>
    </>
  );
}
