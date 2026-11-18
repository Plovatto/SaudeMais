import { cx } from '@lib/cx';

const shimmer =
  'motion-safe:before:absolute motion-safe:before:inset-0 motion-safe:before:bg-linear-to-r motion-safe:before:from-transparent motion-safe:before:via-surface/55 motion-safe:before:to-transparent motion-safe:before:animate-shimmer';

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cx('rounded-field bg-surface-strong relative overflow-hidden', shimmer, className)}
    />
  );
}
