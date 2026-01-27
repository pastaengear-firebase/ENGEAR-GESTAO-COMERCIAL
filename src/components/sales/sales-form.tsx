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
import { useQuotes } from '@/hooks/use-quotes'; // Para buscar e atualizar propostas
import { useSettings } from '@/hooks/use-settings'; 
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import type { Sale, Quote } from '@/lib/types';

interface SalesFormProps {
  showReadOnlyAlert?: boolean;
}

export default function SalesForm({ showReadOnlyAlert }: SalesFormProps) {
  const { addSale, getSaleById, updateSale, selectedSeller: globalSelectedSeller } = useSales();
  const { getQuoteById: getQuoteByIdFromContext, updateQuote: updateQuoteStatus } = useQuotes();
  const { settings: appSettings, loadingSettings } = useSettings(); 
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  
  const editSaleId = searchParams.get('editId');
  const fromQuoteId = searchParams.get('fromQuoteId');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [displayedSeller, setDisplayedSeller] = useState<Seller | typeof ALL_SELLERS_OPTION | undefined>(undefined);

  const isEffectivelyReadOnly = globalSelectedSeller === ALL_SELLERS_OPTION || (fromQuoteId && displayedSeller && globalSelectedSeller !== displayedSeller);


  const form = useForm<SalesFormData>({
    resolver: zodResolver(SalesFormSchema),
    defaultValues: {
      date: undefined, 
      company: undefined,
      project: '',
      os: '',
      area: undefined,
      clientService: '',
      salesValue: undefined,
      status: undefined,
      payment: undefined,
    },
  });

  useEffect(() => {
    const initializeForm = async () => {
      if (editSaleId) {
        const saleToEdit = getSaleById(editSaleId);
        if (saleToEdit) {
          form.reset({
            date: parseISO(saleToEdit.date), 
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
          router.push(pathname.startsWith('/editar-venda') ? '/editar-venda' : '/inserir-venda');
        }
      } else if (fromQuoteId) {
        const quoteToConvert = getQuoteByIdFromContext(fromQuoteId);
        if (quoteToConvert) {
          if (globalSelectedSeller !== quoteToConvert.seller && globalSelectedSeller !== ALL_SELLERS_OPTION) {
             toast({
                title: "Aviso de Vendedor",
                description: `Para converter a proposta de ${quoteToConvert.seller}, selecione ${quoteToConvert.seller} no seletor global. O formulário estará em modo leitura até lá.`,
                variant: "default",
                duration: 7000,
             });
          }
          form.reset({
            date: new Date(), // Data da venda é a data atual
            company: quoteToConvert.company,
            project: `${quoteToConvert.clientName} - ${quoteToConvert.description.substring(0,50)}${quoteToConvert.description.length > 50 ? '...' : ''}`,
            os: '', // OS será preenchido pelo usuário se necessário
            area: quoteToConvert.area,
            clientService: quoteToConvert.clientName,
            salesValue: quoteToConvert.proposedValue,
            status: "Á INICAR", // Status inicial sugerido para a venda
            payment: 0, // Pagamento inicial é zero
          });
          setDisplayedSeller(quoteToConvert.seller); // Vendedor da venda é o da proposta
        } else {
          toast({ title: "Erro", description: "Proposta não encontrada para conversão.", variant: "destructive" });
          router.push('/inserir-venda'); // Volta para inserir venda normal
        }
      } else { // Novo formulário (não edição, não conversão)
        form.reset({
          date: undefined, 
          company: undefined,
          project: '',
          os: '',
          area: undefined,
          clientService: '',
          salesValue: undefined,
          status: undefined,
          payment: undefined,
        });
        form.setValue('date', new Date(), { shouldValidate: true, shouldDirty: true });
        
        if (SELLERS.includes(globalSelectedSeller as Seller)) {
          setDisplayedSeller(globalSelectedSeller as Seller);
        } else {
          setDisplayedSeller(ALL_SELLERS_OPTION);
        }
      }
    };
    initializeForm();
  }, [editSaleId, fromQuoteId, getSaleById, getQuoteByIdFromContext, form, toast, router, globalSelectedSeller, pathname]);


  const triggerEmailNotification = (sale: Sale) => {
    if (loadingSettings || !appSettings.enableEmailNotifications || appSettings.notificationEmails.length === 0) {
      return;
    }

    const recipients = appSettings.notificationEmails.join(',');
    const subject = `Nova Venda Registrada: ${sale.project} (OS: ${sale.os || 'N/A'})`;
    const appBaseUrl = window.location.origin;
    const saleEditLink = `${appBaseUrl}/editar-venda?editId=${sale.id}`;

    const body = `
Uma nova venda foi registrada no sistema:

Detalhes da Venda:
--------------------------------------------------
ID da Venda: ${sale.id}
Data: ${format(parseISO(sale.date), 'dd/MM/yyyy', { locale: ptBR })}
Vendedor: ${sale.seller}
Empresa: ${sale.company}
Projeto: ${sale.project}
O.S.: ${sale.os || 'Não informado'}
Área: ${sale.area}
Cliente/Serviço: ${sale.clientService}
Valor da Venda: ${sale.salesValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
Status: ${sale.status}
Pagamento Registrado: ${sale.payment.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
--------------------------------------------------

Acesse a aplicação: ${appBaseUrl}/dashboard
Visualize ou edite esta venda: ${saleEditLink}

Atenciosamente,
Sistema de Controle de Vendas ENGEAR
    `;

    const mailtoLink = `mailto:${recipients}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink, '_blank');
    toast({ title: "Preparando E-mail", description: "Seu cliente de e-mail foi aberto para enviar a notificação." });
  };

  const onSubmit = async (data: SalesFormData) => {
    if (isEffectivelyReadOnly) {
       let message = "Selecione um vendedor específico (SERGIO ou RODRIGO) para salvar.";
       if (fromQuoteId && displayedSeller && globalSelectedSeller !== displayedSeller && globalSelectedSeller !== ALL_SELLERS_OPTION) {
           message = `Para salvar a venda do vendedor ${displayedSeller}, selecione ${displayedSeller} no seletor global.`;
       } else if (fromQuoteId && globalSelectedSeller === ALL_SELLERS_OPTION) {
           message = `Para salvar a venda do vendedor ${displayedSeller}, selecione ${displayedSeller} no seletor global.`;
       }
      toast({ title: "Ação Não Permitida", description: message, variant: "destructive" });
      return;
    }
    if (!data.date) { 
        toast({ title: "Erro de Validação", description: "Data da venda é obrigatória.", variant: "destructive" });
        return;
    }

    let sellerForPayload: Seller;
    if (editSaleId) { // Edição de venda existente
      const saleToEdit = getSaleById(editSaleId);
      if (!saleToEdit) {
        toast({ title: "Erro", description: "Venda original não encontrada.", variant: "destructive" });
        return;
      }
      sellerForPayload = saleToEdit.seller;
    } else if (fromQuoteId) { // Conversão de proposta
        const quote = getQuoteByIdFromContext(fromQuoteId);
        if (!quote) {
             toast({ title: "Erro", description: "Proposta original não encontrada para conversão.", variant: "destructive" });
             return;
        }
        if (globalSelectedSeller !== quote.seller) {
            toast({ title: "Ação Não Permitida", description: `Para salvar a venda do vendedor ${quote.seller}, selecione ${quote.seller} no seletor global.`, variant: "destructive" });
            return;
        }
        sellerForPayload = quote.seller;
    } else { // Nova venda
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
      salesValue: Number(data.salesValue) || 0,
      payment: Number(data.payment) || 0,
    };

    try {
      let newSaleId: string | undefined;
      if (editSaleId) {
        const updatedSale = updateSale(editSaleId, salePayload);
        if (updatedSale) {
          toast({ title: "Sucesso!", description: "Venda atualizada com sucesso." });
        }
      } else {
        const newSale = addSale(salePayload);
        newSaleId = newSale.id;
        toast({ title: "Sucesso!", description: "Nova venda registrada com sucesso." });
        triggerEmailNotification(newSale);
        
        if (fromQuoteId) {
            updateQuoteStatus(fromQuoteId, { status: "Aceita" });
            toast({ title: "Proposta Atualizada", description: "O status da proposta original foi alterado para 'Aceita'." });
        }
      }

      form.reset({
        date: undefined,
        company: undefined,
        project: '',
        os: '',
        area: undefined,
        clientService: '',
        salesValue: undefined,
        status: undefined,
        payment: undefined,
      });
       // Define a data para hoje apenas se não estiver editando ou vindo de uma cotação
      if(!editSaleId && !fromQuoteId) {
        form.setValue('date', new Date(), { shouldValidate: true, shouldDirty: true });
      }


      if (SELLERS.includes(globalSelectedSeller as Seller)) {
        setDisplayedSeller(globalSelectedSeller as Seller);
      } else {
        setDisplayedSeller(ALL_SELLERS_OPTION);
      }

      // Lógica de redirecionamento
      if (pathname.startsWith('/editar-venda') && editSaleId) {
        router.push('/editar-venda'); // Volta para a página de busca de edição
      } else if (pathname.startsWith('/inserir-venda')) {
        if (fromQuoteId) {
           router.push('/inserir-venda', { scroll: false }); // Remove query param e fica na página
        }
        // Se for inserção normal, permanece na página e o formulário é resetado
      } else {
        router.push('/dados'); // Fallback para página de dados
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {showReadOnlyAlert && isEffectivelyReadOnly && (
          <Alert variant="default" className="bg-amber-50 border-amber-300 text-amber-700">
            <Info className="h-4 w-4 !text-amber-600" />
            <AlertTitle>Modo Somente Leitura</AlertTitle>
            <AlertDescription>
              { fromQuoteId && displayedSeller && globalSelectedSeller !== displayedSeller && globalSelectedSeller !== ALL_SELLERS_OPTION
                ? `Para modificar e salvar esta venda (originada da proposta de ${displayedSeller}), por favor, selecione ${displayedSeller} no seletor do cabeçalho.`
                : editSaleId 
                  ? `Para modificar esta venda de ${displayedSeller}, por favor, selecione ${displayedSeller} no seletor do cabeçalho.`
                  : "Para inserir uma nova venda, por favor, selecione um vendedor específico (SERGIO ou RODRIGO) no seletor do cabeçalho."
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
                      selected={field.value || undefined} 
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
              {editSaleId ? "Vendedor original da venda." : (fromQuoteId ? `Vendedor da proposta: ${displayedSeller}` : "Definido no cabeçalho.")}
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
        </div>

        <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4 border-t">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              form.reset({ 
                date: undefined,
                company: undefined,
                project: '',
                os: '',
                area: undefined,
                clientService: '',
                salesValue: undefined,
                status: undefined,
                payment: undefined,
              });
              // Reset to default view: new sale with current date
              if(!editSaleId && !fromQuoteId) {
                 form.setValue('date', new Date(), { shouldValidate: true, shouldDirty: true });
              } else if (editSaleId) { // If was editing, go back to edit search page
                 router.push('/editar-venda');
              } else if (fromQuoteId) { // If was converting, go back to new sale page (clears query param)
                 router.push('/inserir-venda');
              }
            }}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Limpar / Cancelar
          </Button>
          <Button type="submit"
            disabled={isEffectivelyReadOnly || isSubmitting}
            className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground">
            <Save className="mr-2 h-4 w-4" />
            {isSubmitting ? 'Salvando...' : (editSaleId ? 'Atualizar Venda' : 'Salvar Venda')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
