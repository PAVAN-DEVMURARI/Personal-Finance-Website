'use server';

/**
 * @fileOverview Generates a monthly AI financial report for the user.
 *
 * - generateMonthlyReport - A function that generates the monthly report.
 * - MonthlyReportInput - The input type for the generateMonthlyReport function.
 * - MonthlyReportOutput - The return type for the generateMonthlyReport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MonthlyReportInputSchema = z.object({
  income: z.number().describe('Total income for the month.'),
  expenses: z.number().describe('Total expenses for the month.'),
  investments: z.number().describe('Total investments for the month.'),
  spendingByCategory: z.record(z.number()).describe('Spending per category (e.g., Food, Travel).'),
  investmentPortfolio: z.record(z.number()).describe('Investment portfolio (e.g. mutual funds, stocks).'),
});
export type MonthlyReportInput = z.infer<typeof MonthlyReportInputSchema>;

const MonthlyReportOutputSchema = z.object({
  report: z.string().describe('The AI-generated financial report.'),
  feedback: z.string().describe('Personalized feedback to improve financial habits.'),
});
export type MonthlyReportOutput = z.infer<typeof MonthlyReportOutputSchema>;

export async function generateMonthlyReport(input: MonthlyReportInput): Promise<MonthlyReportOutput> {
  return monthlyReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'monthlyReportPrompt',
  input: {schema: MonthlyReportInputSchema},
  output: {schema: MonthlyReportOutputSchema},
  prompt: `You are an AI financial advisor. Generate a concise monthly financial report based on the following data:\n\nIncome: {{{income}}}\nExpenses: {{{expenses}}}\nInvestments: {{{investments}}}\nSpending by Category: {{{spendingByCategory}}}\nInvestment Portfolio: {{{investmentPortfolio}}}\n\nHighlight key trends and provide personalized feedback to help the user improve their financial habits.`,
});

const monthlyReportFlow = ai.defineFlow(
  {
    name: 'monthlyReportFlow',
    inputSchema: MonthlyReportInputSchema,
    outputSchema: MonthlyReportOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
