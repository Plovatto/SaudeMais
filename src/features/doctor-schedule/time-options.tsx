import type { ReactNode } from 'react';
import { fromMinutes } from '@lib/time-of-day';
import { STEP } from './schedule-schema';

export interface TimeOptions {
  values: ReadonlySet<number>;
  elements: ReactNode;
}

export const timeOption = (minutes: number) => (
  <option key={minutes} value={minutes}>
    {fromMinutes(minutes)}
  </option>
);

export function timeOptions(from: number, to: number): TimeOptions {
  const values = Array.from(
    { length: Math.max(0, (to - from) / STEP + 1) },
    (_value, step) => from + step * STEP,
  );
  return { values: new Set(values), elements: values.map(timeOption) };
}
