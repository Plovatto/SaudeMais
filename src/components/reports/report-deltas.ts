import type { StatDelta } from '@components/ui';
import { formatPercent, formatPoints } from '@lib/number';

const sign = (value: number) => (value > 0 ? '+' : value < 0 ? '−' : '');

export function countDelta(current: number, previous: number | undefined): StatDelta | undefined {
  if (previous === undefined || previous === 0) return undefined;
  const change = (current - previous) / previous;
  return {
    text: `${sign(change)}${formatPercent(Math.abs(change))}`,
    rising: change >= 0,
    good: change >= 0,
  };
}

export function rateDelta(
  current: number | null,
  previous: number | null | undefined,
  { higherIsBetter = true } = {},
): StatDelta | undefined {
  if (current === null || previous === null || previous === undefined) return undefined;
  const change = Math.round((current - previous) * 1000) / 10;
  return {
    text: `${sign(change)}${formatPoints(Math.abs(change))}`,
    rising: change >= 0,
    good: change === 0 || change > 0 === higherIsBetter,
  };
}
