import { PlusCircle, TrendingUp, TrendingDown } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { investments } from "@/lib/data";
import { cn } from "@/lib/utils";

export default function InvestmentsPage() {
    const totalInvestments = investments.reduce((acc, inv) => acc + inv.value, 0);

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
                            {totalInvestments.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                        </p>
                        <p className="text-sm text-muted-foreground">+5.4% all time</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Your Portfolio</CardTitle>
                        <CardDescription>A detailed view of your current investments.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Monthly Change</TableHead>
                                    <TableHead className="text-right">Value</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {investments.map((inv) => (
                                    <TableRow key={inv.id}>
                                        <TableCell className="font-medium">{inv.name}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{inv.type}</Badge>
                                        </TableCell>
                                        <TableCell className={cn("flex items-center gap-1", inv.monthlyChange >= 0 ? 'text-green-500' : 'text-red-500')}>
                                            {inv.monthlyChange >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                                            {inv.monthlyChange}%
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {inv.value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
