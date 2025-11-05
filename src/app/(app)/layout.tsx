import Link from 'next/link';
import {
  FileText,
  Landmark,
  LayoutDashboard,
  Settings,
  Target,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { AppShell } from './app-shell';
import { cn } from '@/lib/utils';
import { FinpowerLogo } from '@/components/finpower-logo';
import { FirebaseClientProvider } from '@/firebase';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/expenses', icon: Wallet, label: 'Expenses' },
  { href: '/income', icon: Landmark, label: 'Income' },
  { href: '/goals', icon: Target, label: 'Goals' },
  { href: '/investments', icon: TrendingUp, label: 'Investments' },
  { href: '/reports', icon: FileText, label: 'Reports' },
];

function SidebarNav() {
  return (
    <nav className="grid items-start gap-2 px-4 text-sm font-medium">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground transition-all hover:text-primary hover:bg-sidebar-accent'
          )}
        >
          <item.icon className="h-4 w-4" />
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <FirebaseClientProvider>
      <AppShell
        sidebarNav={<SidebarNav />}
        sidebarFooter={
          <Link
            href="/settings"
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground transition-all hover:text-primary hover:bg-sidebar-accent'
            )}
          >
            <Settings className="h-4 w-4" />
            Settings
          </Link>
        }
        logo={
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <FinpowerLogo className="h-6 w-6" />
            <span className="font-headline text-lg text-sidebar-foreground">
              FinPower
            </span>
          </Link>
        }
      >
        {children}
      </AppShell>
    </FirebaseClientProvider>
  );
}
