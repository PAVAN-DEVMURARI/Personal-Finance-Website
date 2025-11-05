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

export default function IncomePage() {
    const { firestore, user } = useFirebase();
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const monthStart = useMemo(() => startOfMonth(new Date()), []);
    const monthEnd = useMemo(() => endOfMonth(new Date()), []);

    const incomeQuery = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return query(
            collection(firestore, 'users', user.uid, 'income'),
            where('date', '>=', monthStart.toISOString()),
            where('date', '<=', monthEnd.toISOString())
        );
    }, [firestore, user?.uid, monthStart, monthEnd]);

    const { data: incomes, isLoading } = useCollection(incomeQuery);

    const handleAddIncome = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!firestore || !user?.uid) return;

        const formData = new FormData(event.currentTarget);
        const newIncome = {
            description: formData.get('description') as string,
            source: formData.get('source') as string,
            amount: Number(formData.get('amount')),
            date: new Date(formData.get('date') as string).toISOString(),
            userProfileId: user.uid,
            createdAt: serverTimestamp(),
        };

        const colRef = collection(firestore, 'users', user.uid, 'income');
        addDocumentNonBlocking(colRef, newIncome);
        setIsDialogOpen(false);
    };

    const handleDeleteIncome = (id: string) => {
        if(!firestore || !user?.uid) return;
        const docRef = doc(firestore, 'users', user.uid, 'income', id);
        deleteDocumentNonBlocking(docRef);
    }

    return (
        <>
            <PageHeader
                title="Income"
                action={
                     <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Add Income
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add New Income</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleAddIncome} className="space-y-4">
                                <div><Label htmlFor="description">Description</Label><Input id="description" name="description" required /></div>
                                <div><Label htmlFor="source">Source</Label><Input id="source" name="source" required /></div>
                                <div><Label htmlFor="amount">Amount</Label><Input id="amount" name="amount" type="number" required /></div>
                                <div><Label htmlFor="date">Date</Label><Input id="date" name="date" type="date" defaultValue={format(new Date(), 'yyyy-MM-dd')} required /></div>
                                <Button type="submit" className="w-full">Add Income</Button>                            
                            </form>
                        </DialogContent>
                    </Dialog>
                }
            />
            <Card>
                <CardHeader>
                    <CardTitle>This Month's Income</CardTitle>
                    <CardDescription>A list of your income for the current month.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Description</TableHead>
                                <TableHead>Source</TableHead>
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
                            ) : incomes && incomes.length > 0 ? (
                                incomes.map((income) => (
                                    <TableRow key={income.id}>
                                        <TableCell className="font-medium">{income.description}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{income.source}</Badge>
                                        </TableCell>
                                        <TableCell>{format(new Date(income.date), 'MMM d, yyyy')}</TableCell>
                                        <TableCell className="text-right">
                                            {income.amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                                        </TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="icon" onClick={() => handleDeleteIncome(income.id)}>
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center">No income recorded for this month.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </>
    );
}
