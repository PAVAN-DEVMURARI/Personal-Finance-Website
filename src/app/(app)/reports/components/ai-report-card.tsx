'use client';

import { useState, useTransition, useMemo } from "react";
import { collection } from 'firebase/firestore';
import { BrainCircuit, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle , CardFooter } from "@/components/ui/card";
import { generateMonthlyReport, type MonthlyReportInput, type MonthlyReportOutput } from "@/ai/flows/monthly-ai-financial-report";
import { Separator } from "@/components/ui/separator";
import { useCollection, useFirebase } from "@/firebase";

export function AiReportCard() {
    const [isPending, startTransition] = useTransition();
    const [report, setReport] = useState<MonthlyReportOutput | null>(null);
    const { firestore, user } = useFirebase();

    const expensesQuery = useMemo(() => {
        if (!firestore || !user?.uid) return null;
        return collection(firestore, 'users', user.uid, 'expenses');
    }, [firestore, user?.uid]);

    const incomeQuery = useMemo(() => {
        if (!firestore || !user?.uid) return null;
        return collection(firestore, 'users', user.uid, 'income');
    }, [firestore, user?.uid]);

    const investmentsQuery = useMemo(() => {
        if (!firestore || !user?.uid) return null;
        return collection(firestore, 'users', user.uid, 'investments');
    }, [firestore, user?.uid]);

    const { data: expenses } = useCollection(expensesQuery as any);
    const { data: income } = useCollection(incomeQuery as any);
    const { data: investments } = useCollection(investmentsQuery as any);

    const reportInput: MonthlyReportInput | null = useMemo(() => {
        if (!expenses || !income || !investments) return null;
        return {
            income: income.reduce((sum, t) => sum + t.amount, 0),
            expenses: expenses.reduce((sum, t) => sum + t.amount, 0),
            investments: investments.reduce((sum, i) => sum + (i.quantity * i.purchasePrice), 0),
            spendingByCategory: expenses.reduce((acc, t) => ({...acc, [t.category]: (acc[t.category] || 0) + t.amount }), {} as Record<string, number>),
            investmentPortfolio: investments.reduce((acc, i) => ({...acc, [i.type]: (acc[i.type] || 0) + (i.quantity * i.purchasePrice) }), {} as Record<string, number>),
        }
    }, [expenses, income, investments]);

    const handleGenerateReport = () => {
        if (!reportInput) return;
        startTransition(async () => {
            const result = await generateMonthlyReport(reportInput);
            setReport(result);
        });
    };

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <BrainCircuit className="h-5 w-5 text-primary" />
                    AI Financial Report
                </CardTitle>
                <CardDescription>Get a summary and personalized feedback for this month.</CardDescription>
            </CardHeader>
            <CardContent>
                {report ? (
                    <div className="space-y-4 text-sm">
                        <div>
                            <h3 className="font-semibold mb-2">Monthly Summary</h3>
                            <p className="text-muted-foreground whitespace-pre-wrap">{report.report}</p>
                        </div>
                        <Separator />
                        <div>
                            <h3 className="font-semibold mb-2">Personalized Feedback</h3>
                            <p className="text-muted-foreground whitespace-pre-wrap">{report.feedback}</p>
                        </div>
                    </div>
                ) : (
                    <div className="text-center text-muted-foreground py-8">
                        <p>Click the button to generate your AI report.</p>
                    </div>
                )}
            </CardContent>
            <CardFooter>
                 <Button onClick={handleGenerateReport} disabled={isPending || !reportInput} className="w-full">
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {report ? "Regenerate Report" : "Generate Report"}
                </Button>
            </CardFooter>
        </Card>
    );
}
