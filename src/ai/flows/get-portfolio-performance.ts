'use server';
/**
 * @fileOverview A flow for fetching historical performance for a portfolio of stocks.
 *
 * - getPortfolioPerformance - Fetches performance for multiple tickers.
 * - PortfolioPerformanceInput - The input schema for the flow.
 * - PortfolioPerformanceOutput - The output schema for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import fetch from 'node-fetch';

const PerformanceSchema = z.object({
    weeklyChange: z.number(),
    monthlyChange: z.number(),
    yearlyChange: z.number(),
    fiveYearlyChange: z.number(),
});

const PortfolioPerformanceInputSchema = z.object({
  tickers: z.array(z.string()).describe('An array of stock ticker symbols.'),
});
export type PortfolioPerformanceInput = z.infer<typeof PortfolioPerformanceInputSchema>;

const PortfolioPerformanceOutputSchema = z.record(PerformanceSchema);
export type PortfolioPerformanceOutput = z.infer<typeof PortfolioPerformanceOutputSchema>;

// This tool will fetch data for a single ticker using Twelve Data.
const getAssetPerformanceTool = ai.defineTool(
    {
      name: 'getAssetPerformance',
      description: 'Gets the historical performance of an asset, calculating percentage change over various periods.',
      inputSchema: z.object({ ticker: z.string().describe('The stock ticker symbol.') }),
      outputSchema: PerformanceSchema,
    },
    async ({ ticker }) => {
        const apiKey = process.env.TWELVE_DATA_API_KEY;
        if (!apiKey || apiKey === 'YOUR_API_KEY') {
            console.warn("Twelve Data API key not found or is a placeholder. Using mock data for", ticker);
            return { 
                weeklyChange: (Math.random() - 0.5) * 10,
                monthlyChange: (Math.random() - 0.5) * 20,
                yearlyChange: (Math.random() - 0.5) * 50,
                fiveYearlyChange: (Math.random() - 0.2) * 200,
            };
        }
        
        // Using Twelve Data API
        const url = `https://api.twelvedata.com/time_series?symbol=${ticker}&interval=1day&outputsize=2000&apikey=${apiKey}`;
        
        try {
            const response = await fetch(url);
            const data: any = await response.json();

            if (data.status !== 'ok' || !data.values) {
                 if (data.code === 429) {
                    console.warn(`Twelve Data API rate limit hit for ${ticker}.`);
                    throw new Error(`API rate limit reached for ${ticker}.`);
                }
                console.error(`Could not fetch time series for ${ticker}. Response:`, data);
                throw new Error(`Failed to fetch time series data for ${ticker}. Message: ${data.message}`);
            }

            const timeSeries = data.values.sort((a: any, b: any) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime());

            const getPriceOnOrBefore = (date: Date) => {
                const dateString = date.toISOString().split('T')[0];
                const record = timeSeries.find((d: any) => d.datetime <= dateString);
                return record ? parseFloat(record.close) : null;
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
                weeklyChange: calculateChange(weekAgoPrice, todayPrice),
                monthlyChange: calculateChange(monthAgoPrice, todayPrice),
                yearlyChange: calculateChange(yearAgoPrice, todayPrice),
                fiveYearlyChange: calculateChange(fiveYearsAgoPrice, todayPrice)
            };
        } catch (error) {
            console.error(`Error fetching stock performance for ${ticker} from Twelve Data:`, error);
            throw error;
        }
    }
);

// The exported function that calls the flow.
export async function getPortfolioPerformance(input: PortfolioPerformanceInput): Promise<PortfolioPerformanceOutput> {
    return getPortfolioPerformanceFlow(input);
}


// This flow will iterate over the tickers and call the tool for each one.
const getPortfolioPerformanceFlow = ai.defineFlow(
    {
        name: 'getPortfolioPerformanceFlow',
        inputSchema: PortfolioPerformanceInputSchema,
        outputSchema: PortfolioPerformanceOutputSchema,
    },
    async ({ tickers }) => {
        const results: Record<string, z.infer<typeof PerformanceSchema>> = {};

        // Use Promise.allSettled to handle potential errors for individual tickers
        const promises = tickers.map(ticker => 
            getAssetPerformanceTool({ ticker })
                .then(performance => ({ ticker, status: 'fulfilled', value: performance }))
                .catch(error => ({ ticker, status: 'rejected', reason: error.message }))
        );

        const outcomes = await Promise.allSettled(promises);
        
        outcomes.forEach(outcome => {
            if (outcome.status === 'fulfilled' && outcome.value.status === 'fulfilled') {
                const { ticker, value } = outcome.value;
                results[ticker] = value;
            } else if (outcome.status === 'fulfilled' && outcome.value.status === 'rejected') {
                const { ticker, reason } = outcome.value;
                console.warn(`Could not fetch performance for ${ticker}: ${reason}`);
                // You could add a specific error state for this ticker in the response
            } else if (outcome.status === 'rejected') {
                // This would be an unexpected error in the Promise.allSettled itself
                console.error("An unexpected error occurred in getPortfolioPerformanceFlow:", outcome.reason);
            }
        });

        return results;
    }
);
