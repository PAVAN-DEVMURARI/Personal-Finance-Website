import type { ReactNode } from 'react';

type PageHeaderProps = {
  title: string;
  action?: ReactNode;
};

export function PageHeader({ title, action }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <h1 className="font-headline text-2xl font-semibold md:text-3xl">
        {title}
      </h1>
      {action && <div>{action}</div>}
    </div>
  );
}
