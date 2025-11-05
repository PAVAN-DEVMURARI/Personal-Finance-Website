'use client';

import { useMemo } from 'react';
import { collection } from 'firebase/firestore';
import { TrendingUp } from 'lucide-react';
import { Pie, PieChart, Cell } from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { useCollection, useFirebase } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';

export function SpendingChart() {
  const { firestore, user } = useFirebase();

  const query = useMemo(() => {
    if (!firestore || !user?.uid) return null;
    return collection(firestore, 'users', user.uid, 'expenses');
  }, [firestore, user?.uid]);

  const { data: transactions, isLoading } = useCollection(query as any);

  const spendingByCategory = useMemo(() => {
    if (!transactions) return {};
    return transactions
      .reduce((acc, t) => {
        if (!acc[t.category]) {
          acc[t.category] = 0;
        }
        acc[t.category] += t.amount;
        return acc;
      }, {} as Record<string, number>);
  }, [transactions]);

  const chartData = useMemo(() => Object.entries(spendingByCategory).map(([category, amount]) => ({
    category,
    amount,
    fill: `hsl(var(--chart-${(Object.keys(spendingByCategory).indexOf(category) % 5) + 1}))`,
  })), [spendingByCategory]);

  const chartConfig = useMemo(() => ({
    amount: {
      label: 'Amount',
    },
    ...chartData.reduce((acc, { category }) => {
      acc[category] = { label: category };
      return acc;
    }, {} as any)
  }), [chartData]);

  if (isLoading) {
    return <Skeleton className="h-full" />;
  }

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle>Spending by Category</CardTitle>
        <CardDescription>Showing spending for the current month</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[300px]"
        >
          {chartData.length > 0 ? (
            <PieChart>
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
              <Pie
                data={chartData}
                dataKey="amount"
                nameKey="category"
                innerRadius={60}
                strokeWidth={5}
              >
                  {chartData.map((entry) => (
                      <Cell key={`cell-${entry.category}`} fill={entry.fill} />
                  ))}
              </Pie>
            </PieChart>
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
                No spending data yet.
            </div>
          )}
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 font-medium leading-none">
          Trending up by 0% this month <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          Track your spending to see insights.
        </div>
      </CardFooter>
    </Card>
  );
}
