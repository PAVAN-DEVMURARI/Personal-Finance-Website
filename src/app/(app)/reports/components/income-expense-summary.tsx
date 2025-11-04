'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from '@/components/ui/chart';

const chartData = [
    { month: 'January', income: 155000, expenses: 67000 },
    { month: 'February', income: 254000, expenses: 167000 },
    { month: 'March', income: 197500, expenses: 100000 },
    { month: 'April', income: 60800, expenses: 158000 },
    { month: 'May', income: 174000, expenses: 108000 },
    { month: 'June', income: 178000, expenses: 117000 },
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
                         <YAxis
                            tickFormatter={(value) => `₹${Number(value) / 1000}k`}
                        />
                        <ChartTooltip 
                            content={<ChartTooltipContent 
                                formatter={(value, name) => (
                                    <div className="flex flex-col">
                                        <span className="capitalize">{name}</span>
                                        <span className="font-bold">{Number(value).toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 })}</span>
                                    </div>
                                )}
                            />} 
                        />
                        <Bar dataKey="income" fill="var(--color-income)" radius={4} />
                        <Bar dataKey="expenses" fill="var(--color-expenses)" radius={4} />
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}
