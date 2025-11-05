'use client';

import { useMemo, useState } from 'react';
import { collection, doc, serverTimestamp } from 'firebase/firestore';
import { PlusCircle } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { useCollection, useFirebase, addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

export default function GoalsPage() {
    const { firestore, user } = useFirebase();
    const [isAddDialogOpen, setAddDialogOpen] = useState(false);
    const [isUpdateDialogOpen, setUpdateDialogOpen] = useState(false);
    const [selectedGoal, setSelectedGoal] = useState<any>(null);

    const query = useMemo(() => {
        if (!firestore || !user?.uid) return null;
        return collection(firestore, 'users', user.uid, 'savingsGoals');
    }, [firestore, user?.uid]);

    const { data: goals, isLoading } = useCollection(query as any);

    const handleAddGoal = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!firestore || !user?.uid) return;

        const formData = new FormData(event.currentTarget);
        const newGoal = {
            name: formData.get('name') as string,
            targetAmount: Number(formData.get('targetAmount')),
            savedAmount: 0,
            dueDate: new Date(formData.get('dueDate') as string).toISOString(),
            userProfileId: user.uid,
            createdAt: serverTimestamp(),
        };

        const colRef = collection(firestore, 'users', user.uid, 'savingsGoals');
        addDocumentNonBlocking(colRef, newGoal);
        setAddDialogOpen(false);
    };

    const handleUpdateSavings = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!firestore || !user?.uid || !selectedGoal) return;

        const formData = new FormData(event.currentTarget);
        const additionalAmount = Number(formData.get('amount'));
        const newSavedAmount = selectedGoal.savedAmount + additionalAmount;

        const docRef = doc(firestore, 'users', user.uid, 'savingsGoals', selectedGoal.id);
        updateDocumentNonBlocking(docRef, { savedAmount: newSavedAmount });
        setUpdateDialogOpen(false);
    };

    const openUpdateDialog = (goal: any) => {
        setSelectedGoal(goal);
        setUpdateDialogOpen(true);
    };

    return (
        <>
            <PageHeader
                title="Savings Goals"
                action={
                    <Button onClick={() => setAddDialogOpen(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Goal
                    </Button>
                }
            />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {isLoading ? (
                    [...Array(3)].map((_, i) => <Skeleton key={i} className="h-[238px]" />)
                ) : (
                    goals && goals.map((goal) => {
                        const progress = (goal.savedAmount / goal.targetAmount) * 100;
                        return (
                            <Card key={goal.id}>
                                <CardHeader>
                                    <CardTitle>{goal.name}</CardTitle>
                                    <CardDescription>Deadline: {format(new Date(goal.dueDate), "MMMM d, yyyy")}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <Progress value={progress} />
                                    <div className="flex justify-between text-sm text-muted-foreground">
                                        <span>{goal.savedAmount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</span>
                                        <span>{goal.targetAmount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</span>
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button variant="secondary" className="w-full" onClick={() => openUpdateDialog(goal)}>Update Savings</Button>
                                </CardFooter>
                            </Card>
                        );
                    })
                )}
                 <Card className="flex flex-col items-center justify-center border-2 border-dashed min-h-[200px]">
                    <div className="text-center p-6">
                        <h3 className="text-lg font-semibold mb-2">Create a New Goal</h3>
                        <p className="text-muted-foreground mb-4">Start saving for your next big thing.</p>
                        <Button onClick={() => setAddDialogOpen(true)}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add New Goal
                        </Button>
                    </div>
                </Card>
            </div>
            
            {/* Add Goal Dialog */}
            <Dialog open={isAddDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Add New Savings Goal</DialogTitle></DialogHeader>
                    <form onSubmit={handleAddGoal} className="space-y-4">
                        <div><Label htmlFor="name">Goal Name</Label><Input id="name" name="name" required /></div>
                        <div><Label htmlFor="targetAmount">Target Amount</Label><Input id="targetAmount" name="targetAmount" type="number" required /></div>
                        <div><Label htmlFor="dueDate">Due Date</Label><Input id="dueDate" name="dueDate" type="date" required /></div>
                        <Button type="submit" className="w-full">Create Goal</Button>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Update Savings Dialog */}
            <Dialog open={isUpdateDialogOpen} onOpenChange={setUpdateDialogOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Update Savings for {selectedGoal?.name}</DialogTitle></DialogHeader>
                    <form onSubmit={handleUpdateSavings} className="space-y-4">
                        <div><Label htmlFor="amount">Amount to Add</Label><Input id="amount" name="amount" type="number" required /></div>
                        <Button type="submit" className="w-full">Update</Button>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
