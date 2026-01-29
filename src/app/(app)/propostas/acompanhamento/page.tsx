// src/app/(app)/propostas/acompanhamento/page.tsx
"use client";
import { useState, useMemo } from 'react';
import { useQuotes } from '@/hooks/use-quotes';
import { useSales } from '@/hooks/use-sales';
import type { Quote } from '@/lib/types';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Link from 'next/link';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { BellRing, Calendar as CalendarIcon, ServerCrash } from 'lucide-react';
import { ALL_SELLERS_OPTION } from '@/lib/constants';

type QuotesByDate = {
  [date: string]: Quote[];
};

export default function AcompanhamentoPage() {
  const { quotes, loadingQuotes } = useQuotes();
  const { selectedSeller } = useSales();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  const { quotesByDate, followUpDates } = useMemo(() => {
    const filteredQuotes = (quotes || [])
      .filter(q => q.followUpDate && !q.followUpDone)
      .filter(q => selectedSeller === ALL_SELLERS_OPTION || q.seller === selectedSeller);

    const quotesByDate: QuotesByDate = {};
    const followUpDates: Date[] = [];

    filteredQuotes.forEach(quote => {
      try {
        const followUpD = parseISO(quote.followUpDate!);
        const dateKey = format(followUpD, 'yyyy-MM-dd');
        
        if (!quotesByDate[dateKey]) {
          quotesByDate[dateKey] = [];
          followUpDates.push(followUpD);
        }
        quotesByDate[dateKey].push(quote);
      } catch (e) {
        console.error(`Invalid date for quote ${quote.id}: ${quote.followUpDate}`);
      }
    });

    return { quotesByDate, followUpDates };
  }, [quotes, selectedSeller]);

  const selectedDayQuotes = useMemo(() => {
    if (!selectedDate) return [];
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    return quotesByDate[dateKey] || [];
  }, [selectedDate, quotesByDate]);

  const dashboardSubtitle = selectedSeller === ALL_SELLERS_OPTION 
    ? "Visão geral dos acompanhamentos da equipe comercial." 
    : `Acompanhamentos pendentes para: ${selectedSeller}`;
    
  if (loadingQuotes) {
    return (
      <div className="flex justify-center items-center h-full">
        <BellRing className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Carregando acompanhamentos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
       <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center">
             Acompanhamento de Propostas
          </h1>
          <p className="text-muted-foreground">
            {dashboardSubtitle} Navegue pelo calendário para ver os follow-ups agendados.
          </p>
        </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="shadow-md">
           <CardHeader>
             <CardTitle className="flex items-center"><CalendarIcon className="mr-2 h-5 w-5"/> Calendário de Follow-ups</CardTitle>
             <CardDescription>Dias com um ponto possuem acompanhamentos pendentes.</CardDescription>
           </CardHeader>
           <CardContent className="flex justify-center">
            <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                month={currentMonth}
                onMonthChange={setCurrentMonth}
                locale={ptBR}
                className="p-0"
                modifiers={{ hasFollowUp: followUpDates }}
                modifiersClassNames={{
                    hasFollowUp: 'day-with-followup',
                }}
            />
           </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>
              {selectedDate ? `Acompanhamentos para ${format(selectedDate, 'dd/MM/yyyy')}` : 'Nenhum Dia Selecionado'}
            </CardTitle>
            <CardDescription>
              {selectedDate ? `Encontrados ${selectedDayQuotes.length} registro(s).` : 'Clique em um dia no calendário para ver os detalhes.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedDayQuotes.length > 0 ? (
              <ul className="space-y-3">
                {selectedDayQuotes.map(quote => (
                   <li key={quote.id} className="p-3 rounded-md border bg-muted/40 hover:bg-muted transition-colors">
                     <div className="flex justify-between items-center">
                        <div>
                            <Link href={`/propostas/gerenciar`} className="font-semibold text-primary hover:underline">
                                {quote.clientName}
                            </Link>
                            <p className="text-sm text-muted-foreground">{quote.seller}</p>
                        </div>
                        <div className="text-right">
                           <p className="font-semibold">{quote.proposedValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                           <p className="text-xs text-muted-foreground">{quote.area}</p>
                        </div>
                     </div>
                   </li>
                ))}
              </ul>
            ) : (
               <div className="flex flex-col items-center justify-center h-64 text-center p-4">
                <ServerCrash className="h-12 w-12 text-muted-foreground mb-3" />
                <h3 className="text-lg font-semibold text-foreground">
                  {selectedDate ? 'Nenhum Acompanhamento' : 'Selecione um Dia'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {selectedDate 
                    ? 'Não há follow-ups pendentes para este dia.' 
                    : 'Os detalhes aparecerão aqui.'
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

       <style jsx global>{`
        .day-with-followup {
            position: relative;
            color: hsl(var(--primary-foreground)) !important;
            background-color: hsl(var(--primary)) !important;
            opacity: 1;
        }
        .day-with-followup:hover {
            background-color: hsl(var(--primary) / 0.9) !important;
        }
        .day-with-followup[aria-selected="true"] {
            background-color: hsl(var(--accent)) !important;
            color: hsl(var(--accent-foreground)) !important;
        }
       `}</style>
    </div>
  );
}
