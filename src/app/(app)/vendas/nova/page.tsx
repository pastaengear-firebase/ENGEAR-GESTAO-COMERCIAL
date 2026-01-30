// src/app/(app)/vendas/nova/page.tsx
"use client";
import SalesForm from '@/components/sales/sales-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, PlusCircle } from 'lucide-react';
import { useSales } from '@/hooks/use-sales';
import { useSearchParams } from 'next/navigation';

export default function NovaVendaPage() {
  const { isReadOnly } = useSales();
  const searchParams = useSearchParams();
  const fromQuoteId = searchParams.get('fromQuoteId');


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center">
            <PlusCircle className="mr-3 h-8 w-8" /> 
            {fromQuoteId ? 'Converter Proposta em Venda' : 'Inserir Nova Venda'}
          </h1>
          <p className="text-muted-foreground">
            {fromQuoteId 
              ? 'Os dados da proposta foram pré-preenchidos. Confirme e salve a nova venda.'
              : 'Preencha os detalhes abaixo para registrar uma nova venda.'
            }
          </p>
        </div>
      </div>
      
      {isReadOnly && (
        <Alert variant="default" className="bg-amber-50 border-amber-300 text-amber-700">
          <Info className="h-4 w-4 !text-amber-600" />
          <AlertTitle>Ação Necessária</AlertTitle>
          <AlertDescription>
            Para inserir uma nova venda, por favor, faça login com uma conta de vendedor autorizada (SERGIO ou RODRIGO).
            O formulário abaixo está desabilitado.
          </AlertDescription>
        </Alert>
      )}

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Detalhes da Venda</CardTitle>
          <CardDescription>
            {isReadOnly
              ? "Faça login com um usuário de vendas para habilitar." 
              : "Preencha todos os campos para registrar uma nova venda."
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SalesForm fromQuoteId={fromQuoteId} />
        </CardContent>
      </Card>
    </div>
  );
}
