// src/app/(app)/dashboard/page.tsx
"use client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, DollarSign, ListChecks, TrendingUp, Printer, CalendarDays, Filter } from "lucide-react";
import SalesCharts from "@/components/sales/sales-charts";
import { useSales } from "@/hooks/use-sales";
import { DatePickerWithRange } from "@/components/ui/date-range-picker"; // Assume this component exists or will be created
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { addDays, format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { useState, useEffect } from "react";

// A simple DatePickerWithRange - you'd typically have a more robust one
const SimpleDatePickerWithRange: React.FC<{
  date: DateRange | undefined;
  setDate: (date: DateRange | undefined) => void;
  className?: string;
}> = ({ date, setDate, className }) => {
  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[300px] justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarDays className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} -{" "}
                  {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>Selecione um período</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <DatePickerWithRange
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={setDate}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};


export default function DashboardPage() {
  const { filteredSales, setFilters, filters } = useSales();
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: filters.startDate || addDays(new Date(), -30),
    to: filters.endDate || new Date(),
  });

  useEffect(() => {
    setFilters({ startDate: dateRange?.from, endDate: dateRange?.to });
  }, [dateRange, setFilters]);

  const totalSalesValue = filteredSales.reduce((sum, sale) => sum + sale.salesValue, 0);
  const totalSalesCount = filteredSales.length;
  const wonSales = filteredSales.filter(sale => sale.status === 'Ganha').length;
  const openSales = filteredSales.filter(sale => sale.status === 'Aberta').length;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6" id="dashboard-printable-area">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard de Vendas</h1>
          <p className="text-muted-foreground">Visão geral do desempenho da equipe comercial.</p>
        </div>
        <div className="flex items-center gap-2">
           <SimpleDatePickerWithRange date={dateRange} setDate={setDateRange} />
          <Button onClick={handlePrint} variant="outline" size="icon" className="print-hide">
            <Printer className="h-4 w-4" />
            <span className="sr-only">Imprimir Dashboard</span>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total de Vendas</CardTitle>
            <DollarSign className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {totalSalesValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">No período selecionado</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Vendas</CardTitle>
            <BarChart className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSalesCount}</div>
            <p className="text-xs text-muted-foreground">Número de vendas registradas</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendas Ganhas</CardTitle>
            <TrendingUp className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{wonSales}</div>
            <p className="text-xs text-muted-foreground">Status "Ganha"</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendas Abertas</CardTitle>
            <ListChecks className="h-5 w-5 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openSales}</div>
            <p className="text-xs text-muted-foreground">Status "Aberta"</p>
          </CardContent>
        </Card>
      </div>

      <SalesCharts salesData={filteredSales} />
      
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
          /* Add more print-specific styles here */
          @page {
            size: A4 landscape;
            margin: 10mm;
          }
        }
      `}</style>
    </div>
  );
}
