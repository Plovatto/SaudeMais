import { cx } from '@lib/cx';

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cx('rounded-field bg-border animate-pulse', className)} />;
}
