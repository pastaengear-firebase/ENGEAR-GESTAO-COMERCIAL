// components/quotes/quote-form.tsx
"use client";
import type React from 'react';
import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { QuoteFormSchema, type QuoteFormData } from '@/lib/schemas';
import { AREA_OPTIONS, PROPOSAL_STATUS_OPTIONS, CONTACT_SOURCE_OPTIONS, COMPANY_OPTIONS, SELLERS, FOLLOW_UP_OPTIONS, ALL_SELLERS_OPTION } from '@/lib/constants';
import { useQuotes } from '@/hooks/use-quotes';
import { useSales } from '@/hooks/use-sales';
import { useSettings } from '@/hooks/use-settings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CalendarIcon, DollarSign, Save, RotateCcw, Info, Check } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Quote } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

export default function QuoteForm({ quoteToEdit, onFormSubmit, showReadOnlyAlert }: { quoteToEdit?: Quote | null; onFormSubmit?: () => void; showReadOnlyAlert?: boolean }) {
  const { addQuote, updateQuote } = useQuotes();
  const { userRole } = useSales();
  const { settings: appSettings } = useSettings(); 
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const editMode = !!quoteToEdit;
  // NOVA REGRA: Bloqueia se for "Aceita" ou se o vendedor não for o dono
  const isAccepted = quoteToEdit?.status === "Aceita";
  const isFormDisabled = (userRole === ALL_SELLERS_OPTION && !editMode) || (editMode && userRole !== quoteToEdit.seller) || isAccepted;

  const form = useForm<QuoteFormData>({
    resolver: zodResolver(QuoteFormSchema),
    defaultValues: {
      clientName: '', proposalDate: new Date(), description: '', proposedValue: 0, status: "Enviada", notes: '', followUpOption: '0',
    },
  });

  // Função Auditada para Sincronização de Selects
  const syncQuoteFields = useCallback((data: Quote) => {
    form.setValue('clientName', data.clientName || '');
    form.setValue('description', data.description || '');
    form.setValue('proposedValue', data.proposedValue || 0);
    form.setValue('notes', data.notes || '');
    form.setValue('status', (data.status as any) || "Enviada");
    
    // Força preenchimento dos Selects limpando espaços em branco
    if (data.company) form.setValue('company', data.company.trim() as any);
    if (data.area) form.setValue('area', data.area.trim() as any);
    if (data.contactSource) form.setValue('contactSource', data.contactSource.trim() as any);
    
    if (data.proposalDate) form.setValue('proposalDate', parseISO(data.proposalDate));
    if (data.validityDate) form.setValue('validityDate', parseISO(data.validityDate));
    
    // Follow-up
    const fup = data.followUpSequence || '0';
    form.setValue('followUpOption', fup as any);
  }, [form]);

  useEffect(() => {
    if (editMode && quoteToEdit) {
      syncQuoteFields(quoteToEdit);
    } else {
      form.reset({
        clientName: '', proposalDate: new Date(), status: "Enviada", proposedValue: 0, followUpOption: '0',
        sendProposalNotification: appSettings?.enableProposalsEmailNotifications
      });
    }
  }, [quoteToEdit, editMode, syncQuoteFields, appSettings]);

  const onSubmit = async (data: QuoteFormData) => {
    if (isFormDisabled) return;
    setIsSubmitting(true);
    try {
      const payload = {
        ...data,
        proposalDate: format(data.proposalDate, 'yyyy-MM-dd'),
        validityDate: data.validityDate ? format(data.validityDate, 'yyyy-MM-dd') : undefined,
        proposedValue: Number(data.proposedValue),
      };

      if (editMode && quoteToEdit) {
        await updateQuote(quoteToEdit.id, payload as any);
      } else {
        await addQuote(payload as any);
      }
      setIsSaved(true);
      toast({ title: "Sucesso!", description: "Proposta salva." });
      if (onFormSubmit) onFormSubmit();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally { setIsSubmitting(false); }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {isAccepted && (
          <Alert className="bg-blue-50 border-blue-200 text-blue-800">
            <Info className="h-4 w-4" />
            <AlertTitle>Proposta Aceita</AlertTitle>
            <AlertDescription>Esta proposta já foi convertida em venda e não pode mais ser editada.</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <FormField control={form.control} name="clientName" render={({ field }) => (
            <FormItem><FormLabel>Nome do Cliente</FormLabel><FormControl><Input {...field} disabled={isFormDisabled} /></FormControl><FormMessage /></FormItem>
          )} />

          <FormField control={form.control} name="company" render={({ field }) => (
            <FormItem>
              <FormLabel>Empresa</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ""}>
                <FormControl><SelectTrigger><SelectValue placeholder="Selecione a Empresa" /></SelectTrigger></FormControl>
                <SelectContent>{COMPANY_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="area" render={({ field }) => (
            <FormItem>
              <FormLabel>Área</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ""}>
                <FormControl><SelectTrigger><SelectValue placeholder="Selecione a Área" /></SelectTrigger></FormControl>
                <SelectContent>{AREA_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="contactSource" render={({ field }) => (
            <FormItem>
              <FormLabel>Fonte do Contato</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ""}>
                <FormControl><SelectTrigger><SelectValue placeholder="Selecione a Fonte" /></SelectTrigger></FormControl>
                <SelectContent>{CONTACT_SOURCE_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="proposedValue" render={({ field }) => (
            <FormItem><FormLabel>Valor (R$)</FormLabel>
              <FormControl><div className="relative"><DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" /><Input type="number" className="pl-8" {...field} disabled={isFormDisabled} /></div></FormControl>
            <FormMessage /></FormItem>
          )} />

          <FormField control={form.control} name="status" render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ""}>
                <FormControl><SelectTrigger><SelectValue placeholder="Selecione o Status" /></SelectTrigger></FormControl>
                <SelectContent>{PROPOSAL_STATUS_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem><FormLabel>Descrição</FormLabel><FormControl><Textarea {...field} disabled={isFormDisabled} rows={3} /></FormControl><FormMessage /></FormItem>
        )} />

        <div className="flex justify-end space-x-3">
          <Button type="button" variant="ghost" onClick={() => form.reset()} disabled={isSubmitting || isFormDisabled}><RotateCcw className="mr-2 h-4 w-4" /> Limpar</Button>
          <Button type="submit" disabled={isFormDisabled || isSubmitting} className="bg-primary">{isSubmitting ? "Salvando..." : "Salvar Proposta"}</Button>
        </div>
      </form>
    </Form>
  );
}