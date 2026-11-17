import type { ReactNode } from 'react';
import { cx } from '@lib/cx';

export function CountBadge({
  children,
  inline = false,
  className,
}: {
  children: ReactNode;
  inline?: boolean;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cx(
        'grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[0.6875rem] leading-5 font-bold tabular-nums',
        !inline && 'absolute',
        className,
      )}
    >
      {children}
    </span>
  );
}
