'use client';

import { useMemo } from 'react';
import { collection } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { format } from 'date-fns';
import { useCollection, useFirebase } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';

export function GoalsOverview() {
  const { firestore, user } = useFirebase();

  const query = useMemo(() => {
    if (!firestore || !user?.uid) return null;
    return collection(firestore, 'users', user.uid, 'savingsGoals');
  }, [firestore, user?.uid]);

  const { data: goals, isLoading } = useCollection(query as any);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-4 w-3/4" />
        </CardHeader>
        <CardContent className="space-y-6">
            {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Savings Goals</CardTitle>
        <CardDescription>Track your progress towards your financial goals.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {goals && goals.length > 0 ? goals.map((goal) => {
          const progress = (goal.savedAmount / goal.targetAmount) * 100;
          return (
            <div key={goal.id} className="space-y-2">
              <div className="flex justify-between items-center">
                <p className="font-medium">{goal.name}</p>
                <span className="text-sm text-muted-foreground">
                  {Math.round(progress)}%
                </span>
              </div>
              <Progress value={progress} aria-label={`${goal.name} progress`} />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{goal.savedAmount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</span>
                <span>Target: {goal.targetAmount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                Deadline: {format(new Date(goal.dueDate), "MMMM d, yyyy")}
              </div>
            </div>
          );
        }) : (
          <div className="text-center text-muted-foreground py-4">No savings goals yet.</div>
        )}
      </CardContent>
    </Card>
  );
}
