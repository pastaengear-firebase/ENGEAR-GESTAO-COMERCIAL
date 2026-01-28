// src/app/(app)/propostas/acompanhamento/page.tsx
"use client";
import { useMemo } from 'react';
import { useQuotes } from '@/hooks/use-quotes';
import { useSales } from '@/hooks/use-sales';
import type { Quote } from '@/lib/types';
import { isPast, isToday, isFuture, parseISO, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { format } from 'date-fns';
import Link from 'next/link';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { BellRing, CalendarClock, CalendarCheck2, ServerCrash, CheckCircle } from 'lucide-react';
import { ALL_SELLERS_OPTION } from '@/lib/constants';

interface CategorizedQuotes {
  overdue: Quote[];
  today: Quote[];
  upcoming: Quote[];
}

const FollowUpTable = ({ quotes, title }: { quotes: Quote[]; title: string }) => {
  if (quotes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-center p-4 border border-dashed rounded-lg">
        <CheckCircle className="h-10 w-10 text-green-500 mb-2" />
        <p className="text-muted-foreground">Nenhum acompanhamento para "{title}".</p>
      </div>
    );
  }

  const getDaysDiff = (dateStr: string) => {
    const diff = differenceInDays(parseISO(dateStr), new Date());
    if (diff < 0) return `${Math.abs(diff)}d atrás`;
    if (diff === 0) return "Hoje";
    return `em ${diff}d`;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>Vendedor</TableHead>
            <TableHead>Follow-up</TableHead>
            <TableHead className="text-right">Valor</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {quotes.map(quote => (
            <TableRow key={quote.id}>
              <TableCell>
                 <Link href={`/propostas/gerenciar`} className="hover:underline font-medium text-primary">
                  {quote.clientName}
                 </Link>
              </TableCell>
              <TableCell>{quote.seller}</TableCell>
              <TableCell className="font-semibold">
                {format(parseISO(quote.followUpDate!), 'dd/MM/yy', { locale: ptBR })}
                 <span className="text-xs text-muted-foreground ml-2">({getDaysDiff(quote.followUpDate!)})</span>
              </TableCell>
              <TableCell className="text-right">
                {quote.proposedValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};


export default function AcompanhamentoPage() {
  const { quotes, loadingQuotes } = useQuotes();
  const { selectedSeller } = useSales();

  const categorizedQuotes = useMemo((): CategorizedQuotes => {
    const relevantQuotes = (quotes || [])
      .filter(q => q.followUpDate && !q.followUpDone)
      .filter(q => selectedSeller === ALL_SELLERS_OPTION || q.seller === selectedSeller);

    const overdue: Quote[] = [];
    const today: Quote[] = [];
    const upcoming: Quote[] = [];

    relevantQuotes.forEach(quote => {
      try {
        const followUpD = parseISO(quote.followUpDate!);
        if (isPast(followUpD) && !isToday(followUpD)) {
          overdue.push(quote);
        } else if (isToday(followUpD)) {
          today.push(quote);
        } else if (isFuture(followUpD)) {
          upcoming.push(quote);
        }
      } catch (e) {
        console.error(`Invalid date for quote ${quote.id}: ${quote.followUpDate}`);
      }
    });

    // Sort by date
    overdue.sort((a, b) => parseISO(a.followUpDate!).getTime() - parseISO(b.followUpDate!).getTime());
    upcoming.sort((a, b) => parseISO(a.followUpDate!).getTime() - parseISO(b.followUpDate!).getTime());

    return { overdue, today, upcoming };
  }, [quotes, selectedSeller]);

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
            <BellRing className="mr-3 h-8 w-8" /> Acompanhamento de Propostas
          </h1>
          <p className="text-muted-foreground">
            {dashboardSubtitle}
          </p>
        </div>

      { (categorizedQuotes.overdue.length + categorizedQuotes.today.length + categorizedQuotes.upcoming.length) === 0 ? (
         <Card className="shadow-sm">
           <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center h-64 text-center p-4">
                <ServerCrash className="h-12 w-12 text-muted-foreground mb-3" />
                <h3 className="text-lg font-semibold text-foreground">Nenhum Acompanhamento Pendente</h3>
                <p className="text-sm text-muted-foreground">
                  Não há propostas com follow-up agendado e pendente para o vendedor selecionado.
                </p>
              </div>
            </CardContent>
        </Card>
      ) : (
          <Accordion type="multiple" defaultValue={['overdue', 'today']} className="w-full space-y-4">
            <AccordionItem value="overdue" className="border-b-0">
                <Card className="shadow-md border-destructive/50">
                    <AccordionTrigger className="text-xl font-semibold p-6 hover:no-underline">
                        <div className="flex items-center">
                            <CalendarClock className="mr-3 h-6 w-6 text-destructive" /> 
                            Acompanhamentos Atrasados <Badge variant="destructive" className="ml-3">{categorizedQuotes.overdue.length}</Badge>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-6">
                        <FollowUpTable quotes={categorizedQuotes.overdue} title="Atrasados" />
                    </AccordionContent>
                </Card>
            </AccordionItem>

            <AccordionItem value="today" className="border-b-0">
                <Card className="shadow-md border-primary/50">
                    <AccordionTrigger className="text-xl font-semibold p-6 hover:no-underline">
                        <div className="flex items-center">
                            <CalendarCheck2 className="mr-3 h-6 w-6 text-primary" /> 
                            Acompanhamentos para Hoje <Badge className="ml-3">{categorizedQuotes.today.length}</Badge>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-6">
                       <FollowUpTable quotes={categorizedQuotes.today} title="Hoje" />
                    </AccordionContent>
                </Card>
            </AccordionItem>
            
            <AccordionItem value="upcoming" className="border-b-0">
                <Card className="shadow-md">
                    <AccordionTrigger className="text-xl font-semibold p-6 hover:no-underline">
                        <div className="flex items-center">
                            <BellRing className="mr-3 h-6 w-6 text-muted-foreground" /> 
                            Próximos Acompanhamentos <Badge variant="secondary" className="ml-3">{categorizedQuotes.upcoming.length}</Badge>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-6">
                        <FollowUpTable quotes={categorizedQuotes.upcoming} title="Próximos" />
                    </AccordionContent>
                </Card>
            </AccordionItem>
          </Accordion>
      )}
    </div>
  );
}
