'use client';

import { useMemo } from 'react';
import { collection, query, orderBy } from 'firebase/firestore';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from '@/components/ui/chart';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { subMonths, format, startOfMonth, endOfMonth, isAfter } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

const chartConfig = {
    investments: {
        label: 'Investments',
        color: 'hsl(var(--chart-3))',
    },
} satisfies ChartConfig;

export function InvestmentSummary() {
    const { firestore, user } = useFirebase();

    const investmentsQuery = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return query(
            collection(firestore, 'users', user.uid, 'investments'),
            orderBy('purchaseDate', 'asc')
        );
    }, [firestore, user?.uid]);

    const { data: investmentsData, isLoading } = useCollection(investmentsQuery);

    const chartData = useMemo(() => {
        const monthlyData: { [key: string]: { month: string; investments: number } } = {};
        const now = new Date();

        // Initialize the last 6 months
        for (let i = 5; i >= 0; i--) {
            const date = subMonths(now, i);
            const monthKey = format(date, 'yyyy-MM');
            const monthName = format(date, 'MMMM');
            monthlyData[monthKey] = { month: monthName, investments: 0 };
        }

        if (investmentsData) {
            let cumulativeValue = 0;
            const monthKeys = Object.keys(monthlyData).sort();
            
            monthKeys.forEach(monthKey => {
                const monthEndDate = endOfMonth(new Date(monthKey + '-02')); // Use day 2 to avoid timezone issues
                
                // Sum up investments made up to the end of this month
                const monthlyInvestments = investmentsData
                    .filter(inv => !isAfter(new Date(inv.purchaseDate), monthEndDate));
                
                cumulativeValue = monthlyInvestments.reduce((sum, inv) => sum + inv.purchasePrice, 0);

                monthlyData[monthKey].investments = cumulativeValue;
            });
        }
        
        return Object.values(monthlyData);
    }, [investmentsData]);


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
                <CardTitle>Investment Growth</CardTitle>
                <CardDescription>A summary of your cumulative investment value for the last 6 months.</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig}>
                    <AreaChart accessibilityLayer data={chartData} margin={{ left: 12, right: 12 }}>
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
                            cursor={false}
                            content={<ChartTooltipContent 
                                indicator="dot"
                                formatter={(value, name) => (
                                    <div className="flex flex-col">
                                        <span className="capitalize">{name}</span>
                                        <span className="font-bold">{Number(value).toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 })}</span>
                                    </div>
                                )}
                            />} 
                        />
                         <defs>
                            <linearGradient id="fillInvestments" x1="0" y1="0" x2="0" y2="1">
                                <stop
                                offset="5%"
                                stopColor="var(--color-investments)"
                                stopOpacity={0.8}
                                />
                                <stop
                                offset="95%"
                                stopColor="var(--color-investments)"
                                stopOpacity={0.1}
                                />
                            </linearGradient>
                        </defs>
                        <Area dataKey="investments" type="natural" fill="url(#fillInvestments)" stroke="var(--color-investments)" stackId="a" />
                    </AreaChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}
