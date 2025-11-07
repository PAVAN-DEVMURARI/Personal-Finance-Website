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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

export default function DebtsPage() {
    const { firestore, user } = useFirebase();
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const monthStart = useMemo(() => startOfMonth(new Date()), []);
    const monthEnd = useMemo(() => endOfMonth(new Date()), []);

    const debtsQuery = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return query(
            collection(firestore, 'users', user.uid, 'debts'),
            where('date', '>=', monthStart.toISOString()),
            where('date', '<=', monthEnd.toISOString())
        );
    }, [firestore, user?.uid, monthStart, monthEnd]);

    const { data: debts, isLoading } = useCollection(debtsQuery);

    const handleAddDebt = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!firestore || !user?.uid) return;

        const formData = new FormData(event.currentTarget);
        const newDebt = {
            friendName: formData.get('friendName') as string,
            amount: Number(formData.get('amount')),
            type: formData.get('type') as 'lent' | 'borrowed',
            date: new Date(formData.get('date') as string).toISOString(),
            userProfileId: user.uid,
            createdAt: serverTimestamp(),
        };

        const colRef = collection(firestore, 'users', user.uid, 'debts');
        addDocumentNonBlocking(colRef, newDebt);
        setIsDialogOpen(false);
    };

    const handleDeleteDebt = (id: string) => {
        if(!firestore || !user?.uid) return;
        const docRef = doc(firestore, 'users', user.uid, 'debts', id);
        deleteDocumentNonBlocking(docRef);
    }
    
    const { lent, borrowed } = useMemo(() => {
        if (!debts) return { lent: [], borrowed: [] };
        return debts.reduce((acc, debt) => {
            if (debt.type === 'lent') {
                acc.lent.push(debt);
            } else {
                acc.borrowed.push(debt);
            }
            return acc;
        }, { lent: [] as any[], borrowed: [] as any[] });
    }, [debts]);

    const renderTableView = (title: string, description: string, data: any[], type: 'lent' | 'borrowed') => (
         <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Friend</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            [...Array(3)].map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell colSpan={4}><Skeleton className="h-8 w-full" /></TableCell>
                                </TableRow>
                            ))
                        ) : data && data.length > 0 ? (
                            data.map((debt) => (
                                <TableRow key={debt.id}>
                                    <TableCell className="font-medium">{debt.friendName}</TableCell>
                                    <TableCell>{format(new Date(debt.date), 'MMM d, yyyy')}</TableCell>
                                    <TableCell className={cn("text-right font-semibold", type === 'lent' ? 'text-green-500' : 'text-red-500')}>
                                        {debt.amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                                    </TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon" onClick={() => handleDeleteDebt(debt.id)}>
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center">No records for this month.</TableCell>
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
                title="Debts"
                action={
                     <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Add Debt Record
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add New Debt Record</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleAddDebt} className="space-y-4">
                                <div><Label htmlFor="friendName">Friend's Name</Label><Input id="friendName" name="friendName" required /></div>
                                <div><Label htmlFor="amount">Amount</Label><Input id="amount" name="amount" type="number" required /></div>
                                <div>
                                    <Label htmlFor="type">Type</Label>
                                    <Select name="type" required defaultValue="lent">
                                        <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="lent">I Lent Money</SelectItem>
                                            <SelectItem value="borrowed">I Borrowed Money</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div><Label htmlFor="date">Date</Label><Input id="date" name="date" type="date" defaultValue={format(new Date(), 'yyyy-MM-dd')} required /></div>
                                <Button type="submit" className="w-full">Add Record</Button>                            
                            </form>
                        </DialogContent>
                    </Dialog>
                }
            />
            <div className="grid gap-6 md:grid-cols-2">
                {renderTableView("Money Lent to Others", "Track the money you are owed.", lent, 'lent')}
                {renderTableView("Money Borrowed", "Track the money you owe.", borrowed, 'borrowed')}
            </div>
        </>
    );
}