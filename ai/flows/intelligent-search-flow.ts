'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';
import { SELLERS, AREA_OPTIONS, STATUS_OPTIONS, COMPANY_OPTIONS, PROPOSAL_STATUS_OPTIONS } from '@/lib/constants';

const SalesFiltersSchema = z.object({
  sellers: z.array(z.enum(SELLERS)).optional(),
  dateRange: z.object({
    start: z.string().optional(),
    end: z.string().optional(),
  }).optional(),
  companies: z.array(z.enum(COMPANY_OPTIONS)).optional(),
  areas: z.array(z.enum(AREA_OPTIONS)).optional(),
  statuses: z.array(z.enum(STATUS_OPTIONS)).optional(),
  valueRange: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
  }).optional(),
  searchTerm: z.string().optional()
}).optional();

const QuotesFiltersSchema = z.object({
  sellers: z.array(z.enum(SELLERS)).optional(),
  dateRange: z.object({
    start: z.string().optional(),
    end: z.string().optional(),
  }).optional(),
  companies: z.array(z.enum(COMPANY_OPTIONS)).optional(),
  areas: z.array(z.enum(AREA_OPTIONS)).optional(),
  statuses: z.array(z.enum(PROPOSAL_STATUS_OPTIONS)).optional(),
  valueRange: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
  }).optional(),
  searchTerm: z.string().optional()
}).optional();

export const SearchInputSchema = z.object({
  query: z.string(),
});
export type SearchInput = z.infer<typeof SearchInputSchema>;

export const SearchOutputSchema = z.object({
  salesFilters: SalesFiltersSchema,
  quotesFilters: QuotesFiltersSchema,
  responseText: z.string(),
});
export type SearchOutput = z.infer<typeof SearchOutputSchema>;

export async function intelligentSearch(input: SearchInput): Promise<SearchOutput> {
  const apiKey = process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    throw new Error('Chave de API do Gemini não configurada no ambiente do servidor.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  // Usa o modelo gemini-2.5-flash com fallback para gemini-2.0-flash ou 1.5-flash
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.2,
    },
  });

  const todayStr = new Date().toISOString().split('T')[0];

  const prompt = `Você é um analista de dados especialista em CRM de vendas da Engear/Climazone.
Sua tarefa é traduzir a pergunta em linguagem natural do usuário em filtros estruturados em formato JSON para buscar vendas e propostas.
A data de hoje é: ${todayStr}.

Analise a pergunta do usuário: "${input.query}"

REGRAS:
- Se mencionar "vendas", "venda", "faturamentos", "recebidos", preencha 'salesFilters'.
- Se mencionar "propostas", "orçamentos", "cotações", preencha 'quotesFilters'.
- Se for ambíguo ou mencionar ambos, preencha filtros para ambos.
- Para faixas de data (ex: "junho e julho", "último mês", "este ano"), calcule 'dateRange': { start: 'YYYY-MM-DD', end: 'YYYY-MM-DD' }. O ano base atual é ${new Date().getFullYear()}.
  - Exemplo: "junho e julho de 2026" => start: "2026-06-01", end: "2026-07-31".
  - Se não falar o ano, use o ano corrente (${new Date().getFullYear()}).
- Para valores, extraia 'min' e 'max' (números).
- Para termos gerais (nome de cliente, projeto, O.S.), preencha 'searchTerm'.
- O campo 'responseText' DEVE conter uma explicação amigável em português do que está sendo filtrado.

CAMPOS E VALORES DISPONÍVEIS:
Para Vendas:
- sellers: ${JSON.stringify(SELLERS)}
- companies: ${JSON.stringify(COMPANY_OPTIONS)}
- areas: ${JSON.stringify(AREA_OPTIONS)}
- statuses: ${JSON.stringify(STATUS_OPTIONS)}

Para Propostas:
- sellers: ${JSON.stringify(SELLERS)}
- companies: ${JSON.stringify(COMPANY_OPTIONS)}
- areas: ${JSON.stringify(AREA_OPTIONS)}
- statuses: ${JSON.stringify(PROPOSAL_STATUS_OPTIONS)}

Formato estrito do JSON de resposta:
{
  "salesFilters": {
    "sellers": ["SERGIO"],
    "companies": ["ENGEAR"],
    "areas": ["INST. AC"],
    "statuses": ["FINALIZADA"],
    "dateRange": { "start": "YYYY-MM-DD", "end": "YYYY-MM-DD" },
    "valueRange": { "min": 0, "max": 100000 },
    "searchTerm": "termo"
  },
  "quotesFilters": {
    "sellers": ["RODRIGO"],
    "companies": ["CLIMAZONE"],
    "areas": ["GÁS"],
    "statuses": ["Aceita"],
    "dateRange": { "start": "YYYY-MM-DD", "end": "YYYY-MM-DD" },
    "valueRange": { "min": 0, "max": 100000 },
    "searchTerm": "termo"
  },
  "responseText": "Buscando vendas do mês de junho e julho..."
}
`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const parsed = JSON.parse(text);

    return {
      salesFilters: parsed.salesFilters,
      quotesFilters: parsed.quotesFilters,
      responseText: parsed.responseText || 'Resultados encontrados para sua busca.',
    };
  } catch (error: any) {
    console.error('Erro na chamada da API Gemini:', error);
    throw new Error(`Falha no processamento da IA: ${error?.message || 'Erro desconhecido'}`);
  }
}
