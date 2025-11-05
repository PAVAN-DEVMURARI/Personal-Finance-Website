'use client';

import { useMemo, useState } from 'react';
import { collection, doc, serverTimestamp } from 'firebase/firestore';
import { PlusCircle, TrendingUp, TrendingDown, BrainCircuit, Loader2, Lightbulb, AlertTriangle, ShieldCheck, X } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { generateInvestmentAdvice, type InvestmentAdviceOutput } from '@/ai/flows/investment-advice';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCollection, useFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking, useMemoFirebase } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

const getMockChange = (baseChange: number, period: TimePeriod) => {
    switch (period) {
        case '1W': return baseChange / 4 + (Math.random() - 0.5);
        case '1M': return baseChange + (Math.random() - 0.5) * 2;
        case '1Y': return baseChange * 12 + (Math.random() - 0.5) * 10;
        case '5Y': return baseChange * 60 + (Math.random() - 0.5) * 50;
        default: return baseChange;
    }
};

export default function InvestmentsPage() {
    const { firestore, user } = useFirebase();
    const [advice, setAdvice] = useState<AdviceState>({});
    const [timePeriod, setTimePeriod] = useState<TimePeriod>('1M');
    const [isAddDialogOpen, setAddDialogOpen] = useState(false);

    const query = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return collection(firestore, 'users', user.uid, 'investments');
    }, [firestore, user?.uid]);

    const { data: investments, isLoading } = useCollection(query);

    const totalInvestments = useMemo(() => {
        if (!investments) return 0;
        return investments.reduce((acc, inv) => acc + inv.purchasePrice, 0);
    }, [investments]);

    const handleGetAdvice = (investmentId: string, assetName: string) => {
        setAdvice(prev => ({ ...prev, [investmentId]: { isPending: true, output: null } }));

        generateInvestmentAdvice({ assetName }).then(result => {
            setAdvice(prev => ({ ...prev, [investmentId]: { isPending: false, output: result } }));
        }).catch(err => {
            console.error(err);
            setAdvice(prev => ({ ...prev, [investmentId]: { isPending: false, output: null } }));
        });
    };

    const handleAddInvestment = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!firestore || !user?.uid) return;

        const formData = new FormData(event.currentTarget);
        const newInvestment = {
            name: formData.get('name') as string,
            type: formData.get('type') as string,
            quantity: 1, // Defaulting quantity to 1 as it's removed from form
            purchasePrice: Number(formData.get('purchasePrice')),
            purchaseDate: new Date(formData.get('purchaseDate') as string).toISOString(),
            userProfileId: user.uid,
            createdAt: serverTimestamp(),
            monthlyChange: (Math.random() - 0.5) * 5, // Mock monthly change
        };

        const colRef = collection(firestore, 'users', user.uid, 'investments');
        addDocumentNonBlocking(colRef, newInvestment);
        setAddDialogOpen(false);
    };

    const handleDeleteInvestment = (id: string) => {
        if(!firestore || !user?.uid) return;
        const docRef = doc(firestore, 'users', user.uid, 'investments', id);
        deleteDocumentNonBlocking(docRef);
    }

    return (
        <>
            <PageHeader
                title="Investments"
                action={
                    <Dialog open={isAddDialogOpen} onOpenChange={setAddDialogOpen}>
                        <DialogTrigger asChild>
                             <Button>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Add Investment
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader><DialogTitle>Add New Investment</DialogTitle></DialogHeader>
                            <form onSubmit={handleAddInvestment} className="space-y-4">
                                <div><Label htmlFor="name">Name / Ticker</Label><Input id="name" name="name" required /></div>
                                <div>
                                    <Label htmlFor="type">Type</Label>
                                    <Select name="type" required>
                                        <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Stocks">Stocks</SelectItem>
                                            <SelectItem value="Crypto">Crypto</SelectItem>
                                            <SelectItem value="Mutual Funds">Mutual Funds</SelectItem>
                                            <SelectItem value="ETFs">ETFs</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div><Label htmlFor="purchasePrice">Purchase Price</Label><Input id="purchasePrice" name="purchasePrice" type="number" step="any" required /></div>
                                <div><Label htmlFor="purchaseDate">Purchase Date</Label><Input id="purchaseDate" name="purchaseDate" type="date" required /></div>
                                <Button type="submit" className="w-full">Add Investment</Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                }
            />

            <div className="grid gap-6">
                <Card>
                    <CardHeader><CardTitle>Total Investment Value</CardTitle></CardHeader>
                    <CardContent>
                        {isLoading ? <Skeleton className="h-10 w-48" /> : (
                            <p className="text-4xl font-bold font-headline">
                                {totalInvestments.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                            </p>
                        )}
                        <p className="text-sm text-muted-foreground">+0% all time</p>
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
                                            <TableHead className="w-[50px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isLoading ? (
                                            [...Array(3)].map((_, i) => (
                                                <TableRow key={i}><TableCell colSpan={6}><Skeleton className="h-8 w-full" /></TableCell></TableRow>
                                            ))
                                        ) : investments && investments.length > 0 ? (
                                            investments.map((inv) => {
                                                const change = getMockChange(inv.monthlyChange || 0, timePeriod);
                                                const value = inv.purchasePrice;
                                                return (
                                                    <TableRow key={inv.id}>
                                                        <TableCell className="font-medium">{inv.name}</TableCell>
                                                        <TableCell><Badge variant="outline">{inv.type}</Badge></TableCell>
                                                        <TableCell className={cn("flex items-center gap-1", change >= 0 ? 'text-green-500' : 'text-red-500')}>
                                                            {change >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                                                            {change.toFixed(2)}%
                                                        </TableCell>
                                                        <TableCell>
                                                            <Button variant="outline" size="sm" onClick={() => handleGetAdvice(inv.id, inv.name)} disabled={advice[inv.id]?.isPending}>
                                                                {advice[inv.id]?.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BrainCircuit className="mr-2 h-4 w-4" />}
                                                                Get Advice
                                                            </Button>
                                                        </TableCell>
                                                        <TableCell className="text-right">{value.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</TableCell>
                                                        <TableCell>
                                                            <Button variant="ghost" size="icon" onClick={() => handleDeleteInvestment(inv.id)}>
                                                                <X className="h-4 w-4" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })
                                        ) : (
                                            <TableRow><TableCell colSpan={6} className="text-center">No investments yet.</TableCell></TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </Tabs>
                    </CardContent>
                </Card>

                {Object.entries(advice).map(([id, { output }]) => {
                    const investment = investments?.find(inv => inv.id === id);
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
