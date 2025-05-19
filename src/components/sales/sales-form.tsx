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
import { CalendarIcon, DollarSign, Save, RotateCcw, Sparkles, AlertCircle } from 'lucide-react';
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
}

export default function SalesForm({ onFormChange, onSuggestionsFetched }: SalesFormProps) {
  const { addSale, getSaleById, updateSale, selectedSeller: globalSelectedSeller } = useSales();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const editSaleId = searchParams.get('editId');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
  const [assignedSeller, setAssignedSeller] = useState<Seller | undefined>(
    SELLERS.includes(globalSelectedSeller as Seller) ? globalSelectedSeller as Seller : undefined
  );


  const form = useForm<SalesFormData>({
    resolver: zodResolver(SalesFormSchema),
    defaultValues: {
      date: new Date(),
      company: undefined,
      project: '',
      os: '',
      area: undefined,
      clientService: '',
      salesValue: 0,
      status: undefined,
      payment: 0, 
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
        setAssignedSeller(saleToEdit.seller);
      } else {
        toast({ title: "Erro", description: "Venda não encontrada para edição.", variant: "destructive" });
        // Redirect to the base page of the current route (inserir-venda or editar-venda)
        router.push(pathname); 
      }
    } else {
      // Reset form if editSaleId is not present (e.g., URL changed)
      form.reset({
        date: new Date(),
        company: undefined,
        project: '',
        os: '',
        area: undefined,
        clientService: '',
        salesValue: 0,
        status: undefined,
        payment: 0,
      });
      setAssignedSeller(SELLERS.includes(globalSelectedSeller as Seller) ? globalSelectedSeller as Seller : undefined);
    }
  }, [editSaleId, getSaleById, form, toast, router, globalSelectedSeller, pathname]);
  
  useEffect(() => {
    if (!editSaleId && SELLERS.includes(globalSelectedSeller as Seller)) {
      setAssignedSeller(globalSelectedSeller as Seller);
    } else if (!editSaleId && globalSelectedSeller === ALL_SELLERS_OPTION) {
      setAssignedSeller(undefined); 
    }
  }, [globalSelectedSeller, editSaleId]);


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
        if (typeof value === 'number' && value !== 0) return true;
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
          salesValue: formData.salesValue,
          status: formData.status!, 
          payment: formData.payment, 
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
    if (!assignedSeller) {
      toast({ title: "Erro de Validação", description: "Por favor, selecione um vendedor.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    
    const salePayload: Omit<Sale, 'id' | 'createdAt' | 'updatedAt'> = {
      ...data,
      date: format(data.date, 'yyyy-MM-dd'), 
      seller: assignedSeller,
      payment: Number(data.payment) 
    };

    try {
      if (editSaleId) {
        updateSale(editSaleId, salePayload);
        toast({ title: "Sucesso!", description: "Venda atualizada com sucesso." });
      } else {
        addSale(salePayload);
        toast({ title: "Sucesso!", description: "Nova venda registrada com sucesso." });
      }
      
      // Reset form and navigate after submission
      form.reset({ 
          date: new Date(),
          company: undefined,
          project: '',
          os: '',
          area: undefined,
          clientService: '',
          salesValue: 0,
          status: undefined,
          payment: 0,
      });
      setAssignedSeller(SELLERS.includes(globalSelectedSeller as Seller) ? globalSelectedSeller as Seller : undefined); 
      if (onSuggestionsFetched) onSuggestionsFetched(null);
      
      if (pathname.startsWith('/editar-venda') && editSaleId) {
        router.push('/editar-venda'); // Clear editId, stay on page
      } else {
        // For new sales on /inserir-venda, stay on the page to allow further entries
        if (pathname.startsWith('/inserir-venda') && !editSaleId) {
          // Optionally, keep the user on the /inserir-venda page
          // router.push('/inserir-venda'); // This would keep them on the page
        } else {
            router.push('/dados'); // Default redirect for edits from other contexts or if desired for new sales
        }
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
                        disabled={isSubmitting}
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
                        date > new Date() || date < new Date("1900-01-01") || isSubmitting
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          { (globalSelectedSeller === ALL_SELLERS_OPTION || editSaleId) && (
             <FormField
              control={form.control} 
              name="seller" 
              render={({ field }) => ( 
                <FormItem>
                  <FormLabel>Vendedor</FormLabel>
                  <Select 
                    onValueChange={(value: Seller) => setAssignedSeller(value)} 
                    value={assignedSeller}
                    disabled={isSubmitting || (!!editSaleId && !!getSaleById(editSaleId)?.seller)}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o vendedor" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {SELLERS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {!assignedSeller && <FormDescription className="text-destructive">Vendedor é obrigatório.</FormDescription>}
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="company"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Empresa</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  value={field.value} 
                  disabled={isSubmitting}
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
                  <Input placeholder="Nome ou Descrição do Projeto" {...field} disabled={isSubmitting} />
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
                  <Input placeholder="Número da O.S., 0000 ou deixe em branco" {...field} disabled={isSubmitting} />
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
                <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
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
                  <Input placeholder="Tipo de Cliente ou Serviço Prestado" {...field} disabled={isSubmitting} />
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
                    <Input type="number" placeholder="0.00" className="pl-8" {...field} disabled={isSubmitting} step="0.01" 
                      onChange={e => field.onChange(parseFloat(e.target.value))}
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
                <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
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
                      placeholder="0.00" 
                      className="pl-8" 
                      {...field} 
                      disabled={isSubmitting} 
                      step="0.01"
                      onChange={e => field.onChange(parseFloat(e.target.value))}
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
            disabled={isFetchingSuggestions || isSubmitting}
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
              router.push(targetPath); // This will clear editId from URL due to useEffect dependency
              // Form reset is handled by useEffect when editSaleId changes to null
              setAssignedSeller(SELLERS.includes(globalSelectedSeller as Seller) ? globalSelectedSeller as Seller : undefined);
              if (onSuggestionsFetched) onSuggestionsFetched(null);
            }}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Limpar / Cancelar Edição
          </Button>
          <Button type="submit" disabled={isSubmitting || !assignedSeller} className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white">
            <Save className="mr-2 h-4 w-4" />
            {isSubmitting ? 'Salvando...' : (editSaleId ? 'Atualizar Venda' : 'Salvar Venda')}
          </Button>
        </div>
        {!assignedSeller && (
          <FormItem className="mt-2"> 
             <p className="text-sm font-medium text-destructive flex items-center"><AlertCircle className="w-4 h-4 mr-1"/> Selecione um vendedor para salvar.</p>
          </FormItem>
        )}
      </form>
    </Form>
  );
}
