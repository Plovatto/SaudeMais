import { describe, expect, it } from 'vitest';
import { dayPeriodOf } from './day-periods';

describe('dayPeriodOf', () => {
  it.each([
    ['2026-11-23T14:59:00.000Z', 'Manhã'],
    ['2026-11-23T15:00:00.000Z', 'Tarde'],
    ['2026-11-23T20:59:00.000Z', 'Tarde'],
    ['2026-11-23T21:00:00.000Z', 'Noite'],
    ['2026-11-24T02:59:00.000Z', 'Noite'],
    ['2026-11-24T03:00:00.000Z', 'Manhã'],
  ])('places %s in the %s period', (startsAt, label) => {
    expect(dayPeriodOf(startsAt).label).toBe(label);
  });
});
