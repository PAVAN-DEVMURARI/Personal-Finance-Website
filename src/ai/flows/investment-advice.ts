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
import fetch from 'node-fetch';

const getStockPriceTool = ai.defineTool(
    {
      name: 'getStockPrice',
      description: 'Gets the current price of a stock.',
      inputSchema: z.object({ ticker: z.string().describe('The stock ticker symbol.') }),
      outputSchema: z.object({ price: z.number() }),
    },
    async ({ ticker }) => {
        const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
        if (!apiKey || apiKey === 'YOUR_API_KEY') {
            console.warn("Alpha Vantage API key not found. Using mock price.");
            return { price: Math.random() * 1000 + 100 };
        }
        
        const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${ticker}&apikey=${apiKey}`;
        
        try {
            const response = await fetch(url);
            const data: any = await response.json();
            const price = parseFloat(data['Global Quote']['05. price']);
            if (isNaN(price)) {
                console.error(`Could not parse price for ${ticker}. Response:`, data);
                return { price: 0 };
            }
            return { price };
        } catch (error) {
            console.error(`Error fetching stock price for ${ticker}:`, error);
            // Fallback to a mock price or handle the error appropriately
            return { price: 0 };
        }
    }
);


const InvestmentAdviceInputSchema = z.object({
  assetName: z.string().describe('The name of the investment asset (e.g., Bitcoin, Gold, Nifty 50 ETF).'),
  assetType: z.string().describe('The type of asset (e.g., Stocks, Crypto, ETFs).'),
  purchasePrice: z.number().describe('The price at which the asset was purchased.'),
});
export type InvestmentAdviceInput = z.infer<typeof InvestmentAdviceInputSchema>;

const InvestmentAdviceOutputSchema = z.object({
  signal: z.enum(['BUY', 'SELL', 'HOLD']).describe("The investment signal: 'BUY', 'SELL', or 'HOLD'."),
  advice: z.string().describe('Detailed analysis and reasoning for the signal.'),
  currentPrice: z.number().describe('The current market price of the asset.'),
  disclaimer: z.string().describe('A standard disclaimer that this is not financial advice.'),
});
export type InvestmentAdviceOutput = z.infer<typeof InvestmentAdviceOutputSchema>;

export async function generateInvestmentAdvice(input: InvestmentAdviceInput): Promise<InvestmentAdviceOutput> {
  return investmentAdviceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'investmentAdvicePrompt',
  input: { schema: z.object({ assetName: z.string(), purchasePrice: z.number(), currentPrice: z.number() }) },
  output: { schema: InvestmentAdviceOutputSchema.omit({ currentPrice: true }) },
  tools: [getStockPriceTool],
  prompt: `You are an expert financial analyst. Your task is to provide investment advice on a specific asset.

Asset: {{{assetName}}}
Purchase Price: {{{purchasePrice}}}
Current Market Price: {{{currentPrice}}}

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
    
    let currentPrice = input.purchasePrice; // Default to purchase price

    if (input.assetType.toLowerCase() === 'stocks') {
        const stockPrice = await getStockPriceTool({ ticker: input.assetName });
        currentPrice = stockPrice.price;
    }

    // If we couldn't get a real price for a stock, return early to avoid bad advice.
    if (input.assetType.toLowerCase() === 'stocks' && currentPrice === 0) {
      return {
        signal: 'HOLD',
        advice: `Could not retrieve a current price for ${input.assetName}. Unable to provide advice at this time.`,
        currentPrice: 0,
        disclaimer: "This is AI-generated analysis and not financial advice. Always do your own research and consult with a qualified financial advisor before making investment decisions."
      };
    }

    const { output } = await prompt({
        assetName: input.assetName,
        purchasePrice: input.purchasePrice,
        currentPrice: currentPrice,
    });
    
    return {
        ...output!,
        currentPrice,
    };
  }
);
