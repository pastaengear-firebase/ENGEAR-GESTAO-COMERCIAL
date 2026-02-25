// components/sales/sales-form.tsx
"use client";
import type React from 'react';
import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SalesFormSchema, type SalesFormData } from '@/lib/schemas';
import { AREA_OPTIONS, STATUS_OPTIONS, SELLERS, COMPANY_OPTIONS, ALL_SELLERS_OPTION } from '@/lib/constants';
import { useSales } from '@/hooks/use-sales';
import { useQuotes } from '@/hooks/use-quotes'; 
import { useSettings } from '@/hooks/use-settings'; 
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CalendarIcon, DollarSign, Save, RotateCcw, Info, Mail, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import type { Sale } from '@/lib/types';

interface SalesFormProps {
  saleToEdit?: Sale | null;
  fromQuoteId?: string | null;
  onFormSubmit?: () => void;
  showReadOnlyAlert?: boolean;
}

export default function SalesForm({ saleToEdit, fromQuoteId, onFormSubmit, showReadOnlyAlert }: SalesFormProps) {
  const { addSale, updateSale, userRole } = useSales();
  const { getQuoteById: getQuoteByIdFromContext, updateQuote: updateQuoteStatus } = useQuotes();
  const { settings: appSettings, loadingSettings } = useSettings(); 
  const { toast } = useToast();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [originatingSeller, setOriginatingSeller] = useState<string | null>(null);

  const editMode = !!saleToEdit;

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
      summary: '',
      sendSaleNotification: false,
    },
  });
  
  const isFormDisabled = (userRole === ALL_SELLERS_OPTION && !editMode) || (editMode && userRole !== saleToEdit.seller);

  // Função para resetar o formulário com segurança
  const resetForm = useCallback((data?: any) => {
    if (data) {
      form.reset({
        ...data,
        // Garantir que campos de data sejam objetos Date
        date: typeof data.date === 'string' ? parseISO(data.date) : data.date,
        // Garantir que valores nulos do Firebase virem strings vazias para o formulário
        os: data.os || '',
        summary: data.summary || '',
        payment: data.payment || 0,
        // Se o valor for "null" ou "undefined" em Enums, passamos undefined para o Select não bugar
        company: data.company || undefined,
        area: data.area || undefined,
        status: data.status || undefined,
      });
    } else {
      form.reset({
        date: new Date(),
        company: undefined,
        project: '',
        os: '',
        area: undefined,
        clientService: '',
        salesValue: undefined,
        status: undefined,
        payment: 0,
        summary: '',
        sendSaleNotification: appSettings?.enableSalesEmailNotifications || false,
      });
    }
  }, [form, appSettings?.enableSalesEmailNotifications]);

  useEffect(() => {
    if (editMode && saleToEdit) {
        resetForm(saleToEdit);
        setOriginatingSeller(saleToEdit.seller);
    } else if (fromQuoteId) {
      const quoteToConvert = getQuoteByIdFromContext(fromQuoteId);
      if (quoteToConvert) {
        if (userRole !== quoteToConvert.seller) {
           toast({
              title: "Aviso de Vendedor",
              description: `Atenção: Você está convertendo uma proposta de ${quoteToConvert.seller}.`,
              variant: "default",
              duration: 5000,
           });
        }
        
        // MAPEAMENTO DA PROPOSTA PARA A VENDA
        resetForm({
          date: new Date(),
          company: quoteToConvert.company,
          project: '', // Deixamos vazio para o vendedor inserir o código de 5 dígitos
          os: '',
          area: quoteToConvert.area,
          clientService: quoteToConvert.clientName,
          salesValue: quoteToConvert.proposedValue,
          status: "A INICIAR",
          payment: 0,
          summary: `Convertido da Proposta: ${quoteToConvert.description || ''}`,
          sendSaleNotification: appSettings?.enableSalesEmailNotifications || false,
        });
        setOriginatingSeller(quoteToConvert.seller);
      }
    } else {
      resetForm();
      setOriginatingSeller(null);
    }
  }, [editMode, saleToEdit, fromQuoteId, getQuoteByIdFromContext, resetForm, userRole, toast, appSettings?.enableSalesEmailNotifications]);


  const triggerEmailNotification = async (sale: Sale) => {
    if (!appSettings.enableSalesEmailNotifications) return;

    let recipients = appSettings.salesNotificationEmails.join(',');
    const subjectValue = sale.salesValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const subject = `Nova Venda: ${sale.project} (${subjectValue}) - ${sale.seller}`;
    const body = `Nova venda registrada.\nVendedor: ${sale.seller}\nProjeto: ${sale.project}\nCliente: ${sale.clientService}\nValor: ${subjectValue}`;
    const mailtoLink = `mailto:${recipients}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    window.open(mailtoLink, '_blank');
  };

  const onSubmit = async (data: SalesFormData) => {
    if (isFormDisabled) {
      toast({ title: "Ação Não Permitida", description: "Sem permissão para salvar.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    setIsSaved(false);

    const salePayload = {
      ...data,
      date: format(data.date, 'yyyy-MM-dd'),
      salesValue: Number(data.salesValue || 0),
      payment: Number(data.payment || 0),
    };

    try {
      if (editMode && saleToEdit) {
        await updateSale(saleToEdit.id, salePayload);
        toast({ title: "Sucesso", description: "Venda atualizada com sucesso!" });
      } else {
        const newSale = await addSale(salePayload);
        if (fromQuoteId) {
          await updateQuoteStatus(fromQuoteId, { status: "Aceita" });
        }
        if (newSale && data.sendSaleNotification) {
          await triggerEmailNotification(newSale);
        }
        toast({ title: "Sucesso", description: "Venda cadastrada com sucesso!" });
      }

      setIsSaved(true);
      if (onFormSubmit) onFormSubmit();

    } catch (error) {
      toast({ title: "Erro", description: "Erro ao salvar.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setIsSaved(false), 2000);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {showReadOnlyAlert && isFormDisabled && (
          <Alert variant="default" className="bg-amber-50 border-amber-300 text-amber-700">
            <Info className="h-4 w-4 !text-amber-600" />
            <AlertTitle>Modo Somente Leitura</AlertTitle>
            <AlertDescription>
              { originatingSeller && userRole !== originatingSeller
                ? `Apenas o vendedor ${originatingSeller} pode modificar este item.`
                : "Faça login autorizado para habilitar."
              }
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
                        className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                        disabled={isFormDisabled || isSubmitting}
                      >
                        {field.value ? format(field.value, "PPP", { locale: ptBR }) : <span>Selecione uma data</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value} 
                      onSelect={field.onChange}
                      disabled={(date) => date > new Date() || isFormDisabled || isSubmitting}
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
            <Input value={originatingSeller || userRole} disabled className="bg-muted" />
          </FormItem>

          <FormField
            control={form.control}
            name="company"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Empresa</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value || ""}
                  disabled={isFormDisabled || isSubmitting}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a Empresa" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {COMPANY_OPTIONS.map(option => <SelectItem key={option} value={option}>{option}</SelectItem>)}
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
                <FormLabel>Projeto (máx 5 dígitos)</FormLabel>
                <FormControl>
                  <Input placeholder="Código do Projeto" {...field} maxLength={5} disabled={isFormDisabled || isSubmitting} />
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
                <FormLabel>O.S. (máx 5 dígitos)</FormLabel>
                <FormControl>
                  <Input placeholder="Número da O.S." {...field} maxLength={5} disabled={isFormDisabled || isSubmitting} />
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
                <Select onValueChange={field.onChange} value={field.value || ""} disabled={isFormDisabled || isSubmitting}>
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
                  <Input placeholder="Cliente ou Serviço" {...field} disabled={isFormDisabled || isSubmitting} />
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
                      className="pl-8"
                      value={field.value ?? ''}
                      onChange={e => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                      disabled={isFormDisabled || isSubmitting}
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
                <Select onValueChange={field.onChange} value={field.value || ""} disabled={isFormDisabled || isSubmitting}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o Status" />
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
                      className="pl-8"
                      value={field.value ?? ''}
                      onChange={e => field.onChange(e.target.value === '' ? 0 : parseFloat(e.target.value))}
                      disabled={isFormDisabled || isSubmitting}
                      step="0.01"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="summary"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Resumo</FormLabel>
              <FormControl>
                <Textarea {...field} disabled={isFormDisabled || isSubmitting} rows={4} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4 border-t">
          <Button type="button" variant="ghost" onClick={() => resetForm()} disabled={isSubmitting} className="w-full sm:w-auto">
            <RotateCcw className="mr-2 h-4 w-4" />
            Limpar
          </Button>
          <Button type="submit" disabled={isFormDisabled || isSubmitting || isSaved} className="w-full sm:w-auto">
            {isSaved ? <Check className="mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
            {isSubmitting ? 'Salvando...' : (editMode ? 'Atualizar Venda' : 'Salvar Venda')}
          </Button>
        </div>
      </form>
    </Form>
  );
}