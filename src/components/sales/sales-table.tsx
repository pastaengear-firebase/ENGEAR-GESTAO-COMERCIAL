// src/components/sales/sales-table.tsx
"use client";
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
import { MoreHorizontal, Edit3, Trash2, Eye } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useSales } from '@/hooks/use-sales';

interface SalesTableProps {
  salesData: Sale[];
  onEdit?: (sale: Sale) => void;
  onDelete?: (saleId: string) => void;
  disabledActions?: boolean; // Prop global para desabilitar
}

export default function SalesTable({ salesData, onEdit, onDelete, disabledActions: globalDisabled }: SalesTableProps) {
  const { user, isReadOnly, selectedSeller } = useSales();

  const getStatusBadgeVariant = (status: Sale['status']): React.ComponentProps<typeof Badge>['variant'] => {
    switch (status) {
      case 'FINALIZADO':
        return 'default'; 
      case 'Á INICAR':
      case 'EM ANDAMENTO':
      case 'AGUARDANDO PAGAMENTO':
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
    <ScrollArea className="whitespace-nowrap rounded-md border" id="sales-table-printable-area">
      <Table className="min-w-full">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Data</TableHead>
            <TableHead>Vendedor</TableHead>
            <TableHead>Empresa</TableHead>
            <TableHead>Projeto</TableHead>
            <TableHead>O.S.</TableHead>
            <TableHead>Área</TableHead>
            <TableHead>Cliente/Serviço</TableHead>
            <TableHead className="text-right">Valor Venda</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Pagamento</TableHead>
            {showActions && <TableHead className="text-right print-hide">Ações</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {salesData.map((sale) => {
            // Ações são desabilitadas se a prop global for true, se o usuário for read-only,
            // ou se o vendedor selecionado não for o dono da venda.
            const areActionsDisabled = globalDisabled || isReadOnly || selectedSeller !== sale.seller;
            
            return (
            <TableRow key={sale.id} className="hover:bg-muted/50 transition-colors">
              <TableCell>{format(parseISO(sale.date), 'dd/MM/yy', { locale: ptBR })}</TableCell>
              <TableCell>{sale.seller}</TableCell>
              <TableCell className="font-medium max-w-[200px] truncate" title={sale.company}>{sale.company}</TableCell>
              <TableCell className="max-w-[200px] truncate" title={sale.project}>{sale.project}</TableCell>
              <TableCell>{sale.os}</TableCell>
              <TableCell>{sale.area}</TableCell>
              <TableCell className="max-w-[200px] truncate" title={sale.clientService}>{sale.clientService}</TableCell>
              <TableCell className="text-right">
                {sale.salesValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </TableCell>
              <TableCell>
                <Badge variant={getStatusBadgeVariant(sale.status)} className="capitalize">
                  {sale.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                {sale.payment.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </TableCell>
              {showActions && (
                <TableCell className="text-right print-hide">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0" disabled={areActionsDisabled}>
                        <span className="sr-only">Abrir menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(sale)} disabled={areActionsDisabled}>
                        <Edit3 className="mr-2 h-4 w-4" /> Modificar
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
          body * {
            visibility: hidden;
          }
          #sales-table-printable-area, #sales-table-printable-area * {
            visibility: visible;
          }
          #sales-table-printable-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            font-size: 8pt; /* Smaller font for printing */
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
            white-space: normal !important; /* Allow text wrapping */
            word-break: break-word; /* Break long words */
          }
          .max-w-\\[200px\\] { max-width: 100px !important; } /* Adjust max width for print */

          @page {
            size: A4 landscape; /* Horizontal A4 */
            margin: 10mm; /* Margins for A4 */
          }
        }
      `}</style>
    </>
  );
}
