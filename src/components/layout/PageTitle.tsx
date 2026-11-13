import type { ReactNode } from 'react';
import { cx } from '@lib/cx';

export const PAGE_TITLE_ID = 'page-title';

export function PageTitle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h1
      id={PAGE_TITLE_ID}
      tabIndex={-1}
      className={cx('text-text text-xl font-semibold focus-visible:outline-none', className)}
    >
      {children}
    </h1>
  );
}
