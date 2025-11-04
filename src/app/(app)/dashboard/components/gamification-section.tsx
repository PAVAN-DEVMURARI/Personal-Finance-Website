import { Award, Flame } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { dailyStreak, badges } from "@/lib/data";
import { cn } from "@/lib/utils";

export function GamificationSection() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Your Progress</CardTitle>
        <CardDescription>Stay motivated on your financial journey.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-center gap-4 rounded-lg bg-accent/20 p-4">
          <Flame className="h-10 w-10 text-accent" />
          <div>
            <p className="text-2xl font-bold font-headline">{dailyStreak} Day Streak</p>
            <p className="text-sm text-muted-foreground">Keep logging daily!</p>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium mb-2">Badges Earned</h3>
          <div className="flex flex-wrap gap-4">
            <TooltipProvider>
            {badges.map((badge) => (
                <Tooltip key={badge.id}>
                    <TooltipTrigger>
                        <div
                            className={cn(
                            "flex h-16 w-16 items-center justify-center rounded-full border-2",
                            badge.achieved ? "border-accent bg-accent/20" : "border-dashed border-muted-foreground/50 bg-muted/50"
                            )}
                        >
                            <badge.icon className={cn("h-8 w-8", badge.achieved ? "text-accent" : "text-muted-foreground/50")} />
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{badge.name}</p>
                    </TooltipContent>
                </Tooltip>
            ))}
            </TooltipProvider>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
