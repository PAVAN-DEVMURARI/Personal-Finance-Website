'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  FileText,
  Landmark,
  LayoutDashboard,
  PanelLeft,
  Settings,
  Target,
  TrendingUp,
  Wallet,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { UserNav } from '@/components/user-nav';
import { FinpowerLogo } from '@/components/finpower-logo';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { FirebaseClientProvider, useUser } from '@/firebase';
import React, { useEffect } from 'react';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/expenses', icon: Wallet, label: 'Expenses' },
  { href: '/income', icon: Landmark, label: 'Income' },
  { href: '/goals', icon: Target, label: 'Goals' },
  { href: '/investments', icon: TrendingUp, label: 'Investments' },
  { href: '/reports', icon: FileText, label: 'Reports' },
];

function AppLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isUserLoading } = useUser();

  const sidebarNav = (
    <nav className="grid items-start gap-2 px-4 text-sm font-medium">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground transition-all hover:text-primary hover:bg-sidebar-accent',
            {
              'bg-sidebar-accent text-primary': pathname === item.href,
            }
          )}
        >
          <item.icon className="h-4 w-4" />
          {item.label}
        </Link>
      ))}
    </nav>
  );

  if (isUserLoading) {
    return <div className="flex h-screen w-screen items-center justify-center">Loading...</div>;
  }

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-sidebar lg:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-[60px] items-center border-b px-6">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <FinpowerLogo className="h-6 w-6" />
              <span className="font-headline text-lg text-sidebar-foreground">FinPower</span>
            </Link>
          </div>
          <div className="flex-1 overflow-auto py-2">
           {sidebarNav}
          </div>
          <div className="mt-auto p-4">
            <Link
                href="/settings"
                className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground transition-all hover:text-primary hover:bg-sidebar-accent',
                    {
                    'bg-sidebar-accent text-primary': pathname === '/settings',
                    }
                )}
                >
                <Settings className="h-4 w-4" />
                Settings
            </Link>
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-card px-6 lg:h-[60px]">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0 lg:hidden">
                <PanelLeft className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col p-0">
                <SheetHeader className="p-4 border-b">
                    <SheetTitle>
                      <VisuallyHidden>Menu</VisuallyHidden>
                    </SheetTitle>
                    <VisuallyHidden>
                        <SheetDescription>
                        Main navigation menu for the FinPower application.
                        </SheetDescription>
                    </VisuallyHidden>
                </SheetHeader>
                <div className="flex h-[60px] items-center border-b px-6">
                    <Link href="/" className="flex items-center gap-2 font-semibold">
                        <FinpowerLogo className="h-6 w-6" />
                        <span className="font-headline text-lg text-foreground">FinPower</span>
                    </Link>
                </div>
                <div className="flex-1 overflow-auto py-2">
                    {sidebarNav}
                </div>
                <div className="mt-auto p-4 border-t">
                    <Link
                        href="/settings"
                        className={cn(
                            'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
                            {
                            'text-primary': pathname === '/settings',
                            }
                        )}
                        >
                        <Settings className="h-4 w-4" />
                        Settings
                    </Link>
                </div>
            </SheetContent>
          </Sheet>
          <div className="w-full flex-1">
            {/* Can add a search bar here if needed */}
          </div>
          <UserNav />
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}


export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || !user) {
    return <div className="flex h-screen w-screen items-center justify-center">Loading...</div>;
  }
  
  return (
    <FirebaseClientProvider>
      <AppLayoutContent>{children}</AppLayoutContent>
    </FirebaseClientProvider>
  )
}
