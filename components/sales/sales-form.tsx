// components/sales/sales-form.tsx
"use client";
import type React from 'react';
import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SalesFormSchema, type SalesFormData } from '@/lib/schemas';
import { AREA_OPTIONS, STATUS_OPTIONS, COMPANY_OPTIONS, ALL_SELLERS_OPTION } from '@/lib/constants';
import { useSales } from '@/hooks/use-sales';
import { useQuotes } from '@/hooks/use-quotes'; 
import { useSettings } from '@/hooks/use-settings'; 
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, Save, RotateCcw, Check, Info } from 'lucide-react';
import type { Sale } from '@/lib/types';

export default function SalesForm({ saleToEdit, fromQuoteId, onFormSubmit }: { saleToEdit?: Sale | null; fromQuoteId?: string | null; onFormSubmit?: () => void }) {
  const { addSale, updateSale, userRole } = useSales();
  const { getQuoteById: getQuoteByIdFromContext, updateQuote: updateQuoteStatus } = useQuotes();
  const { settings: appSettings } = useSettings(); 
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const form = useForm<SalesFormData>({
    resolver: zodResolver(SalesFormSchema),
    defaultValues: {
      date: new Date(), project: '', os: '', clientService: '', salesValue: 0, payment: 0, summary: '',
    },
  });

  // Função auditada para forçar o preenchimento dos campos de Seleção
  const syncSelectFields = useCallback((data: any) => {
    if (!data) return;
    
    // Mapeamento direto de campos
    form.setValue('company', data.company || undefined);
    form.setValue('area', data.area || undefined);
    form.setValue('status', data.status || 'A INICIAR');
    form.setValue('clientService', data.clientService || data.clientName || '');
    form.setValue('salesValue', data.salesValue || data.proposedValue || 0);
    form.setValue('summary', data.summary || data.description || '');
    form.setValue('project', data.project || '');
    form.setValue('os', data.os || '');
    form.setValue('payment', data.payment || 0);
    
    if (data.date) {
        const dateObj = typeof data.date === 'string' ? parseISO(data.date) : data.date;
        form.setValue('date', dateObj);
    }
  }, [form]);

  useEffect(() => {
    if (saleToEdit) {
      syncSelectFields(saleToEdit);
    } else if (fromQuoteId) {
      const quote = getQuoteByIdFromContext(fromQuoteId);
      if (quote) syncSelectFields(quote);
    }
  }, [saleToEdit, fromQuoteId, getQuoteByIdFromContext, syncSelectFields]);

  const onSubmit = async (data: SalesFormData) => {
    setIsSubmitting(true);
    try {
      const payload = { 
        ...data, 
        date: format(data.date, 'yyyy-MM-dd'), 
        salesValue: Number(data.salesValue), 
        payment: Number(data.payment) 
      };

      if (saleToEdit) {
        await updateSale(saleToEdit.id, payload);
      } else {
        await addSale(payload);
        if (fromQuoteId) {
          // Muda para ACEITA para travar a proposta e contar no KPI
          await updateQuoteStatus(fromQuoteId, { status: "Aceita" });
        }
      }
      setIsSaved(true);
      toast({ title: "Sucesso!", description: "Dados registrados." });
      if (onFormSubmit) onFormSubmit();
    } catch (e) {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    } finally { setIsSubmitting(false); }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          <FormField control={form.control} name="project" render={({ field }) => (
            <FormItem><FormLabel>Projeto (máx 5 dígitos)</FormLabel><FormControl><Input {...field} maxLength={5} placeholder="0000" /></FormControl><FormMessage /></FormItem>
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

          <FormField control={form.control} name="clientService" render={({ field }) => (
            <FormItem><FormLabel>Cliente/Serviço</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />

          <FormField control={form.control} name="salesValue" render={({ field }) => (
            <FormItem><FormLabel>Valor da Venda</FormLabel>
                <FormControl><div className="relative"><DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" /><Input type="number" className="pl-8" {...field} /></div></FormControl>
                <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="status" render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ""}>
                <FormControl><SelectTrigger><SelectValue placeholder="Selecione o Status" /></SelectTrigger></FormControl>
                <SelectContent>{STATUS_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
        </div>
        
        <FormField control={form.control} name="summary" render={({ field }) => (
          <FormItem><FormLabel>Resumo</FormLabel><FormControl><Textarea {...field} rows={3} /></FormControl><FormMessage /></FormItem>
        )} />

        <Button type="submit" disabled={isSubmitting} className="w-full bg-primary">
          {isSubmitting ? "Salvando..." : isSaved ? "Salvo!" : "Salvar Dados"}
        </Button>
      </form>
    </Form>
  );
}
