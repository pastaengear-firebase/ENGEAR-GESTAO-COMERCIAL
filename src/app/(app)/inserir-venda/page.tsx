// src/app/(app)/inserir-venda/page.tsx
"use client";
import SalesForm from '@/components/sales/sales-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from 'lucide-react';
import { useSales } from '@/hooks/use-sales';
import { ALL_SELLERS_OPTION } from '@/lib/constants';

export default function InserirVendaPage() {
  const { selectedSeller } = useSales();

  const isGlobalSellerEquipeComercial = selectedSeller === ALL_SELLERS_OPTION;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Inserir Nova Venda</h1>
      
      {isGlobalSellerEquipeComercial && (
        <Alert variant="default" className="bg-amber-50 border-amber-300 text-amber-700">
          <Info className="h-4 w-4 !text-amber-600" />
          <AlertTitle>Modo Somente Leitura Ativado</AlertTitle>
          <AlertDescription>
            Para inserir uma nova venda, por favor, selecione um vendedor específico (SERGIO ou RODRIGO) no seletor do cabeçalho.
            O formulário abaixo está desabilitado.
          </AlertDescription>
        </Alert>
      )}

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Detalhes da Venda</CardTitle>
          <CardDescription>
            {isGlobalSellerEquipeComercial 
              ? "Selecione SERGIO ou RODRIGO no cabeçalho para habilitar." 
              : "Preencha todos os campos para registrar uma nova venda."
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SalesForm />
        </CardContent>
      </Card>
    </div>
  );
}
