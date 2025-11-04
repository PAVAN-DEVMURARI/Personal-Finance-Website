'use client';

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
import { transactions } from '@/lib/data';

const spendingByCategory = transactions
  .filter((t) => t.type === 'expense')
  .reduce((acc, t) => {
    if (!acc[t.category]) {
      acc[t.category] = 0;
    }
    acc[t.category] += t.amount;
    return acc;
  }, {} as Record<string, number>);

const chartData = Object.entries(spendingByCategory).map(([category, amount]) => ({
  category,
  amount,
  fill: `hsl(var(--chart-${Object.keys(spendingByCategory).indexOf(category) + 1}))`,
}));

const chartConfig = {
  amount: {
    label: 'Amount',
  },
  ...chartData.reduce((acc, { category }) => {
    acc[category] = { label: category };
    return acc;
  }, {} as any)
};


export function SpendingChart() {
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
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 font-medium leading-none">
          Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          You are spending more in the Travel category.
        </div>
      </CardFooter>
    </Card>
  );
}
