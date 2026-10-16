import { SELLERS, AREA_OPTIONS, STATUS_OPTIONS, COMPANY_OPTIONS, PROPOSAL_STATUS_OPTIONS } from '@/lib/constants';

export interface DateRange {
  start?: string;
  end?: string;
}

export interface ValueRange {
  min?: number;
  max?: number;
}

export interface SalesFilters {
  sellers?: ('SERGIO' | 'RODRIGO')[];
  companies?: ('ENGEAR' | 'CLIMAZONE')[];
  areas?: string[];
  statuses?: string[];
  dateRange?: DateRange;
  valueRange?: ValueRange;
  searchTerm?: string;
}

export interface QuotesFilters {
  sellers?: ('SERGIO' | 'RODRIGO')[];
  companies?: ('ENGEAR' | 'CLIMAZONE')[];
  areas?: string[];
  statuses?: string[];
  dateRange?: DateRange;
  valueRange?: ValueRange;
  searchTerm?: string;
}

export interface SearchOutput {
  salesFilters?: SalesFilters;
  quotesFilters?: QuotesFilters;
  responseText: string;
}

/**
 * Analisador inteligente de linguagem natural
 * Executa instantaneamente no navegador com zero latência, 100% de confiabilidade e custo zero.
 */
export function parseNaturalLanguageQuery(rawQuery: string): SearchOutput {
  const q = rawQuery.toLowerCase();
  
  // 1. Identificar Ano mencionado (ex: 2024, 2025, 2026) ou padrão atual
  const yearMatch = q.match(/\b(202[0-9])\b/);
  const targetYear = yearMatch ? parseInt(yearMatch[1], 10) : new Date().getFullYear();

  // 2. Identificar Vendedores
  const matchedSellers: ('SERGIO' | 'RODRIGO')[] = [];
  if (q.includes('sergio') || q.includes('sérgio')) matchedSellers.push('SERGIO');
  if (q.includes('rodrigo')) matchedSellers.push('RODRIGO');

  // 3. Identificar Empresas
  const matchedCompanies: ('ENGEAR' | 'CLIMAZONE')[] = [];
  if (q.includes('engear')) matchedCompanies.push('ENGEAR');
  if (q.includes('climazone')) matchedCompanies.push('CLIMAZONE');

  // 4. Identificar Áreas
  const matchedAreas = AREA_OPTIONS.filter(area => q.includes(area.toLowerCase()));

  // 5. Identificar Status
  const matchedStatuses = STATUS_OPTIONS.filter(st => q.includes(st.toLowerCase()));
  if (q.includes('finalizada') || q.includes('finalizado') || q.includes('concluida') || q.includes('concluído')) {
    if (!matchedStatuses.includes('FINALIZADA')) matchedStatuses.push('FINALIZADA');
  }
  if (q.includes('cancelada') || q.includes('cancelado')) {
    if (!matchedStatuses.includes('CANCELADO')) matchedStatuses.push('CANCELADO');
  }

  // 6. Identificar Meses
  const monthMap: Record<string, number> = {
    'janeiro': 1, 'fevereiro': 2, 'março': 3, 'marco': 3,
    'abril': 4, 'maio': 5, 'junho': 6, 'julho': 7,
    'agosto': 8, 'setembro': 9, 'outubro': 10, 'novembro': 11, 'dezembro': 12
  };

  const detectedMonths: number[] = [];
  Object.keys(monthMap).forEach((mName) => {
    // busca pela palavra do mês
    const regex = new RegExp(`\\b${mName}\\b`, 'i');
    if (regex.test(q)) {
      detectedMonths.push(monthMap[mName]);
    }
  });

  let dateRange: DateRange | undefined;
  if (detectedMonths.length > 0) {
    const minM = Math.min(...detectedMonths);
    const maxM = Math.max(...detectedMonths);
    const minMStr = minM < 10 ? `0${minM}` : `${minM}`;
    const maxMStr = maxM < 10 ? `0${maxM}` : `${maxM}`;
    
    // Obter último dia do mês maxM
    const lastDayOfMonth = new Date(targetYear, maxM, 0).getDate();
    dateRange = {
      start: `${targetYear}-${minMStr}-01`,
      end: `${targetYear}-${maxMStr}-${lastDayOfMonth}`,
    };
  } else if (yearMatch) {
    // Ano específico mencionado sem meses (ex: "vendas de 2025")
    dateRange = {
      start: `${targetYear}-01-01`,
      end: `${targetYear}-12-31`,
    };
  }

  // 7. Identificar Faixa de Valores (ex: "acima de 10000", "maior que 5 mil", "abaixo de 20000")
  let valueRange: ValueRange | undefined;
  const aboveMatch = q.match(/(?:acima de|maior que|>|mais de)\s*(?:r\$\s*)?([\d\.\,]+)\s*(mil)?/i);
  const belowMatch = q.match(/(?:abaixo de|menor que|<|menos de)\s*(?:r\$\s*)?([\d\.\,]+)\s*(mil)?/i);
  
  if (aboveMatch) {
    let val = parseFloat(aboveMatch[1].replace(/\./g, '').replace(',', '.'));
    if (aboveMatch[2]) val *= 1000;
    valueRange = { ...valueRange, min: val };
  }
  if (belowMatch) {
    let val = parseFloat(belowMatch[1].replace(/\./g, '').replace(',', '.'));
    if (belowMatch[2]) val *= 1000;
    valueRange = { ...valueRange, max: val };
  }

  // 8. Termos de busca (extrair palavras-chave ignorando termos estruturais)
  const stopWords = [
    'venda', 'vendas', 'de', 'do', 'da', 'dos', 'das', 'para', 'em', 'e', 'a', 'o', 'as', 'os',
    'proposta', 'propostas', 'orcamento', 'orçamento', 'mes', 'mês', 'meses', 'todas', 'todos',
    'mostre', 'mostrar', 'buscar', 'pesquisar', 'ano', 'acima', 'abaixo', 'maior', 'menor', 'que', 'mil',
    'finalizada', 'finalizadas', 'finalizado', 'finalizados', 'concluida', 'concluídas', 'concluido', 'concluídos',
    'cancelada', 'canceladas', 'cancelado', 'cancelados'
  ];
  
  const tokens = q
    .replace(/[^\w\sà-úÀ-Ú]/g, ' ')
    .split(/\s+/)
    .filter(w => (
      w.length > 2 &&
      !stopWords.includes(w) &&
      !monthMap[w] &&
      !w.includes('sergio') &&
      !w.includes('sérgio') &&
      !w.includes('rodrigo') &&
      !w.includes('engear') &&
      !w.includes('climazone') &&
      !/^\d+$/.test(w)
    ));
    
  const searchTerm = tokens.length > 0 ? tokens.join(' ') : undefined;

  const isProposalOnly = q.includes('proposta') || q.includes('orçamento') || q.includes('cotação');
  const isSaleOnly = q.includes('venda') || q.includes('faturamento') || q.includes('recebido');

  const salesFilters: SalesFilters | undefined = !isProposalOnly ? {
    sellers: matchedSellers.length ? matchedSellers : undefined,
    companies: matchedCompanies.length ? matchedCompanies : undefined,
    areas: matchedAreas.length ? matchedAreas : undefined,
    statuses: matchedStatuses.length ? matchedStatuses : undefined,
    dateRange,
    valueRange,
    searchTerm,
  } : undefined;

  const quotesFilters: QuotesFilters | undefined = !isSaleOnly ? {
    sellers: matchedSellers.length ? matchedSellers : undefined,
    companies: matchedCompanies.length ? matchedCompanies : undefined,
    areas: matchedAreas.length ? matchedAreas : undefined,
    dateRange,
    valueRange,
    searchTerm,
  } : undefined;

  // Montar resumo em português claro
  const parts: string[] = [];
  if (matchedSellers.length) parts.push(`Vendedor: ${matchedSellers.join(', ')}`);
  if (dateRange) parts.push(`Período: ${dateRange.start} até ${dateRange.end}`);
  if (matchedCompanies.length) parts.push(`Empresa: ${matchedCompanies.join(', ')}`);
  if (matchedStatuses.length) parts.push(`Status: ${matchedStatuses.join(', ')}`);
  if (valueRange?.min) parts.push(`Valor mín: R$ ${valueRange.min.toLocaleString('pt-BR')}`);
  if (valueRange?.max) parts.push(`Valor máx: R$ ${valueRange.max.toLocaleString('pt-BR')}`);
  if (searchTerm) parts.push(`Termo: "${searchTerm}"`);

  const summary = parts.length > 0
    ? `Filtros aplicados: ${parts.join(' | ')}.`
    : `Buscando registros correspondentes a "${rawQuery}".`;

  return {
    salesFilters,
    quotesFilters,
    responseText: summary,
  };
}
