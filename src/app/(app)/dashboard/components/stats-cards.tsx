'use client';

import { ArrowDownLeft, ArrowUpRight, Scale } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { transactions } from "@/lib/data";

export function StatsCards() {
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);
  const totalExpenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);
  const netBalance = totalIncome - totalExpenses;

  const stats = [
    { title: "Total Income", amount: totalIncome, icon: ArrowUpRight, color: "text-green-500" },
    { title: "Total Expenses", amount: totalExpenses, icon: ArrowDownLeft, color: "text-red-500" },
    { title: "Net Balance", amount: netBalance, icon: Scale, color: "text-blue-500" },
  ];

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
            <p className="text-xs text-muted-foreground">+20.1% from last month</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
