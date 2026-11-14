import { cx } from '@lib/cx';
import { Skeleton } from './Skeleton';

const counter = new Intl.NumberFormat('pt-BR');

interface Stat {
  label: string;
  value: number | undefined;
  tone?: string;
}

export function StatGrid({ stats }: { stats: readonly Stat[] }) {
  return (
    <dl
      className="grid grid-cols-3 gap-2 text-center"
      aria-busy={stats.some(({ value }) => value === undefined)}
    >
      {stats.map(({ label, value, tone = 'text-text' }) => (
        <div key={label} className="flex flex-col-reverse items-center gap-1">
          <dt className="text-text-secondary text-sm">{label}</dt>
          <dd className={cx('text-2xl font-semibold tabular-nums lg:text-3xl', tone)}>
            {value === undefined ? <Skeleton className="h-8 w-12" /> : counter.format(value)}
          </dd>
        </div>
      ))}
    </dl>
  );
}
