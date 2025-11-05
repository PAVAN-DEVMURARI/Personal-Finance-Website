'use client';

import { useMemo, useState } from 'react';
import { collection, doc, serverTimestamp, updateDoc, addDoc } from 'firebase/firestore';
import { PlusCircle, BrainCircuit, Loader2, Lightbulb, AlertTriangle, ShieldCheck, X } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { generateInvestmentAdvice, type InvestmentAdviceOutput } from '@/ai/flows/investment-advice';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';


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

function AddInvestmentDialog({ open, onOpenChange, user, firestore, investments }: { open: boolean, onOpenChange: (open: boolean) => void, user: any, firestore: any, investments: any[] | null }) {
    const [selectedType, setSelectedType] = useState('Stocks');
    const { toast } = useToast();

    const handleAddInvestment = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!firestore || !user?.uid) return;

        const formData = new FormData(event.currentTarget);
        const name = formData.get('name') as string;
        const type = selectedType;
        const purchasePrice = Number(formData.get('purchasePrice'));
        const purchaseDate = new Date(formData.get('purchaseDate') as string).toISOString();

        try {
            const existingInvestment = investments?.find(
                inv => inv.name.toLowerCase() === name.toLowerCase() && inv.type === type
            );

            if (existingInvestment) {
                // Investment exists, update it
                const docRef = doc(firestore, 'users', user.uid, 'investments', existingInvestment.id);
                const newTotal = existingInvestment.purchasePrice + purchasePrice;
                await updateDoc(docRef, { purchasePrice: newTotal });
                 toast({
                    title: "Investment Updated",
                    description: `Added ${purchasePrice.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })} to ${name}.`,
                });
            } else {
                // Investment doesn't exist, create it
                const investmentsRef = collection(firestore, 'users', user.uid, 'investments');
                const newInvestment = {
                    name,
                    type,
                    purchasePrice,
                    purchaseDate,
                    userProfileId: user.uid,
                    createdAt: serverTimestamp(),
                };
                await addDoc(investmentsRef, newInvestment);
                 toast({
                    title: "Investment Added",
                    description: `${name} has been added to your portfolio.`,
                });
            }
        } catch (error) {
            console.error("Error adding or updating investment: ", error);
            toast({
                variant: 'destructive',
                title: "Error",
                description: "Could not add or update investment.",
            });
        }
        
        onOpenChange(false);
        setSelectedType('Stocks');
    };
    
    return (
         <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                 <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Investment
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader><DialogTitle>Add New Investment</DialogTitle></DialogHeader>
                <form onSubmit={handleAddInvestment} className="space-y-4">
                    <div>
                        <Label htmlFor="type">Type</Label>
                         <Select name="type" value={selectedType} onValueChange={setSelectedType}>
                            <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Stocks">Stocks</SelectItem>
                                <SelectItem value="Crypto">Crypto</SelectItem>
                                <SelectItem value="Mutual Fund">Mutual Fund</SelectItem>
                                <SelectItem value="ETFs">ETFs</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="name">Name / Ticker</Label>
                        <Input id="name" name="name" required />
                    </div>
                    <div><Label htmlFor="purchasePrice">Purchase Price (per unit)</Label><Input id="purchasePrice" name="purchasePrice" type="number" step="any" required /></div>
                    <div><Label htmlFor="purchaseDate">Purchase Date</Label><Input id="purchaseDate" name="purchaseDate" type="date" required defaultValue={new Date().toISOString().split('T')[0]} /></div>
                    <Button type="submit" className="w-full">Add Investment</Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}


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

    const handleGetAdvice = (investmentId: string, assetName: string, assetType: string, purchasePrice: number) => {
        setAdvice(prev => ({ ...prev, [investmentId]: { isPending: true, output: null, error: null } }));

        generateInvestmentAdvice({ assetName, assetType, purchasePrice }).then(result => {
            setAdvice(prev => ({ ...prev, [investmentId]: { isPending: false, output: result, error: null } }));
        }).catch(err => {
            console.error(err);
            setAdvice(prev => ({ ...prev, [investmentId]: { isPending: false, output: null, error: "An error occurred." } }));
        });
    };

    const handleDeleteInvestment = (id: string) => {
        if(!firestore || !user?.uid) return;
        const docRef = doc(firestore, 'users', user.uid, 'investments', id);
        // Using `deleteDoc` directly from firebase/firestore and handling promise
        deleteDoc(docRef).then(() => {
            setAdvice(prev => {
                const newState = {...prev};
                delete newState[id];
                return newState;
            })
        }).catch(error => {
            console.error("Error deleting investment: ", error);
        });
    }
    
    const isDataLoading = isLoading;

    return (
        <>
            <PageHeader
                title="Investments"
                action={
                    <AddInvestmentDialog open={isAddDialogOpen} onOpenChange={setAddDialogOpen} user={user} firestore={firestore} investments={investments} />
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
                        <CardDescription>A list of your current investments.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Purchase Price</TableHead>
                                        <TableHead>AI Advice</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isDataLoading ? (
                                        [...Array(3)].map((_, i) => (
                                            <TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-8 w-full" /></TableCell></TableRow>
                                        ))
                                    ) : investments && investments.length > 0 ? (
                                        investments.map((inv) => {
                                            const adviceState = advice[inv.id];

                                            return (
                                                <TableRow key={inv.id}>
                                                    <TableCell className="font-medium">{inv.name}</TableCell>
                                                    <TableCell><Badge variant="outline">{inv.type}</Badge></TableCell>
                                                    <TableCell>{inv.purchasePrice.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</TableCell>
                                                    
                                                    <TableCell>
                                                        <Button variant="outline" size="sm" onClick={() => handleGetAdvice(inv.id, inv.name, inv.type, inv.purchasePrice)} disabled={adviceState?.isPending}>
                                                            {adviceState?.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BrainCircuit className="mr-2 h-4 w-4" />}
                                                            {adviceState?.output ? 'Refresh' : 'Get Advice'}
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
                                        <TableRow><TableCell colSpan={5} className="text-center">No investments yet.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {investments && Object.entries(advice).map(([id, { output }]) => {
                    const investment = investments.find(inv => inv.id === id);
                    if (!output || !investment || !output.advice) return null;
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
