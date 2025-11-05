'use client';

import { useState, useTransition, useMemo, useEffect } from 'react';
import { collection, query, where, Timestamp } from 'firebase/firestore';
import { Lightbulb, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { generateFinancialTip, type FinancialTipOutput } from '@/ai/flows/personalized-financial-tips';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';

const initialTip = {
    tip: "Log your expenses daily to get a clear picture of where your money goes. Small leaks can sink a great ship!"
};

export function FinancialTipCard() {
  const [isPending, startTransition] = useTransition();
  const [tip, setTip] = useState<FinancialTipOutput>(initialTip);
  const { firestore, user } = useFirebase();

  const now = new Date();
  const startOfCurrentMonth = startOfMonth(now);
  const startOfPreviousMonth = startOfMonth(subMonths(now, 1));
  const endOfPreviousMonth = endOfMonth(subMonths(now, 1));

  const currentMonthExpensesQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(
        collection(firestore, 'users', user.uid, 'expenses'),
        where('date', '>=', startOfCurrentMonth.toISOString()),
        where('date', '<=', endOfMonth(now).toISOString())
    );
  }, [firestore, user?.uid, startOfCurrentMonth]);

  const previousMonthExpensesQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(
        collection(firestore, 'users', user.uid, 'expenses'),
        where('date', '>=', startOfPreviousMonth.toISOString()),
        where('date', '<=', endOfPreviousMonth.toISOString())
    );
  }, [firestore, user?.uid, startOfPreviousMonth, endOfPreviousMonth]);


  const goalsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return collection(firestore, 'users', user.uid, 'savingsGoals');
  }, [firestore, user?.uid]);

  const investmentsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return collection(firestore, 'users', user.uid, 'investments');
  }, [firestore, user?.uid]);

  const { data: currentMonthExpenses } = useCollection(currentMonthExpensesQuery);
  const { data: previousMonthExpenses } = useCollection(previousMonthExpensesQuery);
  const { data: goals } = useCollection(goalsQuery);
  const { data: investments } = useCollection(investmentsQuery);
  
  const handleGetNewTip = () => {
    startTransition(async () => {
      if (!currentMonthExpenses || !previousMonthExpenses || !goals || !investments) return;

      const currentMonthSpending = currentMonthExpenses.reduce((sum, t) => sum + t.amount, 0);

      const previousMonthSpending = previousMonthExpenses.reduce((sum, t) => sum + t.amount, 0);
      
      const totalSavings = goals.reduce((sum, goal) => sum + goal.savedAmount, 0);
      
      const financialGoals = goals.map(g => g.name).join(', ');

      const result = await generateFinancialTip({
        currentMonthSpending,
        previousMonthSpending,
        savings: totalSavings,
        // Simplified for now
        investmentPerformance: `...`, 
        financialGoals: financialGoals || 'No defined goals yet.',
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
