
// src/components/sales/sales-charts.tsx
"use client";
import type { Sale } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { normalizeSaleStatus } from '@/lib/normalizers';
import { ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, BarChart, Bar } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AREA_OPTIONS, COMPANY_OPTIONS, STATUS_OPTIONS } from '@/lib/constants';

interface SalesChartsProps {
  salesData: Sale[];
}

const CHART_COLORS = {
  SERGIO: 'hsl(var(--chart-1))',
  RODRIGO: 'hsl(var(--chart-2))',
  "A INICIAR": 'hsl(var(--chart-3))',
  "EM ANDAMENTO": 'hsl(var(--chart-4))',
  "FINALIZADA": 'hsl(var(--chart-5))',
  "RECEBIDA": 'hsl(var(--chart-6))',
  "CANCELADO": 'hsl(var(--destructive))',
  ENGEAR: 'hsl(var(--chart-1))',
  CLIMAZONE: 'hsl(var(--chart-2))',
  default: 'hsl(var(--muted-foreground))'
};

const categoryColorsArray = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(var(--accent))',
  'hsl(var(--primary))',
  'hsl(var(--secondary))',
  'hsl(var(--muted))',
];

export default function SalesCharts({ salesData }: SalesChartsProps) {

  const salesByStatus = useMemo(() => {
    const data = salesData.reduce((acc, sale) => {
      const status = normalizeSaleStatus(sale.status) ?? sale.status;
      if (!acc[status]) {
        acc[status] = { name: status, value: 0 };
      }
      acc[status].value += 1;
      return acc;
    }, {} as Record<string, { name: string; value: number }>);
    return Object.values(data);
  }, [salesData]);

  const monthlySales = useMemo(() => {
    const data = salesData.reduce((acc, sale) => {
      const monthYear = format(parseISO(sale.date), 'MMM/yy', { locale: ptBR });
      if (!acc[monthYear]) {
        acc[monthYear] = { name: monthYear, totalValue: 0, totalReceived: 0 };
      }
      acc[monthYear].totalValue += sale.salesValue;
      acc[monthYear].totalReceived += sale.payment || 0;
      return acc;
    }, {} as Record<string, { name: string; totalValue: number; totalReceived: number }>);
    
    return Object.values(data).sort((a, b) => {
        const [aMonthStr, aYear] = a.name.split('/');
        const [bMonthStr, bYear] = b.name.split('/');
        const monthNames = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
        const aMonth = monthNames.indexOf(aMonthStr.toLowerCase().replace('.', ''));
        const bMonth = monthNames.indexOf(bMonthStr.toLowerCase().replace('.', ''));
        const dateA = new Date(parseInt(`20${aYear}`), aMonth);
        const dateB = new Date(parseInt(`20${bYear}`), bMonth);
        return dateA.getTime() - dateB.getTime();
    });
  }, [salesData]);

  const salesByArea = useMemo(() => {
    const data = salesData.reduce((acc, sale) => {
      const area = sale.area;
      if (!acc[area]) {
        acc[area] = { name: area, totalValue: 0 };
      }
      acc[area].totalValue += sale.salesValue;
      return acc;
    }, {} as Record<string, { name: string; totalValue: number }>);
    return Object.values(data).filter(item => item.totalValue > 0);
  }, [salesData]);

  const salesByCompany = useMemo(() => {
    const data = salesData.reduce((acc, sale) => {
      const company = sale.company;
      if (!acc[company]) {
        acc[company] = { name: company, totalValue: 0 };
      }
      acc[company].totalValue += sale.salesValue;
      return acc;
    }, {} as Record<string, { name: string; totalValue: number }>);
    return Object.values(data).filter(item => item.totalValue > 0);
  }, [salesData]);


  const lineChartConfig = {
    totalValue: { label: "Vendido", color: 'hsl(198 93% 46%)' },
    totalReceived: { label: "Recebido", color: 'hsl(160 84% 39%)' },
  } satisfies ChartConfig;

  const pieChartConfigStatus = {
    sales: { label: "Vendas" },
    ...STATUS_OPTIONS.reduce((acc, status) => {
      acc[status] = { label: status, color: CHART_COLORS[status as keyof typeof CHART_COLORS] || CHART_COLORS.default };
      return acc;
    }, {} as Record<string, {label: string, color: string}>)
  } satisfies ChartConfig;

  const pieChartConfigCompany = {
    sales: { label: "Vendas" },
    ...COMPANY_OPTIONS.reduce((acc, company) => {
      acc[company] = { label: company, color: CHART_COLORS[company as keyof typeof CHART_COLORS] || CHART_COLORS.default };
      return acc;
    }, {} as Record<string, {label: string, color: string}>)
  } satisfies ChartConfig;
  
  const areaChartConfig = {
     totalValue: { label: "Valor Total" }, 
     ...AREA_OPTIONS.reduce((acc, area, index) => {
      acc[area] = { label: area, color: categoryColorsArray[index % categoryColorsArray.length] };
      return acc;
    }, {} as Record<string, {label: string, color: string}>)
  } satisfies ChartConfig;

  const compactCurrencyFormatter = (value: number) => {
    if (value >= 1000000) return `R$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `R$${(value / 1000).toFixed(0)}K`;
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };


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
  
  const chartHeight = "h-[280px]"; // Altura reduzida para melhor adaptação

  return (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Evolução de Vendas (Mês a Mês)</CardTitle>
          <CardDescription>Curva dinâmica de vendido e recebido no período.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={lineChartConfig} className={`${chartHeight} w-full`}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlySales} margin={{ top: 5, right: 20, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--foreground))" fontSize={10} interval={0} angle={-25} textAnchor="end" height={40} />
                <YAxis stroke="hsl(var(--foreground))" fontSize={10} tickFormatter={compactCurrencyFormatter} />
                <Tooltip
                  content={<ChartTooltipContent />}
                  cursor={{ fill: "hsl(var(--muted))" }}
                />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
                <Line type="monotone" dataKey="totalValue" name="Vendido" stroke="hsl(198 93% 46%)" strokeWidth={2.8} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="totalReceived" name="Recebido" stroke="hsl(160 84% 39%)" strokeWidth={2.2} dot={{ r: 2.5 }} activeDot={{ r: 4 }} />
              </LineChart>
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
           <ChartContainer config={pieChartConfigStatus} className={`${chartHeight} w-full`}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip content={<ChartTooltipContent />} />
                <Legend wrapperStyle={{ fontSize: "10px" }} />
                <Pie
                  data={salesByStatus}
                  dataKey="value" 
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius="80%" // Raio percentual
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`} // Label mais conciso
                  fontSize={10} // Reduzido font-size do label
                >
                  {salesByStatus.map((entry) => (
                    <Cell key={`cell-status-${entry.name}`} fill={CHART_COLORS[entry.name as keyof typeof CHART_COLORS] || CHART_COLORS.default} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
      
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Tendência de Ritmo Comercial</CardTitle>
          <CardDescription>Curva de volume vendido por mês (ondas).</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={lineChartConfig} className={`${chartHeight} w-full`}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlySales} margin={{ top: 5, right: 20, left: 20, bottom: 30 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" interval={0} angle={-45} textAnchor="end" height={40} stroke="hsl(var(--foreground))" fontSize={9} />
                <YAxis stroke="hsl(var(--foreground))" fontSize={10} tickFormatter={compactCurrencyFormatter} />
                <Tooltip
                  content={<ChartTooltipContent />}
                  cursor={{ fill: "hsl(var(--muted))" }}
                />
                <Legend wrapperStyle={{ fontSize: "10px" }} />
                <Line type="monotone" dataKey="totalValue" name="Vendido" stroke="hsl(198 93% 46%)" strokeWidth={2.8} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Vendas por Área</CardTitle>
          <CardDescription>Valor total de vendas para cada área de negócio.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={areaChartConfig} className={`${chartHeight} w-full`}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesByArea} layout="vertical" margin={{ top: 5, right: 25, left: 10, bottom: 5 }}> {/* Ajustado margins */}
                <XAxis type="number" stroke="hsl(var(--foreground))" fontSize={10} tickFormatter={compactCurrencyFormatter} />
                <YAxis dataKey="name" type="category" stroke="hsl(var(--foreground))" fontSize={9} width={65} interval={0} /> {/* Reduzido width e font-size */}
                <Tooltip
                  content={<ChartTooltipContent />}
                  cursor={{ fill: "hsl(var(--muted))" }}
                />
                <Legend wrapperStyle={{ fontSize: "10px" }} />
                <Bar dataKey="totalValue" name="Valor Total" radius={[0, 4, 4, 0]} >
                   {salesByArea.map((entry, index) => ( 
                    <Cell key={`cell-area-${entry.name}-${index}`} fill={categoryColorsArray[salesByArea.indexOf(entry) % categoryColorsArray.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="col-span-1 md:col-span-2 shadow-sm">
        <CardHeader>
          <CardTitle>Distribuição de Vendas por Empresa</CardTitle>
          <CardDescription>Participação de ENGEAR e CLIMAZONE no valor total de vendas.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center">
           <ChartContainer config={pieChartConfigCompany} className={`${chartHeight} w-full`}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip content={<ChartTooltipContent nameKey="name" />} />
                <Legend wrapperStyle={{ fontSize: "10px" }} />
                <Pie
                  data={salesByCompany}
                  dataKey="totalValue" 
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius="80%" // Raio percentual
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`} // Label mais conciso
                  fontSize={10} // Reduzido font-size do label
                >
                  {salesByCompany.map((entry) => (
                    <Cell key={`cell-company-${entry.name}`} fill={CHART_COLORS[entry.name as keyof typeof CHART_COLORS] || CHART_COLORS.default} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
