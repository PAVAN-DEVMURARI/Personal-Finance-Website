'use server';
import { config } from 'dotenv';
config({ path: '.env.local' });

import '@/ai/flows/personalized-financial-tips.ts';
import '@/ai/flows/monthly-ai-financial-report.ts';
import '@/ai/flows/investment-advice.ts';
