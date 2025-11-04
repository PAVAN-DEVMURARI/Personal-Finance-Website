'use client';

import { PlusCircle } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { goals } from "@/lib/data";
import { format } from "date-fns";

export default function GoalsPage() {
    return (
        <>
            <PageHeader
                title="Savings Goals"
                action={
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Goal
                    </Button>
                }
            />
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {goals.map((goal) => {
                    const progress = (goal.currentAmount / goal.targetAmount) * 100;
                    return (
                        <Card key={goal.id}>
                            <CardHeader>
                                <CardTitle>{goal.name}</CardTitle>
                                <CardDescription>Deadline: {format(new Date(goal.deadline), "MMMM d, yyyy")}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <Progress value={progress} />
                                <div className="flex justify-between text-sm text-muted-foreground">
                                    <span>{goal.currentAmount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</span>
                                    <span>{goal.targetAmount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</span>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button variant="secondary" className="w-full">Update Savings</Button>
                            </CardFooter>
                        </Card>
                    );
                })}
                 <Card className="flex flex-col items-center justify-center border-2 border-dashed">
                    <div className="text-center p-6">
                        <h3 className="text-lg font-semibold mb-2">Create a New Goal</h3>
                        <p className="text-muted-foreground mb-4">Start saving for your next big thing.</p>
                        <Button>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add New Goal
                        </Button>
                    </div>
                </Card>
            </div>
        </>
    );
}
