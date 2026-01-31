
// src/app/(app)/editar-venda/page.tsx
"use client";
import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSales } from '@/hooks/use-sales';
import SalesForm from '@/components/sales/sales-form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Search, Edit3, Trash2, FileEdit, AlertTriangle, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Sale } from '@/lib/types';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ALL_SELLERS_OPTION } from '@/lib/constants'; // Import ALL_SELLERS_OPTION

export default function EditarVendaPage() {
  const { sales, deleteSale, getSaleById, loading: salesLoading, selectedSeller, isReadOnly } = useSales();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Sale[]>([]);
  const [selectedSaleIdForForm, setSelectedSaleIdForForm] = useState<string | null>(null);
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saleToDelete, setSaleToDelete] = useState<string | null>(null);

  const editIdFromUrl = searchParams.get('editId');

  useEffect(() => {
    if (editIdFromUrl) {
      setSelectedSaleIdForForm(editIdFromUrl);
    } else {
      setSelectedSaleIdForForm(null); 
    }
  }, [editIdFromUrl]);

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }
    const lowerSearchTerm = searchTerm.toLowerCase();
    const filtered = sales.filter(sale =>
      sale.project.toLowerCase().includes(lowerSearchTerm) ||
      sale.os.toLowerCase().includes(lowerSearchTerm) ||
      sale.company.toLowerCase().includes(lowerSearchTerm) ||
      sale.clientService.toLowerCase().includes(lowerSearchTerm)
    );
    setSearchResults(filtered);
  };
  
  const handleEditClick = (saleId: string) => {
    router.push(`/editar-venda?editId=${saleId}`);
  };

  const confirmDelete = (id: string) => {
    if (isReadOnly) {
      toast({
        title: "Ação Não Permitida",
        description: "Selecione um vendedor específico (SERGIO ou RODRIGO) no seletor do cabeçalho para excluir vendas.",
        variant: "destructive",
      });
      return;
    }
    setSaleToDelete(id);
    setDialogOpen(true);
  };

  const handleDelete = () => {
    if (saleToDelete) {
      deleteSale(saleToDelete);
      toast({ title: "Sucesso!", description: "Venda excluída com sucesso." });
      setSearchResults(prevResults => prevResults.filter(s => s.id !== saleToDelete)); 
      if (selectedSaleIdForForm === saleToDelete) { 
        router.push('/editar-venda'); 
      }
      setSaleToDelete(null); // Clear saleToDelete after successful deletion
    }
    setDialogOpen(false);
  };
  
  const handleClearSearchAndForm = () => {
    setSearchTerm('');
    setSearchResults([]);
    if (editIdFromUrl) {
      router.push('/editar-venda'); 
    }
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center">
            <FileEdit className="mr-3 h-8 w-8" /> Editar Venda
          </h1>
          <p className="text-muted-foreground">
            Busque por uma venda para modificar ou excluir seus detalhes.
          </p>
        </div>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Buscar Venda</CardTitle>
          <CardDescription>Digite termos como nome do projeto, O.S., empresa ou cliente para encontrar a venda.</CardDescription>
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar vendas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10 w-full"
              />
            </div>
            <Button onClick={handleSearch} className="w-full sm:w-auto">
              <Search className="mr-2 h-4 w-4" /> Buscar
            </Button>
            <Button variant="outline" onClick={handleClearSearchAndForm} className="w-full sm:w-auto">
              <RotateCcw className="mr-2 h-4 w-4" /> Limpar Busca / Formulário
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {salesLoading && <p>Carregando dados de vendas...</p>}
          {!salesLoading && searchResults.length === 0 && searchTerm && (
            <div className="flex flex-col items-center justify-center h-40 text-center p-4 border border-dashed rounded-lg">
              <AlertTriangle className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">Nenhuma venda encontrada para "{searchTerm}".</p>
            </div>
          )}
          {!salesLoading && searchResults.length > 0 && (
            <ScrollArea className="h-[300px] rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Projeto</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>O.S.</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {searchResults.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell>{format(parseISO(sale.date), 'dd/MM/yy', { locale: ptBR })}</TableCell>
                      <TableCell className="max-w-[150px] sm:max-w-[200px] truncate" title={sale.project}>{sale.project}</TableCell>
                      <TableCell>{sale.company}</TableCell>
                      <TableCell>{sale.os}</TableCell>
                      <TableCell>{sale.salesValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col sm:flex-row justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleEditClick(sale.id)} 
                            className="w-full sm:w-auto"
                          >
                            <Edit3 className="h-4 w-4 mr-1" /> Modificar
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => confirmDelete(sale.id)} 
                            className="text-destructive hover:text-destructive hover:bg-destructive/10 w-full sm:w-auto"
                            disabled={isReadOnly}
                          >
                            <Trash2 className="h-4 w-4 mr-1" /> Excluir
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {editIdFromUrl && getSaleById(editIdFromUrl) && (
        <Card className="shadow-lg mt-6">
          <CardHeader>
            <CardTitle>Modificando Venda: {getSaleById(editIdFromUrl)?.project || `OS ${getSaleById(editIdFromUrl)?.os}`}</CardTitle>
            <CardDescription>
              {isReadOnly && getSaleById(editIdFromUrl)?.seller !== selectedSeller
                ? `Apenas o vendedor ${getSaleById(editIdFromUrl)?.seller} pode modificar esta venda.`
                : "Altere os campos abaixo e clique em 'Atualizar Venda'."
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SalesForm showReadOnlyAlert={true} saleToEdit={getSaleById(editIdFromUrl)} onFormSubmit={() => router.push('/editar-venda')} />
          </CardContent>
        </Card>
      )}
       {!editIdFromUrl && searchResults.length > 0 && (
         <div className="flex flex-col items-center justify-center h-40 text-center p-4 border border-dashed rounded-lg mt-6">
            <Edit3 className="h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">Selecione uma venda da lista acima para editar.</p>
        </div>
      )}

      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta venda? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSaleToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
