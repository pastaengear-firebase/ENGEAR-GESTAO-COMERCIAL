// src/components/sales/sales-charts.tsx
"use client";
import type { Sale } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SalesChartsProps {
  salesData: Sale[];
}

const CHART_COLORS = {
  SERGIO: 'hsl(var(--chart-1))',
  RODRIGO: 'hsl(var(--chart-2))',
  Aberta: 'hsl(var(--chart-3))',
  Ganha: 'hsl(var(--chart-4))',
  Perdida: 'hsl(var(--chart-5))',
};

export default function SalesCharts({ salesData }: SalesChartsProps) {
  const salesBySeller = useMemo(() => {
    const data = salesData.reduce((acc, sale) => {
      const seller = sale.seller;
      if (!acc[seller]) {
        acc[seller] = { name: seller, totalValue: 0, count: 0 };
      }
      acc[seller].totalValue += sale.salesValue;
      acc[seller].count += 1;
      return acc;
    }, {} as Record<string, { name: string; totalValue: number; count: number }>);
    return Object.values(data);
  }, [salesData]);

  const salesByStatus = useMemo(() => {
    const data = salesData.reduce((acc, sale) => {
      const status = sale.status;
      if (!acc[status]) {
        acc[status] = { name: status, value: 0 };
      }
      acc[status].value += 1; // Count of sales by status
      return acc;
    }, {} as Record<string, { name: string; value: number }>);
    return Object.values(data);
  }, [salesData]);

  const monthlySales = useMemo(() => {
    const data = salesData.reduce((acc, sale) => {
      const monthYear = format(parseISO(sale.date), 'MMM/yy', { locale: ptBR });
      if (!acc[monthYear]) {
        acc[monthYear] = { name: monthYear, totalValue: 0 };
      }
      acc[monthYear].totalValue += sale.salesValue;
      return acc;
    }, {} as Record<string, { name: string; totalValue: number }>);
    
    // Sort by date for correct chart order
    return Object.values(data).sort((a, b) => {
        const [aMonth, aYear] = a.name.split('/');
        const [bMonth, bYear] = b.name.split('/');
        const dateA = new Date(`20${aYear}`, getMonthIndex(aMonth), 1);
        const dateB = new Date(`20${bYear}`, getMonthIndex(bMonth), 1);
        return dateA.getTime() - dateB.getTime();
    });
  }, [salesData]);

  const getMonthIndex = (monthAbbr: string) => {
    const months = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
    return months.indexOf(monthAbbr.toLowerCase());
  };


  const barChartConfig = {
    totalValue: { label: "Valor Total (R$)", color: "hsl(var(--chart-1))" },
  } satisfies ChartConfig;
  
  const pieChartConfig = {
    sales: { label: "Vendas" }
  } satisfies ChartConfig;


  if (!salesData.length) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Análise de Vendas</CardTitle>
          <CardDescription>Não há dados suficientes para exibir os gráficos no período selecionado.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Selecione um período com vendas ou adicione novas vendas.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Vendas por Vendedor</CardTitle>
          <CardDescription>Valor total de vendas por vendedor.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={barChartConfig} className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesBySeller} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <XAxis dataKey="name" stroke="hsl(var(--foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--foreground))" fontSize={12} tickFormatter={(value) => `R$${value/1000}k`} />
                <Tooltip
                  content={<ChartTooltipContent />}
                  cursor={{ fill: "hsl(var(--muted))" }}
                />
                <Legend />
                <Bar dataKey="totalValue" name="Valor Total" fill={CHART_COLORS.SERGIO} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Distribuição por Status</CardTitle>
          <CardDescription>Número de vendas por status.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center">
           <ChartContainer config={pieChartConfig} className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip content={<ChartTooltipContent nameKey="name" />} />
                <Legend />
                <Pie
                  data={salesByStatus}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {salesByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[entry.name as keyof typeof CHART_COLORS] || `hsl(var(--chart-${(index % 5) + 1}))`} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
      
      <Card className="lg:col-span-2 shadow-sm">
        <CardHeader>
          <CardTitle>Vendas Mensais</CardTitle>
          <CardDescription>Valor total de vendas ao longo dos meses.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={barChartConfig} className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlySales} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <XAxis dataKey="name" stroke="hsl(var(--foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--foreground))" fontSize={12} tickFormatter={(value) => `R$${value/1000}k`} />
                <Tooltip
                  content={<ChartTooltipContent />}
                  cursor={{ fill: "hsl(var(--muted))" }}
                />
                <Legend />
                <Bar dataKey="totalValue" name="Valor Total Mensal" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}

// Need to add DatePickerWithRange component from shadcn/ui to ui folder
// For now, this is a placeholder and will be created next.
