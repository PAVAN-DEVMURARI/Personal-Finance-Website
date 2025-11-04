'use client';

import { useState, useTransition } from 'react';
import { Lightbulb, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { generateFinancialTip, type FinancialTipOutput } from '@/ai/flows/personalized-financial-tips';

const initialTip = {
    tip: "Log your expenses daily to get a clear picture of where your money goes. Small leaks can sink a great ship!"
};

export function FinancialTipCard() {
  const [isPending, startTransition] = useTransition();
  const [tip, setTip] = useState<FinancialTipOutput>(initialTip);

  const handleGetNewTip = () => {
    startTransition(async () => {
      const result = await generateFinancialTip({
        spendingHabits: 'User spends a lot on dining out and travel.',
        financialGoals: 'User wants to save for a down payment on a house.',
      });
      setTip(result);
    });
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-accent" />
          <span>Financial Tip</span>
        </CardTitle>
        <CardDescription>AI-powered advice to boost your financial health.</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <p className="text-sm italic text-foreground/80">
          &quot;{tip.tip}&quot;
        </p>
      </CardContent>
      <CardFooter>
        <Button onClick={handleGetNewTip} disabled={isPending} className="w-full">
          {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Get New Tip
        </Button>
      </CardFooter>
    </Card>
  );
}
