import type { ReactNode } from 'react';

type PageHeaderProps = {
  title: string;
  action?: ReactNode;
};

export function PageHeader({ title, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
      <h1 className="font-headline text-2xl font-semibold md:text-3xl">
        {title}
      </h1>
      {action && <div>{action}</div>}
    </div>
  );
}
