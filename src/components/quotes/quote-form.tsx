
// src/components/quotes/quote-form.tsx
"use client";
import type React from 'react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { QuoteFormSchema, type QuoteFormData } from '@/lib/schemas';
import { AREA_OPTIONS, PROPOSAL_STATUS_OPTIONS, CONTACT_SOURCE_OPTIONS, COMPANY_OPTIONS, SELLERS, ALL_SELLERS_OPTION, FOLLOW_UP_DAYS_OPTIONS, PROPOSAL_NOTIFICATION_EMAILS } from '@/lib/constants';
import type { Seller, FollowUpDaysOptionValue } from '@/lib/constants';
import { useQuotes } from '@/hooks/use-quotes';
import { useSales } from '@/hooks/use-sales'; // Para pegar o vendedor global
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CalendarIcon, DollarSign, Save, RotateCcw, Info, BellRing, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO, addDays } from 'date-fns';
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
      proposalDate: undefined, 
      validityDate: undefined,
      company: undefined,
      area: undefined,
      contactSource: undefined,
      description: '',
      proposedValue: undefined,
      status: "Pendente",
      notes: '',
      followUpDaysOffset: 0, // 'Não agendar' por padrão
      sendProposalNotification: false,
    },
  });

  useEffect(() => {
    if (editMode && quoteToEdit) {
      let followUpDaysOffsetValue: FollowUpDaysOptionValue = 0;
      if (quoteToEdit.followUpDate && quoteToEdit.proposalDate) {
        const proposalD = parseISO(quoteToEdit.proposalDate);
        const followUpD = parseISO(quoteToEdit.followUpDate);
        const diffDays = Math.round((followUpD.getTime() - proposalD.getTime()) / (1000 * 60 * 60 * 24));
        
        const validOffsets = FOLLOW_UP_DAYS_OPTIONS.map(opt => opt.value);
        if (validOffsets.includes(diffDays as FollowUpDaysOptionValue)) {
            followUpDaysOffsetValue = diffDays as FollowUpDaysOptionValue;
        }
      }

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
        followUpDaysOffset: followUpDaysOffsetValue,
        sendProposalNotification: quoteToEdit.sendProposalNotification || false,
      });
      setDisplayedSeller(quoteToEdit.seller);
    } else if (!editMode) {
      form.reset({ 
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
        followUpDaysOffset: 0,
        sendProposalNotification: false,
      });
      form.setValue('proposalDate', new Date(), { shouldValidate: true, shouldDirty: true });
      
      if (SELLERS.includes(globalSelectedSeller as Seller)) {
        setDisplayedSeller(globalSelectedSeller as Seller);
      } else {
        setDisplayedSeller(ALL_SELLERS_OPTION);
      }
    }
  }, [quoteToEdit, editMode, form, globalSelectedSeller]);

  const triggerProposalEmailNotification = (quote: Quote, isUpdate: boolean) => {
    const recipients = PROPOSAL_NOTIFICATION_EMAILS.join(',');
    const action = isUpdate ? 'Atualizada' : 'Registrada';
    const subject = `Proposta Comercial ${action}: ${quote.clientName} / ${quote.description.substring(0,30)}...`;
    const appBaseUrl = window.location.origin;
    const proposalManagementLink = `${appBaseUrl}/propostas/gerenciar`;

    const body = `
Prezados,

Uma proposta comercial foi ${action.toLowerCase()} no sistema:

Detalhes da Proposta:
--------------------------------------------------
ID da Proposta: ${quote.id}
Cliente: ${quote.clientName}
Data da Proposta: ${format(parseISO(quote.proposalDate), 'dd/MM/yyyy', { locale: ptBR })}
${quote.validityDate ? `Data de Validade: ${format(parseISO(quote.validityDate), 'dd/MM/yyyy', { locale: ptBR })}\n` : ''}
Vendedor: ${quote.seller}
Empresa: ${quote.company}
Área: ${quote.area}
Valor Proposto: ${quote.proposedValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
Status: ${quote.status}
Descrição: ${quote.description}
${quote.notes ? `Observações: ${quote.notes}\n` : ''}
${quote.followUpDate ? `Data de Follow-up Agendada: ${format(parseISO(quote.followUpDate), 'dd/MM/yyyy', { locale: ptBR })}\n` : ''}
--------------------------------------------------

Acesse a aplicação para mais detalhes: ${appBaseUrl}
Gerenciar propostas: ${proposalManagementLink}

Atenciosamente,
Sistema de Controle de Vendas ENGEAR
    `;

    const mailtoLink = `mailto:${recipients}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink, '_blank');
    toast({ title: "Preparando E-mail", description: "Seu cliente de e-mail foi aberto para enviar a notificação da proposta." });
  };


  const onSubmit = async (data: QuoteFormData) => {
    console.log('QuoteForm onSubmit triggered. isEffectivelyReadOnly:', isEffectivelyReadOnly, 'globalSelectedSeller:', globalSelectedSeller);
    console.log('Form values (data from react-hook-form):', data);
    console.log('Form validation errors (from react-hook-form state):', form.formState.errors);

    if (isEffectivelyReadOnly && !editMode) { 
       toast({
        title: "Ação Não Permitida",
        description: "Selecione um vendedor específico (SERGIO ou RODRIGO) no seletor do cabeçalho para criar uma nova proposta.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    if (!editMode) {
      if (!SELLERS.includes(globalSelectedSeller as Seller)) {
        console.error('Invalid global seller for new quote:', globalSelectedSeller);
        toast({
          title: "Erro de Validação do Vendedor",
          description: "Para criar uma nova proposta, por favor, selecione SERGIO ou RODRIGO no seletor global do cabeçalho.",
          variant: "destructive",
        });
        setIsSubmitting(false); 
        return;
      }
    }
    
    if (!data.proposalDate) {
        toast({ title: "Erro de Validação", description: "Data da proposta é obrigatória.", variant: "destructive" });
        setIsSubmitting(false);
        return;
    }


    setIsSubmitting(true);
    let sellerForPayload: Seller;
    if(editMode && quoteToEdit) {
        sellerForPayload = quoteToEdit.seller;
    } else if (SELLERS.includes(globalSelectedSeller as Seller)) {
        sellerForPayload = globalSelectedSeller as Seller;
    } else {
        console.error('onSubmit: Cannot determine seller for new quote. Global seller:', globalSelectedSeller);
        toast({ title: "Erro Interno", description: "Não foi possível determinar o vendedor para a nova proposta.", variant: "destructive" });
        setIsSubmitting(false);
        return;
    }
    console.log('Seller for payload:', sellerForPayload);


    const quotePayload = {
      ...data,
      seller: sellerForPayload, // Definido explicitamente aqui
      proposalDate: format(data.proposalDate, 'yyyy-MM-dd'), 
      validityDate: data.validityDate ? format(data.validityDate, 'yyyy-MM-dd') : undefined,
      proposedValue: Number(data.proposedValue) || 0,
    };
    console.log('Quote payload to be sent to context:', quotePayload);

    try {
      let savedQuote: Quote | undefined;
      if (editMode && quoteToEdit) {
        savedQuote = updateQuote(quoteToEdit.id, quotePayload as Partial<Omit<Quote, 'id' | 'createdAt' | 'updatedAt' | 'seller' | 'followUpDate'>> & { followUpDaysOffset?: FollowUpDaysOptionValue, sendProposalNotification?: boolean });
        toast({ title: "Sucesso!", description: "Proposta atualizada com sucesso." });
      } else {
        savedQuote = addQuote(quotePayload as Omit<Quote, 'id' | 'createdAt' | 'updatedAt' | 'seller' | 'followUpDate'> & { followUpDaysOffset?: FollowUpDaysOptionValue, sendProposalNotification?: boolean });
        toast({ title: "Sucesso!", description: "Nova proposta registrada com sucesso." });
      }
      
      if (savedQuote && savedQuote.sendProposalNotification) {
        triggerProposalEmailNotification(savedQuote, editMode);
      }

      form.reset({
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
        followUpDaysOffset: 0,
        sendProposalNotification: false,
      });
      if (!editMode) {
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
      console.error("Detailed error saving quote in QuoteForm onSubmit:", error);
      toast({ 
        title: "Erro Crítico ao Salvar Proposta", 
        description: `Ocorreu um erro inesperado: ${(error as Error).message}. Verifique o console para mais detalhes.`, 
        variant: "destructive" 
      });
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
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
              {editMode ? "Vendedor original da proposta." : "Definido no cabeçalho."}
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
                        disabled={(editMode && isEffectivelyReadOnly) || isSubmitting}
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
                        initialFocus 
                        disabled={(date) => date > new Date() || (editMode && isEffectivelyReadOnly) || isSubmitting} 
                    />
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
                        disabled={(date) => date < (form.getValues("proposalDate") || new Date()) || isEffectivelyReadOnly || isSubmitting} />
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
              <FormItem>
                <FormLabel>Status da Proposta</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={isEffectivelyReadOnly || isSubmitting}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Selecione o Status" /></SelectTrigger></FormControl>
                  <SelectContent>{PROPOSAL_STATUS_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
          
        <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição/Escopo da Proposta</FormLabel>
                <FormControl>
                  <Textarea placeholder="Detalhe o que está sendo proposto..." {...field} disabled={isEffectivelyReadOnly || isSubmitting} rows={3} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <FormField
                control={form.control}
                name="followUpDaysOffset"
                render={({ field }) => (
                <FormItem>
                    <FormLabel className="flex items-center"><BellRing className="mr-2 h-4 w-4" /> Follow-up</FormLabel>
                    <Select 
                        onValueChange={(value) => field.onChange(parseInt(value,10))} 
                        value={String(field.value ?? 0)} 
                        disabled={isEffectivelyReadOnly || isSubmitting}
                    >
                    <FormControl><SelectTrigger><SelectValue placeholder="Agendar follow-up" /></SelectTrigger></FormControl>
                    <SelectContent>{FOLLOW_UP_DAYS_OPTIONS.map(opt => <SelectItem key={opt.value} value={String(opt.value)}>{opt.label}</SelectItem>)}</SelectContent>
                    </Select>
                    <FormDescription>Define um lembrete de follow-up (interno).</FormDescription>
                    <FormMessage />
                </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="sendProposalNotification"
                render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 mt-4 md:mt-0 shadow-sm bg-muted/30">
                     <FormControl>
                        <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={isEffectivelyReadOnly || isSubmitting}
                        />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                    <FormLabel className="flex items-center"><Mail className="mr-2 h-4 w-4 text-primary" />Notificar equipe por e-mail?</FormLabel>
                    <FormDescription>
                        Se marcado, um e-mail com os dados da proposta será preparado para envio.
                    </FormDescription>
                    </div>
                </FormItem>
                )}
            />
        </div>

        <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Observações (Opcional)</FormLabel>
                <FormControl>
                  <Textarea placeholder="Qualquer informação adicional relevante..." {...field} disabled={isEffectivelyReadOnly || isSubmitting} rows={3} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
        />

        <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4 border-t">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              form.reset({ 
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
                followUpDaysOffset: 0,
                sendProposalNotification: false,
              });
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
            disabled={(isEffectivelyReadOnly && !editMode) || isSubmitting} 
            className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground">
            <Save className="mr-2 h-4 w-4" />
            {isSubmitting ? 'Salvando...' : (editMode ? 'Atualizar Proposta' : 'Salvar Proposta')}
          </Button>
        </div>
      </form>
    </Form>
  );
}

