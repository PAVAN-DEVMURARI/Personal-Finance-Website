'use client';

import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from '@/components/ui/chart';

const chartData = [
    { month: 'January', income: 186, expenses: 80 },
    { month: 'February', income: 305, expenses: 200 },
    { month: 'March', income: 237, expenses: 120 },
    { month: 'April', income: 73, expenses: 190 },
    { month: 'May', income: 209, expenses: 130 },
    { month: 'June', income: 214, expenses: 140 },
];

const chartConfig = {
    income: {
        label: 'Income',
        color: 'hsl(var(--chart-1))',
    },
    expenses: {
        label: 'Expenses',
        color: 'hsl(var(--chart-2))',
    },
} satisfies ChartConfig;

export function IncomeExpenseSummary() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Income vs. Expenses</CardTitle>
                <CardDescription>A summary of your cash flow for the last 6 months.</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig}>
                    <BarChart accessibilityLayer data={chartData}>
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="month"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                            tickFormatter={(value) => value.slice(0, 3)}
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="income" fill="var(--color-income)" radius={4} />
                        <Bar dataKey="expenses" fill="var(--color-expenses)" radius={4} />
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}
