'use client';

import { useMemo } from 'react';
import { collection, query, where } from 'firebase/firestore';
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
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { startOfMonth, endOfMonth } from 'date-fns';

// Stable color mapping based on category name
const getStableColor = (category: string) => {
    let hash = 0;
    for (let i = 0; i < category.length; i++) {
        hash = category.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colorIndex = Math.abs(hash % 5) + 1; // 5 chart colors available
    return `hsl(var(--chart-${colorIndex}))`;
};


export function SpendingChart() {
  const { firestore, user } = useFirebase();
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const spendingQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(
      collection(firestore, 'users', user.uid, 'expenses'),
      where('date', '>=', monthStart.toISOString()),
      where('date', '<=', monthEnd.toISOString())
    );
  }, [firestore, user?.uid, monthStart, monthEnd]);

  const { data: transactions, isLoading } = useCollection(spendingQuery);

  const spendingByCategory = useMemo(() => {
    if (!transactions) return {};
    return transactions
      .reduce((acc, t) => {
        const category = t.category || 'Uncategorized';
        if (!acc[category]) {
          acc[category] = 0;
        }
        acc[category] += t.amount;
        return acc;
      }, {} as Record<string, number>);
  }, [transactions]);

  const chartData = useMemo(() => Object.entries(spendingByCategory).map(([category, amount]) => ({
    category,
    amount,
    fill: getStableColor(category),
  })), [spendingByCategory]);

  const chartConfig = useMemo(() => {
    const config: any = {
      amount: {
        label: 'Amount (INR)',
      },
    };
    chartData.forEach(item => {
      config[item.category] = {
        label: item.category,
        color: item.fill,
      };
    });
    return config;
  }, [chartData]);
  
  if (isLoading) {
    return (
        <Card className="flex flex-col h-full">
            <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent className="flex-1 pb-0 flex items-center justify-center">
                <Skeleton className="aspect-square w-full max-w-[300px] rounded-full" />
            </CardContent>
            <CardFooter className="flex-col gap-2 text-sm">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-4 w-1/2" />
            </CardFooter>
        </Card>
    );
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
              <ChartTooltip 
                cursor={false} 
                content={<ChartTooltipContent 
                    hideLabel 
                    formatter={(value, name, item) => (
                        <div className="flex items-center gap-2">
                           <div className="w-2.5 h-2.5 rounded-sm" style={{backgroundColor: item.payload.fill}} />
                           <div className="flex-1">{item.payload.category}</div>
                           <div className="font-bold">{Number(value).toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 })}</div>
                        </div>
                    )}
                />} 
              />
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
                No spending data for this month.
            </div>
          )}
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="leading-none text-muted-foreground">
          Log expenses to see your spending breakdown.
        </div>
      </CardFooter>
    </Card>
  );
}
