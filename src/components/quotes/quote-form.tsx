
// src/components/quotes/quote-form.tsx
"use client";
import type React from 'react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { QuoteFormSchema, type QuoteFormData } from '@/lib/schemas';
import { AREA_OPTIONS, PROPOSAL_STATUS_OPTIONS, CONTACT_SOURCE_OPTIONS, COMPANY_OPTIONS, SELLERS, ALL_SELLERS_OPTION } from '@/lib/constants';
import type { Seller } from '@/lib/constants';
import { useQuotes } from '@/hooks/use-quotes';
import { useSales } from '@/hooks/use-sales'; // Para pegar o vendedor global
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CalendarIcon, DollarSign, Save, RotateCcw, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import type { Quote } from '@/lib/types';

interface QuoteFormProps {
  quoteToEdit?: Quote | null;
  onFormSubmit?: () => void; // Callback para fechar modal ou redirecionar
  showReadOnlyAlert?: boolean;
}

export default function QuoteForm({ quoteToEdit, onFormSubmit, showReadOnlyAlert }: QuoteFormProps) {
  const { addQuote, updateQuote } = useQuotes();
  const { selectedSeller: globalSelectedSeller } = useSales();
  const { toast } = useToast();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [displayedSeller, setDisplayedSeller] = useState<Seller | typeof ALL_SELLERS_OPTION | undefined>(undefined);

  const isEffectivelyReadOnly = globalSelectedSeller === ALL_SELLERS_OPTION;
  const editMode = !!quoteToEdit;

  const form = useForm<QuoteFormData>({
    resolver: zodResolver(QuoteFormSchema),
    defaultValues: {
      clientName: '',
      proposalDate: undefined, // Inicializa como undefined para evitar new Date() em SSR
      validityDate: undefined,
      company: undefined,
      area: undefined,
      contactSource: undefined,
      description: '',
      proposedValue: undefined,
      status: "Pendente",
      notes: '',
    },
  });

  useEffect(() => {
    if (editMode && quoteToEdit) {
      form.reset({
        clientName: quoteToEdit.clientName,
        proposalDate: parseISO(quoteToEdit.proposalDate),
        validityDate: quoteToEdit.validityDate ? parseISO(quoteToEdit.validityDate) : undefined,
        company: quoteToEdit.company,
        area: quoteToEdit.area,
        contactSource: quoteToEdit.contactSource,
        description: quoteToEdit.description,
        proposedValue: quoteToEdit.proposedValue,
        status: quoteToEdit.status,
        notes: quoteToEdit.notes || '',
      });
      setDisplayedSeller(quoteToEdit.seller);
    } else if (!editMode) {
      // Reset para novo formulário, SEM a data principal ainda
      form.reset({
        clientName: '',
        proposalDate: undefined, // Mantém undefined aqui no reset inicial
        validityDate: undefined,
        company: undefined,
        area: undefined,
        contactSource: undefined,
        description: '',
        proposedValue: undefined,
        status: "Pendente",
        notes: '',
      });
      // Define a data APENAS NO CLIENTE após a montagem/reset inicial
      form.setValue('proposalDate', new Date(), { shouldValidate: true, shouldDirty: true });
      
      if (SELLERS.includes(globalSelectedSeller as Seller)) {
        setDisplayedSeller(globalSelectedSeller as Seller);
      } else {
        setDisplayedSeller(ALL_SELLERS_OPTION);
      }
    }
  }, [quoteToEdit, editMode, form, globalSelectedSeller]);

  const onSubmit = async (data: QuoteFormData) => {
    if (isEffectivelyReadOnly) {
      toast({ title: "Ação Não Permitida", description: "Selecione um vendedor específico (SERGIO ou RODRIGO) para salvar.", variant: "destructive" });
      return;
    }

    let sellerForPayload: Seller;
    if (editMode && quoteToEdit) {
      sellerForPayload = quoteToEdit.seller; 
    } else {
      if (!SELLERS.includes(globalSelectedSeller as Seller)) {
        toast({ title: "Erro de Validação", description: "Selecione SERGIO ou RODRIGO no seletor global.", variant: "destructive" });
        return;
      }
      sellerForPayload = globalSelectedSeller as Seller;
    }

    setIsSubmitting(true);

    const quotePayload = {
      ...data,
      proposalDate: format(data.proposalDate, 'yyyy-MM-dd'),
      validityDate: data.validityDate ? format(data.validityDate, 'yyyy-MM-dd') : undefined,
      proposedValue: Number(data.proposedValue) || 0,
    };

    try {
      if (editMode && quoteToEdit) {
        updateQuote(quoteToEdit.id, quotePayload);
        toast({ title: "Sucesso!", description: "Proposta atualizada com sucesso." });
      } else {
        addQuote(quotePayload as Omit<Quote, 'id' | 'createdAt' | 'updatedAt' | 'seller'>);
        toast({ title: "Sucesso!", description: "Nova proposta registrada com sucesso." });
      }

      // Reset para novo formulário
      form.reset({
        clientName: '',
        proposalDate: undefined, // Reset para undefined
        validityDate: undefined,
        company: undefined,
        area: undefined,
        contactSource: undefined,
        description: '',
        proposedValue: undefined,
        status: "Pendente",
        notes: '',
      });
      // Redefine a data no cliente para o próximo "novo" formulário
      if (!editMode) { // Apenas se não estiver editando, para não sobrescrever uma edição
        form.setValue('proposalDate', new Date(), { shouldValidate: true, shouldDirty: true });
      }
      
      if (SELLERS.includes(globalSelectedSeller as Seller)) {
        setDisplayedSeller(globalSelectedSeller as Seller);
      } else {
        setDisplayedSeller(ALL_SELLERS_OPTION);
      }
      
      if (onFormSubmit) {
        onFormSubmit();
      }

    } catch (error) {
      console.error("Error saving quote:", error);
      toast({ title: "Erro ao Salvar", description: (error as Error).message || "Não foi possível salvar a proposta.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {showReadOnlyAlert && isEffectivelyReadOnly && (
          <Alert variant="default" className="bg-amber-50 border-amber-300 text-amber-700">
            <Info className="h-4 w-4 !text-amber-600" />
            <AlertTitle>Modo Somente Leitura</AlertTitle>
            <AlertDescription>
              Para {editMode ? 'modificar esta proposta' : 'criar uma nova proposta'}, por favor, selecione um vendedor específico (SERGIO ou RODRIGO) no seletor do cabeçalho.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <FormField
            control={form.control}
            name="clientName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome do Cliente</FormLabel>
                <FormControl>
                  <Input placeholder="Nome completo ou Razão Social" {...field} disabled={isEffectivelyReadOnly || isSubmitting} />
                </FormControl>
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
              {editMode ? "Vendedor original da proposta (não pode ser alterado)." : "Para nova proposta, use o seletor no cabeçalho."}
            </FormDescription>
          </FormItem>

          <FormField
            control={form.control}
            name="proposalDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data da Proposta</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                        disabled={isEffectivelyReadOnly || isSubmitting}
                      >
                        {field.value ? format(field.value, "PPP", { locale: ptBR }) : <span>Selecione uma data</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar 
                        mode="single" 
                        selected={field.value || undefined} // field.value pode ser null
                        onSelect={field.onChange} 
                        initialFocus 
                        disabled={isEffectivelyReadOnly || isSubmitting} />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="validityDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data de Validade (Opcional)</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                        disabled={isEffectivelyReadOnly || isSubmitting}
                      >
                        {field.value ? format(field.value, "PPP", { locale: ptBR }) : <span>Selecione uma data</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar 
                        mode="single" 
                        selected={field.value || undefined}
                        onSelect={field.onChange} 
                        disabled={(date) => date < new Date() || isEffectivelyReadOnly || isSubmitting} />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="company"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Empresa da Proposta</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={isEffectivelyReadOnly || isSubmitting}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Selecione a Empresa" /></SelectTrigger></FormControl>
                  <SelectContent>{COMPANY_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="area"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Área de Atuação</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={isEffectivelyReadOnly || isSubmitting}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Selecione a Área" /></SelectTrigger></FormControl>
                  <SelectContent>{AREA_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="contactSource"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fonte do Contato</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={isEffectivelyReadOnly || isSubmitting}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Selecione a Fonte" /></SelectTrigger></FormControl>
                  <SelectContent>{CONTACT_SOURCE_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="proposedValue"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor Proposto (R$)</FormLabel>
                <FormControl>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input 
                      type="number" 
                      placeholder="0,00" 
                      className="pl-8" 
                      value={field.value === undefined || field.value === null || isNaN(Number(field.value)) ? '' : String(field.value)}
                      onChange={e => {
                        const val = e.target.value;
                        field.onChange(val === '' ? undefined : parseFloat(val));
                      }}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
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
              <FormItem className="md:col-span-2">
                <FormLabel>Status da Proposta</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={isEffectivelyReadOnly || isSubmitting}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Selecione o Status" /></SelectTrigger></FormControl>
                  <SelectContent>{PROPOSAL_STATUS_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Descrição/Escopo da Proposta</FormLabel>
                <FormControl>
                  <Textarea placeholder="Detalhe o que está sendo proposto..." {...field} disabled={isEffectivelyReadOnly || isSubmitting} rows={3} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Observações (Opcional)</FormLabel>
                <FormControl>
                  <Textarea placeholder="Qualquer informação adicional relevante..." {...field} disabled={isEffectivelyReadOnly || isSubmitting} rows={3} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4 border-t">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              form.reset({ // Reset para valores vazios
                clientName: '',
                proposalDate: undefined, 
                validityDate: undefined,
                company: undefined,
                area: undefined,
                contactSource: undefined,
                description: '',
                proposedValue: undefined,
                status: "Pendente",
                notes: '',
              });
              // Redefine a data no cliente para o próximo "novo" formulário
              if (!editMode) {
                 form.setValue('proposalDate', new Date(), { shouldValidate: true, shouldDirty: true });
              }
              if (onFormSubmit && editMode) onFormSubmit(); 
            }}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            {editMode ? 'Cancelar Edição' : 'Limpar Formulário'}
          </Button>
          <Button type="submit"
            disabled={isEffectivelyReadOnly || isSubmitting}
            className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground">
            <Save className="mr-2 h-4 w-4" />
            {isSubmitting ? 'Salvando...' : (editMode ? 'Atualizar Proposta' : 'Salvar Proposta')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
