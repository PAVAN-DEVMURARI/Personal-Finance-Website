'use server';

/**
 * @fileOverview Generates personalized financial tips based on user spending habits and financial goals.
 *
 * - generateFinancialTip - A function that generates a personalized financial tip.
 * - FinancialTipInput - The input type for the generateFinancialTip function.
 * - FinancialTipOutput - The return type for the generateFinancialTip function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FinancialTipInputSchema = z.object({
  currentMonthSpending: z.number().describe('Total spending for the current month.'),
  previousMonthSpending: z.number().describe('Total spending for the previous month.'),
  savings: z.number().describe('Total savings amount.'),
  investmentPerformance: z.string().describe('Performance of investments (e.g., "+2.5%").'),
  financialGoals: z.string().describe('Description of the user financial goals.'),
});
export type FinancialTipInput = z.infer<typeof FinancialTipInputSchema>;

const FinancialTipOutputSchema = z.object({
  tip: z.string().describe('A personalized financial tip for the user.'),
});
export type FinancialTipOutput = z.infer<typeof FinancialTipOutputSchema>;

export async function generateFinancialTip(input: FinancialTipInput): Promise<FinancialTipOutput> {
  return generateFinancialTipFlow(input);
}

const prompt = ai.definePrompt({
  name: 'financialTipPrompt',
  input: {schema: FinancialTipInputSchema},
  output: {schema: FinancialTipOutputSchema},
  prompt: `You are a financial advisor providing personalized tips to users.

  Based on the user's financial data, generate a concise and actionable financial tip.
  If the user has saved money compared to last month, congratulate them.
  Your tip should be encouraging and provide a specific, actionable insight.

  Current Month Spending: {{{currentMonthSpending}}}
  Previous Month Spending: {{{previousMonthSpending}}}
  Total Savings: {{{savings}}}
  Investment Performance: {{{investmentPerformance}}}
  Financial Goals: {{{financialGoals}}}

  Tip:`,
});

const generateFinancialTipFlow = ai.defineFlow(
  {
    name: 'generateFinancialTipFlow',
    inputSchema: FinancialTipInputSchema,
    outputSchema: FinancialTipOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
