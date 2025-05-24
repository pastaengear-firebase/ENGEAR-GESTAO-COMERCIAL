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

// Updated CHART_COLORS for more distinct status colors
const CHART_COLORS = {
  SERGIO: 'hsl(var(--chart-1))', // Maroon
  RODRIGO: 'hsl(var(--chart-2))', // Golden Yellow
  "Á INICAR": 'hsl(var(--chart-3))', // Teal/Green
  "EM ANDAMENTO": 'hsl(var(--chart-4))', // Blue
  "FINALIZADO": 'hsl(var(--chart-5))', // Orange (was chart-1, changed for more distinction)
  "CANCELADO": 'hsl(var(--destructive))', // Destructive color (red) for Cancelled
  default: 'hsl(var(--muted-foreground))'
};

// Array of colors for the monthly sales chart to cycle through
const monthlyChartColorsArray = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

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
    
    return Object.values(data).sort((a, b) => {
        const [aMonthStr, aYear] = a.name.split('/');
        const [bMonthStr, bYear] = b.name.split('/');
        const monthNames = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
        const aMonth = monthNames.indexOf(aMonthStr.toLowerCase().replace('.', '')); // remove . from fev.
        const bMonth = monthNames.indexOf(bMonthStr.toLowerCase().replace('.', '')); // remove . from fev.
        const dateA = new Date(parseInt(`20${aYear}`), aMonth);
        const dateB = new Date(parseInt(`20${bYear}`), bMonth);
        return dateA.getTime() - dateB.getTime();
    });
  }, [salesData]);

  const barChartConfig = {
    totalValue: { label: "Valor Total (R$)" }, // Color will be applied by <Cell>
  } satisfies ChartConfig;
  
  const pieChartConfig = {
    sales: { label: "Vendas" },
    "Á INICAR": { label: "À Iniciar", color: CHART_COLORS["Á INICAR"] },
    "EM ANDAMENTO": { label: "Em Andamento", color: CHART_COLORS["EM ANDAMENTO"] },
    "FINALIZADO": { label: "Finalizado", color: CHART_COLORS["FINALIZADO"] },
    "CANCELADO": { label: "Cancelado", color: CHART_COLORS["CANCELADO"] },
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
                <Bar dataKey="totalValue" name="Valor Total" radius={[4, 4, 0, 0]} >
                   {salesBySeller.map((entry, index) => (
                    <Cell key={`cell-seller-${index}`} fill={CHART_COLORS[entry.name as keyof typeof CHART_COLORS] || CHART_COLORS.default} />
                  ))}
                </Bar>
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
                <Legend 
                  formatter={(value, entry) => {
                     const color = CHART_COLORS[entry.payload.name as keyof typeof CHART_COLORS] || CHART_COLORS.default;
                     return <span style={{ color }}>{value}</span>;
                  }}
                />
                <Pie
                  data={salesByStatus}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  labelLine={false}
                  label={({ name, percent, value }) => `${name} (${value})`}
                >
                  {salesByStatus.map((entry, index) => (
                    <Cell key={`cell-status-${index}`} fill={CHART_COLORS[entry.name as keyof typeof CHART_COLORS] || CHART_COLORS.default} />
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
                <Bar dataKey="totalValue" name="Valor Total Mensal" radius={[4, 4, 0, 0]}>
                   {monthlySales.map((entry, index) => (
                    <Cell key={`cell-month-${index}`} fill={monthlyChartColorsArray[index % monthlyChartColorsArray.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
