import { PageHeader } from '@/components/page-header';
import { StatsCards } from './components/stats-cards';
import { SpendingChart } from './components/spending-chart';
import { GoalsOverview } from './components/goals-overview';
import { RecentTransactions } from './components/recent-transactions';
import { FinancialTipCard } from './components/financial-tip-card';

export default function DashboardPage() {
  return (
    <>
      <PageHeader title="Dashboard" />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="col-span-1 md:col-span-2 lg:col-span-4">
            <StatsCards />
        </div>
        
        <div className="col-span-1 md:col-span-2 lg:col-span-2">
            <SpendingChart />
        </div>
        
        <div className="col-span-1 md:col-span-1 lg:col-span-2">
            <FinancialTipCard />
        </div>
        
        <div className="col-span-1 md:col-span-2 lg:col-span-4">
          <GoalsOverview />
        </div>
        
        <div className="col-span-1 md:col-span-2 lg:col-span-4">
          <RecentTransactions />
        </div>

      </div>
    </>
  );
}
