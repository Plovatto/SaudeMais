import type { ComponentProps } from 'react';
import { cx } from '@lib/cx';

export function SheetMore({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cx('in-data-[sheet=min]:hidden', className)} {...props} />;
}
