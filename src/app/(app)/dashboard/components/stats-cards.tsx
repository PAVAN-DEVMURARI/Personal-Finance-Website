'use client';

import { useMemo } from 'react';
import { collection, query, where } from 'firebase/firestore';
import { ArrowDownLeft, ArrowUpRight, Scale } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { startOfMonth, endOfMonth } from 'date-fns';

export function StatsCards() {
  const { firestore, user } = useFirebase();

  const monthStart = useMemo(() => startOfMonth(new Date()), []);
  const monthEnd = useMemo(() => endOfMonth(new Date()), []);

  const expensesQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(
      collection(firestore, 'users', user.uid, 'expenses'),
      where('date', '>=', monthStart.toISOString()),
      where('date', '<=', monthEnd.toISOString())
    );
  }, [firestore, user?.uid, monthStart, monthEnd]);
  
  const incomeQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(
      collection(firestore, 'users', user.uid, 'income'),
      where('date', '>=', monthStart.toISOString()),
      where('date', '<=', monthEnd.toISOString())
    );
  }, [firestore, user?.uid, monthStart, monthEnd]);

  const { data: expenses, isLoading: expensesLoading } = useCollection(expensesQuery);
  const { data: income, isLoading: incomeLoading } = useCollection(incomeQuery);

  const totalIncome = useMemo(() => income?.reduce((acc, t) => acc + t.amount, 0) || 0, [income]);
  const totalExpenses = useMemo(() => expenses?.reduce((acc, t) => acc + t.amount, 0) || 0, [expenses]);
  const netBalance = totalIncome - totalExpenses;

  const isLoading = expensesLoading || incomeLoading;

  const stats = [
    { title: "This Month's Income", amount: totalIncome, icon: ArrowUpRight, color: "text-green-500" },
    { title: "This Month's Expenses", amount: totalExpenses, icon: ArrowDownLeft, color: "text-red-500" },
    { title: "This Month's Balance", amount: netBalance, icon: Scale, color: "text-blue-500" },
  ];

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-[126px]" />
        <Skeleton className="h-[126px]" />
        <Skeleton className="h-[126px]" />
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className={`h-4 w-4 text-muted-foreground ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stat.amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
            </div>
            {/* <p className="text-xs text-muted-foreground">+0% from last month</p> */}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
