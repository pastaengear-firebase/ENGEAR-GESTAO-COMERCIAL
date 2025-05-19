// src/components/sales/ai-suggestions.tsx
"use client";
import type { SuggestSalesImprovementsOutput } from '@/ai/flows/suggest-sales-improvements';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { ThumbsUp, AlertTriangle, Info } from 'lucide-react';

interface AISuggestionsProps {
  suggestions: SuggestSalesImprovementsOutput | null;
}

export default function AISuggestions({ suggestions }: AISuggestionsProps) {
  if (!suggestions || suggestions.suggestions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4 border border-dashed rounded-lg">
        <ThumbsUp className="h-12 w-12 text-green-500 mb-3" />
        <h3 className="text-lg font-semibold text-foreground">Tudo Certo!</h3>
        <p className="text-sm text-muted-foreground">
          Nenhuma sugestão da IA no momento. Clique em "Verificar com IA" no formulário após preencher alguns dados.
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px] rounded-md border p-1">
      <div className="p-3 space-y-3">
      {suggestions.suggestions.map((suggestion, index) => (
        <Alert key={index} className="shadow-sm">
          {suggestion.reason.toLowerCase().includes('error') || suggestion.reason.toLowerCase().includes('correção') ? 
            <AlertTriangle className="h-4 w-4 text-destructive" /> : 
            <Info className="h-4 w-4 text-blue-500" />
          }
          <AlertTitle className="flex items-center gap-2">
            <span>Campo: {suggestion.field}</span>
            <Badge variant={suggestion.reason.toLowerCase().includes('error') ? "destructive" : "secondary"}>
              {suggestion.reason.toLowerCase().includes('error') ? "Correção Sugerida" : "Melhoria"}
            </Badge>
          </AlertTitle>
          <AlertDescription>
            <p><strong className="font-medium">Sugestão:</strong> {suggestion.suggestion}</p>
            <p><strong className="font-medium">Motivo:</strong> {suggestion.reason}</p>
          </AlertDescription>
        </Alert>
      ))}
      </div>
    </ScrollArea>
  );
}
