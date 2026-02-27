'use client';
import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { format, parseISO, isBefore, subDays, differenceInDays } from 'date-fns';
import { Printer, Filter, AlertTriangle, ClipboardList, TrendingUp, CalendarDays, BadgeDollarSign, Layers } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SalesCharts from '@/components/sales/sales-charts';
import { useSales } from '@/hooks/use-sales';
import { useQuotes } from '@/hooks/use-quotes';
import { ALL_SELLERS_OPTION } from '@/lib/constants';
import type { Sale, Quote } from '@/lib/types';

type AgingBucketKey = '0-30' | '31-60' | '61-90' | '90+';
type AgingBucket = { key: AgingBucketKey; label: string; count: number; pendingValue: number };

function countBusinessDaysInclusive(start: Date, end: Date) {
  // Seg–Sex (sem feriados no v1)
  let s = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  let e = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  if (s > e) [s, e] = [e, s];

  let days = 0;
  for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
    const day = d.getDay(); // 0 dom .. 6 sáb
    if (day !== 0 && day !== 6) days++;
  }
  return days;
}

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
    return [{ value: 'all', label: 'Todos os Anos' }, ...Array.from(years).sort((a, b) => b - a).map(y => ({ value: String(y), label: String(y) }))];
  }, [allSales, allQuotes]);

  useEffect(() => {
    const yearToFilter = displayYear === 'all' ? 'all' : parseInt(displayYear, 10);
    if (lastYearApplied.current !== displayYear) {
      lastYearApplied.current = displayYear;
      setSalesFilters({ selectedYear: yearToFilter });
      setQuotesDashboardFilters({ selectedYear: yearToFilter });
    }
  }, [displayYear, setSalesFilters, setQuotesDashboardFilters]);

  // Intervalo do dashboard (para métricas por dia útil)
  const dashboardRange = useMemo(() => {
    const dates: Date[] = [];
    filteredSales.forEach(s => s.date && dates.push(parseISO(s.date)));
    dashboardFilteredQuotes.forEach(q => q.proposalDate && dates.push(parseISO(q.proposalDate)));

    if (!dates.length) return null;

    const min = new Date(Math.min(...dates.map(d => d.getTime())));
    const max = new Date(Math.max(...dates.map(d => d.getTime())));
    return { min, max, businessDays: countBusinessDaysInclusive(min, max) };
  }, [filteredSales, dashboardFilteredQuotes]);

  const stats = useMemo(() => {
    const totalSalesValue = filteredSales.reduce((sum, s) => sum + (s.salesValue || 0), 0);
    const totalSalesCount = filteredSales.length;
    const totalReceived = filteredSales.reduce((sum, s) => sum + (s.payment || 0), 0);
    const totalPendingValue = filteredSales.reduce((sum, s) => sum + Math.max(0, (s.salesValue || 0) - (s.payment || 0)), 0);

    // Propostas contratadas (status = "Aceita")
    const contractedQuotes = dashboardFilteredQuotes.filter(q => q.status === 'Aceita');
    const contractedCount = contractedQuotes.length;
    const contractedValue = contractedQuotes.reduce((sum, q) => sum + (q.proposedValue || 0), 0);

    // Propostas em aberto (status !== "Aceita")
    const openQuotes = dashboardFilteredQuotes.filter(q => q.status !== 'Aceita');
    const openCount = openQuotes.length;
    const openValue = openQuotes.reduce((sum, q) => sum + (q.proposedValue || 0), 0);

    // Total de propostas
    const totalProposalsCount = dashboardFilteredQuotes.length;
    const totalProposedValue = dashboardFilteredQuotes.reduce((sum, q) => sum + (q.proposedValue || 0), 0);

    const assertividade = totalProposalsCount > 0 ? (contractedCount / totalProposalsCount) * 100 : 0;

    // Produtividade por dia útil (quantitativos)
    const businessDays = dashboardRange?.businessDays || 0;
    const proposalsPerBusinessDay = businessDays > 0 ? totalProposalsCount / businessDays : 0;
    const salesPerBusinessDay = businessDays > 0 ? totalSalesCount / businessDays : 0;

    return {
      totalSalesValue,
      totalSalesCount,
      totalReceived,
      totalPendingValue,
      totalProposedValue,
      totalProposalsCount,
      openCount,
      openValue,
      contractedCount,
      contractedValue,
      assertividade,
      businessDays,
      proposalsPerBusinessDay,
      salesPerBusinessDay,
    };
  }, [filteredSales, dashboardFilteredQuotes, dashboardRange]);

  // Alerta existente (+30 dias sem pagamento)
  const pendingCount = useMemo(() => {
    const limit = subDays(new Date(), 30);
    return allSales.filter(s => {
      const matchesSeller = viewingAsSeller === ALL_SELLERS_OPTION || s.seller === viewingAsSeller;
      return matchesSeller && s.payment < s.salesValue && (s.status === 'A INICIAR' || s.status === 'EM ANDAMENTO') && isBefore(parseISO(s.date), limit);
    }).length;
  }, [allSales, viewingAsSeller]);

  // Aging (faixas) - fundamental
  const aging = useMemo((): AgingBucket[] => {
    // usa allSales para não depender do filtro do SalesContext além do seller selecionado
    const now = new Date();
    const buckets: Record<AgingBucketKey, AgingBucket> = {
      '0-30': { key: '0-30', label: '0–30 dias', count: 0, pendingValue: 0 },
      '31-60': { key: '31-60', label: '31–60 dias', count: 0, pendingValue: 0 },
      '61-90': { key: '61-90', label: '61–90 dias', count: 0, pendingValue: 0 },
      '90+': { key: '90+', label: '90+ dias', count: 0, pendingValue: 0 },
    };

    allSales.forEach(s => {
      const matchesSeller = viewingAsSeller === ALL_SELLERS_OPTION || s.seller === viewingAsSeller;
      if (!matchesSeller) return;

      // consideramos pendente apenas quando falta receber algo e não está cancelado
      const pending = Math.max(0, (s.salesValue || 0) - (s.payment || 0));
      if (pending <= 0) return;
      if (s.status === 'CANCELADO') return;

      const days = Math.max(0, differenceInDays(now, parseISO(s.date)));
      let key: AgingBucketKey = '0-30';
      if (days >= 90) key = '90+';
      else if (days >= 61) key = '61-90';
      else if (days >= 31) key = '31-60';

      buckets[key].count += 1;
      buckets[key].pendingValue += pending;
    });

    return [buckets['0-30'], buckets['31-60'], buckets['61-90'], buckets['90+']];
  }, [allSales, viewingAsSeller]);

  const rangeLabel = useMemo(() => {
    if (!dashboardRange) return 'Sem dados no período';
    return `${format(dashboardRange.min, 'dd/MM/yy')} → ${format(dashboardRange.max, 'dd/MM/yy')} (${stats.businessDays} dias úteis)`;
  }, [dashboardRange, stats.businessDays]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Comercial</h1>
          <p className="text-muted-foreground">{viewingAsSeller} • {rangeLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={displayYear} onValueChange={setDisplayYear}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>{yearOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => window.print()} aria-label="Imprimir">
            <Printer className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* KPIs principais */}
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Vendas (R$)</CardTitle>
            <BadgeDollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSalesValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
            <p className="text-xs text-muted-foreground">{stats.totalSalesCount} vendas no período</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Recebido (R$)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReceived.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
            <p className="text-xs text-muted-foreground">Pendente: {stats.totalPendingValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Propostas</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProposalsCount}</div>
            <p className="text-xs text-muted-foreground">
              {stats.contractedCount} aceitas • {stats.openCount} em aberto • {stats.assertividade.toFixed(1)}% aceitação
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Produtividade (dia útil) + Aging */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Produtividade (Dia Útil)</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm text-muted-foreground">Base: {stats.businessDays || 0} dias úteis</div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Propostas / dia útil</span>
              <span className="text-lg font-semibold">{stats.proposalsPerBusinessDay.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Vendas / dia útil</span>
              <span className="text-lg font-semibold">{stats.salesPerBusinessDay.toFixed(2)}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              (Somente quantitativos; valores ficam nos KPIs acima)
            </p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Aging de Cobrança (pendente)</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-muted-foreground">
                    <th className="text-left font-medium py-2">Faixa</th>
                    <th className="text-right font-medium py-2">Qtd</th>
                    <th className="text-right font-medium py-2">Saldo (R$)</th>
                  </tr>
                </thead>
                <tbody>
                  {aging.map(b => (
                    <tr key={b.key} className="border-t">
                      <td className="py-2">{b.label}</td>
                      <td className="py-2 text-right font-semibold">{b.count}</td>
                      <td className="py-2 text-right">{b.pendingValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Base: vendas com pagamento pendente (payment &lt; salesValue), exclui CANCELADO.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos existentes (sem regra de paleta) */}
      <SalesCharts salesData={filteredSales} />
    </div>
  );
}
