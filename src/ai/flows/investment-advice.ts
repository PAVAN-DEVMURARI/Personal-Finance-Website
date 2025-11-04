'use server';

/**
 * @fileOverview Provides AI-driven investment advice.
 *
 * - generateInvestmentAdvice - A function that generates advice for a given asset.
 * - InvestmentAdviceInput - The input type for the function.
 * - InvestmentAdviceOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const InvestmentAdviceInputSchema = z.object({
  assetName: z.string().describe('The name of the investment asset (e.g., Bitcoin, Gold, Nifty 50 ETF).'),
});
export type InvestmentAdviceInput = z.infer<typeof InvestmentAdviceInputSchema>;

const InvestmentAdviceOutputSchema = z.object({
  signal: z.enum(['BUY', 'SELL', 'HOLD']).describe("The investment signal: 'BUY', 'SELL', or 'HOLD'."),
  advice: z.string().describe('Detailed analysis and reasoning for the signal.'),
  disclaimer: z.string().describe('A standard disclaimer that this is not financial advice.'),
});
export type InvestmentAdviceOutput = z.infer<typeof InvestmentAdviceOutputSchema>;

export async function generateInvestmentAdvice(input: InvestmentAdviceInput): Promise<InvestmentAdviceOutput> {
  return investmentAdviceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'investmentAdvicePrompt',
  input: { schema: InvestmentAdviceInputSchema },
  output: { schema: InvestmentAdviceOutputSchema },
  prompt: `You are an expert financial analyst. Your task is to provide investment advice on a specific asset.

Asset: {{{assetName}}}

Analyze the current market conditions for this asset. Based on your analysis, determine whether it's a good time to buy, sell, or hold.
- If it's a buying opportunity, set the signal to 'BUY'.
- If there are signs of a downturn or it's overvalued, set the signal to 'SELL'.
- Otherwise, set the signal to 'HOLD'.

Provide a concise, one-paragraph explanation for your recommendation in the 'advice' field.

Finally, set the 'disclaimer' to: "This is AI-generated analysis and not financial advice. Always do your own research and consult with a qualified financial advisor before making investment decisions."`,
});

const investmentAdviceFlow = ai.defineFlow(
  {
    name: 'investmentAdviceFlow',
    inputSchema: InvestmentAdviceInputSchema,
    outputSchema: InvestmentAdviceOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
