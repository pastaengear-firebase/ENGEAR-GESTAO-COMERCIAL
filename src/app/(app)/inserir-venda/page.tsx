// src/app/(app)/inserir-venda/page.tsx
"use client";
import SalesForm from '@/components/sales/sales-form';
import AISuggestions from '@/components/sales/ai-suggestions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useState } from 'react';
import type { SuggestSalesImprovementsOutput } from '@/ai/flows/suggest-sales-improvements';
import type { SalesFormData } from '@/lib/schemas';
import { Lightbulb } from 'lucide-react';

export default function InserirVendaPage() {
  const [aiSuggestions, setAiSuggestions] = useState<SuggestSalesImprovementsOutput | null>(null);
  const [currentFormData, setCurrentFormData] = useState<Partial<SalesFormData>>({});

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Inserir Nova Venda</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-lg">
          <CardHeader>
            <CardTitle>Detalhes da Venda</CardTitle>
            <CardDescription>Preencha todos os campos para registrar uma nova venda.</CardDescription>
          </CardHeader>
          <CardContent>
            <SalesForm 
              onFormChange={setCurrentFormData} 
              onSuggestionsFetched={setAiSuggestions} 
            />
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center space-x-2">
            <Lightbulb className="h-6 w-6 text-primary" />
            <div>
              <CardTitle>Sugestões Inteligentes</CardTitle>
              <CardDescription>Melhorias sugeridas pela IA.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <AISuggestions suggestions={aiSuggestions} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
