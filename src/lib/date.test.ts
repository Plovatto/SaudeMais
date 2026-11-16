import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import {
  addDays,
  civilDateInSaoPaulo,
  formatDateTime,
  formatDate,
  formatDay,
  formatRelative,
  formatTime,
  todayInSaoPaulo,
} from './date';

describe.each([
  { zone: 'Asia/Tokyo', offset: -540 },
  { zone: 'America/Los_Angeles', offset: 480 },
])('São Paulo dates with the process in $zone', ({ zone, offset }) => {
  beforeAll(() => {
    vi.stubEnv('TZ', zone);
  });

  afterAll(() => {
    vi.unstubAllEnvs();
  });

  it('runs in the process time zone', () => {
    expect(new Date('2026-11-20T02:30:00.000Z').getTimezoneOffset()).toBe(offset);
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

  it('takes the civil date of an instant from the São Paulo calendar', () => {
    expect(civilDateInSaoPaulo(new Date('2026-12-01T02:59:00.000Z'))).toBe('2026-11-30');
    expect(civilDateInSaoPaulo(new Date('2026-12-01T03:00:00.000Z'))).toBe('2026-12-01');
  });

  it('adds days to a civil date across months and years', () => {
    expect(addDays('2026-11-14', 30)).toBe('2026-12-14');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('labels a civil date without shifting the day', () => {
    expect(formatDay('2026-11-20')).toBe('sex., 20/11');
  });

  it('formats a civil date with and without the year', () => {
    expect(formatDate('2026-01-05')).toBe('05/01/2026');
    expect(formatDate('2026-01-05', { year: false })).toBe('05/01');
  });

  it('tells how long ago something happened', () => {
    const now = new Date('2026-11-20T15:00:00.000Z');
    expect(formatRelative('2026-11-20T14:59:30.000Z', now)).toBe('agora');
    expect(formatRelative('2026-11-20T14:55:00.000Z', now)).toBe('há 5 min.');
    expect(formatRelative('2026-11-20T13:00:00.000Z', now)).toBe('há 2 h');
    expect(formatRelative('2026-11-17T15:00:00.000Z', now)).toBe('há 3 dias');
    expect(formatRelative('not-a-date', now)).toBe('data indisponível');
  });

  it('counts past days on the São Paulo calendar', () => {
    const now = new Date('2026-11-21T02:00:00.000Z');
    expect(formatRelative('2026-11-19T03:30:00.000Z', now)).toBe('ontem');
    expect(formatRelative('2026-11-19T02:30:00.000Z', now)).toBe('anteontem');
  });

  it('keeps hours for the last day even across midnight in São Paulo', () => {
    expect(formatRelative('2026-11-20T05:00:00.000Z', new Date('2026-11-21T04:00:00.000Z'))).toBe('há 23 h');
  });

  it('treats a timestamp in the future as now', () => {
    expect(formatRelative('2026-11-20T15:10:00.000Z', new Date('2026-11-20T15:00:00.000Z'))).toBe('agora');
  });

  it('shows the date after a week', () => {
    const now = new Date('2026-11-20T15:00:00.000Z');
    expect(formatRelative('2026-11-13T15:00:00.000Z', now)).toBe('há 7 dias');
    expect(formatRelative('2026-11-12T15:00:00.000Z', now)).toBe('12/11/2026, 12:00');
  });
});
