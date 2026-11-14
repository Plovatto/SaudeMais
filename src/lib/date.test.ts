import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { addDays, formatDateTime, formatDay, formatTime, todayInSaoPaulo } from './date';

beforeAll(() => {
  vi.stubEnv('TZ', 'Asia/Tokyo');
});

afterAll(() => {
  vi.unstubAllEnvs();
});

describe('São Paulo dates with the process in Tokyo', () => {
  it('runs in the Tokyo time zone', () => {
    expect(new Date('2026-11-20T02:30:00.000Z').getTimezoneOffset()).toBe(-540);
  });

  it('shows the date and time in São Paulo', () => {
    expect(formatDateTime('2026-11-20T02:30:00.000Z')).toBe('19/11/2026, 23:30');
  });

  it('does not break on an invalid date', () => {
    expect(formatDateTime('not-a-date')).toBe('data indisponível');
  });

  it('shows the time of a slot in São Paulo', () => {
    expect(formatTime('2026-11-23T11:00:00.000Z')).toBe('08:00');
    expect(formatTime('2026-11-24T02:30:00.000Z')).toBe('23:30');
  });

  it('takes today from the São Paulo calendar', () => {
    expect(todayInSaoPaulo(new Date('2026-11-20T02:30:00.000Z'))).toBe('2026-11-19');
    expect(todayInSaoPaulo(new Date('2026-11-20T15:00:00.000Z'))).toBe('2026-11-20');
  });

  it('adds days to a civil date across months and years', () => {
    expect(addDays('2026-11-14', 30)).toBe('2026-12-14');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('labels a civil date without shifting the day', () => {
    expect(formatDay('2026-11-20')).toBe('sex., 20/11');
  });
});
