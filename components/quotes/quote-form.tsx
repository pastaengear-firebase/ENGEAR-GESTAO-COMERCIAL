// components/quotes/quote-form.tsx
"use client";
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { QuoteFormSchema, type QuoteFormData } from '@/lib/schemas';
import { AREA_OPTIONS, PROPOSAL_STATUS_OPTIONS, CONTACT_SOURCE_OPTIONS, COMPANY_OPTIONS } from '@/lib/constants';
import { useQuotes } from '@/hooks/use-quotes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { format, parseISO } from 'date-fns';
import { DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function QuoteForm({ quoteToEdit, onFormSubmit }: { quoteToEdit?: any; onFormSubmit?: () => void }) {
  const { addQuote, updateQuote } = useQuotes();
  const { toast } = useToast();
  
  // FORÇAR REMOUNT DO COMPONENTE INTEIRO
  const [formKey, setFormKey] = useState(0);

  const form = useForm<QuoteFormData>({
    resolver: zodResolver(QuoteFormSchema),
    defaultValues: { 
      clientName: '', 
      proposalDate: new Date(), 
      proposedValue: 0, 
      status: "Enviada",
      company: '',
      area: '',
      contactSource: ''
    },
  });

  useEffect(() => {
    if (quoteToEdit) {
      // RESET COM DELAY PARA GARANTIR REMOUNT
      setFormKey(prev => prev + 1);
      
      setTimeout(() => {
        form.reset({
          clientName: quoteToEdit.clientName || '',
          company: quoteToEdit.company?.trim() || '',
          area: quoteToEdit.area?.trim() || '',
          status: quoteToEdit.status?.trim() || 'Enviada',
          contactSource: quoteToEdit.contactSource?.trim() || '',
          proposalDate: quoteToEdit.proposalDate ? parseISO(quoteToEdit.proposalDate) : new Date(),
          validityDate: quoteToEdit.validityDate ? parseISO(quoteToEdit.validityDate) : undefined,
          proposedValue: Number(quoteToEdit.proposedValue) || 0,
          notes: quoteToEdit.notes || '',
        });
      }, 0);
    }
  }, [quoteToEdit?.id]); // DEPENDÊNCIA SÓ NO ID

  const onSubmit = async (data: QuoteFormData) => {
    try {
      const payload = { 
        ...data, 
        proposalDate: format(data.proposalDate, 'yyyy-MM-dd'), 
        proposedValue: Number(data.proposedValue),
        company: data.company.trim(),
        area: data.area.trim(),
        status: data.status.trim(),
        contactSource: data.contactSource?.trim()
      };
      
      if (quoteToEdit) {
        await updateQuote(quoteToEdit.id, payload as any);
      } else {
        await addQuote(payload as any);
      }
      
      toast({ title: "Sucesso!", description: "Proposta salva com sucesso." });
      if (onFormSubmit) onFormSubmit();
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div key={formKey}> {/* REMOUNT FORÇADO AQUI */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            <FormField control={form.control} name="clientName" render={({ field }) => (
              <FormItem>
                <FormLabel>Nome do Cliente</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="company" render={({ field }) => (
              <FormItem>
                <FormLabel>Empresa</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  value={field.value || ''}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a Empresa" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {COMPANY_OPTIONS.map(o => (
                      <SelectItem key={o} value={o}>{o}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="area" render={({ field }) => (
              <FormItem>
                <FormLabel>Área</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  value={field.value || ''}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a Área" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {AREA_OPTIONS.map(o => (
                      <SelectItem key={o} value={o}>{o}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="contactSource" render={({ field }) => (
              <FormItem>
                <FormLabel>Fonte do Contato</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  value={field.value || ''}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a Fonte" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CONTACT_SOURCE_OPTIONS.map(o => (
                      <SelectItem key={o} value={o}>{o}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="proposedValue" render={({ field }) => (
              <FormItem>
                <FormLabel>Valor (R$)</FormLabel>
                <FormControl>
                  <div className="relative">
                    <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                      type="number" 
                      className="pl-8" 
                      {...field} 
                      value={field.value || ''}
                      onChange={e => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="status" render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  value={field.value || 'Enviada'}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o Status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {PROPOSAL_STATUS_OPTIONS.map(o => (
                      <SelectItem key={o} value={o}>{o}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            
          </div>
          
          <Button type="submit" className="w-full">
            {quoteToEdit ? 'Atualizar Proposta' : 'Criar Proposta'}
          </Button>
        </form>
      </Form>
    </div>
  );
}