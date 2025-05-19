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

const SuggestSalesImprovementsInputSchema = z.object({
  date: z.string().describe('The date of the sale (YYYY-MM-DD).'),
  company: z.string().describe('The name of the company sold to.'),
  project: z.string().describe('The project name associated with the sale.'),
  os: z.string().describe('The order sheet number.'),
  area: z.string().describe('The area of the sale (e.g., North, South, East, West).'),
  clientService: z.string().describe('The type of client or service provided.'),
  salesValue: z.number().describe('The monetary value of the sale.'),
  status: z.string().describe('The current status of the sale (e.g., Open, Won, Lost).'),
  payment: z.string().describe('The payment terms for the sale.'),
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
  - Sales Value: {{{salesValue}}}
  - Status: {{{status}}}
  - Payment: {{{payment}}}

  Provide a list of suggestions, including the field to improve, the suggested improvement, and the reason for the suggestion.

  Format your output as a JSON array of objects, where each object has the keys 'field', 'suggestion', and 'reason'.
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
    return output!;
  }
);
