
// src/app/(app)/dashboard/page.tsx
"use client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, ListChecks, TrendingUp, Printer, Banknote, BarChart3, Filter, FileText, FileSignature, Percent, AlertTriangle, CalendarCheck2 } from "lucide-react";
import SalesCharts from "@/components/sales/sales-charts";
import { useSales } from "@/hooks/use-sales";
import { useQuotes } from "@/hooks/use-quotes"; // Import useQuotes
import { useState, useEffect, useMemo } from "react";
import type { Sale, Quote } from '@/lib/types';
import { ALL_SELLERS_OPTION } from "@/lib/constants";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { isBefore, subDays, parseISO } from 'date-fns';
import Link from "next/link";


const calculateWorkingDays = (from: Date, to: Date): number => {
  let count = 0;
  const currentDate = new Date(from);
  const endDate = new Date(to);
  
  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Monday to Friday
      count++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return count;
};

// Atualizada para considerar vendas e propostas
const getDisplayYears = (allSales: Sale[], allQuotes: Quote[]): Array<{ value: string; label: string }> => {
  const years = new Set<number>();
  allSales.forEach(sale => {
    const year = new Date(sale.date).getFullYear();
    if (year >= 2025) {
      years.add(year);
    }
  });
  allQuotes.forEach(quote => {
    const year = new Date(quote.proposalDate).getFullYear();
     if (year >= 2025) {
      years.add(year);
    }
  });
  const sortedYears = Array.from(years).sort((a, b) => b - a); 
  const options = [{ value: 'all', label: 'Todos os Anos' }];
  sortedYears.forEach(year => {
    options.push({ value: String(year), label: String(year) });
  });
  return options;
};


export default function DashboardPage() {
  const { sales: allSales, filteredSales, setFilters: setSalesFilters, selectedSeller } = useSales();
  const { quotes: allQuotes, dashboardFilteredQuotes, setDashboardFilters: setQuotesDashboardFilters } = useQuotes(); // Use useQuotes
  
  const [displayYear, setDisplayYear] = useState<string>('all'); 
  
  // Atualizada para usar allSales e allQuotes
  const yearOptions = useMemo(() => getDisplayYears(allSales, allQuotes), [allSales, allQuotes]);

  useEffect(() => {
    const validYearValues = yearOptions
      .map(opt => opt.value)
      .filter(val => val !== 'all' && parseInt(val) >= 2025);

    if (validYearValues.length > 0) {
      const latestValidYearOption = yearOptions.find(opt => opt.value !== 'all' && parseInt(opt.value) >= 2025);
      if (latestValidYearOption) {
        setDisplayYear(latestValidYearOption.value);
      } else {
        setDisplayYear('all'); 
      }
    } else {
      setDisplayYear('all'); 
    }
  }, [yearOptions]);


  useEffect(() => {
    const yearToFilter = displayYear === 'all' ? 'all' : parseInt(displayYear, 10);
    setSalesFilters({ selectedYear: yearToFilter });
    setQuotesDashboardFilters({ selectedYear: yearToFilter }); // Aplicar filtro de ano às propostas
  }, [displayYear, setSalesFilters, setQuotesDashboardFilters]);

  const dashboardSubtitle = selectedSeller === ALL_SELLERS_OPTION 
    ? "Visão geral do desempenho da equipe comercial." 
    : `Desempenho do vendedor: ${selectedSeller}`;

  // KPIs de Vendas
  const totalSalesValue = filteredSales.reduce((sum, sale) => sum + sale.salesValue, 0);
  const totalSalesCount = filteredSales.length;
  const totalPaymentsAllStatuses = filteredSales.reduce((sum, sale) => sum + sale.payment, 0);
  
  // KPIs de Propostas
  const totalProposedValue = dashboardFilteredQuotes.reduce((sum, quote) => sum + quote.proposedValue, 0);
  const totalProposalsCount = dashboardFilteredQuotes.length;

  // KPIs de Conversão
  const conversionRateValue = useMemo(() => {
    if (totalProposedValue > 0) {
      return (totalSalesValue / totalProposedValue) * 100;
    }
    return 0;
  }, [totalSalesValue, totalProposedValue]);

  const conversionRateCount = useMemo(() => {
    if (totalProposalsCount > 0) {
      return (totalSalesCount / totalProposalsCount) * 100;
    }
    return 0;
  }, [totalSalesCount, totalProposalsCount]);

  // Dias Úteis e Médias
  const workingDaysInPeriod = useMemo(() => {
    if (displayYear === 'all') {
      const combinedDates = [
        ...allSales.map(s => new Date(s.date)),
        ...allQuotes.map(q => new Date(q.proposalDate))
      ];
      if (combinedDates.length === 0) return 0;

      const yearsInData = combinedDates
        .map(d => d.getFullYear())
        .filter(y => y >= 2025);
      if (yearsInData.length === 0) return 0;
      
      const minYear = Math.min(...yearsInData);
      const maxYear = Math.max(...yearsInData);
      
      if (minYear === Infinity || maxYear === -Infinity || minYear > maxYear) return 0;
      return calculateWorkingDays(new Date(minYear, 0, 1), new Date(maxYear, 11, 31));
    } else {
      const yearNum = parseInt(displayYear, 10);
      if (isNaN(yearNum)) return 0;
      return calculateWorkingDays(new Date(yearNum, 0, 1), new Date(yearNum, 11, 31));
    }
  }, [displayYear, allSales, allQuotes]);

  const averageSalesPerWorkingDay = useMemo(() => {
    if (workingDaysInPeriod > 0 && totalSalesCount > 0) {
      return (totalSalesCount / workingDaysInPeriod).toFixed(2);
    }
    return "0.00";
  }, [totalSalesCount, workingDaysInPeriod]);

  const averageProposalsPerWorkingDay = useMemo(() => {
    if (workingDaysInPeriod > 0 && totalProposalsCount > 0) {
      return (totalProposalsCount / workingDaysInPeriod).toFixed(2);
    }
    return "0.00";
  }, [totalProposalsCount, workingDaysInPeriod]);

  // Lógica para Faturamentos Atrasados
  const pendingBillingSales = useMemo(() => {
    const thirtyDaysAgo = subDays(new Date(), 30);
    // O alerta de faturamentos atrasados agora respeita os filtros de ano e vendedor selecionados.
    return filteredSales.filter(sale => {
        try {
            const saleDate = parseISO(sale.date);
            const isPendingPayment = sale.payment < sale.salesValue;
            const isPendingStatus = sale.status === 'Á INICAR' || sale.status === 'EM ANDAMENTO';
            const isOlderThan30Days = isBefore(saleDate, thirtyDaysAgo);
            return isPendingPayment && isPendingStatus && isOlderThan30Days;
        } catch (e) {
            return false;
        }
    });
  }, [filteredSales]);

  const handlePrint = () => {
    window.print();
  };

  const periodDescription = displayYear === 'all' ? 'Em todos os anos (desde 2025)' : `No ano de ${displayYear}`;
  const workingDaysDescription = displayYear === 'all' ? 'Considerando todos os dias úteis nos anos com dados (desde 2025)' : `Em dias úteis de ${displayYear}`;


  return (
    <div className="space-y-6" id="dashboard-printable-area">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard de Vendas e Propostas</h1>
          <p className="text-muted-foreground">{dashboardSubtitle}</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-2 print-hide w-full sm:w-auto">
           <div className="flex items-center space-x-2 w-full sm:w-auto">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <Label htmlFor="year-select-dashboard" className="text-sm font-medium text-muted-foreground whitespace-nowrap">
              Filtrar por Ano:
            </Label>
            <Select
              value={displayYear}
              onValueChange={setDisplayYear}
            >
              <SelectTrigger id="year-select-dashboard" className="w-full sm:w-[180px] bg-background hover:bg-muted transition-colors duration-150 focus:ring-primary">
                <SelectValue placeholder="Selecionar ano" />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handlePrint} variant="outline" size="icon" className="w-full sm:w-auto mt-2 sm:mt-0">
            <Printer className="h-4 w-4" />
            <span className="sr-only">Imprimir Dashboard</span>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {/* Card de Alerta de Faturamento Atrasado */}
        {pendingBillingSales.length > 0 && (
            <Link href="/faturamento#cobranca" className="xl:col-span-1">
                <Card className="shadow-lg hover:shadow-xl transition-shadow border-2 border-amber-500 bg-amber-50/80 dark:bg-amber-900/30 animate-pulse-slow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-amber-800 dark:text-amber-400">Faturamentos Atrasados</CardTitle>
                        <AlertTriangle className="h-5 w-5 text-amber-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-900 dark:text-amber-300">{pendingBillingSales.length}</div>
                        <p className="text-xs text-muted-foreground">Vendas com mais de 30 dias pendentes.</p>
                    </CardContent>
                </Card>
            </Link>
        )}

        {/* KPIs de Vendas */}
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total de Vendas</CardTitle>
            <DollarSign className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalSalesValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-xs text-muted-foreground">{periodDescription}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendas Efetuadas</CardTitle>
            <ListChecks className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSalesCount}</div>
            <p className="text-xs text-muted-foreground">Número de vendas no período</p>
          </CardContent>
        </Card>
         <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Média de Vendas / Dia Útil</CardTitle>
            <BarChart3 className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageSalesPerWorkingDay}</div>
            <p className="text-xs text-muted-foreground">{workingDaysDescription}</p>
          </CardContent>
        </Card>
         <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Recebido (Geral)</CardTitle>
            <Banknote className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
             {totalPaymentsAllStatuses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-xs text-muted-foreground">Soma de todos os pagamentos no período</p>
          </CardContent>
        </Card>


        {/* KPIs de Propostas */}
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total Orçado</CardTitle>
            <FileText className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalProposedValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-xs text-muted-foreground">{periodDescription}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Propostas Emitidas</CardTitle>
            <FileSignature className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProposalsCount}</div>
            <p className="text-xs text-muted-foreground">Número de propostas no período</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Média de Propostas / Dia Útil</CardTitle>
            <CalendarCheck2 className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageProposalsPerWorkingDay}</div>
            <p className="text-xs text-muted-foreground">{workingDaysDescription}</p>
          </CardContent>
        </Card>

        {/* KPIs de Conversão */}
         <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão (Valor)</CardTitle>
            <TrendingUp className="h-5 w-5 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversionRateValue.toFixed(2)}%</div>
            <p className="text-xs text-muted-foreground">(Valor Vendido / Valor Orçado)</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm hover:shadow-md transition-shadow lg:col-start-2 xl:col-start-auto"> {/* Ajuste para layout */}
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão (Qtd)</CardTitle>
            <Percent className="h-5 w-5 text-sky-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversionRateCount.toFixed(2)}%</div>
            <p className="text-xs text-muted-foreground">(Vendas / Propostas)</p>
          </CardContent>
        </Card>
      </div>

      <SalesCharts salesData={filteredSales} /> {/* Poderia receber propostas no futuro */}
      
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #dashboard-printable-area, #dashboard-printable-area * {
            visibility: visible;
          }
          #dashboard-printable-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 10mm; /* A4 padding */
            font-size: 10pt;
          }
          .print-hide {
            display: none !important;
          }
          .grid { /* Ajustar o grid para impressão se necessário */
             display: grid !important; /* Certifique-se que o grid é aplicado */
             grid-template-columns: repeat(2, minmax(0, 1fr)) !important; /* Exemplo: 2 colunas para impressão */
          }
          .card {
             break-inside: avoid; /* Evitar que cards quebrem entre páginas */
          }
          @page {
            size: A4 landscape;
            margin: 10mm;
          }
        }
        .animate-pulse-slow {
            animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @keyframes pulse {
            0%, 100% {
                opacity: 1;
            }
            50% {
                opacity: .8;
            }
        }
      `}</style>
    </div>
  );
}
