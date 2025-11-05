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

const InvestmentDetailSchema = z.object({
  name: z.string(),
  type: z.string(),
  value: z.number(),
});

const MonthlyReportInputSchema = z.object({
  income: z.number().describe('Total income for the month.'),
  expenses: z.number().describe('Total expenses for the month.'),
  spendingByCategory: z.record(z.number()).describe('Spending per category (e.g., Food, Travel).'),
  investmentPortfolio: z.array(InvestmentDetailSchema).describe('A detailed list of the user\'s investments, including name, type, and current value.'),
});
export type MonthlyReportInput = z.infer<typeof MonthlyReportInputSchema>;

const MonthlyReportOutputSchema = z.object({
  report: z.string().describe('The AI-generated financial report. This should be a comprehensive summary including analysis of income, expenses, and investment performance.'),
  feedback: z.string().describe('Personalized feedback to improve financial habits, including specific comments on spending and investment allocation.'),
});
export type MonthlyReportOutput = z.infer<typeof MonthlyReportOutputSchema>;

export async function generateMonthlyReport(input: MonthlyReportInput): Promise<MonthlyReportOutput> {
  return monthlyReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'monthlyReportPrompt',
  input: {schema: MonthlyReportInputSchema},
  output: {schema: MonthlyReportOutputSchema},
  prompt: `You are an AI financial advisor. Generate a concise monthly financial report based on the following data:

Income: {{{income}}}
Expenses: {{{expenses}}}
Spending by Category:
{{#each spendingByCategory}}
- {{@key}}: {{{this}}}
{{/each}}

Investment Portfolio:
{{#each investmentPortfolio}}
- {{name}} ({{type}}): {{{value}}}
{{/each}}

Analyze the user's income, expenses, and detailed investment portfolio. In the 'report' field, provide a summary of their financial health. In the 'feedback' field, provide personalized, actionable advice. Comment on their spending habits and the composition of their investment portfolio.`,
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
