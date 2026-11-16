import { cx } from '@lib/cx';
import { formatCount } from '@lib/number';
import { Skeleton } from './Skeleton';

interface Stat {
  label: string;
  value: number | string | undefined;
  tone?: string;
}

export function StatGrid({ stats, className }: { stats: readonly Stat[]; className?: string }) {
  return (
    <dl
      className={cx('grid grid-cols-3 gap-2 text-center', className)}
      aria-busy={stats.some(({ value }) => value === undefined)}
    >
      {stats.map(({ label, value, tone = 'text-text' }) => (
        <div key={label} className="flex flex-col-reverse items-center justify-end gap-1">
          <dt className="text-text-secondary text-sm">{label}</dt>
          <dd className={cx('text-2xl font-semibold tabular-nums lg:text-3xl', tone)}>
            {value === undefined ? (
              <Skeleton className="h-8 w-12" />
            ) : typeof value === 'number' ? (
              formatCount(value)
            ) : (
              value
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}
