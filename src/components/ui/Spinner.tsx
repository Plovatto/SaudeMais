import { cx } from '@lib/cx';

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      data-spinner
      aria-hidden
      className={cx(
        'inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent',
        className,
      )}
    />
  );
}
