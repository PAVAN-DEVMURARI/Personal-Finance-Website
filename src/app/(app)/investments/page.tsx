'use client';

import { useState } from 'react';
import { PlusCircle, TrendingUp, TrendingDown, BrainCircuit, Loader2, Lightbulb, AlertTriangle, ShieldCheck } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { investments } from '@/lib/data';
import { cn } from '@/lib/utils';
import { generateInvestmentAdvice, type InvestmentAdviceOutput } from '@/ai/flows/investment-advice';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type AdviceState = {
    [key: string]: {
        isPending: boolean;
        output: InvestmentAdviceOutput | null;
    };
};

type TimePeriod = '1W' | '1M' | '1Y' | '5Y';

const signalIcons = {
    BUY: <ShieldCheck className="h-4 w-4 text-green-500" />,
    SELL: <AlertTriangle className="h-4 w-4 text-red-500" />,
    HOLD: <Lightbulb className="h-4 w-4 text-yellow-500" />,
};

const signalColors: { [key: string]: string } = {
    BUY: 'border-green-500/50',
    SELL: 'border-red-500/50',
    HOLD: 'border-yellow-500/50',
};

// Mock percentage changes for different time periods
const getMockChange = (baseChange: number, period: TimePeriod) => {
    switch (period) {
        case '1W':
            return baseChange / 4 + (Math.random() - 0.5);
        case '1M':
            return baseChange + (Math.random() - 0.5) * 2;
        case '1Y':
            return baseChange * 12 + (Math.random() - 0.5) * 10;
        case '5Y':
            return baseChange * 60 + (Math.random() - 0.5) * 50;
        default:
            return baseChange;
    }
};

export default function InvestmentsPage() {
    const totalInvestments = investments.reduce((acc, inv) => acc + inv.value, 0);
    const [advice, setAdvice] = useState<AdviceState>({});
    const [timePeriod, setTimePeriod] = useState<TimePeriod>('1M');

    const handleGetAdvice = (investmentId: string, assetName: string) => {
        setAdvice(prev => ({ ...prev, [investmentId]: { isPending: true, output: null } }));

        generateInvestmentAdvice({ assetName }).then(result => {
            setAdvice(prev => ({ ...prev, [investmentId]: { isPending: false, output: result } }));
        }).catch(err => {
            console.error(err);
            setAdvice(prev => ({ ...prev, [investmentId]: { isPending: false, output: null } }));
        });
    };

    return (
        <>
            <PageHeader
                title="Investments"
                action={
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Investment
                    </Button>
                }
            />

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Total Investment Value</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-bold font-headline">
                            {totalInvestments.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                        </p>
                        <p className="text-sm text-muted-foreground">+5.4% all time</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Your Portfolio</CardTitle>
                        <CardDescription>A detailed view of your current investments with AI-powered advice.</CardDescription>
                    </CardHeader>
                    <CardContent>
                       <Tabs value={timePeriod} onValueChange={(value) => setTimePeriod(value as TimePeriod)}>
                            <TabsList className="grid w-full grid-cols-4 mb-4">
                                <TabsTrigger value="1W">Week</TabsTrigger>
                                <TabsTrigger value="1M">Month</TabsTrigger>
                                <TabsTrigger value="1Y">Year</TabsTrigger>
                                <TabsTrigger value="5Y">5 Years</TabsTrigger>
                            </TabsList>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Change</TableHead>
                                            <TableHead>AI Advice</TableHead>
                                            <TableHead className="text-right">Value</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {investments.map((inv) => {
                                            const change = getMockChange(inv.monthlyChange, timePeriod);
                                            return (
                                                <TableRow key={inv.id}>
                                                    <TableCell className="font-medium">{inv.name}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline">{inv.type}</Badge>
                                                    </TableCell>
                                                    <TableCell className={cn("flex items-center gap-1", change >= 0 ? 'text-green-500' : 'text-red-500')}>
                                                        {change >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                                                        {change.toFixed(2)}%
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button variant="outline" size="sm" onClick={() => handleGetAdvice(inv.id, inv.name)} disabled={advice[inv.id]?.isPending}>
                                                            {advice[inv.id]?.isPending ? (
                                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                            ) : (
                                                                <BrainCircuit className="mr-2 h-4 w-4" />
                                                            )}
                                                            Get Advice
                                                        </Button>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {inv.value.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        </Tabs>
                    </CardContent>
                </Card>

                {Object.entries(advice).map(([id, { output }]) => {
                    const investment = investments.find(inv => inv.id === id);
                    if (!output || !investment) return null;
                    return (
                        <Alert key={id} className={cn("mt-4", signalColors[output.signal])}>
                             {signalIcons[output.signal as keyof typeof signalIcons]}
                            <AlertTitle className="font-bold">
                                {investment.name}: <span className={cn(
                                    output.signal === 'BUY' && 'text-green-500',
                                    output.signal === 'SELL' && 'text-red-500',
                                    output.signal === 'HOLD' && 'text-yellow-500',
                                )}>{output.signal}</span>
                            </AlertTitle>
                            <AlertDescription className="space-y-2">
                                <p>{output.advice}</p>
                                <p className="text-xs text-muted-foreground italic">{output.disclaimer}</p>
                            </AlertDescription>
                        </Alert>
                    );
                })}
            </div>
        </>
    );
}
