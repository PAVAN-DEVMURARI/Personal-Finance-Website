'use client';

import { useMemo, useState } from 'react';
import { collection, doc, serverTimestamp, query, where } from 'firebase/firestore';
import { PlusCircle, X } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { useCollection, useFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking, useMemoFirebase } from '@/firebase';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

export default function ExpensesPage() {
    const { firestore, user } = useFirebase();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    
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
    
    const { data: expenses, isLoading } = useCollection(expensesQuery);

    const handleAddExpense = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!firestore || !user?.uid) return;
        
        const formData = new FormData(event.currentTarget);
        const newExpense = {
            description: formData.get('description') as string,
            amount: Number(formData.get('amount')),
            category: formData.get('category') as string,
            date: new Date(formData.get('date') as string).toISOString(),
            userProfileId: user.uid,
            createdAt: serverTimestamp(),
        };

        const colRef = collection(firestore, 'users', user.uid, 'expenses');
        addDocumentNonBlocking(colRef, newExpense);
        setIsDialogOpen(false);
    };

    const handleDeleteExpense = (id: string) => {
        if(!firestore || !user?.uid) return;
        const docRef = doc(firestore, 'users', user.uid, 'expenses', id);
        deleteDocumentNonBlocking(docRef);
    }

    const renderMobileView = () => (
        <div className="md:hidden space-y-4">
            {expenses && expenses.length > 0 ? (
                expenses.map((expense) => (
                    <Card key={expense.id}>
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-lg">{expense.description}</CardTitle>
                                    <CardDescription>{format(new Date(expense.date), 'MMM d, yyyy')}</CardDescription>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => handleDeleteExpense(expense.id)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="flex justify-between items-center">
                             <Badge variant="outline">{expense.category}</Badge>
                            <p className="text-lg font-bold">
                                {expense.amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                            </p>
                        </CardContent>
                    </Card>
                ))
            ) : (
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-center text-muted-foreground">No expenses recorded for this month.</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );

    const renderDesktopView = () => (
        <Card className="hidden md:block">
            <CardHeader>
                <CardTitle>This Month's Expenses</CardTitle>
                <CardDescription>A list of your expenses for the current month.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Description</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            [...Array(5)].map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell colSpan={5}><Skeleton className="h-8 w-full" /></TableCell>
                                </TableRow>
                            ))
                        ) : expenses && expenses.length > 0 ? (
                            expenses.map((expense) => (
                                <TableRow key={expense.id}>
                                    <TableCell className="font-medium">{expense.description}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{expense.category}</Badge>
                                    </TableCell>
                                    <TableCell>{format(new Date(expense.date), 'MMM d, yyyy')}</TableCell>
                                    <TableCell className="text-right">
                                        {expense.amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                                    </TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon" onClick={() => handleDeleteExpense(expense.id)}>
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center">No expenses recorded for this month.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );

    return (
        <>
            <PageHeader
                title="Expenses"
                action={
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Add Expense
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add New Expense</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleAddExpense} className="space-y-4">
                                <div>
                                    <Label htmlFor="description">Description</Label>
                                    <Input id="description" name="description" required />
                                </div>
                                <div>
                                    <Label htmlFor="amount">Amount</Label>
                                    <Input id="amount" name="amount" type="number" required />
                                </div>
                                <div>
                                    <Label htmlFor="category">Category</Label>
                                    <Input id="category" name="category" required />
                                </div>
                                <div>
                                    <Label htmlFor="date">Date</Label>
                                    <Input id="date" name="date" type="date" defaultValue={format(new Date(), 'yyyy-MM-dd')} required />
                                </div>
                                <Button type="submit" className="w-full">Add Expense</Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                }
            />
            
            {isLoading && !expenses ? (
                <div className="space-y-4">
                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
                </div>
            ) : (
                <>
                    {renderMobileView()}
                    {renderDesktopView()}
                </>
            )}
        </>
    );
}
