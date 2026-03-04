
// src/components/sales/sales-charts.tsx
"use client";
import type { Sale } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
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
  "AGUARDANDO PAGAMENTO": 'hsl(var(--chart-2))',
  "FINALIZADO": 'hsl(var(--chart-5))', 
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
      acc[status].value += 1; 
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


  const barChartConfig = {
    totalValue: { label: "Valor Total" },
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

  const currencyFormatter = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
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
    <div className="grid gap-6 grid-cols-1 md:grid-cols-2"> {/* Ajustado para md:grid-cols-2 para telas um pouco maiores */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Vendas por Vendedor</CardTitle>
          <CardDescription>Valor total de vendas por vendedor.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={barChartConfig} className={`${chartHeight} w-full`}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesBySeller} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}> {/* Reduzido left margin */}
                <XAxis dataKey="name" stroke="hsl(var(--foreground))" fontSize={10} /> {/* Reduzido font-size */}
                <YAxis stroke="hsl(var(--foreground))" fontSize={10} tickFormatter={compactCurrencyFormatter} /> {/* Reduzido font-size */}
                <Tooltip
                  content={<ChartTooltipContent />}
                  cursor={{ fill: "hsl(var(--muted))" }}
                />
                <Legend wrapperStyle={{ fontSize: "10px" }} /> {/* Reduzido font-size da legenda */}
                <Bar dataKey="totalValue" name="Valor Total" radius={[4, 4, 0, 0]} >
                   {salesBySeller.map((entry) => (
                    <Cell key={`cell-seller-${entry.name}`} fill={CHART_COLORS[entry.name as keyof typeof CHART_COLORS] || CHART_COLORS.default} />
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
          <CardTitle>Vendas Mensais</CardTitle>
          <CardDescription>Valor total de vendas ao longo dos meses.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={barChartConfig} className={`${chartHeight} w-full`}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlySales} margin={{ top: 5, right: 20, left: 20, bottom: 30 }}> {/* Aumentado bottom margin para XAxis labels */}
                <XAxis dataKey="name" interval={0} angle={-45} textAnchor="end" height={40} stroke="hsl(var(--foreground))" fontSize={9} /> {/* Ajustado ângulo e font-size */}
                <YAxis stroke="hsl(var(--foreground))" fontSize={10} tickFormatter={compactCurrencyFormatter} />
                <Tooltip
                  content={<ChartTooltipContent />}
                  cursor={{ fill: "hsl(var(--muted))" }}
                />
                <Legend wrapperStyle={{ fontSize: "10px" }} />
                <Bar dataKey="totalValue" name="Valor Total Mensal" radius={[4, 4, 0, 0]}>
                   {monthlySales.map((entry, index) => ( 
                    <Cell key={`cell-month-${entry.name}-${index}`} fill={categoryColorsArray[monthlySales.indexOf(entry) % categoryColorsArray.length]} />
                  ))}
                </Bar>
              </BarChart>
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
