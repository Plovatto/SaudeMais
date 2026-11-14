import { addDays, civilDateInSaoPaulo, formatDay } from '@lib/date';

interface DayGroup<T> {
  date: string;
  label: string;
  items: T[];
}

export function groupByDay<T extends { startsAt: string }>(
  items: readonly T[],
  now = new Date(),
): DayGroup<T>[] {
  const today = civilDateInSaoPaulo(now);
  const named: Record<string, string> = {
    [today]: 'Hoje',
    [addDays(today, 1)]: 'Amanhã',
    [addDays(today, -1)]: 'Ontem',
  };
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const date = civilDateInSaoPaulo(new Date(item.startsAt));
    groups.set(date, [...(groups.get(date) ?? []), item]);
  }
  return [...groups].map(([date, dayItems]) => ({
    date,
    label: named[date] ?? formatDay(date),
    items: dayItems,
  }));
}
