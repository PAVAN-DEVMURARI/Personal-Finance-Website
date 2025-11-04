'use client';

import { PlusCircle } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { transactions } from "@/lib/data";
import { format } from "date-fns";

export default function ExpensesPage() {
    const expenses = transactions.filter(t => t.type === 'expense');

    return (
        <>
            <PageHeader
                title="Expenses"
                action={
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Expense
                    </Button>
                }
            />
            <Card>
                <CardHeader>
                    <CardTitle>Your Expenses</CardTitle>
                    <CardDescription>A detailed list of all your recorded expenses.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Description</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {expenses.map((expense) => (
                                <TableRow key={expense.id}>
                                    <TableCell className="font-medium">{expense.description}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{expense.category}</Badge>
                                    </TableCell>
                                    <TableCell>{format(new Date(expense.date), 'MMM d, yyyy')}</TableCell>
                                    <TableCell className="text-right">
                                        {expense.amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </>
    );
}
