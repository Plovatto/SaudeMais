import type { ReactNode } from 'react';
import { cx } from '@lib/cx';

export const PAGE_TITLE_ID = 'page-title';

export function PageTitle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h1
      id={PAGE_TITLE_ID}
      tabIndex={-1}
      className={cx(
        'text-text text-[1.3125rem] leading-[1.2] font-bold tracking-[-0.02em] text-balance focus-visible:outline-none lg:text-[1.625rem]',
        className,
      )}
    >
      {children}
    </h1>
  );
}
