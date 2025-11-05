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

const getAssetPerformanceTool = ai.defineTool(
    {
      name: 'getAssetPerformance',
      description: 'Gets the historical performance of a stock, calculating percentage change over various periods.',
      inputSchema: z.object({ ticker: z.string().describe('The stock ticker symbol.') }),
      outputSchema: z.object({
        currentPrice: z.number(),
        weeklyChange: z.number(),
        monthlyChange: z.number(),
        yearlyChange: z.number(),
        fiveYearlyChange: z.number(),
      }),
    },
    async ({ ticker }) => {
        const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
        if (!apiKey || apiKey === 'YOUR_API_KEY' || apiKey === 'XP3RGQIPH960ZMJM') {
            console.warn("Alpha Vantage API key not found or is placeholder. Using mock data.");
            return { 
                currentPrice: Math.random() * 1000 + 100,
                weeklyChange: (Math.random() - 0.5) * 10,
                monthlyChange: (Math.random() - 0.5) * 20,
                yearlyChange: (Math.random() - 0.5) * 50,
                fiveYearlyChange: (Math.random() - 0.2) * 200,
             };
        }
        
        const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol=${ticker}&outputsize=full&apikey=${apiKey}`;
        
        try {
            const response = await fetch(url);
            const data: any = await response.json();
            const timeSeries = data['Time Series (Daily)'];

            if (!timeSeries) {
                console.error(`Could not parse time series for ${ticker}. Response:`, data);
                throw new Error('Failed to fetch time series data.');
            }

            const dates = Object.keys(timeSeries).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
            
            const getPriceOnOrBefore = (date: Date) => {
                const dateString = date.toISOString().split('T')[0];
                let targetDate = dates.find(d => d <= dateString);
                return targetDate ? parseFloat(timeSeries[targetDate]['4. close']) : null;
            };

            const now = new Date();
            const todayPrice = getPriceOnOrBefore(now);
            if (todayPrice === null) throw new Error('Could not get current price.');
            
            const weekAgo = new Date(); weekAgo.setDate(now.getDate() - 7);
            const monthAgo = new Date(); monthAgo.setMonth(now.getMonth() - 1);
            const yearAgo = new Date(); yearAgo.setFullYear(now.getFullYear() - 1);
            const fiveYearsAgo = new Date(); fiveYearsAgo.setFullYear(now.getFullYear() - 5);

            const weekAgoPrice = getPriceOnOrBefore(weekAgo);
            const monthAgoPrice = getPriceOnOrBefore(monthAgo);
            const yearAgoPrice = getPriceOnOrBefore(yearAgo);
            const fiveYearsAgoPrice = getPriceOnOrBefore(fiveYearsAgo);

            const calculateChange = (oldPrice: number | null, newPrice: number) => {
                return oldPrice ? ((newPrice - oldPrice) / oldPrice) * 100 : 0;
            }

            return {
                currentPrice: todayPrice,
                weeklyChange: calculateChange(weekAgoPrice, todayPrice),
                monthlyChange: calculateChange(monthAgoPrice, todayPrice),
                yearlyChange: calculateChange(yearAgoPrice, todayPrice),
                fiveYearlyChange: calculateChange(fiveYearsAgoPrice, todayPrice)
            };
        } catch (error) {
            console.error(`Error fetching stock performance for ${ticker}:`, error);
            throw error; // Let the flow handle it
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
  performance: z.object({
    weeklyChange: z.number(),
    monthlyChange: z.number(),
    yearlyChange: z.number(),
    fiveYearlyChange: z.number(),
  }).optional(),
  disclaimer: z.string().describe('A standard disclaimer that this is not financial advice.'),
});
export type InvestmentAdviceOutput = z.infer<typeof InvestmentAdviceOutputSchema>;

export async function generateInvestmentAdvice(input: InvestmentAdviceInput): Promise<InvestmentAdviceOutput> {
  return investmentAdviceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'investmentAdvicePrompt',
  input: { schema: z.object({ 
      assetName: z.string(), 
      purchasePrice: z.number(),
      performance: z.object({
        weeklyChange: z.number(),
        monthlyChange: z.number(),
        yearlyChange: z.number(),
        fiveYearlyChange: z.number(),
      }).optional(),
    }) 
  },
  output: { schema: InvestmentAdviceOutputSchema.omit({ performance: true }) },
  tools: [getAssetPerformanceTool],
  prompt: `You are an expert financial analyst. Your task is to provide investment advice on a specific asset.

Asset: {{{assetName}}}
Purchase Price: {{{purchasePrice}}}

{{#if performance}}
Historical Performance:
- 1 Week: {{performance.weeklyChange}}%
- 1 Month: {{performance.monthlyChange}}%
- 1 Year: {{performance.yearlyChange}}%
- 5 Years: {{performance.fiveYearlyChange}}%
{{/if}}

Analyze the asset based on the provided data. Based on your analysis, determine whether it's a good time to buy, sell, or hold.
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
    let performance;

    if (input.assetType.toLowerCase() === 'stocks') {
        try {
            performance = await getAssetPerformanceTool({ ticker: input.assetName });
        } catch (e) {
            console.error("Could not fetch performance data for", input.assetName, e);
            // Don't fail the whole flow, just proceed without performance data
        }
    }

    const { output } = await prompt({
        assetName: input.assetName,
        purchasePrice: input.purchasePrice,
        performance: performance,
    });
    
    return {
        ...output!,
        performance,
    };
  }
);
