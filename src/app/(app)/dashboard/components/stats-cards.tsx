'use client';

import { useMemo } from 'react';
import { collection } from 'firebase/firestore';
import { ArrowDownLeft, ArrowUpRight, Scale } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';

export function StatsCards() {
  const { firestore, user } = useFirebase();

  const expensesQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return collection(firestore, 'users', user.uid, 'expenses');
  }, [firestore, user?.uid]);
  
  const incomeQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return collection(firestore, 'users', user.uid, 'income');
  }, [firestore, user?.uid]);

  const { data: expenses, isLoading: expensesLoading } = useCollection(expensesQuery);
  const { data: income, isLoading: incomeLoading } = useCollection(incomeQuery);

  const totalIncome = useMemo(() => income?.reduce((acc, t) => acc + t.amount, 0) || 0, [income]);
  const totalExpenses = useMemo(() => expenses?.reduce((acc, t) => acc + t.amount, 0) || 0, [expenses]);
  const netBalance = totalIncome - totalExpenses;

  const isLoading = expensesLoading || incomeLoading;

  const stats = [
    { title: "Total Income", amount: totalIncome, icon: ArrowUpRight, color: "text-green-500" },
    { title: "Total Expenses", amount: totalExpenses, icon: ArrowDownLeft, color: "text-red-500" },
    { title: "Net Balance", amount: netBalance, icon: Scale, color: "text-blue-500" },
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
            <p className="text-xs text-muted-foreground">+0% from last month</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
