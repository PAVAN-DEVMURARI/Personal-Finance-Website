'use client';

import { Download } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { collection } from 'firebase/firestore';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { AiReportCard } from './components/ai-report-card';
import { IncomeExpenseSummary } from './components/income-expense-summary';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { format, startOfMonth, endOfMonth } from 'date-fns';

export default function ReportsPage() {
    const { firestore, user } = useFirebase();

    const expensesQuery = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return collection(firestore, 'users', user.uid, 'expenses');
    }, [firestore, user?.uid]);

    const incomeQuery = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return collection(firestore, 'users', user.uid, 'income');
    }, [firestore, user?.uid]);

    const investmentsQuery = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return collection(firestore, 'users', user.uid, 'investments');
    }, [firestore, user?.uid]);

    const { data: allExpenses } = useCollection(expensesQuery);
    const { data: allIncome } = useCollection(incomeQuery);
    const { data: allInvestments } = useCollection(investmentsQuery);

    const handleExportCSV = () => {
        if (!allExpenses || !allIncome) return;

        const allTransactions = [
            ...allIncome.map(i => ({ type: 'Income', description: i.source, date: format(new Date(i.date), 'yyyy-MM-dd'), amount: i.amount })),
            ...allExpenses.map(e => ({ type: 'Expense', description: e.description, date: format(new Date(e.date), 'yyyy-MM-dd'), amount: e.amount })),
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        const headers = ['Type', 'Description', 'Date', 'Amount'];
        const csvContent = [
            headers.join(','),
            ...allTransactions.map(t => [t.type, `"${t.description}"`, t.date, t.amount].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.href) {
            URL.revokeObjectURL(link.href);
        }
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.setAttribute('download', `financial-report-${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportPDF = () => {
        if (!allExpenses || !allIncome || !allInvestments) return;

        const now = new Date();
        const monthStart = startOfMonth(now);
        const monthEnd = endOfMonth(now);

        const income = allIncome.filter(i => {
            const itemDate = new Date(i.date);
            return itemDate >= monthStart && itemDate <= monthEnd;
        });
        const expenses = allExpenses.filter(e => {
            const itemDate = new Date(e.date);
            return itemDate >= monthStart && itemDate <= monthEnd;
        });
        const investments = allInvestments.filter(i => {
            const itemDate = new Date(i.purchaseDate);
            return itemDate >= monthStart && itemDate <= monthEnd;
        });

        const totalIncome = income.reduce((sum, i) => sum + i.amount, 0);
        const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
        const totalInvestments = investments.reduce((sum, i) => sum + i.purchasePrice, 0);
    
        const doc = new jsPDF();
        let cursorY = 45;
    
        doc.setFontSize(20);
        doc.text("Financial Report", 14, 22);
        doc.setFontSize(12);
        doc.text(`Report for: ${user?.email || 'N/A'}`, 14, 30);
        doc.text(`Date: ${format(new Date(), 'MMMM d, yyyy')}`, 14, 36);
    
        if (income.length > 0) {
            doc.setFontSize(16);
            doc.text('Income', 14, cursorY);
            cursorY += 2; 

            autoTable(doc, {
                startY: cursorY,
                head: [['Date', 'Source', 'Amount']],
                body: income.map(i => [format(new Date(i.date), 'yyyy-MM-dd'), i.source, i.amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })]),
                headStyles: { fillColor: [41, 128, 185] },
            });
            cursorY = (doc as any).lastAutoTable.finalY + 15;
        }
    
        if (expenses.length > 0) {
            doc.setFontSize(16);
            doc.text('Expenses', 14, cursorY);
            cursorY += 2;

            autoTable(doc, {
                startY: cursorY,
                head: [['Date', 'Description', 'Category', 'Amount']],
                body: expenses.map(e => [format(new Date(e.date), 'yyyy-MM-dd'), e.description, e.category, e.amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })]),
                headStyles: { fillColor: [231, 76, 60] },
            });
            cursorY = (doc as any).lastAutoTable.finalY + 15;
        }
    
        doc.setFontSize(16);
        doc.text('Monthly Summary', 14, cursorY);
        cursorY += 8;

        autoTable(doc, {
            startY: cursorY,
            body: [
                ['Total Income', totalIncome.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })],
                ['Total Expenses', totalExpenses.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })],
                ['Total Investments', totalInvestments.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })],
            ],
            theme: 'plain',
        });

        doc.save(`financial-report-${format(now, 'yyyy-MM')}.pdf`);
    };

    return (
        <>
            <PageHeader
                title="Financial Reports"
                action={
                    <div className="flex flex-col sm:flex-row gap-2">
                        <Button variant="outline" onClick={handleExportCSV} disabled={!allExpenses || !allIncome}>
                            <Download className="mr-2 h-4 w-4" />
                            Export CSV
                        </Button>
                        <Button variant="outline" onClick={handleExportPDF} disabled={!allExpenses || !allIncome || !allInvestments}>
                            <Download className="mr-2 h-4 w-4" />
                            Export PDF
                        </Button>
                    </div>
                }
            />

            <div className="grid gap-6 lg:grid-cols-5">
                <div className="lg:col-span-3">
                    <IncomeExpenseSummary />
                </div>
                <div className="lg:col-span-2">
                    <AiReportCard />
                </div>
            </div>
        </>
    );
}
