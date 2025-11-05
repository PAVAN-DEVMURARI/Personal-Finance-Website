'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { PanelLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { UserNav } from '@/components/user-nav';
import { useUser } from '@/firebase';
import { FinpowerLogo } from '@/components/finpower-logo';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';


export function AppShell({
  children,
  sidebarNav,
  sidebarFooter,
  logo,
}: {
  children: React.ReactNode;
  sidebarNav: React.ReactNode;
  sidebarFooter: React.ReactNode;
  logo: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    // If auth is done loading and there's no user, redirect to login
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [isUserLoading, user, router]);

  // While checking user auth, show a loading screen
  if (isUserLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }
  
  // If there's no user, we are in the process of redirecting, so don't render the layout
  if (!user) {
      return null;
  }

  // This function is to add the active class to the nav items.
  // We need to do this on the client because usePathname is a client hook.
  const addActiveClassToNav = (nav: React.ReactNode) => {
    return React.Children.map((nav as any)?.props.children, (item: React.ReactElement) => {
       if (item.props.href === pathname) {
        return React.cloneElement(item, {
          className: `${item.props.className} bg-sidebar-accent text-primary`,
        });
      }
      return item;
    });
  };

  const activeSidebarNav = addActiveClassToNav(sidebarNav);

  const activeSidebarFooter = React.cloneElement(sidebarFooter as React.ReactElement, {
      className: cn((sidebarFooter as any).props.className, {
        'bg-sidebar-accent text-primary': pathname === '/settings',
      })
  });

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-sidebar lg:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-[60px] items-center border-b px-6">
            {logo}
          </div>
          <div className="flex-1 overflow-auto py-2">{activeSidebarNav}</div>
          <div className="mt-auto p-4">
            {activeSidebarFooter}
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
                <SheetHeader className="p-6 pb-0">
                    <SheetTitle className="sr-only">Main Menu</SheetTitle>
                </SheetHeader>
                <div className="flex h-[60px] items-center border-b px-6">
                    <Link href="/" className="flex items-center gap-2 font-semibold">
                        <FinpowerLogo className="h-6 w-6" />
                        <span className="font-headline text-lg text-foreground">FinPower</span>
                    </Link>
                </div>
                <div className="flex-1 overflow-auto py-2">
                    {activeSidebarNav}
                </div>
                <div className="mt-auto p-4 border-t">
                    {activeSidebarFooter}
                </div>
            </SheetContent>
          </Sheet>
          <div className="w-full flex-1" />
          <UserNav />
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
