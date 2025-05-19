// Use server directive to ensure this code runs on the server.
'use server';

/**
 * @fileOverview AI-powered tool to suggest improvements or corrections to sales entries.
 *
 * - suggestSalesImprovements - A function that suggests improvements to sales data.
 * - SuggestSalesImprovementsInput - The input type for the suggestSalesImprovements function.
 * - SuggestSalesImprovementsOutput - The return type for the suggestSalesImprovements function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { COMPANY_OPTIONS, AREA_OPTIONS, STATUS_OPTIONS } from '@/lib/constants';

const SuggestSalesImprovementsInputSchema = z.object({
  date: z.string().describe('The date of the sale (YYYY-MM-DD).'),
  company: z.enum(COMPANY_OPTIONS).describe('The name of the company sold to.'),
  project: z.string().describe('The project name associated with the sale.'),
  os: z.string().describe('The order sheet number (can be "0000" or empty if not applicable).'),
  area: z.enum(AREA_OPTIONS).describe('The area of the sale (e.g., INST. AC, MANUT. AC).'),
  clientService: z.string().describe('The type of client or service provided.'),
  salesValue: z.number().describe('The monetary value of the sale.'),
  status: z.enum(STATUS_OPTIONS).describe('The current status of the sale (e.g., Á INICAR, EM ANDAMENTO, FINALIZADO, CANCELADO).'),
  payment: z.number().describe('The payment value related to the sale, in BRL.'),
});
export type SuggestSalesImprovementsInput = z.infer<typeof SuggestSalesImprovementsInputSchema>;

const SuggestSalesImprovementsOutputSchema = z.object({
  suggestions: z.array(
    z.object({
      field: z.string().describe('The field to improve or correct.'),
      suggestion: z.string().describe('The suggested improvement or correction.'),
      reason: z.string().describe('The reason for the suggested improvement.'),
    })
  ).describe('A list of suggestions for improving or correcting the sales entry.'),
});
export type SuggestSalesImprovementsOutput = z.infer<typeof SuggestSalesImprovementsOutputSchema>;

export async function suggestSalesImprovements(input: SuggestSalesImprovementsInput): Promise<SuggestSalesImprovementsOutput> {
  return suggestSalesImprovementsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestSalesImprovementsPrompt',
  input: {schema: SuggestSalesImprovementsInputSchema},
  output: {schema: SuggestSalesImprovementsOutputSchema},
  prompt: `You are an AI assistant helping sales managers improve the accuracy and performance of their sales data.

  Based on the following sales entry and your knowledge of historical sales data, provide suggestions for improvements or corrections.
  Focus on identifying potential errors, inconsistencies, or opportunities for optimization.

  Sales Entry:
  - Date: {{{date}}}
  - Company: {{{company}}}
  - Project: {{{project}}}
  - OS: {{{os}}}
  - Area: {{{area}}}
  - Client/Service: {{{clientService}}}
  - Sales Value: R$ {{{salesValue}}}
  - Status: {{{status}}}
  - Payment Value: R$ {{{payment}}}

  Provide a list of suggestions, including the field to improve, the suggested improvement, and the reason for the suggestion.
  Be specific about which field the suggestion applies to.
  If a value seems unusually low or high (e.g. salesValue, payment), point it out.
  If a combination of fields seems unlikely (e.g. a very high sales value for a small project), suggest reviewing it.
  If the payment value seems inconsistent with the sales value (e.g., much higher or significantly lower without clear reason), suggest reviewing it.
  Ensure dates are logical (e.g., not in the distant future or past unless justified).
  If the OS field is "0000" or empty, consider if this is appropriate for the type of project or company. For example, large projects for 'ENGEAR' typically have an OS.

  Format your output as a JSON array of objects, where each object has the keys 'field', 'suggestion', and 'reason'.
  If no specific suggestions are found, return an empty array for suggestions.
  `,
});

const suggestSalesImprovementsFlow = ai.defineFlow(
  {
    name: 'suggestSalesImprovementsFlow',
    inputSchema: SuggestSalesImprovementsInputSchema,
    outputSchema: SuggestSalesImprovementsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output || !output.suggestions) {
      return { suggestions: [] }; // Ensure a valid empty array if AI returns nothing
    }
    return output;
  }
);
