import { PlusCircle } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { transactions } from "@/lib/data";
import { format } from "date-fns";

export default function IncomePage() {
    const incomes = transactions.filter(t => t.type === 'income');

    return (
        <>
            <PageHeader
                title="Income"
                action={
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Income
                    </Button>
                }
            />
            <Card>
                <CardHeader>
                    <CardTitle>Your Income Sources</CardTitle>
                    <CardDescription>A detailed list of all your recorded income.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Description</TableHead>
                                <TableHead>Source</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {incomes.map((income) => (
                                <TableRow key={income.id}>
                                    <TableCell className="font-medium">{income.description}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{income.category}</Badge>
                                    </TableCell>
                                    <TableCell>{format(new Date(income.date), 'MMM d, yyyy')}</TableCell>
                                    <TableCell className="text-right">
                                        {income.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </>
    );
}
