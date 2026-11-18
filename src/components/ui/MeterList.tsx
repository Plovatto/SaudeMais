import type { ReactNode } from 'react';
import { formatCount } from '@lib/number';

export interface MeterItem {
  key: string;
  label: ReactNode;
  value: number;
}

export interface MeterListProps {
  label: string;
  items: readonly MeterItem[];
  max: number;
}

export function MeterList({ label, items, max }: MeterListProps) {
  return (
    <ul aria-label={label} className="flex flex-col gap-3">
      {items.map(({ key, label: itemLabel, value }) => (
        <li key={key} className="flex flex-col gap-1.5">
          <div className="text-text flex items-center justify-between gap-3 text-sm">
            <span className="min-w-0">{itemLabel}</span>
            <span className="font-semibold tabular-nums">{formatCount(value)}</span>
          </div>
          <div aria-hidden className="bg-chart-1/15 h-2 overflow-hidden rounded-full">
            <div
              className="bg-chart-1 motion-safe:animate-grow-x h-full origin-left rounded-full"
              style={{ width: `${max > 0 ? (value / max) * 100 : 0}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
