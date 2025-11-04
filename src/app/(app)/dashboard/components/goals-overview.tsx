import { Target } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { goals } from "@/lib/data";
import { format } from 'date-fns';

export function GoalsOverview() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Savings Goals</CardTitle>
        <CardDescription>Track your progress towards your financial goals.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {goals.map((goal) => {
          const progress = (goal.currentAmount / goal.targetAmount) * 100;
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
                <span>{goal.currentAmount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>
                <span>Target: {goal.targetAmount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                Deadline: {format(new Date(goal.deadline), "MMMM d, yyyy")}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
