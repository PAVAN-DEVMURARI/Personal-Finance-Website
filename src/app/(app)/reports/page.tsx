import { Download, FileText } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { AiReportCard } from "./components/ai-report-card";
import { IncomeExpenseSummary } from "./components/income-expense-summary";

export default function ReportsPage() {
    return (
        <>
            <PageHeader
                title="Financial Reports"
                action={
                    <div className="flex flex-col sm:flex-row gap-2">
                        <Button variant="outline">
                            <Download className="mr-2 h-4 w-4" />
                            Export CSV
                        </Button>
                        <Button variant="outline">
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
