import { PageHeader } from '@/components/page-header';
import { StatsCards } from './components/stats-cards';
import { SpendingChart } from './components/spending-chart';
import { GoalsOverview } from './components/goals-overview';
import { RecentTransactions } from './components/recent-transactions';
import { FinancialTipCard } from './components/financial-tip-card';
import { GamificationSection } from './components/gamification-section';

export default function DashboardPage() {
  return (
    <>
      <PageHeader title="Dashboard" />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="md:col-span-2 lg:col-span-3">
            <StatsCards />
        </div>
        
        <div className="md:col-span-2 lg:col-span-2">
            <SpendingChart />
        </div>
        
        <div className="md:col-span-1 lg:col-span-1">
            <FinancialTipCard />
        </div>
        
        <div className="md:col-span-2 lg:col-span-2">
          <GoalsOverview />
        </div>
        
        <div className="md:col-span-1 lg:col-span-1 row-start-3 md:row-start-auto">
            <GamificationSection />
        </div>

        <div className="md:col-span-3 lg:col-span-3">
          <RecentTransactions />
        </div>

      </div>
    </>
  );
}
