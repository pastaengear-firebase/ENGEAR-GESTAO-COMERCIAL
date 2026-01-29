// src/app/(app)/propostas/nova/page.tsx
"use client";
import QuoteForm from '@/components/quotes/quote-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useSales } from '@/hooks/use-sales';
import { FilePlus, Info } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NovaPropostaPage() {
  const { isReadOnly } = useSales();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center">
            Nova Proposta Comercial
          </h1>
          <p className="text-muted-foreground">
            Preencha os detalhes abaixo para registrar uma nova proposta.
          </p>
        </div>
      </div>
      
      {isReadOnly && (
        <Alert variant="default" className="bg-amber-50 border-amber-300 text-amber-700">
          <Info className="h-4 w-4 !text-amber-600" />
          <AlertTitle>Ação Necessária</AlertTitle>
          <AlertDescription>
            Para criar uma nova proposta, por favor, faça login com uma conta de vendedor autorizada.
            O formulário abaixo está desabilitado.
          </AlertDescription>
        </Alert>
      )}

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Detalhes da Proposta</CardTitle>
          <CardDescription>
            {isReadOnly
              ? "Faça login com um usuário de vendas para habilitar." 
              : "Todos os campos marcados com * são obrigatórios."
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <QuoteForm showReadOnlyAlert={false} />
        </CardContent>
      </Card>
    </div>
  );
}
