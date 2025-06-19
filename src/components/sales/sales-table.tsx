// src/components/sales/sales-table.tsx
"use client";
import type { Sale } from '@/lib/types';
// import { useSales } from '@/hooks/use-sales'; // No longer needed for deleteSale
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
// import { Button } from '@/components/ui/button'; // No longer needed for actions
import { Badge } from '@/components/ui/badge';
// import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'; // No longer needed
// import { MoreHorizontal, Edit3, Trash2 } from 'lucide-react'; // No longer needed for actions
import { Eye } from 'lucide-react'; // Keep Eye for empty state
// import { useRouter } from 'next/navigation'; // No longer needed for edit navigation
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
// import { useToast } from '@/hooks/use-toast'; // No longer needed for delete toast
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
// import {
//   AlertDialog,
//   AlertDialogAction,
//   AlertDialogCancel,
//   AlertDialogContent,
//   AlertDialogDescription,
//   AlertDialogFooter,
//   AlertDialogHeader,
//   AlertDialogTitle,
// } from "@/components/ui/alert-dialog" // No longer needed here
// import { useState } from 'react'; // No longer needed for dialog state

interface SalesTableProps {
  salesData: Sale[];
}

export default function SalesTable({ salesData }: SalesTableProps) {
  // const { deleteSale } = useSales(); // Moved to EditarVendaPage
  // const router = useRouter(); // Moved to EditarVendaPage
  // const { toast } = useToast(); // Moved to EditarVendaPage
  // const [dialogOpen, setDialogOpen] = useState(false); // Moved to EditarVendaPage
  // const [saleToDelete, setSaleToDelete] = useState<string | null>(null); // Moved to EditarVendaPage

  // Edit and Delete handlers are removed as actions are moved to EditarVendaPage

  const getStatusBadgeVariant = (status: Sale['status']): React.ComponentProps<typeof Badge>['variant'] => {
    switch (status) {
      case 'FINALIZADO':
        return 'default'; 
      case 'Á INICAR':
      case 'EM ANDAMENTO':
        return 'secondary'; 
      case 'CANCELADO':
        return 'destructive'; 
      default:
        return 'outline';
    }
  };

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
          </TableRow>
        </TableHeader>
        <TableBody>
          {salesData.map((sale) => (
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
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
    {/* AlertDialog moved to EditarVendaPage */}
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
