// src/app/(app)/busca-ia/page.tsx
'use client';

import { useState, useMemo } from 'react';
import { BrainCircuit, Search, CircleDashed, Bot } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useSales } from '@/hooks/use-sales';
import { useQuotes } from '@/hooks/use-quotes';
import { intelligentSearch, type SearchOutput } from '@/ai/flows/intelligent-search-flow';
import SalesTable from '@/components/sales/sales-table';
import QuotesTable from '@/components/quotes/quotes-table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import type { Sale, Quote } from '@/lib/types';
import { parseISO, isWithinInterval } from 'date-fns';

export default function BuscaIAPage() {
  const { sales: allSales } = useSales();
  const { quotes: allQuotes } = useQuotes();

  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<SearchOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setAiResponse(null);
    try {
      const response = await intelligentSearch({ query });
      setAiResponse(response);
    } catch (e) {
      console.error(e);
      setError('Ocorreu um erro ao processar sua busca. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const filteredSales = useMemo(() => {
    if (!aiResponse?.salesFilters) return [];
    const filters = aiResponse.salesFilters;
    return allSales.filter(sale => {
      let match = true;
      if (filters.sellers?.length) {
        match &&= filters.sellers.includes(sale.seller);
      }
      if (filters.companies?.length) {
        match &&= filters.companies.includes(sale.company);
      }
      if (filters.areas?.length) {
        match &&= filters.areas.includes(sale.area);
      }
      if (filters.statuses?.length) {
        match &&= filters.statuses.includes(sale.status);
      }
      if (filters.dateRange?.start || filters.dateRange?.end) {
        const saleDate = parseISO(sale.date);
        const start = filters.dateRange.start ? parseISO(filters.dateRange.start) : new Date(0);
        const end = filters.dateRange.end ? parseISO(filters.dateRange.end) : new Date();
        match &&= isWithinInterval(saleDate, { start, end });
      }
      if (filters.valueRange?.min || filters.valueRange?.max) {
        const min = filters.valueRange.min ?? 0;
        const max = filters.valueRange.max ?? Infinity;
        match &&= sale.salesValue >= min && sale.salesValue <= max;
      }
      if (filters.searchTerm) {
        const lowerSearchTerm = filters.searchTerm.toLowerCase();
        match &&= (
          sale.project.toLowerCase().includes(lowerSearchTerm) ||
          sale.os.toLowerCase().includes(lowerSearchTerm) ||
          sale.clientService.toLowerCase().includes(lowerSearchTerm)
        );
      }
      return match;
    });
  }, [allSales, aiResponse]);

  const filteredQuotes = useMemo(() => {
    if (!aiResponse?.quotesFilters) return [];
    const filters = aiResponse.quotesFilters;
    return allQuotes.filter(quote => {
      let match = true;
      if (filters.sellers?.length) {
        match &&= filters.sellers.includes(quote.seller);
      }
      if (filters.companies?.length) {
        match &&= filters.companies.includes(quote.company);
      }
      if (filters.areas?.length) {
        match &&= filters.areas.includes(quote.area);
      }
      if (filters.statuses?.length) {
        match &&= filters.statuses.includes(quote.status);
      }
      if (filters.dateRange?.start || filters.dateRange?.end) {
        const quoteDate = parseISO(quote.proposalDate);
        const start = filters.dateRange.start ? parseISO(filters.dateRange.start) : new Date(0);
        const end = filters.dateRange.end ? parseISO(filters.dateRange.end) : new Date();
        match &&= isWithinInterval(quoteDate, { start, end });
      }
      if (filters.valueRange?.min || filters.valueRange?.max) {
        const min = filters.valueRange.min ?? 0;
        const max = filters.valueRange.max ?? Infinity;
        match &&= quote.proposedValue >= min && quote.proposedValue <= max;
      }
       if (filters.searchTerm) {
        const lowerSearchTerm = filters.searchTerm.toLowerCase();
        match &&= (
          quote.clientName.toLowerCase().includes(lowerSearchTerm) ||
          quote.description.toLowerCase().includes(lowerSearchTerm)
        );
      }
      return match;
    });
  }, [allQuotes, aiResponse]);

  const hasSalesResults = filteredSales.length > 0;
  const hasQuotesResults = filteredQuotes.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center">
          <BrainCircuit className="mr-3 h-8 w-8" />
          Busca Inteligente (IA)
        </h1>
        <p className="text-muted-foreground">
          Faça perguntas em linguagem natural sobre suas vendas e propostas.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>O que você gostaria de saber?</CardTitle>
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <div className="relative flex-grow">
              <Input
                type="text"
                placeholder="Ex: 'Vendas do Sergio no último mês' ou 'propostas acima de 10 mil para a Engear'"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pr-10"
                disabled={loading}
              />
            </div>
            <Button onClick={handleSearch} disabled={loading || !query.trim()} className="w-full sm:w-auto">
              {loading ? 'Analisando...' : <><Search className="mr-2 h-4 w-4" /> Buscar</>}
            </Button>
          </div>
        </CardHeader>
        {loading && (
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            </div>
          </CardContent>
        )}
        {error && (
            <CardContent>
                <Alert variant="destructive">
                    <AlertTitle>Erro na Busca</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            </CardContent>
        )}
        {aiResponse && (
          <CardContent>
            <Alert variant="default" className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
              <Bot className="h-4 w-4 !text-blue-600 dark:!text-blue-400" />
              <AlertTitle>Resposta da IA</AlertTitle>
              <AlertDescription>
                {aiResponse.responseText}
              </AlertDescription>
            </Alert>
          </CardContent>
        )}
      </Card>

      {aiResponse && !loading && (
        <div className="space-y-8">
            {aiResponse.salesFilters && (
                <Card>
                    <CardHeader>
                        <CardTitle>Resultados da Busca por Vendas ({filteredSales.length})</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <SalesTable salesData={filteredSales} />
                    </CardContent>
                </Card>
            )}

            {aiResponse.quotesFilters && (
                <Card>
                    <CardHeader>
                        <CardTitle>Resultados da Busca por Propostas ({filteredQuotes.length})</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <QuotesTable quotesData={filteredQuotes} onEdit={() => {}} onDelete={() => {}} disabledActions={true} />
                    </CardContent>
                </Card>
            )}

            {!hasSalesResults && !hasQuotesResults && (
                <div className="flex flex-col items-center justify-center h-40 text-center p-4 border border-dashed rounded-lg mt-6">
                    <CircleDashed className="h-10 w-10 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">Nenhum resultado encontrado para os filtros aplicados pela IA.</p>
                </div>
            )}
        </div>
      )}
    </div>
  );
}
