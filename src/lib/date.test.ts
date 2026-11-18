import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import {
  addDays,
  dayTile,
  civilDateInSaoPaulo,
  formatDateTime,
  formatDate,
  formatDuration,
  formatLongDay,
  formatMonth,
  formatRelative,
  formatAgo,
  formatSince,
  formatShortDay,
  formatTime,
  hourInSaoPaulo,
  isCivilDate,
  todayInSaoPaulo,
  weekdayOf,
  weekOf,
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

  it('tells since when in full words, in days for two weeks and in weeks, months and years after that', () => {
    const now = new Date('2026-11-20T15:00:00.000Z');
    expect(formatSince('2026-11-20T13:00:00.000Z', now)).toBe('há 2 horas');
    expect(formatSince('2026-11-20T14:20:00.000Z', now)).toBe('há 40 minutos');
    expect(formatSince('2026-11-17T15:00:00.000Z', now)).toBe('há 3 dias');
    expect(formatSince('2026-11-10T15:00:00.000Z', now)).toBe('há 10 dias');
    expect(formatSince('2026-11-07T15:00:00.000Z', now)).toBe('há 13 dias');
    expect(formatSince('2026-10-30T15:00:00.000Z', now)).toBe('há 3 semanas');
    expect(formatSince('2026-08-10T12:00:00.000Z', now)).toBe('há 3 meses');
    expect(formatSince('not-a-date', now)).toBe('data indisponível');
  });

  it('counts how long ago in weeks, months and years and switches unit at the week, month and year boundaries', () => {
    const now = new Date('2026-11-20T15:00:00.000Z');
    const ago = (days: number) => new Date(now.getTime() - days * 86_400_000).toISOString();
    expect(formatAgo(ago(7), now)).toBe('há 7 dias');
    expect(formatAgo(ago(8), now)).toBe('há 1 semana');
    expect(formatAgo(ago(29), now)).toBe('há 4 semanas');
    expect(formatAgo(ago(30), now)).toBe('há 1 mês');
    expect(formatAgo(ago(364), now)).toBe('há 12 meses');
    expect(formatAgo(ago(365), now)).toBe('há 1 ano');
  });

  it('treats a future date as just now', () => {
    const now = new Date('2026-11-20T15:00:00.000Z');
    expect(formatAgo('2026-11-21T15:00:00.000Z', now)).toBe('agora');
  });
});

describe('day labels in São Paulo', () => {
  const lateNight = '2026-11-24T01:30:00.000Z';

  it('reads the tile, short and long day in the clinic time zone', () => {
    expect(dayTile(lateNight)).toEqual({ weekday: 'seg', day: '23' });
    expect(formatShortDay(lateNight)).toBe('Seg, 23/11');
    expect(formatLongDay(lateNight)).toBe('Segunda, 23 de novembro');
  });

  it.each([
    ['2026-11-07T15:00:00.000Z', { weekday: 'sáb', day: '07' }, 'Sáb, 07/11', 'Sábado, 7 de novembro'],
    ['2026-11-08T02:59:00.000Z', { weekday: 'sáb', day: '07' }, 'Sáb, 07/11', 'Sábado, 7 de novembro'],
    ['2026-11-08T03:00:00.000Z', { weekday: 'dom', day: '08' }, 'Dom, 08/11', 'Domingo, 8 de novembro'],
  ])('keeps %s on the São Paulo day', (instant, tile, short, long) => {
    expect(dayTile(instant)).toEqual(tile);
    expect(formatShortDay(instant)).toBe(short);
    expect(formatLongDay(instant)).toBe(long);
  });
});

describe('month and duration', () => {
  it('names the month of a booking in São Paulo and the length in minutes', () => {
    expect(formatMonth('2026-12-01T01:00:00.000Z')).toBe('Novembro de 2026');
    expect(formatDuration('2026-11-23T13:00:00.000Z', '2026-11-23T13:30:00.000Z')).toBe('30 minutos');
    expect(formatDuration('2026-11-23T13:00:00.000Z', '2026-11-23T13:01:00.000Z')).toBe('1 minuto');
  });
});

describe('civil weeks', () => {
  it('validates civil dates', () => {
    expect(isCivilDate('2026-11-23')).toBe(true);
    expect(isCivilDate('2026-02-30')).toBe(false);
    expect(isCivilDate('2030-13-40')).toBe(false);
    expect(isCivilDate('23/11/2026')).toBe(false);
  });

  it('returns the monday to sunday week of a day', () => {
    expect(weekdayOf('2026-11-22')).toBe(0);
    expect(weekOf('2026-11-22')).toEqual([
      '2026-11-16',
      '2026-11-17',
      '2026-11-18',
      '2026-11-19',
      '2026-11-20',
      '2026-11-21',
      '2026-11-22',
    ]);
    expect(weekOf('2026-12-31')[0]).toBe('2026-12-28');
  });

  it('reads the hour in São Paulo', () => {
    expect(hourInSaoPaulo('2026-11-23T02:30:00.000Z')).toBe(23);
    expect(hourInSaoPaulo('2026-11-23T15:00:00.000Z')).toBe(12);
  });
});
