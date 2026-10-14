'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';
import { SELLERS, AREA_OPTIONS, STATUS_OPTIONS, COMPANY_OPTIONS, PROPOSAL_STATUS_OPTIONS } from '@/lib/constants';
import { parseNaturalLanguageQuery, type SearchOutput as BaseSearchOutput } from '@/lib/ai-search-parser';

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
  const rawKey = process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  const apiKey = rawKey ? rawKey.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 39) : null;

  if (apiKey && apiKey.startsWith('AIza')) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: 'gemini-3.8-flash',
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      });

      const todayStr = new Date().toISOString().split('T')[0];
      const prompt = `Analise a pergunta do CRM: "${input.query}". Data atual: ${todayStr}.
Traduza em JSON com salesFilters, quotesFilters e responseText.
sellers disponíveis: ${JSON.stringify(SELLERS)}.
companies disponíveis: ${JSON.stringify(COMPANY_OPTIONS)}.
statuses disponíveis: ${JSON.stringify(STATUS_OPTIONS)}.
Formato:
{
  "salesFilters": { "sellers": [], "companies": [], "statuses": [], "dateRange": { "start": "YYYY-MM-DD", "end": "YYYY-MM-DD" }, "searchTerm": "" },
  "quotesFilters": { "sellers": [], "companies": [], "dateRange": { "start": "YYYY-MM-DD", "end": "YYYY-MM-DD" }, "searchTerm": "" },
  "responseText": "Explicacao amigavel"
}`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const parsed = JSON.parse(text);

      return {
        salesFilters: parsed.salesFilters,
        quotesFilters: parsed.quotesFilters,
        responseText: parsed.responseText || 'Resultados encontrados.',
      };
    } catch (apiError: any) {
      console.warn('[intelligentSearch] Gemini API error, applying local intelligent fallback:', apiError?.message);
    }
  }

  return parseNaturalLanguageQuery(input.query) as SearchOutput;
}
