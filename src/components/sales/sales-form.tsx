// src/components/sales/sales-form.tsx
"use client";
import type React from 'react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SalesFormSchema, type SalesFormData } from '@/lib/schemas';
import { AREA_OPTIONS, STATUS_OPTIONS, SELLERS, ALL_SELLERS_OPTION, COMPANY_OPTIONS } from '@/lib/constants';
import type { Seller } from '@/lib/constants';
import { useSales } from '@/hooks/use-sales';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // Import Alert
import { CalendarIcon, DollarSign, Save, RotateCcw, Sparkles, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { suggestSalesImprovements, type SuggestSalesImprovementsInput, type SuggestSalesImprovementsOutput } from '@/ai/flows/suggest-sales-improvements';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import type { Sale } from '@/lib/types';

interface SalesFormProps {
  onFormChange?: (data: Partial<SalesFormData>) => void;
  onSuggestionsFetched?: (suggestions: SuggestSalesImprovementsOutput | null) => void;
  showReadOnlyAlert?: boolean; // Prop to control alert display from parent page
}

export default function SalesForm({ onFormChange, onSuggestionsFetched, showReadOnlyAlert }: SalesFormProps) {
  const { addSale, getSaleById, updateSale, selectedSeller: globalSelectedSeller } = useSales();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const editSaleId = searchParams.get('editId');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
  
  const [displayedSeller, setDisplayedSeller] = useState<Seller | typeof ALL_SELLERS_OPTION | undefined>(undefined);

  const isEffectivelyReadOnly = globalSelectedSeller === ALL_SELLERS_OPTION;

  const form = useForm<SalesFormData>({
    resolver: zodResolver(SalesFormSchema),
    defaultValues: {
      date: new Date(),
      company: undefined,
      project: '',
      os: '',
      area: undefined,
      clientService: '',
      salesValue: undefined, // Changed from 0 to undefined
      status: undefined,
      payment: undefined,    // Changed from 0 to undefined
      // seller field in form data is not directly used for saving,
      // actual seller comes from globalSelectedSeller or saleToEdit.seller
    },
  });

  useEffect(() => {
    if (editSaleId) {
      const saleToEdit = getSaleById(editSaleId);
      if (saleToEdit) {
        form.reset({
          date: new Date(saleToEdit.date),
          company: saleToEdit.company,
          project: saleToEdit.project,
          os: saleToEdit.os,
          area: saleToEdit.area,
          clientService: saleToEdit.clientService,
          salesValue: saleToEdit.salesValue,
          status: saleToEdit.status,
          payment: saleToEdit.payment,
        });
        setDisplayedSeller(saleToEdit.seller);
      } else {
        toast({ title: "Erro", description: "Venda não encontrada para edição.", variant: "destructive" });
        router.push(pathname);
      }
    } else {
      // New sale
      form.reset({
        date: new Date(),
        company: undefined,
        project: '',
        os: '',
        area: undefined,
        clientService: '',
        salesValue: undefined, // Changed from 0 to undefined
        status: undefined,
        payment: undefined,    // Changed from 0 to undefined
      });
      if (SELLERS.includes(globalSelectedSeller as Seller)) {
        setDisplayedSeller(globalSelectedSeller as Seller);
      } else {
        setDisplayedSeller(ALL_SELLERS_OPTION); 
      }
    }
  }, [editSaleId, getSaleById, form, toast, router, globalSelectedSeller, pathname]);


  const handleDataChange = () => {
    if (onFormChange) {
      onFormChange(form.getValues());
    }
  };

  const fetchSuggestions = async () => {
    const formData = form.getValues();
    if (!formData.company || !formData.area || !formData.status ) {
        toast({
            title: "Campos Incompletos",
            description: "Por favor, preencha todos os campos obrigatórios (Empresa, Área, Status) antes de verificar com IA.",
            variant: "destructive",
        });
        if (onSuggestionsFetched) {
          onSuggestionsFetched(null);
        }
        return;
    }
    const relevantFieldsFilled = Object.entries(formData).some(([key, value]) => {
        if (key === 'date' && value instanceof Date && !isNaN(value.getTime())) return true;
        if (typeof value === 'string' && value.trim() !== '') return true;
        if (typeof value === 'number' && value !== 0 && !isNaN(value)) return true; // Ensure it's not NaN
        if (['company', 'area', 'status'].includes(key) && value !== undefined) return true;
        return false;
    });

    if (relevantFieldsFilled) {
      setIsFetchingSuggestions(true);
      try {
        const aiInput: SuggestSalesImprovementsInput = {
          date: format(formData.date, 'yyyy-MM-dd'),
          company: formData.company!,
          project: formData.project,
          os: formData.os,
          area: formData.area!,
          clientService: formData.clientService,
          salesValue: Number(formData.salesValue) || 0, // Ensure number, default to 0 if NaN
          status: formData.status!,
          payment: Number(formData.payment) || 0,     // Ensure number, default to 0 if NaN
        };
        const suggestions = await suggestSalesImprovements(aiInput);
        if (onSuggestionsFetched) {
          onSuggestionsFetched(suggestions);
        }
      } catch (error) {
        console.error("Error fetching AI suggestions:", error);
        toast({ title: "Erro IA", description: "Não foi possível buscar sugestões.", variant: "destructive" });
        if (onSuggestionsFetched) {
          onSuggestionsFetched(null);
        }
      } finally {
        setIsFetchingSuggestions(false);
      }
    } else {
         toast({
            title: "Dados Insuficientes para IA",
            description: "Preencha mais campos para obter sugestões da IA.",
            variant: "default",
        });
        if (onSuggestionsFetched) {
          onSuggestionsFetched(null);
        }
    }
  };

  const onSubmit = async (data: SalesFormData) => {
    if (isEffectivelyReadOnly) {
      toast({ title: "Ação Não Permitida", description: "Selecione um vendedor específico (SERGIO ou RODRIGO) para salvar.", variant: "destructive" });
      return;
    }

    let sellerForPayload: Seller;
    if (editSaleId) {
      const saleToEdit = getSaleById(editSaleId);
      if (!saleToEdit) { 
        toast({ title: "Erro", description: "Venda original não encontrada.", variant: "destructive" });
        return;
      }
      sellerForPayload = saleToEdit.seller; 
    } else {
      if (!SELLERS.includes(globalSelectedSeller as Seller)) {
        toast({ title: "Erro de Validação", description: "Selecione SERGIO ou RODRIGO no seletor global para registrar uma nova venda.", variant: "destructive" });
        return;
      }
      sellerForPayload = globalSelectedSeller as Seller;
    }

    setIsSubmitting(true);
    
    const salePayload: Omit<Sale, 'id' | 'createdAt' | 'updatedAt'> = {
      ...data,
      date: format(data.date, 'yyyy-MM-dd'),
      seller: sellerForPayload,
      // Ensure salesValue and payment are numbers, defaulting to 0 if they became NaN or undefined
      salesValue: Number(data.salesValue) || 0,
      payment: Number(data.payment) || 0,
    };

    try {
      if (editSaleId) {
        updateSale(editSaleId, salePayload);
        toast({ title: "Sucesso!", description: "Venda atualizada com sucesso." });
      } else {
        addSale(salePayload);
        toast({ title: "Sucesso!", description: "Nova venda registrada com sucesso." });
      }
      
      form.reset({ // Reset to blank for new sales
          date: new Date(),
          company: undefined,
          project: '',
          os: '',
          area: undefined,
          clientService: '',
          salesValue: undefined,
          status: undefined,
          payment: undefined,
      });
      if (SELLERS.includes(globalSelectedSeller as Seller)) {
        setDisplayedSeller(globalSelectedSeller as Seller);
      } else {
        setDisplayedSeller(ALL_SELLERS_OPTION);
      }
      if (onSuggestionsFetched) onSuggestionsFetched(null);
      
      if (pathname.startsWith('/editar-venda') && editSaleId) {
        router.push('/editar-venda'); 
      } else if (pathname.startsWith('/inserir-venda') && !editSaleId) {
        // Stay on page
      } else {
        router.push('/dados');
      }

    } catch (error) {
      console.error("Error saving sale:", error);
      toast({ title: "Erro ao Salvar", description: (error as Error).message || "Não foi possível salvar a venda.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8" onChange={handleDataChange}>
        {showReadOnlyAlert && isEffectivelyReadOnly && (
           <Alert variant="default" className="bg-amber-50 border-amber-300 text-amber-700">
            <Info className="h-4 w-4 !text-amber-600" />
            <AlertTitle>Modo Somente Leitura</AlertTitle>
            <AlertDescription>
              Para {editSaleId ? 'modificar esta venda' : 'inserir uma nova venda'}, por favor, selecione um vendedor específico (SERGIO ou RODRIGO) no seletor do cabeçalho.
            </AlertDescription>
          </Alert>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data da Venda</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                        disabled={isEffectivelyReadOnly || isSubmitting}
                      >
                        {field.value ? (
                          format(field.value, "PPP", { locale: ptBR })
                        ) : (
                          <span>Selecione uma data</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01") || isEffectivelyReadOnly || isSubmitting
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormItem>
            <FormLabel>Vendedor</FormLabel>
            <Select value={displayedSeller || ""} disabled>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Vendedor definido no cabeçalho" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {SELLERS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                <SelectItem value={ALL_SELLERS_OPTION}>{ALL_SELLERS_OPTION}</SelectItem>
              </SelectContent>
            </Select>
            <FormDescription>
              {editSaleId ? "Vendedor original da venda (não pode ser alterado)." : "Para nova venda, use o seletor no cabeçalho."}
            </FormDescription>
          </FormItem>


          <FormField
            control={form.control}
            name="company"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Empresa</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={isEffectivelyReadOnly || isSubmitting}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a Empresa" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {COMPANY_OPTIONS.map(option => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="project"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Projeto</FormLabel>
                <FormControl>
                  <Input placeholder="Nome ou Descrição do Projeto" {...field} disabled={isEffectivelyReadOnly || isSubmitting} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="os"
            render={({ field }) => (
              <FormItem>
                <FormLabel>O.S. (Ordem de Serviço)</FormLabel>
                <FormControl>
                  <Input placeholder="Número da O.S., 0000 ou deixe em branco" {...field} disabled={isEffectivelyReadOnly || isSubmitting} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="area"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Área</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={isEffectivelyReadOnly || isSubmitting}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a Área" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {AREA_OPTIONS.map(option => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="clientService"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cliente/Serviço</FormLabel>
                <FormControl>
                  <Input placeholder="Tipo de Cliente ou Serviço Prestado" {...field} disabled={isEffectivelyReadOnly || isSubmitting} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="salesValue"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor da Venda (R$)</FormLabel>
                <FormControl>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input 
                      type="number" 
                      placeholder="0,00" 
                      className="pl-8" 
                      {...field} 
                      value={field.value === undefined || field.value === null || isNaN(Number(field.value)) ? '' : field.value}
                      onChange={e => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                      disabled={isEffectivelyReadOnly || isSubmitting} 
                      step="0.01"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={isEffectivelyReadOnly || isSubmitting}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o Status da Venda" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {STATUS_OPTIONS.map(option => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="payment"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor do Pagamento (R$)</FormLabel>
                <FormControl>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="number"
                      placeholder="0,00"
                      className="pl-8"
                      {...field}
                      value={field.value === undefined || field.value === null || isNaN(Number(field.value)) ? '' : field.value}
                      onChange={e => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                      disabled={isEffectivelyReadOnly || isSubmitting}
                      step="0.01"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={fetchSuggestions}
            disabled={isEffectivelyReadOnly || isFetchingSuggestions || isSubmitting}
            className="w-full sm:w-auto"
          >
            {isFetchingSuggestions ? (
              <Sparkles className="mr-2 h-4 w-4 animate-pulse" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            Verificar com IA
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              const targetPath = pathname.startsWith('/editar-venda') ? '/editar-venda' : '/inserir-venda';
              router.push(targetPath); // This will trigger the useEffect to reset the form to its "new sale" state or clear editId
              if (onSuggestionsFetched) onSuggestionsFetched(null);
            }}
            disabled={isSubmitting} 
            className="w-full sm:w-auto"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Limpar / Cancelar Edição
          </Button>
          <Button type="submit"
            disabled={isEffectivelyReadOnly || isSubmitting }
            className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white">
            <Save className="mr-2 h-4 w-4" />
            {isSubmitting ? 'Salvando...' : (editSaleId ? 'Atualizar Venda' : 'Salvar Venda')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
