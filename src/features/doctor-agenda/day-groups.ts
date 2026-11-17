import { addDays, civilDateInSaoPaulo, formatDay } from '@lib/date';
import { groupConsecutive } from '@lib/group';

interface DayGroup<T> {
  date: string;
  label: string;
  items: T[];
}

export function groupByAppointmentDay<T extends { startsAt: string }>(
  items: readonly T[],
  now = new Date(),
): DayGroup<T>[] {
  const today = civilDateInSaoPaulo(now);
  const named: Record<string, string> = {
    [today]: 'Hoje',
    [addDays(today, 1)]: 'Amanhã',
    [addDays(today, -1)]: 'Ontem',
  };
  return groupConsecutive(items, (item) => civilDateInSaoPaulo(new Date(item.startsAt))).map(
    ({ key, items: day }) => ({ date: key, label: named[key] ?? formatDay(key), items: day }),
  );
}
