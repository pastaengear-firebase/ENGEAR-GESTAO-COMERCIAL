'use client';
import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { format, parseISO, isBefore, subDays } from 'date-fns';
import { DollarSign, Printer, BarChart3, Filter, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SalesCharts from '@/components/sales/sales-charts';
import { useSales } from '@/hooks/use-sales';
import { useQuotes } from '@/hooks/use-quotes';
import { ALL_SELLERS_OPTION } from '@/lib/constants';
import type { Sale, Quote } from '@/lib/types';

export default function DashboardPage() {
  const { sales: allSales, filteredSales, setFilters: setSalesFilters, viewingAsSeller } = useSales();
  const { quotes: allQuotes, dashboardFilteredQuotes, setDashboardFilters: setQuotesDashboardFilters } = useQuotes();
  
  const [displayYear, setDisplayYear] = useState<string>('all'); 
  const lastYearApplied = useRef<string | null>(null);

  const yearOptions = useMemo(() => {
    const years = new Set<number>();
    [...allSales, ...allQuotes].forEach(item => {
      const dateStr = (item as Sale).date || (item as Quote).proposalDate;
      if (dateStr) {
        const year = new Date(dateStr).getFullYear();
        if (year >= 2025) years.add(year);
      }
    });
    return [{ value: 'all', label: 'Todos os Anos' }, ...Array.from(years).sort((a,b) => b-a).map(y => ({ value: String(y), label: String(y) }))];
  }, [allSales, allQuotes]);

  useEffect(() => {
    const yearToFilter = displayYear === 'all' ? 'all' : parseInt(displayYear, 10);
    if (lastYearApplied.current !== displayYear) {
        lastYearApplied.current = displayYear;
        setSalesFilters({ selectedYear: yearToFilter });
        setQuotesDashboardFilters({ selectedYear: yearToFilter });
    }
  }, [displayYear, setSalesFilters, setQuotesDashboardFilters]);

  const stats = useMemo(() => {
    const totalSalesValue = filteredSales.reduce((sum, s) => sum + s.salesValue, 0);
    const totalSalesCount = filteredSales.length;
    const totalProposedValue = dashboardFilteredQuotes.reduce((sum, q) => sum + q.proposedValue, 0);
    const totalProposalsCount = dashboardFilteredQuotes.length;
    
    return {
      totalSalesValue,
      totalSalesCount,
      totalProposedValue,
      totalProposalsCount,
      totalReceived: filteredSales.reduce((sum, s) => sum + s.payment, 0),
      convValue: totalProposedValue > 0 ? (totalSalesValue / totalProposedValue) * 100 : 0,
      convCount: totalProposalsCount > 0 ? (totalSalesCount / totalProposalsCount) * 100 : 0
    };
  }, [filteredSales, dashboardFilteredQuotes]);

  const pendingCount = useMemo(() => {
    const limit = subDays(new Date(), 30);
    return allSales.filter(s => {
        const matchesSeller = viewingAsSeller === ALL_SELLERS_OPTION || s.seller === viewingAsSeller;
        return matchesSeller && s.payment < s.salesValue && (s.status === 'Á INICAR' || s.status === 'EM ANDAMENTO') && isBefore(parseISO(s.date), limit);
    }).length;
  }, [allSales, viewingAsSeller]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Dashboard Comercial</h1>
          <p className="text-muted-foreground">{viewingAsSeller}</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={displayYear} onValueChange={setDisplayYear}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>{yearOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => window.print()}><Printer className="h-4 w-4" /></Button>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {pendingCount > 0 && (
          <Link href="/faturamento#cobranca" className="col-span-full lg:col-span-1">
            <Card className="border-2 border-amber-500 bg-amber-50 dark:bg-amber-950/20">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Cobranças Pendentes</CardTitle>
                <AlertTriangle className="h-4 w-4 text-amber-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingCount}</div>
                <p className="text-xs text-muted-foreground">Vendas +30 dias sem pgto.</p>
              </CardContent>
            </Card>
          </Link>
        )}
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Vendas Total</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.totalSalesValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div></CardContent>
        </Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Propostas Total</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.totalProposedValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div></CardContent>
        </Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Conversão (Valor)</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.convValue.toFixed(1)}%</div></CardContent>
        </Card>
      </div>

      <SalesCharts salesData={filteredSales} />
    </div>
  );
}