import type { ReactNode } from 'react';
import { cx } from '@lib/cx';

export function CountBadge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      aria-hidden
      className={cx(
        'absolute h-5 min-w-5 rounded-full px-1 text-center text-[0.6875rem] leading-5 font-bold',
        className,
      )}
    >
      {children}
    </span>
  );
}
