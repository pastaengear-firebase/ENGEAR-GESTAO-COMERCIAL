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

/**
 * Analisador heurístico local inteligente (sempre funciona, custo zero, sem risco de quota)
 */
function localNaturalLanguageSearch(rawQuery: string): SearchOutput {
  const q = rawQuery.toLowerCase();
  const currentYear = new Date().getFullYear();

  // 1. Identificar Vendedores
  const matchedSellers: ('SERGIO' | 'RODRIGO')[] = [];
  if (q.includes('sergio') || q.includes('sérgio')) matchedSellers.push('SERGIO');
  if (q.includes('rodrigo')) matchedSellers.push('RODRIGO');

  // 2. Identificar Empresas
  const matchedCompanies: ('ENGEAR' | 'CLIMAZONE')[] = [];
  if (q.includes('engear')) matchedCompanies.push('ENGEAR');
  if (q.includes('climazone')) matchedCompanies.push('CLIMAZONE');

  // 3. Identificar Áreas
  const matchedAreas = AREA_OPTIONS.filter(area => q.includes(area.toLowerCase()));

  // 4. Identificar Status
  const matchedStatuses = STATUS_OPTIONS.filter(st => q.includes(st.toLowerCase()));
  if (q.includes('finalizada') || q.includes('finalizado') || q.includes('concluida') || q.includes('concluído')) {
    if (!matchedStatuses.includes('FINALIZADA')) matchedStatuses.push('FINALIZADA');
  }

  // 5. Identificar Meses
  const monthMap: Record<string, { startMonth: string, endMonth: string, lastDay: string }> = {
    'janeiro': { startMonth: '01', endMonth: '01', lastDay: '31' },
    'fevereiro': { startMonth: '02', endMonth: '02', lastDay: '28' },
    'março': { startMonth: '03', endMonth: '03', lastDay: '31' },
    'marco': { startMonth: '03', endMonth: '03', lastDay: '31' },
    'abril': { startMonth: '04', endMonth: '04', lastDay: '30' },
    'maio': { startMonth: '05', endMonth: '05', lastDay: '31' },
    'junho': { startMonth: '06', endMonth: '06', lastDay: '30' },
    'julho': { startMonth: '07', endMonth: '07', lastDay: '31' },
    'agosto': { startMonth: '08', endMonth: '08', lastDay: '31' },
    'setembro': { startMonth: '09', endMonth: '09', lastDay: '30' },
    'outubro': { startMonth: '10', endMonth: '10', lastDay: '31' },
    'novembro': { startMonth: '11', endMonth: '11', lastDay: '30' },
    'dezembro': { startMonth: '12', endMonth: '12', lastDay: '31' },
  };

  const detectedMonths: number[] = [];
  Object.keys(monthMap).forEach((mName) => {
    if (q.includes(mName)) {
      detectedMonths.push(parseInt(monthMap[mName].startMonth, 10));
    }
  });

  let dateRange: { start: string, end: string } | undefined;
  if (detectedMonths.length > 0) {
    const minM = Math.min(...detectedMonths);
    const maxM = Math.max(...detectedMonths);
    const minMStr = minM < 10 ? `0${minM}` : `${minM}`;
    const maxMStr = maxM < 10 ? `0${maxM}` : `${maxM}`;
    
    // Obter último dia do mês maxM
    const lastDayOfMonth = new Date(currentYear, maxM, 0).getDate();
    dateRange = {
      start: `${currentYear}-${minMStr}-01`,
      end: `${currentYear}-${maxMStr}-${lastDayOfMonth}`,
    };
  }

  // 6. Termos de busca (extrair palavras-chave ignorando termos estruturais)
  const stopWords = ['venda', 'vendas', 'de', 'do', 'da', 'dos', 'das', 'para', 'em', 'e', 'a', 'o', 'as', 'os', 'proposta', 'propostas', 'orcamento', 'orçamento', 'mes', 'mês', 'todas', 'todos', 'mostre', 'mostrar', 'buscar', 'pesquisar'];
  const tokens = q.split(/\s+/).filter(w => !stopWords.includes(w) && !monthMap[w] && !w.includes('sergio') && !w.includes('sérgio') && !w.includes('rodrigo') && !w.includes('engear') && !w.includes('climazone'));
  const searchTerm = tokens.length > 0 ? tokens.join(' ') : undefined;

  const isProposalOnly = q.includes('proposta') || q.includes('orçamento') || q.includes('cotação');
  const isSaleOnly = q.includes('venda') || q.includes('faturamento') || q.includes('recebido');

  const salesFilters = !isProposalOnly ? {
    sellers: matchedSellers.length ? matchedSellers : undefined,
    companies: matchedCompanies.length ? matchedCompanies : undefined,
    areas: matchedAreas.length ? matchedAreas : undefined,
    statuses: matchedStatuses.length ? matchedStatuses : undefined,
    dateRange,
    searchTerm,
  } : undefined;

  const quotesFilters = !isSaleOnly ? {
    sellers: matchedSellers.length ? matchedSellers : undefined,
    companies: matchedCompanies.length ? matchedCompanies : undefined,
    areas: matchedAreas.length ? matchedAreas : undefined,
    dateRange,
    searchTerm,
  } : undefined;

  const parts: string[] = [];
  if (matchedSellers.length) parts.push(`vendedor(es): ${matchedSellers.join(', ')}`);
  if (dateRange) parts.push(`período: ${dateRange.start} até ${dateRange.end}`);
  if (matchedCompanies.length) parts.push(`empresa: ${matchedCompanies.join(', ')}`);
  if (matchedStatuses.length) parts.push(`status: ${matchedStatuses.join(', ')}`);
  if (searchTerm) parts.push(`termo: "${searchTerm}"`);

  const summary = parts.length > 0
    ? `Filtrando por ${parts.join(' | ')}.`
    : `Buscando registros correspondentes a "${rawQuery}".`;

  return {
    salesFilters,
    quotesFilters,
    responseText: summary,
  };
}

export async function intelligentSearch(input: SearchInput): Promise<SearchOutput> {
  // 1. Tentar execução via Gemini API com fallback
  const rawKey = process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  // Limpar chaves duplicadas ou caracteres extras caso venham concatenados
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

  // 2. Fallback inteligente imediato: garante que a busca NUNCA quebre para o usuário
  return localNaturalLanguageSearch(input.query);
}
