'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { collection, doc, serverTimestamp } from 'firebase/firestore';
import { PlusCircle, TrendingUp, TrendingDown, BrainCircuit, Loader2, Lightbulb, AlertTriangle, ShieldCheck, X, Check, ChevronsUpDown } from 'lucide-react';
import { z } from 'zod';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { generateInvestmentAdvice, type InvestmentAdviceOutput } from '@/ai/flows/investment-advice';
import { getPortfolioPerformance, type PortfolioPerformanceOutput } from '@/ai/flows/get-portfolio-performance';
import { symbolSearch } from '@/ai/flows/symbol-search';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useCollection, useFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking, useMemoFirebase } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import debounce from 'lodash.debounce';

const SymbolSchema = z.object({
    symbol: z.string(),
    instrument_name: z.string(),
    exchange: z.string(),
    country: z.string(),
});
type SymbolSearchOutput = z.infer<typeof SymbolSchema>[];


type AdviceState = {
    [key: string]: {
        isPending: boolean;
        output: InvestmentAdviceOutput | null;
        error?: string | null;
    };
};

type PerformanceState = {
    isPending: boolean;
    data: PortfolioPerformanceOutput | null;
    error?: string | null;
}

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

const ChangeCell = ({ value }: { value?: number }) => {
    if (value === undefined || value === null) {
        return <span className="text-muted-foreground">N/A</span>;
    }
    const isPositive = value >= 0;
    return (
        <span className={cn(
            "flex items-center gap-1",
            isPositive ? 'text-green-500' : 'text-red-500'
        )}>
            {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            {value.toFixed(2)}%
        </span>
    );
};


function AddInvestmentDialog({ open, onOpenChange, user, firestore }: { open: boolean, onOpenChange: (open: boolean) => void, user: any, firestore: any }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SymbolSearchOutput>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedSymbol, setSelectedSymbol] = useState('');
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);

    const debouncedSearch = useCallback(
        debounce((query: string) => {
            if (query.length < 2) {
                setSearchResults([]);
                return;
            }
            setIsSearching(true);
            symbolSearch({ query })
                .then(results => setSearchResults(results))
                .finally(() => setIsSearching(false));
        }, 300),
        []
    );

    useEffect(() => {
        debouncedSearch(searchQuery);
    }, [searchQuery, debouncedSearch]);


    const handleAddInvestment = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!firestore || !user?.uid) return;

        const formData = new FormData(event.currentTarget);
        const newInvestment = {
            name: selectedSymbol || (formData.get('name') as string),
            type: (formData.get('type') as string) || 'Stocks',
            purchasePrice: Number(formData.get('purchasePrice')),
            purchaseDate: new Date(formData.get('purchaseDate') as string).toISOString(),
            userProfileId: user.uid,
            createdAt: serverTimestamp(),
        };

        const colRef = collection(firestore, 'users', user.uid, 'investments');
        addDocumentNonBlocking(colRef, newInvestment);
        onOpenChange(false);
        // Reset form state
        setSearchQuery('');
        setSelectedSymbol('');
        setSearchResults([]);
    };
    
    return (
         <Dialog open={open} onOpenChange={(isOpen) => {
            if (!isOpen) {
                setSearchQuery('');
                setSelectedSymbol('');
                setSearchResults([]);
            }
            onOpenChange(isOpen);
         }}>
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
                        <Label htmlFor="name">Name / Ticker</Label>
                        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                             <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    className={cn("w-full justify-between", !selectedSymbol && "text-muted-foreground")}
                                >
                                    {selectedSymbol || "Select symbol..."}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                <Command>
                                    <CommandInput 
                                        placeholder="Search for a stock..." 
                                        value={searchQuery}
                                        onValueChange={setSearchQuery}
                                    />
                                    {isSearching && <div className="p-4 text-sm text-center">Searching...</div>}
                                    <CommandEmpty>{!isSearching && searchQuery.length > 1 ? 'No symbols found.' : 'Type to search.'}</CommandEmpty>
                                    <CommandList>
                                        <CommandGroup>
                                            {searchResults.map((result) => (
                                                <CommandItem
                                                    key={result.symbol}
                                                    value={result.symbol}
                                                    onSelect={(currentValue) => {
                                                        setSelectedSymbol(currentValue.toUpperCase());
                                                        setSearchQuery('');
                                                        setSearchResults([]);
                                                        setIsPopoverOpen(false);
                                                    }}
                                                >
                                                    <Check className={cn("mr-2 h-4 w-4", selectedSymbol === result.symbol ? "opacity-100" : "opacity-0")} />
                                                    <div className="flex flex-col">
                                                        <span className="font-bold">{result.symbol}</span>
                                                        <span className="text-xs text-muted-foreground">{result.instrument_name}</span>
                                                    </div>
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                         <Input id="name" name="name" type="hidden" value={selectedSymbol} />
                    </div>
                    <div>
                        <Label htmlFor="type">Type</Label>
                         <Select name="type" defaultValue="Stocks">
                            <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Stocks">Stocks</SelectItem>
                                <SelectItem value="Crypto">Crypto</SelectItem>
                                <SelectItem value="Mutual Funds">Mutual Funds</SelectItem>
                                <SelectItem value="ETFs">ETFs</SelectItem>
                            </SelectContent>
                        </Select>
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
    const [performanceData, setPerformanceData] = useState<PerformanceState>({ isPending: true, data: null });
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

    useEffect(() => {
        if (investments && investments.length > 0) {
            const stockTickers = investments
                .filter(inv => inv.type.toLowerCase() === 'stocks')
                .map(inv => inv.name);

            if (stockTickers.length > 0) {
                setPerformanceData({ isPending: true, data: null, error: null });
                getPortfolioPerformance({ tickers: stockTickers })
                    .then(data => {
                        setPerformanceData({ isPending: false, data, error: null });
                    })
                    .catch(error => {
                        console.error("Error fetching portfolio performance:", error);
                        setPerformanceData({ isPending: false, data: null, error: "Failed to fetch performance." });
                    });
            } else {
                 setPerformanceData({ isPending: false, data: null, error: null });
            }
        } else if (investments) {
            setPerformanceData({ isPending: false, data: null, error: null });
        }
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
        deleteDocumentNonBlocking(docRef);
        setAdvice(prev => {
            const newState = {...prev};
            delete newState[id];
            return newState;
        })
    }
    
    const isDataLoading = isLoading || performanceData.isPending;

    return (
        <>
            <PageHeader
                title="Investments"
                action={
                    <AddInvestmentDialog open={isAddDialogOpen} onOpenChange={setAddDialogOpen} user={user} firestore={firestore} />
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
                        <CardTitle>Your Portfolio Performance</CardTitle>
                        <CardDescription>Historical performance of your stock investments.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Purchase Price</TableHead>
                                        <TableHead>1W %</TableHead>
                                        <TableHead>1M %</TableHead>
                                        <TableHead>1Y %</TableHead>
                                        <TableHead>5Y %</TableHead>
                                        <TableHead>AI Advice</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isDataLoading ? (
                                        [...Array(3)].map((_, i) => (
                                            <TableRow key={i}><TableCell colSpan={9}><Skeleton className="h-8 w-full" /></TableCell></TableRow>
                                        ))
                                    ) : investments && investments.length > 0 ? (
                                        investments.map((inv) => {
                                            const adviceState = advice[inv.id];
                                            const perf = performanceData.data?.[inv.name];
                                            const isStock = inv.type.toLowerCase() === 'stocks';

                                            return (
                                                <TableRow key={inv.id}>
                                                    <TableCell className="font-medium">{inv.name}</TableCell>
                                                    <TableCell><Badge variant="outline">{inv.type}</Badge></TableCell>
                                                    <TableCell>{inv.purchasePrice.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</TableCell>
                                                    <TableCell><ChangeCell value={isStock ? perf?.weeklyChange : undefined} /></TableCell>
                                                    <TableCell><ChangeCell value={isStock ? perf?.monthlyChange : undefined} /></TableCell>
                                                    <TableCell><ChangeCell value={isStock ? perf?.yearlyChange : undefined} /></TableCell>
                                                    <TableCell><ChangeCell value={isStock ? perf?.fiveYearlyChange : undefined} /></TableCell>
                                                    
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
                                        <TableRow><TableCell colSpan={9} className="text-center">No investments yet.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {Object.entries(advice).map(([id, { output }]) => {
                    const investment = investments?.find(inv => inv.id === id);
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
