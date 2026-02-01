
'use server';
/**
 * @fileOverview An intelligent search agent for sales and quotes data.
 *
 * - intelligentSearch - A function that handles natural language queries for sales and quotes.
 * - SearchInputSchema - The input type for the intelligentSearch function.
 * - SearchOutputSchema - The return type for the intelligentSearch function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { SELLERS, AREA_OPTIONS, STATUS_OPTIONS, COMPANY_OPTIONS, PROPOSAL_STATUS_OPTIONS } from '@/lib/constants';

// Define the structure for filter outputs
const SalesFiltersSchema = z.object({
  sellers: z.array(z.enum(SELLERS)).optional().describe('Filter by seller name.'),
  dateRange: z.object({
    start: z.string().optional().describe('Start date in YYYY-MM-DD format.'),
    end: z.string().optional().describe('End date in YYYY-MM-DD format.'),
  }).optional().describe('Filter by a date range.'),
  companies: z.array(z.enum(COMPANY_OPTIONS)).optional().describe('Filter by company.'),
  areas: z.array(z.enum(AREA_OPTIONS)).optional().describe('Filter by business area.'),
  statuses: z.array(z.enum(STATUS_OPTIONS)).optional().describe('Filter by sale status.'),
  valueRange: z.object({
    min: z.number().optional().describe('Minimum sales value.'),
    max: z.number().optional().describe('Maximum sales value.'),
  }).optional().describe('Filter by sales value range.'),
  searchTerm: z.string().optional().describe('A general search term for project, OS, or client/service fields.')
}).optional();

const QuotesFiltersSchema = z.object({
  sellers: z.array(z.enum(SELLERS)).optional().describe('Filter by seller name.'),
  dateRange: z.object({
    start: z.string().optional().describe('Start date in YYYY-MM-DD format.'),
    end: z.string().optional().describe('End date in YYYY-MM-DD format.'),
  }).optional().describe('Filter by a proposal date range.'),
  companies: z.array(z.enum(COMPANY_OPTIONS)).optional().describe('Filter by company.'),
  areas: z.array(z.enum(AREA_OPTIONS)).optional().describe('Filter by business area.'),
  statuses: z.array(z.enum(PROPOSAL_STATUS_OPTIONS)).optional().describe('Filter by quote status.'),
  valueRange: z.object({
    min: z.number().optional().describe('Minimum proposed value.'),
    max: z.number().optional().describe('Maximum proposed value.'),
  }).optional().describe('Filter by proposed value range.'),
  searchTerm: z.string().optional().describe('A general search term for client name or description fields.')
}).optional();

export const SearchInputSchema = z.object({
  query: z.string().describe('The natural language query from the user.'),
});
export type SearchInput = z.infer<typeof SearchInputSchema>;

export const SearchOutputSchema = z.object({
  salesFilters: SalesFiltersSchema.describe('The structured filters to be applied to the sales data.'),
  quotesFilters: QuotesFiltersSchema.describe('The structured filters to be applied to the quotes data.'),
  responseText: z.string().describe('A natural language summary of the query and the filters being applied.'),
});
export type SearchOutput = z.infer<typeof SearchOutputSchema>;

// Main exported function to be called from the client
export async function intelligentSearch(input: SearchInput): Promise<SearchOutput> {
  return intelligentSearchFlow(input);
}

const searchPrompt = ai.definePrompt({
    name: 'intelligentSearchPrompt',
    input: { schema: SearchInputSchema },
    output: { schema: SearchOutputSchema },
    prompt: `You are an expert data analyst for a sales CRM. Your task is to translate a user's natural language query into a structured JSON filter object to search for sales and quotes. Today's date is ${new Date().toISOString().split('T')[0]}.

You must respond with a JSON object containing 'salesFilters', 'quotesFilters', and a 'responseText'.
The 'responseText' should be a friendly confirmation of what you are searching for.

Analyze the user's query: "{{query}}"

- If the query mentions "vendas", "venda", "faturamentos", "recebidos", populate 'salesFilters'.
- If the query mentions "propostas", "orçamentos", "cotações", populate 'quotesFilters'.
- If the query is ambiguous, populate filters for both.
- If the query is about "vendas e propostas", populate both.
- For date ranges like "último mês", "esta semana", "ano passado", calculate the 'dateRange' in YYYY-MM-DD format.
- For value ranges, extract 'min' and 'max' values.
- For general text searches that don't map to a specific field (like a project name, client name), use the 'searchTerm' field.

AVAILABLE FILTER FIELDS AND VALUES:

**For Sales ('salesFilters'):**
- sellers: ${SELLERS.join(', ')}
- companies: ${COMPANY_OPTIONS.join(', ')}
- areas: ${AREA_OPTIONS.join(', ')}
- statuses: ${STATUS_OPTIONS.join(', ')}
- dateRange: { start: 'YYYY-MM-DD', end: 'YYYY-MM-DD' }
- valueRange: { min: number, max: number } (field is 'salesValue')
- searchTerm: string (for 'project', 'os', 'clientService')

**For Quotes ('quotesFilters'):**
- sellers: ${SELLERS.join(', ')}
- companies: ${COMPANY_OPTIONS.join(', ')}
- areas: ${AREA_OPTIONS.join(', ')}
- statuses: ${PROPOSAL_STATUS_OPTIONS.join(', ')}
- dateRange: { start: 'YYYY-MM-DD', end: 'YYYY-MM-DD' } (field is 'proposalDate')
- valueRange: { min: number, max: number } (field is 'proposedValue')
- searchTerm: string (for 'clientName', 'description')

Generate only the JSON object as a direct response.
`,
});

const intelligentSearchFlow = ai.defineFlow(
  {
    name: 'intelligentSearchFlow',
    inputSchema: SearchInputSchema,
    outputSchema: SearchOutputSchema,
    enforceAppCheck: false, // Desativa a verificação obrigatória para permitir testes de implantação.
  },
  async (input) => {
    const llmResponse = await searchPrompt(input);
    const output = llmResponse.output;
    if (!output) {
      throw new Error('AI did not return a valid structured response.');
    }
    return output;
  }
);

