'use client';

import { useMemo } from 'react';
import { collection, query, where } from 'firebase/firestore';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from '@/components/ui/chart';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { subMonths, format, startOfMonth, endOfMonth } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

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
    const { firestore, user } = useFirebase();
    const sixMonthsAgo = useMemo(() => subMonths(new Date(), 5), []);

    const expensesQuery = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return query(
            collection(firestore, 'users', user.uid, 'expenses'),
            where('date', '>=', startOfMonth(sixMonthsAgo).toISOString())
        );
    }, [firestore, user?.uid, sixMonthsAgo]);

    const incomeQuery = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return query(
            collection(firestore, 'users', user.uid, 'income'),
            where('date', '>=', startOfMonth(sixMonthsAgo).toISOString())
        );
    }, [firestore, user?.uid, sixMonthsAgo]);

    const { data: expensesData, isLoading: expensesLoading } = useCollection(expensesQuery);
    const { data: incomeData, isLoading: incomeLoading } = useCollection(incomeQuery);
    
    const isLoading = expensesLoading || incomeLoading;

    const chartData = useMemo(() => {
        const monthlyData: { [key: string]: { month: string; income: number; expenses: number } } = {};
        const now = new Date();

        for (let i = 5; i >= 0; i--) {
            const date = subMonths(now, i);
            const monthKey = format(date, 'yyyy-MM');
            const monthName = format(date, 'MMMM');
            monthlyData[monthKey] = { month: monthName, income: 0, expenses: 0 };
        }

        (incomeData || []).forEach(item => {
            const monthKey = format(new Date(item.date), 'yyyy-MM');
            if (monthlyData[monthKey]) {
                monthlyData[monthKey].income += item.amount;
            }
        });

        (expensesData || []).forEach(item => {
            const monthKey = format(new Date(item.date), 'yyyy-MM');
            if (monthlyData[monthKey]) {
                monthlyData[monthKey].expenses += item.amount;
            }
        });
        
        return Object.values(monthlyData);
    }, [incomeData, expensesData]);


    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-1/2" />
                    <Skeleton className="h-4 w-3/4" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-[300px] w-full" />
                </CardContent>
            </Card>
        );
    }

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
