
// src/components/planner/planner-table.tsx
"use client";
import type { PlannerItem, Seller } from '@/lib/types';
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit3, Trash2, AlertTriangle, CheckCircle, ClipboardList } from 'lucide-react'; // Added ClipboardList
import { format, parseISO, isPast, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from '@/lib/utils';

interface PlannerTableProps {
  plannerItems: PlannerItem[];
  onEdit: (item: PlannerItem) => void;
  onDelete: (itemId: string, responsibleSeller: Seller) => void;
  disabledActions: boolean; // True if globalSelectedSeller is "EQUIPE COMERCIAL"
}

export default function PlannerTable({ plannerItems, onEdit, onDelete, disabledActions }: PlannerTableProps) {

  const getStatusBadgeVariant = (status: PlannerItem['status']): React.ComponentProps<typeof Badge>['variant'] => {
    switch (status) {
      case 'Concluído':
        return 'default'; 
      case 'Em Desenvolvimento':
      case 'Em Análise':
        return 'secondary';
      case 'Aguardando Cliente':
        return 'outline'; // Needs a specific color, using outline for now
      case 'Cancelado':
        return 'destructive'; 
      case 'Pendente':
      default:
        return 'outline'; 
    }
  };

  const getPriorityBadgeVariant = (priority: PlannerItem['priority']): React.ComponentProps<typeof Badge>['variant'] => {
    switch (priority) {
      case 'Alta':
        return 'destructive';
      case 'Média':
        return 'secondary'; // Using 'secondary' for yellow-ish, adjust theme if needed
      case 'Baixa':
      default:
        return 'outline';
    }
  };
  
  const isOverdue = (deadline: string, status: PlannerItem['status']) => {
    if (status === 'Concluído' || status === 'Cancelado') return false;
    try {
      const deadLineDate = parseISO(deadline);
      return isPast(deadLineDate) && !isToday(deadLineDate);
    } catch {
      return false;
    }
  };


  if (!plannerItems.length) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center p-4 border border-dashed rounded-lg">
        <ClipboardList className="h-12 w-12 text-muted-foreground mb-3" />
        <h3 className="text-lg font-semibold text-foreground">Nenhum Item no Planner</h3>
        <p className="text-sm text-muted-foreground">
          Não há tarefas que correspondam aos filtros atuais ou nenhum item foi adicionado ainda.
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="whitespace-nowrap rounded-md border">
      <Table className="min-w-full">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[250px]">Título</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Responsável</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Prioridade</TableHead>
            <TableHead className="w-[120px]">Prazo</TableHead>
            <TableHead className="text-right w-[80px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {plannerItems.map((item) => (
            <TableRow key={item.id} className={cn("hover:bg-muted/50 transition-colors", isOverdue(item.deadline, item.status) && "bg-destructive/10 hover:bg-destructive/20")}>
              <TableCell className="font-medium max-w-[250px] truncate" title={item.title}>{item.title}</TableCell>
              <TableCell className="max-w-[150px] truncate" title={item.clientName || ''}>{item.clientName || '-'}</TableCell>
              <TableCell>{item.responsibleSeller}</TableCell>
              <TableCell>
                <Badge variant={getStatusBadgeVariant(item.status)} className="capitalize text-xs px-2 py-0.5">
                  {item.status === 'Concluído' && <CheckCircle className="mr-1 h-3 w-3" />}
                  {item.status}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={getPriorityBadgeVariant(item.priority)} className="capitalize text-xs px-2 py-0.5">
                  {item.priority}
                </Badge>
              </TableCell>
              <TableCell className={cn(isOverdue(item.deadline, item.status) && "font-semibold text-destructive-foreground")}>
                <div className="flex items-center">
                 {isOverdue(item.deadline, item.status) && <AlertTriangle className="mr-1.5 h-4 w-4 text-destructive" />}
                 {format(parseISO(item.deadline), 'dd/MM/yy', { locale: ptBR })}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0" disabled={disabledActions && item.responsibleSeller !== undefined /* Allow if no specific seller is selected and current user is not EQUIPE */}>
                      <span className="sr-only">Abrir menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(item)} disabled={disabledActions}>
                      <Edit3 className="mr-2 h-4 w-4" /> Modificar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDelete(item.id, item.responsibleSeller)} className="text-destructive" disabled={disabledActions}>
                      <Trash2 className="mr-2 h-4 w-4" /> Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}

