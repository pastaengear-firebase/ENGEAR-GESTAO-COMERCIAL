
// src/components/sales/sales-form.tsx
"use client";
import type React from 'react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SalesFormSchema, type SalesFormData } from '@/lib/schemas';
import { AREA_OPTIONS, STATUS_OPTIONS, SELLERS, COMPANY_OPTIONS } from '@/lib/constants';
import { useSales } from '@/hooks/use-sales';
import { useQuotes } from '@/hooks/use-quotes'; // Para buscar e atualizar propostas
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
  const { addSale, updateSale, selectedSeller, isReadOnly } = useSales();
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
      date: undefined, 
      company: undefined,
      project: '',
      os: '',
      area: undefined,
      clientService: '',
      salesValue: undefined,
      status: undefined,
      payment: 0,
      summary: '',
      sendSaleNotification: false,
    },
  });

  useEffect(() => {
    const initializeForm = () => {
      let formIsReadOnly = isReadOnly;
      if (editMode && saleToEdit) {
        if (saleToEdit) {
          form.reset({
            date: parseISO(saleToEdit.date), 
            company: saleToEdit.company,
            project: saleToEdit.project,
            os: saleToEdit.os || '',
            area: saleToEdit.area,
            clientService: saleToEdit.clientService,
            salesValue: saleToEdit.salesValue,
            status: saleToEdit.status,
            payment: saleToEdit.payment,
            summary: saleToEdit.summary || '',
            sendSaleNotification: false, // Don't send email on edit
          });
          setOriginatingSeller(saleToEdit.seller);
          if (selectedSeller !== saleToEdit.seller) formIsReadOnly = true;
        }
      } else if (fromQuoteId) {
        const quoteToConvert = getQuoteByIdFromContext(fromQuoteId);
        if (quoteToConvert) {
          if (selectedSeller !== quoteToConvert.seller) {
             toast({
                title: "Aviso de Vendedor",
                description: `Para converter a proposta de ${quoteToConvert.seller}, o usuário logado deve ser o mesmo. O formulário está em modo leitura.`,
                variant: "default",
                duration: 7000,
             });
             formIsReadOnly = true;
          }
          form.reset({
            date: new Date(),
            company: quoteToConvert.company,
            project: `${quoteToConvert.clientName} - ${quoteToConvert.description.substring(0,50)}${quoteToConvert.description.length > 50 ? '...' : ''}`,
            os: '',
            area: quoteToConvert.area,
            clientService: quoteToConvert.clientName,
            salesValue: quoteToConvert.proposedValue,
            status: "Á INICAR",
            payment: 0,
            summary: quoteToConvert.description, // Pre-fill summary from quote description
            sendSaleNotification: false,
          });
          setOriginatingSeller(quoteToConvert.seller);
        } else {
          toast({ title: "Erro", description: "Proposta não encontrada para conversão.", variant: "destructive" });
          if(onFormSubmit) onFormSubmit();
        }
      } else { // Novo formulário
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
          sendSaleNotification: false,
        });
        setOriginatingSeller(null);
      }
      
      // Forçar desabilitação do formulário se necessário
      if(formIsReadOnly) {
        Object.keys(form.getValues()).forEach((key: any) => {
            form.control.getFieldState(key).isDirty = false;
        });
      }
    };
    initializeForm();
  }, [editMode, saleToEdit, fromQuoteId, getQuoteByIdFromContext, form, toast, onFormSubmit, isReadOnly, selectedSeller]);


  const triggerEmailNotification = (sale: Sale) => {
    if (loadingSettings || !appSettings.enableSalesEmailNotifications || appSettings.salesNotificationEmails.length === 0) {
      return;
    }

    const recipients = appSettings.salesNotificationEmails.join(',');
    
    // Truncate long strings for the subject to avoid overly long mailto links
    const subjectProject = sale.project.length > 25 ? `${sale.project.substring(0, 22)}...` : sale.project;
    const subjectClient = sale.clientService.length > 25 ? `${sale.clientService.substring(0, 22)}...` : sale.clientService;
    const subjectValue = sale.salesValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    
    const subject = `NOVA VENDA - ${sale.company}, ${subjectProject}, OS ${sale.os || 'N/A'}, ${subjectClient}, ${subjectValue}`;
    const appBaseUrl = window.location.origin;
    const saleEditLink = `${appBaseUrl}/vendas/gerenciar?editId=${sale.id}`;

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

Resumo da Venda/Serviço:
--------------------------------------------------
${sale.summary || "Nenhum resumo fornecido."}
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
    let formIsReadOnly = isReadOnly;
    if((editMode || fromQuoteId) && selectedSeller !== originatingSeller) {
        formIsReadOnly = true;
    }

    if (formIsReadOnly) {
       let message = "Faça login com um usuário de vendas autorizado para salvar.";
       if (originatingSeller) {
           message = `Apenas o vendedor ${originatingSeller} pode modificar este item.`;
       }
      toast({ title: "Ação Não Permitida", description: message, variant: "destructive" });
      return;
    }
    if (!data.date) { 
        toast({ title: "Erro de Validação", description: "Data da venda é obrigatória.", variant: "destructive" });
        return;
    }

    setIsSubmitting(true);
    setIsSaved(false);

    const salePayload: Omit<Sale, 'id' | 'createdAt' | 'updatedAt' | 'seller' | 'sellerUid'> = {
      ...data,
      date: format(data.date, 'yyyy-MM-dd'),
      salesValue: Number(Number(data.salesValue || 0).toFixed(2)),
      payment: Number(Number(data.payment || 0).toFixed(2)),
    };

    try {
      if (editMode && saleToEdit) {
        await updateSale(saleToEdit.id, salePayload);
      } else {
        const newSale = await addSale(salePayload);
        if (data.sendSaleNotification) {
          triggerEmailNotification(newSale);
        }
        
        if (fromQuoteId) {
            await updateQuoteStatus(fromQuoteId, { status: "Aceita" } as any);
        }
      }

      setIsSaved(true);

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
        sendSaleNotification: false,
      });

      if (onFormSubmit) {
        onFormSubmit();
      }

    } catch (error) {
      console.error("Error saving sale:", error);
      toast({ title: "Erro ao Salvar", description: (error as Error).message || "Não foi possível salvar a venda.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setIsSaved(false), 2000);
    }
  };
  
  const finalIsReadOnly = isReadOnly || ((editMode || fromQuoteId) && selectedSeller !== originatingSeller);


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {showReadOnlyAlert && finalIsReadOnly && (
          <Alert variant="default" className="bg-amber-50 border-amber-300 text-amber-700">
            <Info className="h-4 w-4 !text-amber-600" />
            <AlertTitle>Modo Somente Leitura</AlertTitle>
            <AlertDescription>
              { originatingSeller
                ? `Apenas o vendedor ${originatingSeller} pode modificar este item.`
                : "Faça login com uma conta de vendedor autorizada para habilitar o formulário."
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
                        disabled={finalIsReadOnly || isSubmitting}
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
                      disabled={(date) => date > new Date() || date < new Date("1900-01-01") || finalIsReadOnly || isSubmitting}
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
            <Select value={originatingSeller || selectedSeller} disabled>
              <FormControl>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                 {SELLERS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <FormDescription>
              {editMode || fromQuoteId ? `Vendedor original: ${originatingSeller}` : "Vendedor definido pelo usuário logado."}
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
                  disabled={finalIsReadOnly || isSubmitting}
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
                <FormLabel>Projeto</FormLabel>
                <FormControl>
                  <Input placeholder="Nome ou Descrição do Projeto" {...field} disabled={finalIsReadOnly || isSubmitting} />
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
                  <Input placeholder="Número da O.S., 0000 ou deixe em branco" {...field} disabled={finalIsReadOnly || isSubmitting} />
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
                <Select onValueChange={field.onChange} value={field.value} disabled={finalIsReadOnly || isSubmitting}>
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
                  <Input placeholder="Tipo de Cliente ou Serviço Prestado" {...field} disabled={finalIsReadOnly || isSubmitting} />
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
                      onChange={e => { const val = e.target.value; field.onChange(val === '' ? undefined : parseFloat(val)); }}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                      disabled={finalIsReadOnly || isSubmitting}
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
                <Select onValueChange={field.onChange} value={field.value} disabled={finalIsReadOnly || isSubmitting}>
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
                      onChange={e => { const val = e.target.value; field.onChange(val === '' ? undefined : parseFloat(val)); }}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                      disabled={finalIsReadOnly || isSubmitting}
                      step="0.01"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
           <FormField
              control={form.control}
              name="summary"
              render={({ field }) => (
                  <FormItem>
                  <FormLabel>Resumo da Venda/Serviço</FormLabel>
                  <FormControl>
                      <Textarea
                      placeholder="Insira um resumo rápido da venda e do serviço a ser executado..."
                      {...field}
                      disabled={finalIsReadOnly || isSubmitting}
                      rows={4}
                      />
                  </FormControl>
                  <FormMessage />
                  </FormItem>
              )}
          />

          {!editMode && (
            <FormField
              control={form.control}
              name="sendSaleNotification"
              render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm bg-muted/30">
                  <FormControl>
                  <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={finalIsReadOnly || isSubmitting || loadingSettings || !appSettings.enableSalesEmailNotifications}
                  />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                  <FormLabel className="flex items-center"><Mail className="mr-2 h-4 w-4 text-primary" />ENVIAR E-MAIL COM A NOVA VENDA</FormLabel>
                  <FormDescription>
                      {loadingSettings ? "Carregando config..." : 
                      !appSettings.enableSalesEmailNotifications ? "Notificações de vendas desabilitadas em Configurações." :
                      "Se marcado, um e-mail com os dados da venda será preparado para envio à equipe."
                      }
                  </FormDescription>
                  </div>
              </FormItem>
              )}
            />
          )}
        </div>


        <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4 border-t">
          <Button type="button" variant="ghost" onClick={() => {
              form.reset({ date: new Date(), company: undefined, project: '', os: '', area: undefined, clientService: '', salesValue: undefined, status: undefined, payment: 0, summary: '', sendSaleNotification: false });
              if (onFormSubmit) onFormSubmit();
            }}
            disabled={isSubmitting} className="w-full sm:w-auto">
            <RotateCcw className="mr-2 h-4 w-4" />
            {editMode ? 'Cancelar Edição' : 'Limpar Formulário'}
          </Button>
          <Button type="submit" disabled={finalIsReadOnly || isSubmitting || isSaved} className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground">
            {isSaved ? <Check className="mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
            {isSubmitting ? 'Salvando...' : isSaved ? 'Salvo!' : (editMode ? 'Atualizar Venda' : 'Salvar Venda')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
