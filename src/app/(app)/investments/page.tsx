'use client';

import { useMemo, useState, useEffect } from 'react';
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
        error?: string | null;
    };
};

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

export default function InvestmentsPage() {
    const { firestore, user } = useFirebase();
    const [advice, setAdvice] = useState<AdviceState>({});
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

    const handleGetAdvice = (investmentId: string, assetName: string, purchasePrice: number) => {
        setAdvice(prev => ({ ...prev, [investmentId]: { isPending: true, output: null, error: null } }));

        generateInvestmentAdvice({ assetName, purchasePrice }).then(result => {
            if(result.currentPrice === 0) {
                 setAdvice(prev => ({ ...prev, [investmentId]: { isPending: false, output: null, error: "Could not fetch price." } }));
            } else {
                setAdvice(prev => ({ ...prev, [investmentId]: { isPending: false, output: result, error: null } }));
            }
        }).catch(err => {
            console.error(err);
            setAdvice(prev => ({ ...prev, [investmentId]: { isPending: false, output: null, error: "An error occurred." } }));
        });
    };
    
    useEffect(() => {
        if (investments && investments.length > 0) {
            investments.forEach(inv => {
                const nonStockTypes = ['crypto', 'mutual funds', 'etfs'];
                const isStock = !nonStockTypes.some(type => inv.type.toLowerCase().includes(type));
                if (isStock && !advice[inv.id]) {
                    handleGetAdvice(inv.id, inv.name, inv.purchasePrice);
                }
            });
        }
    }, [investments]);


    const handleAddInvestment = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!firestore || !user?.uid) return;

        const formData = new FormData(event.currentTarget);
        const newInvestment = {
            name: formData.get('name') as string,
            type: formData.get('type') as string,
            purchasePrice: Number(formData.get('purchasePrice')),
            purchaseDate: new Date(formData.get('purchaseDate') as string).toISOString(),
            userProfileId: user.uid,
            createdAt: serverTimestamp(),
        };

        const colRef = collection(firestore, 'users', user.uid, 'investments');
        addDocumentNonBlocking(colRef, newInvestment);
        setAddDialogOpen(false);
    };

    const handleDeleteInvestment = (id: string) => {
        if(!firestore || !user?.uid) return;
        const docRef = doc(firestore, 'users', user.uid, 'investments', id);
        deleteDocumentNonBlocking(docRef);
        setAdvice(prev => {
            const newState = {...prev};
            delete newState[id];
            return newState;
        })
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
                    <CardHeader><CardTitle>Total Investment Value (at cost)</CardTitle></CardHeader>
                    <CardContent>
                        {isLoading ? <Skeleton className="h-10 w-48" /> : (
                            <p className="text-4xl font-bold font-headline">
                                {totalInvestments.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                            </p>
                        )}
                        <p className="text-sm text-muted-foreground">This is the total amount you have invested.</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Your Portfolio</CardTitle>
                        <CardDescription>A detailed view of your current investments with AI-powered advice.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Purchase Price</TableHead>
                                        <TableHead>Current Value</TableHead>
                                        <TableHead>AI Advice</TableHead>
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
                                            const adviceState = advice[inv.id];
                                            const adviceOutput = adviceState?.output;
                                            const currentValue = adviceOutput?.currentPrice;
                                            const change = currentValue ? ((currentValue - inv.purchasePrice) / inv.purchasePrice) * 100 : 0;

                                            return (
                                                <TableRow key={inv.id}>
                                                    <TableCell className="font-medium">{inv.name}</TableCell>
                                                    <TableCell><Badge variant="outline">{inv.type}</Badge></TableCell>
                                                    <TableCell>{inv.purchasePrice.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</TableCell>
                                                    <TableCell className={cn(
                                                        "flex items-center gap-1",
                                                        !currentValue ? "" : change >= 0 ? 'text-green-500' : 'text-red-500'
                                                    )}>
                                                        {adviceState?.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                                                        {currentValue ? (
                                                            <>
                                                                {change >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                                                                {currentValue.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })} ({change.toFixed(2)}%)
                                                            </>
                                                        ) : (
                                                            adviceState?.error || 'N/A'
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button variant="outline" size="sm" onClick={() => handleGetAdvice(inv.id, inv.name, inv.purchasePrice)} disabled={advice[inv.id]?.isPending}>
                                                            {advice[inv.id]?.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BrainCircuit className="mr-2 h-4 w-4" />}
                                                            Get Advice
                                                        </Button>
                                                    </TableCell>
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
