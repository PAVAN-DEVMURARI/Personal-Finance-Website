import type { SVGProps } from 'react';

export function FinpowerLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 2L2 7l10 5 10-5-10-5z" fill="hsl(var(--primary))" opacity="0.5" />
      <path d="M2 17l10 5 10-5" stroke="hsl(var(--primary))" />
      <path d="M2 12l10 5 10-5" stroke="hsl(var(--primary))" />
    </svg>
  );
}
