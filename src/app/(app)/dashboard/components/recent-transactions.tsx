'use client';

import { useMemo } from 'react';
import { collection, limit, orderBy, query } from 'firebase/firestore';
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';

export function RecentTransactions() {
  const { firestore, user } = useFirebase();

  const expensesQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(collection(firestore, 'users', user.uid, 'expenses'), orderBy('date', 'desc'), limit(3));
  }, [firestore, user?.uid]);

  const incomeQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(collection(firestore, 'users', user.uid, 'income'), orderBy('date', 'desc'), limit(2));
  }, [firestore, user?.uid]);

  const { data: expenses, isLoading: expensesLoading } = useCollection(expensesQuery);
  const { data: income, isLoading: incomeLoading } = useCollection(incomeQuery);

  const transactions = useMemo(() => {
    const combined = [
        ...(expenses || []).map(e => ({...e, type: 'expense'})),
        ...(income || []).map(i => ({...i, type: 'income', category: i.source}))
    ];
    return combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
  }, [expenses, income]);
  
  const isLoading = expensesLoading || incomeLoading;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center">
        <div className="grid gap-2">
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>
                An overview of your most recent income and expenses.
            </CardDescription>
        </div>
        <Button asChild size="sm" className="ml-auto gap-1">
          <Link href="/expenses">
            View All
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
            <div className="space-y-4">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
        ) : (
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Description</TableHead>
                <TableHead className="hidden sm:table-cell">Category</TableHead>
                <TableHead className="hidden sm:table-cell">Type</TableHead>
                <TableHead className="hidden md:table-cell">Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {transactions.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center">No transactions yet.</TableCell>
                    </TableRow>
                ) : (
                    transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                        <TableCell>
                        <div className="font-medium">{transaction.description || transaction.source}</div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                        <Badge className="text-xs" variant="outline">
                            {transaction.category}
                        </Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                        <span className={cn(
                            "flex items-center gap-1",
                            transaction.type === 'income' ? 'text-green-500' : 'text-red-500'
                        )}>
                            {transaction.type === 'income' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownLeft className="h-4 w-4" />}
                            {transaction.type}
                        </span>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                        {format(new Date(transaction.date), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell className="text-right">
                        {transaction.amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                        </TableCell>
                    </TableRow>
                    ))
                )}
            </TableBody>
            </Table>
        )}
      </CardContent>
    </Card>
  );
}
