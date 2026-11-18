import { cx } from '@lib/cx';
import { formatCount, formatPercent } from '@lib/number';

export interface DonutPart {
  key: string;
  label: string;
  value: number;
  swatch: string;
  stroke?: string;
}

const RADIUS = 42;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const GAP = 1.6;

const share = (value: number, total: number) => (total === 0 ? 0 : value / total);

export function StatusDonut({
  parts,
  total,
  center,
}: {
  parts: readonly DonutPart[];
  total: number;
  center: string;
}) {
  const lengths = parts.map(({ value }) => share(value, total) * CIRCUMFERENCE);
  const arcs = parts.map((part, index) => ({
    ...part,
    length: Math.max((lengths[index] ?? 0) - GAP, 0),
    offset: lengths.slice(0, index).reduce((sum, length) => sum + length, 0),
  }));
  const first = parts[0];
  const summary = parts
    .map(({ label, value }) => `${label}: ${formatPercent(share(value, total))}`)
    .join(', ');

  return (
    <div className="flex flex-col gap-[18px]">
      <div role="img" aria-label={summary} className="relative size-[148px] shrink-0 self-center">
        <svg viewBox="0 0 100 100" className="size-full -rotate-90">
          <circle r={RADIUS} cx="50" cy="50" fill="none" strokeWidth="12" stroke="var(--surface-strong)" />
          {arcs.map(({ key, stroke, value, length, offset: start }) =>
            stroke && value > 0 ? (
              <circle
                key={key}
                r={RADIUS}
                cx="50"
                cy="50"
                fill="none"
                strokeWidth="12"
                stroke={stroke}
                strokeDasharray={`${length.toFixed(2)} ${(CIRCUMFERENCE - length).toFixed(2)}`}
                strokeDashoffset={(-start).toFixed(2)}
                className="motion-safe:animate-fade"
              />
            ) : null,
          )}
        </svg>
        <div aria-hidden className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-text text-2xl/[1.1] font-[650] tabular-nums">
            {formatPercent(share(first?.value ?? 0, total))}
          </span>
          <span className="text-text-muted text-[0.71875rem]">{center}</span>
        </div>
      </div>
      <ul className="flex flex-col gap-2.5 text-[0.84375rem]">
        {parts.map(({ key, label, value, swatch }) => (
          <li key={key} className="flex items-center gap-2.5">
            <span aria-hidden className={cx('size-2.5 shrink-0 rounded-[3px]', swatch)} />
            <span className="text-text min-w-0 flex-1">{label}</span>
            <span className="text-text font-[650] tabular-nums">{formatCount(value)}</span>
            <span className="text-text-muted w-12 text-end text-[0.78125rem] tabular-nums">
              {formatPercent(share(value, total))}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
