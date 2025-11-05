'use server';
/**
 * @fileOverview A flow for searching stock symbols.
 *
 * - symbolSearch - A function that searches for stock symbols.
 * - SymbolSearchInput - The input type for the function.
 * - SymbolSearchOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import fetch from 'node-fetch';

const SymbolSchema = z.object({
    symbol: z.string(),
    instrument_name: z.string(),
    exchange: z.string(),
    country: z.string(),
});

export const SymbolSearchInputSchema = z.object({
  query: z.string().describe('The search query for the stock symbol.'),
});
export type SymbolSearchInput = z.infer<typeof SymbolSearchInputSchema>;

export const SymbolSearchOutputSchema = z.array(SymbolSchema);
export type SymbolSearchOutput = z.infer<typeof SymbolSearchOutputSchema>;

export async function symbolSearch(input: SymbolSearchInput): Promise<SymbolSearchOutput> {
  return symbolSearchFlow(input);
}

const symbolSearchFlow = ai.defineFlow(
  {
    name: 'symbolSearchFlow',
    inputSchema: SymbolSearchInputSchema,
    outputSchema: SymbolSearchOutputSchema,
  },
  async ({ query }) => {
    const apiKey = process.env.TWELVE_DATA_API_KEY;
    if (!apiKey || apiKey === 'YOUR_API_KEY') {
      console.warn("Twelve Data API key not found or is a placeholder. Skipping symbol search.");
      return [];
    }
    
    // Only search for stocks and ETFs in the India exchange to start
    const url = `https://api.twelvedata.com/symbol_search?symbol=${query}&outputsize=10&country=India`;

    try {
      const response = await fetch(url, { headers: { 'Authorization': `apikey ${apiKey}` }});
      const data: any = await response.json();

      if (data && Array.isArray(data.data)) {
        return data.data.map((item: any) => ({
            symbol: item.symbol,
            instrument_name: item.instrument_name,
            exchange: item.exchange,
            country: item.country,
        }));
      }
      return [];
    } catch (error) {
      console.error('Error searching for symbols:', error);
      return [];
    }
  }
);
