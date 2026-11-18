import { useId, type ReactNode } from 'react';
import { LuTrendingDown, LuTrendingUp } from 'react-icons/lu';
import { useCountUp } from '@hooks/useCountUp';
import { cx } from '@lib/cx';
import { formatCount } from '@lib/number';
import { Skeleton } from './Skeleton';

export interface StatDelta {
  text: string;
  rising: boolean;
  good: boolean;
}

export interface StatTileProps {
  label: string;
  value: number | string | undefined;
  format?: ((value: number) => string) | undefined;
  icon?: ReactNode;
  delta?: StatDelta | undefined;
  foot?: string | undefined;
  trend?: readonly number[] | undefined;
  compact?: boolean;
  className?: string;
}

export function DeltaBadge({ delta }: { delta: StatDelta }) {
  const Icon = delta.rising ? LuTrendingUp : LuTrendingDown;
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-[650] whitespace-nowrap tabular-nums',
        delta.good ? 'bg-success-soft text-success-text' : 'bg-danger-soft text-danger-text',
      )}
    >
      <Icon aria-hidden className="size-3" />
      {delta.text}
    </span>
  );
}

function CountUp({ value, format }: { value: number; format: (value: number) => string }) {
  const current = useCountUp(value);
  if (current === value) return format(value);
  return (
    <>
      <span className="sr-only">{format(value)}</span>
      <span aria-hidden>{format(current)}</span>
    </>
  );
}

function Sparkline({ values }: { values: readonly number[] }) {
  const gradient = useId();
  const low = Math.min(...values);
  const high = Math.max(...values);
  const y = (value: number) => 32 - ((value - low) / (high - low || 1)) * 28;
  const points = values.map((value, index) => [(index / Math.max(values.length - 1, 1)) * 100, y(value)]);
  const path = points
    .map(([x = 0, py = 0], index) => {
      if (index === 0) return `M${x.toFixed(2)},${py.toFixed(2)}`;
      const [px = 0, ppy = 0] = points[index - 1] ?? [];
      const mid = ((px + x) / 2).toFixed(2);
      return `C${mid},${ppy.toFixed(2)} ${mid},${py.toFixed(2)} ${x.toFixed(2)},${py.toFixed(2)}`;
    })
    .join(' ');
  const last = values.at(-1) ?? 0;
  return (
    <div
      aria-hidden
      className="relative -mx-[18px] mt-2.5 h-10 max-[560px]:-mx-3.5 max-[560px]:mt-2 max-[560px]:h-[34px]"
    >
      <svg viewBox="0 0 100 36" preserveAspectRatio="none" className="block size-full">
        <defs>
          <linearGradient id={gradient} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="var(--chart-1)" stopOpacity="0.22" />
            <stop offset="1" stopColor="var(--chart-1)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`${path} L100,36 L0,36 Z`} fill={`url(#${gradient})`} />
        <path
          d={path}
          fill="none"
          stroke="var(--chart-1)"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <span
        className="bg-chart-1 absolute end-0 -mt-[5px] size-2.5 rounded-full shadow-[0_0_0_2px_var(--surface)]"
        style={{ top: `${((y(last) / 36) * 100).toFixed(1)}%` }}
      />
    </div>
  );
}

export function StatTile({
  label,
  value,
  format = formatCount,
  icon,
  delta,
  foot,
  trend,
  compact = false,
  className,
}: StatTileProps) {
  return (
    <section
      aria-label={label}
      aria-busy={value === undefined}
      className={cx(
        'rounded-card border-border bg-surface shadow-card relative flex min-w-0 flex-col gap-1 overflow-hidden border px-[18px] pt-[18px] max-[560px]:px-3.5 max-[560px]:pt-3.5',
        (compact || !trend || trend.length < 2) && 'pb-4 max-[560px]:pb-3.5',
        className,
      )}
    >
      {icon && (
        <span
          aria-hidden
          className="text-chart-1 absolute end-3.5 top-3.5 grid size-[34px] place-items-center rounded-[10px] bg-[color-mix(in_oklab,var(--chart-1)_12%,var(--surface))] [&_svg]:size-[18px]"
        >
          {icon}
        </span>
      )}
      <p className={cx('text-text-secondary text-[0.8125rem] font-semibold', icon !== undefined && 'pe-10')}>
        {label}
      </p>
      {value === undefined ? (
        <Skeleton className={compact ? 'h-7 w-16' : 'h-8 w-20'} />
      ) : (
        <p
          className={cx(
            'text-text leading-[1.15] font-[650] tracking-[-0.02em] tabular-nums',
            compact ? 'text-[1.375rem]' : 'text-[1.75rem] max-[560px]:text-[1.375rem]',
          )}
        >
          {typeof value === 'number' ? <CountUp value={value} format={format} /> : value}
        </p>
      )}
      {(delta || foot) && (
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
          {delta && <DeltaBadge delta={delta} />}
          {foot && <span className="text-text-muted text-xs">{foot}</span>}
        </p>
      )}
      {!compact && trend && trend.length > 1 && <Sparkline values={trend} />}
    </section>
  );
}
