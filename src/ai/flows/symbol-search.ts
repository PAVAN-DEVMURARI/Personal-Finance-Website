'use server';
/**
 * @fileOverview A flow for searching stock symbols.
 *
 * - symbolSearch - A function that searches for stock symbols.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import fetch from 'node-fetch';

const SymbolSchema = z.object({
    symbol: z.string(),
    instrument_name: z.string(),
    exchange: z.string(),
    country: z.string(),
    type: z.string(),
});

const SymbolSearchInputSchema = z.object({
  query: z.string().describe('The search query for the stock symbol.'),
  instrument_type: z.string().optional().describe('The type of instrument to search for (e.g., Stocks, Crypto).'),
});

const SymbolSearchOutputSchema = z.array(SymbolSchema);

export async function symbolSearch(input: z.infer<typeof SymbolSearchInputSchema>): Promise<z.infer<typeof SymbolSearchOutputSchema>> {
  return symbolSearchFlow(input);
}

const symbolSearchFlow = ai.defineFlow(
  {
    name: 'symbolSearchFlow',
    inputSchema: SymbolSearchInputSchema,
    outputSchema: SymbolSearchOutputSchema,
  },
  async ({ query, instrument_type }) => {
    const apiKey = process.env.TWELVE_DATA_API_KEY;
    if (!apiKey || apiKey === 'YOUR_API_KEY') {
      console.warn("Twelve Data API key not found or is a placeholder. Skipping symbol search.");
      return [];
    }

    let url = `https://api.twelvedata.com/symbol_search?symbol=${query}&outputsize=10`;
    
    // Mapping from our app's types to Twelve Data's types
    const typeMapping: { [key: string]: string } = {
        'Stocks': 'Stock',
        'Crypto': 'Digital Currency',
        'Mutual Funds': 'Mutual Fund',
        'ETFs': 'ETF',
    };

    const apiType = instrument_type ? typeMapping[instrument_type] : undefined;

    if (apiType) {
        url += `&type=${apiType}`;
    }

    // Default to India for stocks if no specific type is requested or if it's stocks
    if (!instrument_type || instrument_type === 'Stocks') {
        url += '&country=India';
    }


    try {
      const response = await fetch(url, { headers: { 'Authorization': `apikey ${apiKey}` }});
      const data: any = await response.json();

      if (data && Array.isArray(data.data)) {
        return data.data.map((item: any) => ({
            symbol: item.symbol,
            instrument_name: item.instrument_name,
            exchange: item.exchange,
            country: item.country,
            type: item.instrument_type,
        }));
      }
      return [];
    } catch (error) {
      console.error('Error searching for symbols:', error);
      return [];
    }
  }
);
