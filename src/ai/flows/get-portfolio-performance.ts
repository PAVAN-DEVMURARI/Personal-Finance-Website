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

// This tool will fetch data for a single ticker.
const getAssetPerformanceTool = ai.defineTool(
    {
      name: 'getAssetPerformance',
      description: 'Gets the historical performance of a stock, calculating percentage change over various periods.',
      inputSchema: z.object({ ticker: z.string().describe('The stock ticker symbol.') }),
      outputSchema: PerformanceSchema,
    },
    async ({ ticker }) => {
        const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
        if (!apiKey || apiKey === 'YOUR_API_KEY' || apiKey === 'XP3RGQIPH960ZMJM') {
            console.warn("Alpha Vantage API key not found or is placeholder. Using mock data for", ticker);
            return { 
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
                if (data['Note']) {
                    // Handle API call frequency limit note
                    console.warn(`Alpha Vantage API note for ${ticker}: ${data['Note']}`);
                     throw new Error(`API call frequency limit reached for ${ticker}.`);
                }
                console.error(`Could not parse time series for ${ticker}. Response:`, data);
                throw new Error(`Failed to fetch time series data for ${ticker}.`);
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
                weeklyChange: calculateChange(weekAgoPrice, todayPrice),
                monthlyChange: calculateChange(monthAgoPrice, todayPrice),
                yearlyChange: calculateChange(yearAgoPrice, todayPrice),
                fiveYearlyChange: calculateChange(fiveYearsAgoPrice, todayPrice)
            };
        } catch (error) {
            console.error(`Error fetching stock performance for ${ticker}:`, error);
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
                // Optionally, you could add a specific error state for this ticker in the response
            } else if (outcome.status === 'rejected') {
                // This would be an unexpected error in the Promise.allSettled itself
                console.error("An unexpected error occurred in getPortfolioPerformanceFlow:", outcome.reason);
            }
        });

        return results;
    }
);
