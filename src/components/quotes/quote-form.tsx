
// src/components/quotes/quote-form.tsx
"use client";
import type React from 'react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { QuoteFormSchema, type QuoteFormData } from '@/lib/schemas';
import { AREA_OPTIONS, PROPOSAL_STATUS_OPTIONS, CONTACT_SOURCE_OPTIONS, COMPANY_OPTIONS, SELLERS, FOLLOW_UP_OPTIONS, ALL_SELLERS_OPTION } from '@/lib/constants';
import type { Seller, FollowUpOptionValue } from '@/lib/constants';
import { useQuotes } from '@/hooks/use-quotes';
import { useSales } from '@/hooks/use-sales';
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
import { CalendarIcon, DollarSign, Save, RotateCcw, Info, BellRing, Check, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO, addDays, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Quote } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface QuoteFormProps {
  quoteToEdit?: Quote | null;
  onFormSubmit?: () => void; 
  showReadOnlyAlert?: boolean;
}

export default function QuoteForm({ quoteToEdit, onFormSubmit, showReadOnlyAlert }: QuoteFormProps) {
  const { addQuote, updateQuote } = useQuotes();
  const { userRole } = useSales();
  const { settings: appSettings, loadingSettings } = useSettings(); 
  const { toast } = useToast();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const editMode = !!quoteToEdit;

  const isFormDisabled = (userRole === ALL_SELLERS_OPTION && !editMode) || (editMode && userRole !== quoteToEdit.seller);

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
      status: "Enviada",
      notes: '',
      followUpOption: '0', 
      sendProposalNotification: false,
    },
  });

  useEffect(() => {
    if (editMode && quoteToEdit) {
      let followUpOptionValue: FollowUpOptionValue = '0';
      if (quoteToEdit.followUpSequence) {
        followUpOptionValue = quoteToEdit.followUpSequence as FollowUpOptionValue;
      } else if (quoteToEdit.followUpDate) {
        const proposalD = parseISO(quoteToEdit.proposalDate);
        const followUpD = parseISO(quoteToEdit.followUpDate);
        const diff = differenceInDays(followUpD, proposalD);
        const closestOption = FOLLOW_UP_OPTIONS.find(opt => !opt.value.includes(',') && parseInt(opt.value) === diff);
        if (closestOption) {
          followUpOptionValue = closestOption.value;
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
        followUpOption: followUpOptionValue,
        sendProposalNotification: false,
      });
    } else if (!editMode) {
      form.reset({ 
        clientName: '',
        proposalDate: new Date(), 
        validityDate: undefined,
        company: undefined,
        area: undefined,
        contactSource: undefined,
        description: '',
        proposedValue: undefined,
        status: "Enviada",
        notes: '',
        followUpOption: '0',
        sendProposalNotification: appSettings.enableProposalsEmailNotifications, // Default to config
      });
    }
  }, [quoteToEdit, editMode, form, appSettings.enableProposalsEmailNotifications]);

  const triggerProposalEmailNotification = (quote: Quote) => {
    if (loadingSettings || !appSettings.enableProposalsEmailNotifications || appSettings.proposalsNotificationEmails.length === 0) {
      return;
    }

    const recipients = appSettings.proposalsNotificationEmails.join(',');
    
    const subjectClient = quote.clientName && quote.clientName.length > 25 ? `${quote.clientName.substring(0, 22)}...` : (quote.clientName || "N/A");
    const subjectValue = (quote.proposedValue || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    
    const subject = `NOVA PROPOSTA - Cliente ${subjectClient}, Valor ${subjectValue}, Vendedor ${quote.seller}`;
    const appBaseUrl = window.location.origin;
    const quoteLink = `${appBaseUrl}/propostas/gerenciar`; // Link to the management page

    const body = `
Uma nova proposta foi registrada no sistema:

Detalhes da Proposta:
--------------------------------------------------
ID: ${quote.id}
Data da Proposta: ${format(parseISO(quote.proposalDate), 'dd/MM/yyyy', { locale: ptBR })}
Vendedor: ${quote.seller}
Cliente: ${quote.clientName || 'Não informado'}
Valor Proposto: ${(quote.proposedValue || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
Status: ${quote.status}
--------------------------------------------------

Descrição do Escopo:
--------------------------------------------------
${quote.description || "Nenhuma descrição fornecida."}
--------------------------------------------------

Acesse a aplicação para gerenciar as propostas: ${quoteLink}

Atenciosamente,
Sistema de Controle de Vendas ENGEAR
    `;

    const mailtoLink = `mailto:${recipients}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink, '_blank');
  };

  const onSubmit = async (data: QuoteFormData) => {
    if (isFormDisabled) { 
      toast({
        title: "Ação Não Permitida",
        description: "Seu perfil de usuário não tem permissão para salvar esta proposta.",
        variant: "destructive",
      });
      return;
    }
    
    if (!data.proposalDate) {
        toast({ title: "Erro de Validação", description: "Data da proposta é obrigatória.", variant: "destructive" });
        return;
    }

    setIsSubmitting(true);
    setIsSaved(false);
    
    const { validityDate, ...restOfData } = data;

    const quotePayload = {
      ...restOfData,
      proposalDate: format(data.proposalDate, 'yyyy-MM-dd'),
      ...(validityDate && { validityDate: format(validityDate, 'yyyy-MM-dd') }),
      proposedValue: Number(Math.round(+(data.proposedValue || 0) + 'e+2') + 'e-2'),
    };

    try {
      if (editMode && quoteToEdit) {
        await updateQuote(quoteToEdit.id, quotePayload as any);
      } else {
        const newQuote = await addQuote(quotePayload as any);
        if (data.sendProposalNotification) {
          triggerProposalEmailNotification(newQuote);
        }
      }
      
      setIsSaved(true);

      if (!editMode) {
        form.reset({
          clientName: '',
          proposalDate: new Date(), 
          validityDate: undefined,
          company: undefined,
          area: undefined,
          contactSource: undefined,
          description: '',
          proposedValue: undefined,
          status: "Enviada",
          notes: '',
          followUpOption: '0',
          sendProposalNotification: appSettings.enableProposalsEmailNotifications,
        });
      }
      
      if (onFormSubmit) {
        onFormSubmit();
      }

    } catch(err: any) {
       toast({ title: "Erro ao Salvar", description: err.message || "Não foi possível salvar a proposta.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setIsSaved(false), 2000);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {showReadOnlyAlert && isFormDisabled && (
          <Alert variant="default" className="bg-amber-50 border-amber-300 text-amber-700">
            <Info className="h-4 w-4 !text-amber-600" />
            <AlertTitle>Modo Somente Leitura</AlertTitle>
            <AlertDescription>
              Para {editMode ? 'modificar esta proposta' : 'criar uma nova proposta'}, por favor, faça login com uma conta de vendedor autorizada.
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
                  <Input 
                    placeholder="Nome completo ou Razão Social" 
                    {...field} 
                    disabled={isFormDisabled || isSubmitting} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormItem>
            <FormLabel>Vendedor</FormLabel>
            <Select value={editMode ? quoteToEdit.seller : (userRole === 'EQUIPE COMERCIAL' ? '' : userRole)} disabled>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Vendedor não definido"/>
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {SELLERS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <FormDescription>
              Vendedor definido pelo seu login.
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
                        selected={field.value || undefined}
                        onSelect={field.onChange} 
                        initialFocus 
                        disabled={(date) => date > new Date() || isFormDisabled || isSubmitting} 
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
                        selected={field.value || undefined}
                        onSelect={field.onChange} 
                        disabled={(date) => date < (form.getValues("proposalDate") || new Date()) || isFormDisabled || isSubmitting} />
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
                <Select onValueChange={field.onChange} value={field.value} disabled={isFormDisabled || isSubmitting}>
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
                <Select onValueChange={field.onChange} value={field.value} disabled={isFormDisabled || isSubmitting}>
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
                <Select onValueChange={field.onChange} value={field.value} disabled={isFormDisabled || isSubmitting}>
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
                <FormLabel>Status da Proposta</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={isFormDisabled || isSubmitting}>
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
                  <Textarea placeholder="Detalhe o que está sendo proposto..." {...field} disabled={isFormDisabled || isSubmitting} rows={3} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <FormField
                control={form.control}
                name="followUpOption"
                render={({ field }) => (
                <FormItem>
                    <FormLabel className="flex items-center"><BellRing className="mr-2 h-4 w-4" /> Acompanhamento (Follow-up)</FormLabel>
                    <Select 
                        onValueChange={field.onChange} 
                        value={String(field.value ?? '0')} 
                        disabled={isFormDisabled || isSubmitting}
                    >
                    <FormControl><SelectTrigger><SelectValue placeholder="Agendar follow-up" /></SelectTrigger></FormControl>
                    <SelectContent>{FOLLOW_UP_OPTIONS.map(opt => <SelectItem key={opt.value} value={String(opt.value)}>{opt.label}</SelectItem>)}</SelectContent>
                    </Select>
                    <FormDescription>Define um lembrete único ou uma sequência de acompanhamentos.</FormDescription>
                    <FormMessage />
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
                  <Textarea placeholder="Qualquer informação adicional relevante..." {...field} disabled={isFormDisabled || isSubmitting} rows={3} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
        />

        {!editMode && (
          <FormField
            control={form.control}
            name="sendProposalNotification"
            render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm bg-muted/30">
                <FormControl>
                <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isFormDisabled || isSubmitting || loadingSettings || !appSettings.enableProposalsEmailNotifications}
                />
                </FormControl>
                <div className="space-y-1 leading-none">
                <FormLabel className="flex items-center"><Mail className="mr-2 h-4 w-4 text-primary" />ENVIAR E-MAIL COM A NOVA PROPOSTA</FormLabel>
                <FormDescription>
                    {loadingSettings ? "Carregando config..." : 
                    !appSettings.enableProposalsEmailNotifications ? "Notificações de propostas desabilitadas em Configurações." :
                    "Se marcado, um e-mail com os dados da proposta será preparado para envio à equipe."
                    }
                </FormDescription>
                </div>
            </FormItem>
            )}
          />
        )}


        <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4 border-t">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              form.reset({ 
                clientName: '',
                proposalDate: new Date(),
                validityDate: undefined,
                company: undefined,
                area: undefined,
                contactSource: undefined,
                description: '',
                proposedValue: undefined,
                status: "Enviada",
                notes: '',
                followUpOption: '0',
                sendProposalNotification: appSettings.enableProposalsEmailNotifications,
              });
              if (onFormSubmit && editMode) onFormSubmit(); 
            }}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            {editMode ? 'Cancelar Edição' : 'Limpar Formulário'}
          </Button>
          <Button type="submit"
            disabled={isFormDisabled || isSubmitting || isSaved} 
            className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground">
            {isSaved ? <Check className="mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
            {isSubmitting ? 'Salvando...' : isSaved ? 'Salvo!' : (editMode ? 'Atualizar Proposta' : 'Salvar Proposta')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
