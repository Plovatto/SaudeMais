import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { groupByDay } from './day-groups';

const NOW = new Date('2026-11-20T15:00:00.000Z');

describe.each(['Asia/Tokyo', 'America/Los_Angeles'])('day groups with the process in %s', (zone) => {
  beforeAll(() => {
    vi.stubEnv('TZ', zone);
  });

  afterAll(() => {
    vi.unstubAllEnvs();
  });

  it('groups by the São Paulo civil date and names the days around today', () => {
    const items = [
      { id: 'a', startsAt: '2026-11-19T14:00:00.000Z' },
      { id: 'b', startsAt: '2026-11-20T02:30:00.000Z' },
      { id: 'c', startsAt: '2026-11-20T03:30:00.000Z' },
      { id: 'd', startsAt: '2026-11-21T02:59:00.000Z' },
      { id: 'e', startsAt: '2026-11-21T12:00:00.000Z' },
      { id: 'f', startsAt: '2026-11-25T12:00:00.000Z' },
    ];

    expect(
      groupByDay(items, NOW).map(({ date, label, items: day }) => [date, label, day.map(({ id }) => id)]),
    ).toEqual([
      ['2026-11-19', 'Ontem', ['a', 'b']],
      ['2026-11-20', 'Hoje', ['c', 'd']],
      ['2026-11-21', 'Amanhã', ['e']],
      ['2026-11-25', 'qua., 25/11', ['f']],
    ]);
  });
});
